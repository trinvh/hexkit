//! XML beautify (re-indent), minify (strip inter-tag whitespace), and XPath query.

use crate::error::{ToolError, ToolResult};
use quick_xml::events::Event;
use quick_xml::{Reader, Writer};
use serde::Deserialize;
use serde_json::Value;
use std::io::Cursor;
use sxd_document::dom::{ChildOfElement, Element};
use sxd_document::parser;
use sxd_xpath::nodeset::Node;
use sxd_xpath::{evaluate_xpath, Value as XpathValue};

fn reformat(input: &str, indent: Option<usize>) -> ToolResult<String> {
    let mut reader = Reader::from_str(input.trim());
    let config = reader.config_mut();
    config.trim_text(true);
    config.check_end_names = true;

    let buffer = Cursor::new(Vec::new());
    let mut writer = match indent {
        Some(size) => Writer::new_with_indent(buffer, b' ', size),
        None => Writer::new(buffer),
    };

    loop {
        match reader.read_event() {
            Ok(Event::Eof) => break,
            Ok(event) => writer
                .write_event(event)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?,
            Err(e) => return Err(ToolError::invalid_input(format!("XML error: {e}"))),
        }
    }

    let bytes = writer.into_inner().into_inner();
    String::from_utf8(bytes).map_err(|e| ToolError::other(e.to_string()))
}

/// Re-indent XML with two-space indentation.
pub fn beautify(input: &str) -> ToolResult<String> {
    reformat(input, Some(2))
}

/// Collapse XML to a single line.
pub fn minify(input: &str) -> ToolResult<String> {
    reformat(input, None)
}

/// Filter XML with an XPath 1.0 expression. Matched element nodes are returned
/// as XML, attribute/text nodes as their value, one match per line. Scalar
/// results (string/number/boolean) are returned directly.
pub fn query(input: &str, xpath: &str) -> ToolResult<String> {
    let package = parser::parse(input.trim())
        .map_err(|e| ToolError::invalid_input(format!("invalid XML: {e:?}")))?;
    let document = package.as_document();
    let value = evaluate_xpath(&document, xpath)
        .map_err(|e| ToolError::invalid_input(format!("invalid XPath: {e}")))?;

    let output = match value {
        XpathValue::Nodeset(nodeset) => nodeset
            .document_order()
            .into_iter()
            .map(serialize_node)
            .collect::<Vec<_>>()
            .join("\n"),
        XpathValue::String(s) => s,
        XpathValue::Number(n) => format_number(n),
        XpathValue::Boolean(b) => b.to_string(),
    };
    Ok(output)
}

fn format_number(n: f64) -> String {
    if n.fract() == 0.0 && n.is_finite() {
        format!("{}", n as i64)
    } else {
        n.to_string()
    }
}

fn serialize_node(node: Node<'_>) -> String {
    match node {
        Node::Element(element) => serialize_element(element),
        Node::Attribute(attr) => attr.value().to_string(),
        Node::Text(text) => text.text().to_string(),
        other => other.string_value(),
    }
}

/// Serialize an element (and its subtree) back to XML. Namespaces are rendered
/// by local name; this is a readable preview, not a canonical round-trip.
fn serialize_element(element: Element<'_>) -> String {
    let name = element.name().local_part();
    let mut out = format!("<{name}");
    for attr in element.attributes() {
        out.push_str(&format!(
            " {}=\"{}\"",
            attr.name().local_part(),
            html_escape::encode_double_quoted_attribute(attr.value()),
        ));
    }

    let children = element.children();
    if children.is_empty() {
        out.push_str("/>");
        return out;
    }

    out.push('>');
    for child in children {
        match child {
            ChildOfElement::Element(child_el) => out.push_str(&serialize_element(child_el)),
            ChildOfElement::Text(text) => {
                out.push_str(&html_escape::encode_text(text.text()));
            }
            ChildOfElement::Comment(comment) => {
                out.push_str(&format!("<!--{}-->", comment.text()));
            }
            ChildOfElement::ProcessingInstruction(_) => {}
        }
    }
    out.push_str(&format!("</{name}>"));
    out
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

#[derive(Deserialize)]
struct QueryParams {
    input: String,
    xpath: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    match action {
        "xml.beautify" => {
            let p: OneInput = from_params(params)?;
            Ok(Value::String(beautify(&p.input)?))
        }
        "xml.minify" => {
            let p: OneInput = from_params(params)?;
            Ok(Value::String(minify(&p.input)?))
        }
        "xml.query" => {
            let p: QueryParams = from_params(params)?;
            Ok(Value::String(query(&p.input, &p.xpath)?))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

fn from_params<T: serde::de::DeserializeOwned>(params: Value) -> ToolResult<T> {
    serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn beautifies_nested_xml() {
        let out = beautify("<a><b>x</b></a>").unwrap();
        assert!(out.contains("<a>"));
        assert!(out.contains("  <b>x</b>"));
    }

    #[test]
    fn minifies_xml() {
        assert_eq!(minify("<a>\n  <b>x</b>\n</a>").unwrap(), "<a><b>x</b></a>");
    }

    #[test]
    fn rejects_mismatched_tags() {
        assert!(matches!(beautify("<a></b>"), Err(ToolError::InvalidInput(_))));
    }

    const DOC: &str = r#"<catalog><book id="bk101"><author>Gambardella</author><title>XML Guide</title></book><book id="bk102"><author>Ralls</author><title>Midnight</title></book></catalog>"#;

    #[test]
    fn query_extracts_matching_elements() {
        let out = query(DOC, "//author").unwrap();
        assert_eq!(out, "<author>Gambardella</author>\n<author>Ralls</author>");
    }

    #[test]
    fn query_extracts_attribute_values() {
        assert_eq!(query(DOC, "//book/@id").unwrap(), "bk101\nbk102");
    }

    #[test]
    fn query_extracts_text_nodes() {
        assert_eq!(query(DOC, "//title/text()").unwrap(), "XML Guide\nMidnight");
    }

    #[test]
    fn query_returns_scalar_results() {
        assert_eq!(query(DOC, "count(//book)").unwrap(), "2");
    }

    #[test]
    fn query_is_empty_when_nothing_matches() {
        assert_eq!(query(DOC, "//nope").unwrap(), "");
    }

    #[test]
    fn query_rejects_invalid_xpath() {
        assert!(matches!(query(DOC, "//["), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn query_rejects_invalid_xml() {
        assert!(matches!(
            query("<a></b>", "//a"),
            Err(ToolError::InvalidInput(_))
        ));
    }
}
