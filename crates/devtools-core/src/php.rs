//! PHP `serialize()` format <-> JSON.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::{Map, Number, Value};

/// Unserialize a PHP-serialized string into pretty JSON.
pub fn to_json(input: &str) -> ToolResult<String> {
    let value = unserialize(input.trim())?;
    serde_json::to_string_pretty(&value).map_err(|e| ToolError::other(e.to_string()))
}

/// Serialize JSON into the PHP `serialize()` format.
pub fn from_json(input: &str) -> ToolResult<String> {
    let value: Value =
        serde_json::from_str(input.trim()).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    Ok(serialize(&value))
}

fn serialize(value: &Value) -> String {
    match value {
        Value::Null => "N;".to_string(),
        Value::Bool(b) => format!("b:{};", i32::from(*b)),
        Value::Number(n) => {
            if n.is_i64() || n.is_u64() {
                format!("i:{n};")
            } else {
                format!("d:{n};")
            }
        }
        Value::String(s) => format!("s:{}:\"{}\";", s.len(), s),
        Value::Array(items) => {
            let mut out = format!("a:{}:{{", items.len());
            for (i, item) in items.iter().enumerate() {
                out.push_str(&format!("i:{i};"));
                out.push_str(&serialize(item));
            }
            out.push('}');
            out
        }
        Value::Object(map) => {
            let mut out = format!("a:{}:{{", map.len());
            for (key, item) in map {
                out.push_str(&format!("s:{}:\"{}\";", key.len(), key));
                out.push_str(&serialize(item));
            }
            out.push('}');
            out
        }
    }
}

fn unserialize(input: &str) -> ToolResult<Value> {
    let mut parser = Parser {
        bytes: input.as_bytes(),
        pos: 0,
    };
    parser.parse_value()
}

struct Parser<'a> {
    bytes: &'a [u8],
    pos: usize,
}

impl<'a> Parser<'a> {
    fn err(message: &str) -> ToolError {
        ToolError::invalid_input(format!("malformed PHP serialization: {message}"))
    }

    fn peek(&self) -> ToolResult<u8> {
        self.bytes
            .get(self.pos)
            .copied()
            .ok_or_else(|| Self::err("unexpected end of input"))
    }

    fn expect(&mut self, byte: u8) -> ToolResult<()> {
        if self.peek()? == byte {
            self.pos += 1;
            Ok(())
        } else {
            Err(Self::err("unexpected byte"))
        }
    }

    fn read_until(&mut self, delim: u8) -> ToolResult<&'a str> {
        let start = self.pos;
        while self.peek()? != delim {
            self.pos += 1;
        }
        let slice = std::str::from_utf8(&self.bytes[start..self.pos])
            .map_err(|_| Self::err("invalid UTF-8"))?;
        self.pos += 1;
        Ok(slice)
    }

    fn parse_value(&mut self) -> ToolResult<Value> {
        match self.peek()? {
            b'N' => {
                self.expect(b'N')?;
                self.expect(b';')?;
                Ok(Value::Null)
            }
            b'b' => {
                self.expect(b'b')?;
                self.expect(b':')?;
                match self.read_until(b';')? {
                    "0" => Ok(Value::Bool(false)),
                    "1" => Ok(Value::Bool(true)),
                    _ => Err(Self::err("invalid bool")),
                }
            }
            b'i' => {
                self.expect(b'i')?;
                self.expect(b':')?;
                let digits = self.read_until(b';')?;
                let n: i64 = digits.parse().map_err(|_| Self::err("invalid int"))?;
                Ok(Value::Number(n.into()))
            }
            b'd' => {
                self.expect(b'd')?;
                self.expect(b':')?;
                let digits = self.read_until(b';')?;
                let n: f64 = digits.parse().map_err(|_| Self::err("invalid float"))?;
                Ok(Number::from_f64(n).map(Value::Number).unwrap_or(Value::Null))
            }
            b's' => Ok(Value::String(self.parse_string()?)),
            b'a' => self.parse_array(),
            _ => Err(Self::err("unknown type marker")),
        }
    }

    fn parse_string(&mut self) -> ToolResult<String> {
        self.expect(b's')?;
        self.expect(b':')?;
        let len: usize = self
            .read_until(b':')?
            .parse()
            .map_err(|_| Self::err("invalid string length"))?;
        self.expect(b'"')?;
        if self.pos + len > self.bytes.len() {
            return Err(Self::err("string length out of range"));
        }
        let slice = std::str::from_utf8(&self.bytes[self.pos..self.pos + len])
            .map_err(|_| Self::err("invalid UTF-8"))?;
        let value = slice.to_string();
        self.pos += len;
        self.expect(b'"')?;
        self.expect(b';')?;
        Ok(value)
    }

    fn parse_array(&mut self) -> ToolResult<Value> {
        self.expect(b'a')?;
        self.expect(b':')?;
        let count: usize = self
            .read_until(b':')?
            .parse()
            .map_err(|_| Self::err("invalid array count"))?;
        self.expect(b'{')?;
        let mut keys = Vec::with_capacity(count);
        let mut values = Vec::with_capacity(count);
        for _ in 0..count {
            keys.push(self.parse_value()?);
            values.push(self.parse_value()?);
        }
        self.expect(b'}')?;

        let is_list = keys
            .iter()
            .enumerate()
            .all(|(i, key)| key.as_i64() == Some(i as i64));
        if is_list {
            return Ok(Value::Array(values));
        }

        let mut map = Map::new();
        for (key, value) in keys.into_iter().zip(values) {
            let key = match key {
                Value::String(s) => s,
                Value::Number(n) => n.to_string(),
                _ => return Err(Self::err("invalid array key")),
            };
            map.insert(key, value);
        }
        Ok(Value::Object(map))
    }
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "php.to_json" => Ok(Value::String(to_json(&parsed.input)?)),
        "php.from_json" => Ok(Value::String(from_json(&parsed.input)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn serializes_object() {
        assert_eq!(
            from_json(r#"{"a":1,"b":"hi"}"#).unwrap(),
            r#"a:2:{s:1:"a";i:1;s:1:"b";s:2:"hi";}"#
        );
    }

    #[test]
    fn serializes_array() {
        assert_eq!(from_json("[1,2,3]").unwrap(), "a:3:{i:0;i:1;i:1;i:2;i:2;i:3;}");
    }

    #[test]
    fn serializes_scalars() {
        assert_eq!(from_json("null").unwrap(), "N;");
        assert_eq!(from_json("true").unwrap(), "b:1;");
        assert_eq!(from_json("42").unwrap(), "i:42;");
        assert_eq!(from_json(r#""hi""#).unwrap(), r#"s:2:"hi";"#);
    }

    #[test]
    fn unserializes_object() {
        let json = to_json(r#"a:2:{s:1:"a";i:1;s:1:"b";s:2:"hi";}"#).unwrap();
        let value: Value = serde_json::from_str(&json).unwrap();
        assert_eq!(value["a"], 1);
        assert_eq!(value["b"], "hi");
    }

    #[test]
    fn unserializes_list() {
        let json = to_json("a:3:{i:0;i:1;i:1;i:2;i:2;i:3;}").unwrap();
        assert_eq!(json.replace(char::is_whitespace, ""), "[1,2,3]");
    }

    #[test]
    fn round_trips() {
        let php = r#"a:2:{s:4:"name";s:6:"hexkit";s:4:"tags";a:2:{i:0;s:1:"a";i:1;s:1:"b";}}"#;
        let json = to_json(php).unwrap();
        assert_eq!(from_json(&json).unwrap(), php);
    }

    #[test]
    fn rejects_garbage() {
        assert!(matches!(to_json("not php"), Err(ToolError::InvalidInput(_))));
    }
}
