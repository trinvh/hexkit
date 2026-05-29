//! Color format conversion (hex, rgb(a), hsl(a), hsb, hwb, cmyk; named colors).

use crate::error::{ToolError, ToolResult};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct ColorOut {
    pub hex: String,
    pub hex8: String,
    pub rgb: String,
    pub rgba: String,
    pub hsl: String,
    pub hsla: String,
    pub hsb: String,
    pub hwb: String,
    pub cmyk: String,
}

/// Parse any CSS color (hex, rgb(), hsl(), named) and render it in every format.
pub fn convert(input: &str) -> ToolResult<ColorOut> {
    let color = csscolorparser::parse(input.trim())
        .map_err(|e| ToolError::invalid_input(e.to_string()))?;

    let [r8, g8, b8, a8] = color.to_rgba8();
    // Normalize to 0..1 from the 8-bit channels so every format agrees with hex.
    let (r, g, b) = (r8 as f64 / 255.0, g8 as f64 / 255.0, b8 as f64 / 255.0);
    let alpha = color.a as f64;

    let max = r.max(g).max(b);
    let min = r.min(g).min(b);
    let delta = max - min;

    let hue = if delta == 0.0 {
        0.0
    } else if max == r {
        60.0 * (((g - b) / delta).rem_euclid(6.0))
    } else if max == g {
        60.0 * ((b - r) / delta + 2.0)
    } else {
        60.0 * ((r - g) / delta + 4.0)
    };

    let light = (max + min) / 2.0;
    let sat_l = if delta == 0.0 {
        0.0
    } else {
        delta / (1.0 - (2.0 * light - 1.0).abs())
    };
    let sat_v = if max == 0.0 { 0.0 } else { delta / max };

    let white = min;
    let black = 1.0 - max;

    let k = 1.0 - max;
    let (c, m, y) = if k >= 1.0 {
        (0.0, 0.0, 0.0)
    } else {
        (
            (1.0 - r - k) / (1.0 - k),
            (1.0 - g - k) / (1.0 - k),
            (1.0 - b - k) / (1.0 - k),
        )
    };

    let pct = |x: f64| (x * 100.0).round();
    let deg = hue.round();

    Ok(ColorOut {
        hex: format!("#{r8:02x}{g8:02x}{b8:02x}"),
        hex8: format!("#{r8:02x}{g8:02x}{b8:02x}{a8:02x}"),
        rgb: format!("rgb({r8}, {g8}, {b8})"),
        rgba: format!("rgba({r8}, {g8}, {b8}, {})", trim(alpha)),
        hsl: format!("hsl({deg}, {}%, {}%)", pct(sat_l), pct(light)),
        hsla: format!("hsla({deg}, {}%, {}%, {})", pct(sat_l), pct(light), trim(alpha)),
        hsb: format!("hsb({deg}, {}%, {}%)", pct(sat_v), pct(max)),
        hwb: format!("hwb({deg} {}% {}%)", pct(white), pct(black)),
        cmyk: format!(
            "cmyk({}%, {}%, {}%, {}%)",
            pct(c),
            pct(m),
            pct(y),
            pct(k)
        ),
    })
}

/// Format a 0..1 value with up to two decimals, trimming trailing zeros.
fn trim(x: f64) -> String {
    let s = format!("{x:.2}");
    let s = s.trim_end_matches('0').trim_end_matches('.');
    s.to_string()
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "color.convert" => {
            serde_json::to_value(convert(&parsed.input)?).map_err(|e| ToolError::other(e.to_string()))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn converts_hex_to_all_formats() {
        let c = convert("#ff0000").unwrap();
        assert_eq!(c.hex, "#ff0000");
        assert_eq!(c.hex8, "#ff0000ff");
        assert_eq!(c.rgb, "rgb(255, 0, 0)");
        assert_eq!(c.rgba, "rgba(255, 0, 0, 1)");
        assert_eq!(c.hsl, "hsl(0, 100%, 50%)");
        assert_eq!(c.hsla, "hsla(0, 100%, 50%, 1)");
        assert_eq!(c.hsb, "hsb(0, 100%, 100%)");
        assert_eq!(c.hwb, "hwb(0 0% 0%)");
        assert_eq!(c.cmyk, "cmyk(0%, 100%, 100%, 0%)");
    }

    #[test]
    fn handles_alpha() {
        let c = convert("rgba(255, 0, 0, 0.5)").unwrap();
        assert_eq!(c.hex8, "#ff000080");
        assert_eq!(c.rgba, "rgba(255, 0, 0, 0.5)");
    }

    #[test]
    fn converts_a_mixed_color() {
        // #336699 -> rgb(51,102,153), hsl(210,50%,40%)
        let c = convert("#336699").unwrap();
        assert_eq!(c.rgb, "rgb(51, 102, 153)");
        assert_eq!(c.hsl, "hsl(210, 50%, 40%)");
        assert_eq!(c.cmyk, "cmyk(67%, 33%, 0%, 40%)");
    }

    #[test]
    fn parses_rgb_function() {
        assert_eq!(convert("rgb(0, 255, 0)").unwrap().hex, "#00ff00");
    }

    #[test]
    fn parses_named_color() {
        assert_eq!(convert("red").unwrap().hex, "#ff0000");
    }

    #[test]
    fn rejects_invalid_color() {
        assert!(matches!(convert("notacolor"), Err(ToolError::InvalidInput(_))));
    }
}
