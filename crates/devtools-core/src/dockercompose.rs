//! Convert a `docker run` command into an equivalent `docker-compose.yml`.
//!
//! Only the common flags are parsed; unknown flags are ignored gracefully.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;

/// A single compose service derived from a `docker run` invocation.
struct Service {
    name: String,
    image: String,
    ports: Vec<String>,
    environment: Vec<String>,
    volumes: Vec<String>,
    networks: Vec<String>,
    restart: Option<String>,
    working_dir: Option<String>,
    command: Vec<String>,
}

/// Derive a service key from an image reference, e.g. `library/redis:7` -> `redis`.
fn service_name_from_image(image: &str) -> String {
    let no_digest = image.split('@').next().unwrap_or(image);
    let no_tag = no_digest.split(':').next().unwrap_or(no_digest);
    let last = no_tag.rsplit('/').next().unwrap_or(no_tag);
    if last.is_empty() {
        "app".to_string()
    } else {
        last.to_string()
    }
}

/// Parse a `docker run …` command into a [`Service`].
fn parse_run(command: &str) -> ToolResult<Service> {
    let tokens =
        shell_words::split(command.trim()).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    let mut iter = tokens.iter().peekable();

    // Skip a leading `docker` and `run`.
    if iter.peek().map(|s| s.as_str()) == Some("docker") {
        iter.next();
    }
    if iter.peek().map(|s| s.as_str()) == Some("run") {
        iter.next();
    }

    let mut name = None;
    let mut image = None;
    let mut ports = Vec::new();
    let mut environment = Vec::new();
    let mut volumes = Vec::new();
    let mut networks = Vec::new();
    let mut restart = None;
    let mut working_dir = None;
    let mut command = Vec::new();

    while let Some(token) = iter.next() {
        // Once the image is known, every remaining token is the container command.
        if image.is_some() {
            command.push(token.clone());
            continue;
        }
        match token.as_str() {
            "-d" | "--detach" => {} // no-op: compose runs detached by default
            "--name" => name = iter.next().cloned(),
            "-p" | "--publish" => {
                if let Some(v) = iter.next() {
                    ports.push(v.clone());
                }
            }
            "-e" | "--env" => {
                if let Some(v) = iter.next() {
                    environment.push(v.clone());
                }
            }
            "-v" | "--volume" => {
                if let Some(v) = iter.next() {
                    volumes.push(v.clone());
                }
            }
            "--network" => {
                if let Some(v) = iter.next() {
                    networks.push(v.clone());
                }
            }
            "--restart" => restart = iter.next().cloned(),
            "-w" | "--workdir" => working_dir = iter.next().cloned(),
            // `--flag=value` form for the flags that take a value.
            flag if flag.starts_with("--") && flag.contains('=') => {
                let (key, value) = flag.split_once('=').unwrap();
                let value = value.to_string();
                match key {
                    "--name" => name = Some(value),
                    "--publish" => ports.push(value),
                    "--env" => environment.push(value),
                    "--volume" => volumes.push(value),
                    "--network" => networks.push(value),
                    "--restart" => restart = Some(value),
                    "--workdir" => working_dir = Some(value),
                    _ => {} // unknown flag, ignored
                }
            }
            // Any other flag is unknown; skip it (without consuming a value).
            flag if flag.starts_with('-') => {}
            // First positional is the image.
            positional => image = Some(positional.to_string()),
        }
    }

    let image = image.ok_or_else(|| ToolError::invalid_input("no image found in docker run command"))?;
    let name = name.unwrap_or_else(|| service_name_from_image(&image));
    Ok(Service {
        name,
        image,
        ports,
        environment,
        volumes,
        networks,
        restart,
        working_dir,
        command,
    })
}

/// Quote a scalar for YAML when it could otherwise be misread. Path-like values
/// with colons (e.g. `/data:/var/data`) stay bare, but a value that starts with
/// a digit (e.g. the port mapping `8080:80`, which could read as a sexagesimal
/// number) or carries `=`/whitespace/other punctuation is quoted.
fn yaml_scalar(value: &str) -> String {
    let starts_with_digit = value.chars().next().is_some_and(|c| c.is_ascii_digit());
    let chars_ok = value
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '_' | '-' | '.' | '/' | ':' | '@'));
    if !value.is_empty() && !starts_with_digit && chars_ok {
        value.to_string()
    } else {
        format!("{value:?}")
    }
}

/// Emit a compose-spec YAML document for `service`.
fn to_yaml(service: &Service) -> String {
    let mut out = String::from("services:\n");
    out.push_str(&format!("  {}:\n", yaml_scalar(&service.name)));
    // An image ref (`name:tag`, `registry/name@sha256:…`) is a safe YAML plain
    // scalar — the colon has no following space — so emit it unquoted, the way
    // hand-written compose files do.
    out.push_str(&format!("    image: {}\n", service.image));

    if let Some(restart) = &service.restart {
        out.push_str(&format!("    restart: {}\n", yaml_scalar(restart)));
    }
    if let Some(workdir) = &service.working_dir {
        out.push_str(&format!("    working_dir: {}\n", yaml_scalar(workdir)));
    }
    if !service.ports.is_empty() {
        out.push_str("    ports:\n");
        for p in &service.ports {
            out.push_str(&format!("      - {}\n", yaml_scalar(p)));
        }
    }
    if !service.environment.is_empty() {
        out.push_str("    environment:\n");
        for e in &service.environment {
            out.push_str(&format!("      - {}\n", yaml_scalar(e)));
        }
    }
    if !service.volumes.is_empty() {
        out.push_str("    volumes:\n");
        for v in &service.volumes {
            out.push_str(&format!("      - {}\n", yaml_scalar(v)));
        }
    }
    if !service.networks.is_empty() {
        out.push_str("    networks:\n");
        for n in &service.networks {
            out.push_str(&format!("      - {}\n", yaml_scalar(n)));
        }
    }
    if !service.command.is_empty() {
        let items: Vec<String> = service.command.iter().map(|c| yaml_scalar(c)).collect();
        out.push_str(&format!("    command: [{}]\n", items.join(", ")));
    }

    out
}

/// Convert a `docker run …` command into a `docker-compose` YAML string.
pub fn to_compose(command: &str) -> ToolResult<String> {
    let service = parse_run(command)?;
    Ok(to_yaml(&service))
}

#[derive(Deserialize)]
struct ComposeParams {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let p: ComposeParams =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "dockerc.to_compose" => Ok(Value::String(to_compose(&p.input)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn converts_representative_command() {
        let out = to_compose(
            "docker run -d --name web -p 8080:80 -e KEY=val -v /data:/var/data --restart unless-stopped nginx:latest nginx -g 'daemon off;'",
        )
        .unwrap();
        assert!(out.starts_with("services:\n"));
        assert!(out.contains("  web:\n"));
        assert!(out.contains("    image: nginx:latest\n"));
        assert!(out.contains("    restart: unless-stopped\n"));
        assert!(out.contains("    ports:\n      - \"8080:80\"\n"));
        assert!(out.contains("    environment:\n      - \"KEY=val\"\n"));
        assert!(out.contains("    volumes:\n      - /data:/var/data\n"));
        assert!(out.contains("    command: [nginx, -g, \"daemon off;\"]"));
        // -d is a no-op.
        assert!(!out.contains("detach"));
    }

    #[test]
    fn derives_service_name_from_image() {
        let out = to_compose("docker run library/redis:7").unwrap();
        assert!(out.contains("  redis:\n"));
        assert!(out.contains("    image: library/redis:7\n"));
    }

    #[test]
    fn repeatable_flags_collect() {
        let out = to_compose("docker run -p 80:80 -p 443:443 -e A=1 -e B=2 myimg").unwrap();
        assert!(out.contains("      - \"80:80\"\n      - \"443:443\"\n"));
        assert!(out.contains("      - \"A=1\"\n      - \"B=2\"\n"));
    }

    #[test]
    fn supports_equals_flag_form() {
        let out = to_compose("docker run --name=db --restart=always --workdir=/srv postgres").unwrap();
        assert!(out.contains("  db:\n"));
        assert!(out.contains("    restart: always\n"));
        assert!(out.contains("    working_dir: /srv\n"));
    }

    #[test]
    fn captures_network() {
        let out = to_compose("docker run --network mynet alpine").unwrap();
        assert!(out.contains("    networks:\n      - mynet\n"));
    }

    #[test]
    fn ignores_unknown_flags() {
        let out = to_compose("docker run --rm -it busybox").unwrap();
        assert!(out.contains("    image: busybox\n"));
    }

    #[test]
    fn rejects_missing_image() {
        assert!(matches!(
            to_compose("docker run -d --name web -p 80:80"),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn dispatch_routes_to_compose() {
        let out = dispatch(
            "dockerc.to_compose",
            serde_json::json!({ "input": "docker run nginx" }),
        )
        .unwrap();
        assert_eq!(out, Value::String("services:\n  nginx:\n    image: nginx\n".to_string()));
    }

    #[test]
    fn dispatch_rejects_unknown_action() {
        let err = dispatch("dockerc.nope", serde_json::json!({ "input": "x" })).unwrap_err();
        assert!(matches!(err, ToolError::InvalidInput(_)));
    }
}
