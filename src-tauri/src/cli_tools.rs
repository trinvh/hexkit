//! Tauri commands that manage the bundled `hexkit` CLI sidecar:
//!
//! - `cli_status`  — reports whether the user already has `hexkit` on PATH,
//!   what version they have, and whether it satisfies the running app's
//!   version (so we can prompt for an upgrade).
//! - `install_cli` — copies the bundled sidecar into the user's local bin
//!   directory and reports whether that directory is already on PATH.

use std::env;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde::Serialize;

const APP_VERSION: &str = env!("CARGO_PKG_VERSION");

/// Snapshot of the user's CLI install + the bundle's expectations.
#[derive(Debug, Serialize)]
pub struct CliStatus {
    /// Filesystem path of the user's installed `hexkit` binary, if any.
    pub installed_path: Option<String>,
    /// Output of `hexkit --version`, parsed down to `X.Y.Z` if possible.
    pub installed_version: Option<String>,
    /// Version of the running app — the floor we want the CLI to meet.
    pub app_version: String,
    /// True when the installed CLI is at least as new as the app.
    pub version_ok: bool,
    /// Directory `install_cli` writes to by default (e.g. `~/.local/bin`).
    pub default_install_dir: String,
    /// Full path the sidecar will land at after install.
    pub default_install_path: String,
    /// Whether `default_install_dir` is on PATH right now.
    pub install_dir_on_path: bool,
    /// True when the bundled sidecar binary is available — meaning the app
    /// can perform the install itself without asking the user to download.
    pub bundled_sidecar_available: bool,
}

/// Result of a successful install action.
#[derive(Debug, Serialize)]
pub struct InstallReport {
    pub installed_path: String,
    pub installed_version: Option<String>,
    pub install_dir_on_path: bool,
    pub path_hint: Option<String>,
}

#[tauri::command]
pub fn cli_status() -> CliStatus {
    let installed_path = find_installed_cli();
    let installed_version = installed_path
        .as_deref()
        .and_then(|p| read_cli_version(Path::new(p)));
    let version_ok = installed_version
        .as_deref()
        .map(|v| version_satisfies(v, APP_VERSION))
        .unwrap_or(false);

    let install_dir = default_install_dir();
    let install_path = install_dir.join(bin_filename());

    CliStatus {
        installed_path: installed_path.as_deref().map(path_to_string),
        installed_version,
        app_version: APP_VERSION.to_string(),
        version_ok,
        default_install_dir: path_to_string(&install_dir),
        default_install_path: path_to_string(&install_path),
        install_dir_on_path: dir_on_path(&install_dir),
        bundled_sidecar_available: bundled_sidecar_path().is_some(),
    }
}

/// Remove the CLI from our managed install location (idempotent).
///
/// We only ever delete the binary at `default_install_dir/<bin>`. CLIs that
/// the user installed via cargo, brew, or manual placement on PATH are left
/// alone — this command exists for symmetry with `install_cli`, not as a
/// general uninstaller.
#[tauri::command]
pub fn uninstall_cli() -> Result<String, String> {
    let target = default_install_dir().join(bin_filename());
    if target.is_file() {
        std::fs::remove_file(&target)
            .map_err(|e| format!("Could not remove {}: {e}", target.display()))?;
    }
    Ok(path_to_string(&target))
}

#[tauri::command]
pub fn install_cli() -> Result<InstallReport, String> {
    let source = bundled_sidecar_path()
        .ok_or_else(|| "Bundled `hexkit` CLI is missing from this build.".to_string())?;

    let install_dir = default_install_dir();
    std::fs::create_dir_all(&install_dir).map_err(|e| {
        format!(
            "Could not create install directory {}: {e}",
            install_dir.display()
        )
    })?;

    let target = install_dir.join(bin_filename());
    std::fs::copy(&source, &target).map_err(|e| {
        format!(
            "Failed to copy CLI from {} to {}: {e}",
            source.display(),
            target.display()
        )
    })?;

    #[cfg(unix)]
    set_executable(&target).map_err(|e| format!("Could not mark CLI executable: {e}"))?;

    let installed_version = read_cli_version(&target);
    let on_path = dir_on_path(&install_dir);
    let path_hint = if on_path {
        None
    } else {
        Some(path_export_hint(&install_dir))
    };

    Ok(InstallReport {
        installed_path: path_to_string(&target),
        installed_version,
        install_dir_on_path: on_path,
        path_hint,
    })
}

// ---------- helpers ---------------------------------------------------------

/// File name of the installed CLI on disk (`hexkit` / `hexkit.exe`).
fn bin_filename() -> String {
    if cfg!(windows) {
        "hexkit.exe".to_string()
    } else {
        "hexkit".to_string()
    }
}

/// File name of the bundled sidecar Tauri ships next to the main executable.
fn sidecar_filename() -> String {
    if cfg!(windows) {
        "hexkit-cli.exe".to_string()
    } else {
        "hexkit-cli".to_string()
    }
}

/// Look up `hexkit` on the user's PATH and fall back to a small set of
/// well-known install locations so we still detect installs made by tools
/// like `cargo install` whose bins aren't always on Raycast's PATH.
fn find_installed_cli() -> Option<PathBuf> {
    let name = bin_filename();

    if let Some(path) = env::var_os("PATH") {
        for dir in env::split_paths(&path) {
            let candidate = dir.join(&name);
            if is_executable(&candidate) {
                return Some(candidate);
            }
        }
    }

    for dir in fallback_install_dirs() {
        let candidate = dir.join(&name);
        if is_executable(&candidate) {
            return Some(candidate);
        }
    }
    None
}

fn fallback_install_dirs() -> Vec<PathBuf> {
    let mut out = Vec::new();
    if let Some(home) = home_dir() {
        out.push(home.join(".local").join("bin"));
        out.push(home.join(".cargo").join("bin"));
        out.push(home.join("bin"));
    }
    out.push(PathBuf::from("/usr/local/bin"));
    out.push(PathBuf::from("/opt/homebrew/bin"));
    out
}

fn default_install_dir() -> PathBuf {
    if cfg!(windows) {
        if let Some(local_appdata) = env::var_os("LOCALAPPDATA") {
            return PathBuf::from(local_appdata).join("Hexkit").join("bin");
        }
        if let Some(home) = home_dir() {
            return home.join("Hexkit").join("bin");
        }
        PathBuf::from(r"C:\Hexkit\bin")
    } else if let Some(home) = home_dir() {
        home.join(".local").join("bin")
    } else {
        PathBuf::from("/usr/local/bin")
    }
}

fn dir_on_path(dir: &Path) -> bool {
    let Ok(canonical_dir) = std::fs::canonicalize(dir).or_else(|_| Ok::<_, std::io::Error>(dir.to_path_buf())) else {
        return false;
    };
    let Some(path) = env::var_os("PATH") else {
        return false;
    };
    for entry in env::split_paths(&path) {
        let canonical_entry = std::fs::canonicalize(&entry).unwrap_or(entry);
        if canonical_entry == canonical_dir {
            return true;
        }
    }
    false
}

fn path_export_hint(dir: &Path) -> String {
    let dir_str = path_to_string(dir);
    if cfg!(windows) {
        format!(
            "Add {dir_str} to your PATH (Settings → System → About → Advanced system settings → Environment Variables)."
        )
    } else {
        format!(
            "Add to your shell profile (~/.zshrc, ~/.bashrc):\nexport PATH=\"{dir_str}:$PATH\""
        )
    }
}

fn read_cli_version(bin: &Path) -> Option<String> {
    let output = Command::new(bin).arg("--version").output().ok()?;
    if !output.status.success() {
        return None;
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    parse_version_string(stdout.trim())
}

/// Accept `hexkit 0.1.0` or just `0.1.0`; return the bare semver.
fn parse_version_string(s: &str) -> Option<String> {
    let token = s.split_whitespace().last()?;
    let trimmed = token.trim_start_matches('v');
    let mut parts = trimmed.split('.');
    let major: u32 = parts.next()?.parse().ok()?;
    let minor: u32 = parts.next().unwrap_or("0").parse().ok()?;
    let patch_raw = parts.next().unwrap_or("0");
    // Strip pre-release / build metadata for parsing but keep the original token.
    let patch_num = patch_raw
        .split(|c: char| !c.is_ascii_digit())
        .next()?
        .parse::<u32>()
        .ok()?;
    Some(format!("{major}.{minor}.{patch_num}"))
}

fn version_satisfies(installed: &str, required: &str) -> bool {
    let i = split_semver(installed);
    let r = split_semver(required);
    match (i, r) {
        (Some(i), Some(r)) => i >= r,
        _ => false,
    }
}

fn split_semver(v: &str) -> Option<(u32, u32, u32)> {
    let v = v.trim().trim_start_matches('v');
    let mut parts = v.split('.');
    let major = parts.next()?.parse().ok()?;
    let minor = parts.next().unwrap_or("0").parse().ok()?;
    let patch = parts
        .next()
        .unwrap_or("0")
        .split(|c: char| !c.is_ascii_digit())
        .next()
        .unwrap_or("0")
        .parse()
        .ok()?;
    Some((major, minor, patch))
}

fn bundled_sidecar_path() -> Option<PathBuf> {
    let exe = env::current_exe().ok()?;
    let dir = exe.parent()?.to_path_buf();
    let name = sidecar_filename();
    let candidate = dir.join(&name);
    if candidate.is_file() {
        return Some(candidate);
    }
    // macOS .app bundle: sidecar may also be inside Contents/Resources/binaries.
    let resources = dir.parent()?.join("Resources").join("binaries").join(&name);
    if resources.is_file() {
        return Some(resources);
    }
    None
}

fn home_dir() -> Option<PathBuf> {
    if cfg!(windows) {
        env::var_os("USERPROFILE")
            .or_else(|| env::var_os("HOME"))
            .map(PathBuf::from)
    } else {
        env::var_os("HOME").map(PathBuf::from)
    }
}

fn is_executable(path: &Path) -> bool {
    if !path.is_file() {
        return false;
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        path.metadata()
            .map(|m| m.permissions().mode() & 0o111 != 0)
            .unwrap_or(false)
    }
    #[cfg(not(unix))]
    {
        true
    }
}

#[cfg(unix)]
fn set_executable(path: &Path) -> std::io::Result<()> {
    use std::os::unix::fs::PermissionsExt;
    let mut perms = std::fs::metadata(path)?.permissions();
    perms.set_mode(0o755);
    std::fs::set_permissions(path, perms)
}

fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_versioned_output() {
        assert_eq!(parse_version_string("hexkit 1.2.3").as_deref(), Some("1.2.3"));
        assert_eq!(parse_version_string("0.1.0").as_deref(), Some("0.1.0"));
        assert_eq!(parse_version_string("v0.2.1-beta").as_deref(), Some("0.2.1"));
    }

    #[test]
    fn version_comparison_is_semver_aware() {
        assert!(version_satisfies("0.2.0", "0.1.9"));
        assert!(version_satisfies("1.0.0", "0.9.9"));
        assert!(version_satisfies("0.1.0", "0.1.0"));
        assert!(!version_satisfies("0.1.0", "0.2.0"));
        assert!(!version_satisfies("0.0.9", "0.1.0"));
    }

    #[test]
    fn bin_filename_matches_platform() {
        let name = bin_filename();
        if cfg!(windows) {
            assert_eq!(name, "hexkit.exe");
        } else {
            assert_eq!(name, "hexkit");
        }
    }
}
