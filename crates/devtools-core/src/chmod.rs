//! Unix file-permission (chmod) calculator: describe an octal or symbolic
//! mode as octal, symbolic, and the per-class read/write/execute bits.

use crate::error::{ToolError, ToolResult};
use serde::Serialize;
use serde_json::Value;

/// Read/write/execute flags for a single permission class.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub struct ClassBits {
    pub read: bool,
    pub write: bool,
    pub execute: bool,
}

/// The setuid / setgid / sticky special bits.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub struct SpecialBits {
    pub setuid: bool,
    pub setgid: bool,
    pub sticky: bool,
}

/// Full description of a permission mode. Owns its `octal`/`symbolic` strings,
/// so it is `Clone` but not `Copy`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Mode {
    pub octal: String,
    pub symbolic: String,
    pub owner: ClassBits,
    pub group: ClassBits,
    pub others: ClassBits,
    pub special: SpecialBits,
}

/// Describe a permission mode from either an octal (`"755"`, `"0644"`,
/// `"0o755"`) or symbolic (`"rwxr-xr-x"`) string. Returns
/// [`ToolError::InvalidInput`] on a malformed mode.
pub fn describe(input: &str) -> ToolResult<Mode> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err(ToolError::invalid_input("empty mode"));
    }

    let bits = if looks_octal(trimmed) {
        parse_octal(trimmed)?
    } else {
        parse_symbolic(trimmed)?
    };

    Ok(from_bits(bits))
}

/// True when the input is made only of octal digits, optionally with an
/// `0o` or leading-`0` prefix — the symbolic form always contains letters.
fn looks_octal(input: &str) -> bool {
    let digits = input.strip_prefix("0o").unwrap_or(input);
    !digits.is_empty() && digits.bytes().all(|b| b.is_ascii_digit())
}

/// Parse an octal mode into a 12-bit permission value (`0o7777` max).
fn parse_octal(input: &str) -> ToolResult<u16> {
    let digits = input.strip_prefix("0o").unwrap_or(input);
    let value = u16::from_str_radix(digits, 8)
        .map_err(|_| ToolError::invalid_input(format!("invalid octal mode: {input}")))?;
    if value > 0o7777 {
        return Err(ToolError::invalid_input(format!(
            "octal mode out of range: {input}"
        )));
    }
    Ok(value)
}

/// Parse a 9-character symbolic mode (`"rwxr-xr-x"`) into a permission value.
/// `s`/`S` in the execute slot of owner/group encode setuid/setgid; `t`/`T`
/// in the others execute slot encodes the sticky bit.
fn parse_symbolic(input: &str) -> ToolResult<u16> {
    let chars: Vec<char> = input.chars().collect();
    if chars.len() != 9 {
        return Err(ToolError::invalid_input(format!(
            "symbolic mode must be 9 characters: {input}"
        )));
    }

    let mut perms: u16 = 0;
    let mut special: u16 = 0;

    // Owner / group / others, three slots each: read, write, execute.
    for (class, chunk) in chars.chunks(3).enumerate() {
        let shift = 6 - class as u16 * 3;

        if chunk[0] == 'r' {
            perms |= 0o4 << shift;
        } else if chunk[0] != '-' {
            return Err(read_err(chunk[0]));
        }

        if chunk[1] == 'w' {
            perms |= 0o2 << shift;
        } else if chunk[1] != '-' {
            return Err(write_err(chunk[1]));
        }

        // The execute slot doubles as the special-bit slot for each class.
        match (class, chunk[2]) {
            (_, 'x') => perms |= 0o1 << shift,
            (_, '-') => {}
            (0, 's') => {
                perms |= 0o1 << shift;
                special |= 0o4;
            }
            (0, 'S') => special |= 0o4,
            (1, 's') => {
                perms |= 0o1 << shift;
                special |= 0o2;
            }
            (1, 'S') => special |= 0o2,
            (2, 't') => {
                perms |= 0o1 << shift;
                special |= 0o1;
            }
            (2, 'T') => special |= 0o1,
            (_, other) => return Err(execute_err(other)),
        }
    }

    Ok((special << 9) | perms)
}

fn read_err(ch: char) -> ToolError {
    ToolError::invalid_input(format!("expected 'r' or '-', found '{ch}'"))
}

fn write_err(ch: char) -> ToolError {
    ToolError::invalid_input(format!("expected 'w' or '-', found '{ch}'"))
}

fn execute_err(ch: char) -> ToolError {
    ToolError::invalid_input(format!("invalid execute/special character: '{ch}'"))
}

/// Build a full [`Mode`] description from a 12-bit permission value.
fn from_bits(bits: u16) -> Mode {
    let special = (bits >> 9) & 0o7;
    let owner = class_bits(bits >> 6);
    let group = class_bits(bits >> 3);
    let others = class_bits(bits);

    let setuid = special & 0o4 != 0;
    let setgid = special & 0o2 != 0;
    let sticky = special & 0o1 != 0;

    Mode {
        octal: format!("0{bits:o}"),
        symbolic: symbolic_string(owner, group, others, setuid, setgid, sticky),
        owner,
        group,
        others,
        special: SpecialBits {
            setuid,
            setgid,
            sticky,
        },
    }
}

/// Extract the low three bits of `value` as a read/write/execute triple.
fn class_bits(value: u16) -> ClassBits {
    ClassBits {
        read: value & 0o4 != 0,
        write: value & 0o2 != 0,
        execute: value & 0o1 != 0,
    }
}

/// Render the 9-character symbolic string, folding the special bits into the
/// execute slots (`s`/`S`, `t`/`T`) the same way `ls -l` does.
fn symbolic_string(
    owner: ClassBits,
    group: ClassBits,
    others: ClassBits,
    setuid: bool,
    setgid: bool,
    sticky: bool,
) -> String {
    let mut out = String::with_capacity(9);
    out.push(if owner.read { 'r' } else { '-' });
    out.push(if owner.write { 'w' } else { '-' });
    out.push(exec_char(owner.execute, setuid, 's', 'S'));
    out.push(if group.read { 'r' } else { '-' });
    out.push(if group.write { 'w' } else { '-' });
    out.push(exec_char(group.execute, setgid, 's', 'S'));
    out.push(if others.read { 'r' } else { '-' });
    out.push(if others.write { 'w' } else { '-' });
    out.push(exec_char(others.execute, sticky, 't', 'T'));
    out
}

/// Pick the execute-slot character given the execute and special bits.
fn exec_char(execute: bool, special: bool, set: char, unset: char) -> char {
    match (execute, special) {
        (true, true) => set,
        (false, true) => unset,
        (true, false) => 'x',
        (false, false) => '-',
    }
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    #[derive(serde::Deserialize)]
    struct Input {
        input: String,
    }

    let parsed: Input =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;

    match action {
        "chmod.describe" => serde_json::to_value(describe(&parsed.input)?)
            .map_err(|e| ToolError::invalid_input(e.to_string())),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn octal_to_symbolic() {
        let mode = describe("755").unwrap();
        assert_eq!(mode.octal, "0755");
        assert_eq!(mode.symbolic, "rwxr-xr-x");
        assert!(mode.owner.read && mode.owner.write && mode.owner.execute);
        assert!(mode.group.read && !mode.group.write && mode.group.execute);
        assert!(mode.others.read && !mode.others.write && mode.others.execute);
        assert_eq!(
            mode.special,
            SpecialBits {
                setuid: false,
                setgid: false,
                sticky: false
            }
        );
    }

    #[test]
    fn accepts_octal_prefixes() {
        assert_eq!(describe("0644").unwrap().symbolic, "rw-r--r--");
        assert_eq!(describe("0o644").unwrap().symbolic, "rw-r--r--");
        assert_eq!(describe("644").unwrap().octal, "0644");
    }

    #[test]
    fn symbolic_to_octal() {
        let mode = describe("rwxr-xr-x").unwrap();
        assert_eq!(mode.octal, "0755");
        assert_eq!(mode.symbolic, "rwxr-xr-x");

        let mode = describe("rw-r--r--").unwrap();
        assert_eq!(mode.octal, "0644");
    }

    #[test]
    fn special_bits_octal() {
        // setuid (4000) + 755
        let mode = describe("4755").unwrap();
        assert_eq!(mode.octal, "04755");
        assert_eq!(mode.symbolic, "rwsr-xr-x");
        assert!(mode.special.setuid);
        assert!(!mode.special.setgid);
        assert!(!mode.special.sticky);

        // sticky bit (1000) + 777
        let mode = describe("1777").unwrap();
        assert_eq!(mode.symbolic, "rwxrwxrwt");
        assert!(mode.special.sticky);

        // setgid (2000) without execute -> capital S
        let mode = describe("2644").unwrap();
        assert_eq!(mode.symbolic, "rw-r-Sr--");
        assert!(mode.special.setgid);
    }

    #[test]
    fn special_bits_symbolic_round_trip() {
        let mode = describe("rwsr-sr-t").unwrap();
        assert!(mode.special.setuid && mode.special.setgid && mode.special.sticky);
        assert_eq!(mode.octal, "07755");

        // Uppercase forms mean the special bit is set but execute is not.
        let mode = describe("rwSr--r-T").unwrap();
        assert!(mode.special.setuid && mode.special.sticky);
        assert!(!mode.owner.execute && !mode.others.execute);
        assert_eq!(mode.octal, "05644");
    }

    #[test]
    fn dispatch_describe_returns_object() {
        let out =
            dispatch("chmod.describe", serde_json::json!({ "input": "755" })).unwrap();
        assert_eq!(out["octal"], "0755");
        assert_eq!(out["symbolic"], "rwxr-xr-x");
        assert_eq!(out["owner"]["write"], true);
    }

    #[test]
    fn rejects_empty() {
        assert!(matches!(describe(""), Err(ToolError::InvalidInput(_))));
        assert!(matches!(describe("   "), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_octal_out_of_range() {
        assert!(matches!(describe("9999"), Err(ToolError::InvalidInput(_))));
        assert!(matches!(describe("77777"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_bad_symbolic_length() {
        assert!(matches!(describe("rwxr-xr"), Err(ToolError::InvalidInput(_))));
        assert!(matches!(
            describe("rwxr-xr-xx"),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn rejects_bad_symbolic_chars() {
        assert!(matches!(describe("zwxr-xr-x"), Err(ToolError::InvalidInput(_))));
        assert!(matches!(describe("rzxr-xr-x"), Err(ToolError::InvalidInput(_))));
        // sticky char in the owner slot is invalid
        assert!(matches!(describe("rwtr-xr-x"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn unknown_action_is_invalid_input() {
        let err = dispatch("chmod.nope", serde_json::json!({ "input": "755" })).unwrap_err();
        assert!(matches!(err, ToolError::InvalidInput(_)));
    }
}
