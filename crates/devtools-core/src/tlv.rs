//! BER-TLV decoder, as used by EMV chip transactions and many smart-card
//! protocols. Recursively walks constructed nodes, attaches well-known EMV
//! tag names, and tries an ASCII interpretation for printable values.

use crate::error::{ToolError, ToolResult};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct TlvNode {
    /// Uppercase hex of the tag bytes (e.g. "9F02").
    pub tag: String,
    pub tag_class: &'static str,
    pub constructed: bool,
    pub length: usize,
    /// Uppercase hex of the value bytes.
    pub value: String,
    /// Best-effort UTF-8/ASCII interpretation when the value is printable.
    pub ascii: Option<String>,
    /// EMV tag friendly name, when known.
    pub name: Option<&'static str>,
    /// Decoded children when `constructed` is true. Empty otherwise.
    pub children: Vec<TlvNode>,
}

/// Decode a TLV stream supplied as hex (whitespace and `0x` prefixes ignored).
pub fn decode(hex_input: &str) -> ToolResult<Vec<TlvNode>> {
    let bytes = hex_to_bytes(hex_input)?;
    let mut nodes = Vec::new();
    let mut cursor = 0;
    while cursor < bytes.len() {
        // Skip the 0x00 padding bytes EMV pads structures with.
        if bytes[cursor] == 0x00 {
            cursor += 1;
            continue;
        }
        let node = parse_node(&bytes, &mut cursor)?;
        nodes.push(node);
    }
    Ok(nodes)
}

fn parse_node(bytes: &[u8], cursor: &mut usize) -> ToolResult<TlvNode> {
    let tag_start = *cursor;
    let first = read_byte(bytes, cursor)?;
    let tag_class = match first & 0xC0 {
        0x00 => "universal",
        0x40 => "application",
        0x80 => "context-specific",
        _ => "private",
    };
    let constructed = first & 0x20 != 0;
    // Multi-byte tag continues while subsequent bytes have the MSB set.
    if first & 0x1F == 0x1F {
        loop {
            let b = read_byte(bytes, cursor)?;
            if b & 0x80 == 0 {
                break;
            }
        }
    }
    let tag = hex_uppercase(&bytes[tag_start..*cursor]);

    // Length: short form (<0x80) or long form (N subsequent bytes).
    let length = parse_length(bytes, cursor)?;
    if *cursor + length > bytes.len() {
        return Err(ToolError::invalid_input(format!(
            "tag {tag}: declared length {length} exceeds remaining buffer",
        )));
    }
    let value_bytes = &bytes[*cursor..*cursor + length];
    *cursor += length;

    let value = hex_uppercase(value_bytes);
    let children = if constructed && !value_bytes.is_empty() {
        let mut sub_cursor = 0;
        let mut kids = Vec::new();
        while sub_cursor < value_bytes.len() {
            if value_bytes[sub_cursor] == 0x00 {
                sub_cursor += 1;
                continue;
            }
            kids.push(parse_node(value_bytes, &mut sub_cursor)?);
        }
        kids
    } else {
        Vec::new()
    };

    Ok(TlvNode {
        name: tag_name(&tag),
        ascii: printable_ascii(value_bytes),
        children,
        tag,
        tag_class,
        constructed,
        length,
        value,
    })
}

fn parse_length(bytes: &[u8], cursor: &mut usize) -> ToolResult<usize> {
    let first = read_byte(bytes, cursor)?;
    if first < 0x80 {
        return Ok(first as usize);
    }
    let n = (first & 0x7F) as usize;
    if n == 0 || n > 4 {
        return Err(ToolError::invalid_input(format!(
            "unsupported BER length form: 0x{first:02X}",
        )));
    }
    let mut length: usize = 0;
    for _ in 0..n {
        length = (length << 8) | read_byte(bytes, cursor)? as usize;
    }
    Ok(length)
}

fn read_byte(bytes: &[u8], cursor: &mut usize) -> ToolResult<u8> {
    if *cursor >= bytes.len() {
        return Err(ToolError::invalid_input(
            "unexpected end of TLV stream while parsing",
        ));
    }
    let b = bytes[*cursor];
    *cursor += 1;
    Ok(b)
}

fn hex_to_bytes(input: &str) -> ToolResult<Vec<u8>> {
    let cleaned: String = input
        .chars()
        .filter(|c| !c.is_whitespace() && *c != ':')
        .collect();
    let cleaned = cleaned
        .strip_prefix("0x")
        .or_else(|| cleaned.strip_prefix("0X"))
        .map(str::to_string)
        .unwrap_or(cleaned);
    if cleaned.is_empty() {
        return Err(ToolError::invalid_input("input is empty"));
    }
    if !cleaned.len().is_multiple_of(2) {
        return Err(ToolError::invalid_input(
            "hex input must have an even number of digits",
        ));
    }
    let mut out = Vec::with_capacity(cleaned.len() / 2);
    for i in (0..cleaned.len()).step_by(2) {
        let byte = u8::from_str_radix(&cleaned[i..i + 2], 16)
            .map_err(|_| ToolError::invalid_input(format!("invalid hex at offset {i}")))?;
        out.push(byte);
    }
    Ok(out)
}

fn hex_uppercase(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push_str(&format!("{b:02X}"));
    }
    s
}

fn printable_ascii(bytes: &[u8]) -> Option<String> {
    if bytes.is_empty() {
        return None;
    }
    if bytes.iter().all(|b| (0x20..=0x7E).contains(b)) {
        Some(String::from_utf8_lossy(bytes).into_owned())
    } else {
        None
    }
}

/// Return the human-readable name for a well-known EMV/ISO tag, if any.
/// Trimmed to the tags most commonly seen when debugging chip transactions.
fn tag_name(tag: &str) -> Option<&'static str> {
    match tag {
        "4F" => Some("Application Identifier (AID)"),
        "50" => Some("Application Label"),
        "57" => Some("Track 2 Equivalent Data"),
        "5A" => Some("Application PAN"),
        "5F20" => Some("Cardholder Name"),
        "5F24" => Some("Application Expiration Date"),
        "5F25" => Some("Application Effective Date"),
        "5F28" => Some("Issuer Country Code"),
        "5F2A" => Some("Transaction Currency Code"),
        "5F2D" => Some("Language Preference"),
        "5F30" => Some("Service Code"),
        "5F34" => Some("PAN Sequence Number"),
        "6F" => Some("File Control Information (FCI) Template"),
        "70" => Some("Read Record Response Message Template"),
        "77" => Some("Response Message Template Format 2"),
        "80" => Some("Response Message Template Format 1"),
        "82" => Some("Application Interchange Profile"),
        "83" => Some("Command Template"),
        "84" => Some("Dedicated File Name"),
        "87" => Some("Application Priority Indicator"),
        "88" => Some("Short File Identifier (SFI)"),
        "8A" => Some("Authorisation Response Code"),
        "8C" => Some("CDOL1"),
        "8D" => Some("CDOL2"),
        "8E" => Some("Cardholder Verification Method (CVM) List"),
        "8F" => Some("Certification Authority Public Key Index"),
        "90" => Some("Issuer Public Key Certificate"),
        "92" => Some("Issuer Public Key Remainder"),
        "93" => Some("Signed Static Application Data"),
        "94" => Some("Application File Locator (AFL)"),
        "95" => Some("Terminal Verification Results"),
        "9A" => Some("Transaction Date"),
        "9B" => Some("Transaction Status Information"),
        "9C" => Some("Transaction Type"),
        "9F02" => Some("Amount, Authorised"),
        "9F03" => Some("Amount, Other"),
        "9F06" => Some("Application Identifier (Terminal)"),
        "9F07" => Some("Application Usage Control"),
        "9F08" => Some("Application Version Number"),
        "9F09" => Some("Application Version Number (Terminal)"),
        "9F0D" => Some("Issuer Action Code — Default"),
        "9F0E" => Some("Issuer Action Code — Denial"),
        "9F0F" => Some("Issuer Action Code — Online"),
        "9F10" => Some("Issuer Application Data"),
        "9F11" => Some("Issuer Code Table Index"),
        "9F12" => Some("Application Preferred Name"),
        "9F1A" => Some("Terminal Country Code"),
        "9F1B" => Some("Terminal Floor Limit"),
        "9F1C" => Some("Terminal Identification"),
        "9F1E" => Some("Interface Device (IFD) Serial Number"),
        "9F21" => Some("Transaction Time"),
        "9F26" => Some("Application Cryptogram"),
        "9F27" => Some("Cryptogram Information Data"),
        "9F33" => Some("Terminal Capabilities"),
        "9F34" => Some("CVM Results"),
        "9F35" => Some("Terminal Type"),
        "9F36" => Some("Application Transaction Counter (ATC)"),
        "9F37" => Some("Unpredictable Number"),
        "9F38" => Some("PDOL"),
        "9F39" => Some("POS Entry Mode"),
        "9F40" => Some("Additional Terminal Capabilities"),
        "9F41" => Some("Transaction Sequence Counter"),
        "9F42" => Some("Application Currency Code"),
        "9F4E" => Some("Merchant Name and Location"),
        "A5" => Some("FCI Proprietary Template"),
        "BF0C" => Some("FCI Issuer Discretionary Data"),
        _ => None,
    }
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    #[derive(Deserialize)]
    struct In {
        input: String,
    }
    let p: In = serde_json::from_value(params)
        .map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "tlv.decode" => serde_json::to_value(decode(&p.input)?)
            .map_err(|e| ToolError::other(e.to_string())),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_a_flat_primitive() {
        // Tag 50 (Application Label) length 4 value "VISA"
        let nodes = decode("50 04 56 49 53 41").unwrap();
        assert_eq!(nodes.len(), 1);
        let n = &nodes[0];
        assert_eq!(n.tag, "50");
        assert_eq!(n.length, 4);
        assert_eq!(n.value, "56495341");
        assert_eq!(n.ascii.as_deref(), Some("VISA"));
        assert_eq!(n.name, Some("Application Label"));
        assert!(!n.constructed);
    }

    #[test]
    fn decodes_a_constructed_node_recursively() {
        // 6F = FCI Template (constructed), containing 84 (DF Name) "1234"
        // 6F 08 84 06 31 32 33 34 35 36
        let nodes = decode("6F 08 84 06 31 32 33 34 35 36").unwrap();
        assert_eq!(nodes.len(), 1);
        let outer = &nodes[0];
        assert_eq!(outer.tag, "6F");
        assert!(outer.constructed);
        assert_eq!(outer.children.len(), 1);
        let inner = &outer.children[0];
        assert_eq!(inner.tag, "84");
        assert_eq!(inner.length, 6);
        assert_eq!(inner.ascii.as_deref(), Some("123456"));
    }

    #[test]
    fn handles_multi_byte_tag() {
        // 9F02 = Amount Authorised, length 6, value 000000012345
        let nodes = decode("9F02 06 00 00 00 01 23 45").unwrap();
        assert_eq!(nodes[0].tag, "9F02");
        assert_eq!(nodes[0].name, Some("Amount, Authorised"));
        assert_eq!(nodes[0].value, "000000012345");
    }

    #[test]
    fn handles_long_form_length() {
        // Tag 70, length 0x81 0x82 (130 bytes). We only need to check the
        // parser accepts the encoding; build a stream of 130 zero bytes.
        let mut input = String::from("70 81 82 ");
        for _ in 0..130 {
            input.push_str("00 ");
        }
        let nodes = decode(&input).unwrap();
        assert_eq!(nodes[0].tag, "70");
        assert_eq!(nodes[0].length, 130);
    }

    #[test]
    fn decodes_realistic_emv_pse_response() {
        // Mirrors the TLV tool's default sample so the UI never ships a
        // broken example again.
        let nodes = decode(
            "6F34840E315041592E5359532E4444463031A522BF0C1F611D\
             4F07A0000000031010500A4D6173746572636172648701015F2D02656E",
        )
        .unwrap();
        assert_eq!(nodes.len(), 1);
        let fci = &nodes[0];
        assert_eq!(fci.tag, "6F");
        assert_eq!(fci.length, 0x34);
        // 6F → [84 (DF Name), A5 (FCI Proprietary Template)]
        assert_eq!(fci.children.len(), 2);
        assert_eq!(fci.children[0].tag, "84");
        assert_eq!(fci.children[0].ascii.as_deref(), Some("1PAY.SYS.DDF01"));
        let app_template = &fci.children[1].children[0].children[0];
        assert_eq!(app_template.tag, "61");
        // 61 → [4F (AID), 50 (Label), 87 (Priority), 5F2D (Language)]
        assert_eq!(app_template.children.len(), 4);
        assert_eq!(app_template.children[1].ascii.as_deref(), Some("Mastercard"));
        assert_eq!(app_template.children[3].tag, "5F2D");
        assert_eq!(app_template.children[3].ascii.as_deref(), Some("en"));
    }

    #[test]
    fn rejects_truncated_value() {
        // Declares length 4 but only 2 bytes follow.
        assert!(decode("50 04 31 32").is_err());
    }

    #[test]
    fn rejects_odd_hex() {
        assert!(decode("ABC").is_err());
    }
}
