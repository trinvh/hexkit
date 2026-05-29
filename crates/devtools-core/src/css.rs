//! CSS / SCSS / Less beautify, plus CSS minify.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;

fn syntax_from(name: &str) -> ToolResult<malva::Syntax> {
    match name {
        "css" => Ok(malva::Syntax::Css),
        "scss" => Ok(malva::Syntax::Scss),
        "less" => Ok(malva::Syntax::Less),
        other => Err(ToolError::invalid_input(format!("unknown syntax: {other}"))),
    }
}

/// Beautify CSS/SCSS/Less source.
pub fn beautify(input: &str, syntax: &str) -> ToolResult<String> {
    let syntax = syntax_from(syntax)?;
    malva::format_text(input, syntax, &malva::config::FormatOptions::default())
        .map_err(|e| ToolError::invalid_input(e.to_string()))
}

/// Minify plain CSS (SCSS/Less are not supported by the minifier).
pub fn minify(input: &str, syntax: &str) -> ToolResult<String> {
    if syntax != "css" {
        return Err(ToolError::invalid_input(
            "minify is only supported for plain CSS",
        ));
    }
    use lightningcss::stylesheet::{ParserOptions, PrinterOptions, StyleSheet};
    let sheet = StyleSheet::parse(input, ParserOptions::default())
        .map_err(|e| ToolError::invalid_input(format!("{e:?}")))?;
    let result = sheet
        .to_css(PrinterOptions {
            minify: true,
            ..Default::default()
        })
        .map_err(|e| ToolError::other(format!("{e:?}")))?;
    Ok(result.code)
}

#[derive(Deserialize)]
struct CssParams {
    input: String,
    #[serde(default = "default_syntax")]
    syntax: String,
}

fn default_syntax() -> String {
    "css".to_string()
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let p: CssParams =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "css.beautify" => Ok(Value::String(beautify(&p.input, &p.syntax)?)),
        "css.minify" => Ok(Value::String(minify(&p.input, &p.syntax)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn beautifies_css() {
        let out = beautify("a{color:red}", "css").unwrap();
        assert!(out.contains("color: red"));
        assert!(out.contains('\n'));
    }

    #[test]
    fn beautifies_scss() {
        let out = beautify("$x: 1px;\na{margin:$x}", "scss").unwrap();
        assert!(out.contains("margin"));
    }

    #[test]
    fn minifies_css() {
        let out = minify("a {\n  color: red;\n}\n", "css").unwrap();
        assert!(!out.contains('\n'));
        assert!(out.contains("color"));
    }

    #[test]
    fn minify_rejects_non_css_syntax() {
        assert!(matches!(minify("a{}", "scss"), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn rejects_unknown_syntax() {
        assert!(matches!(beautify("a{}", "stylus"), Err(ToolError::InvalidInput(_))));
    }
}
