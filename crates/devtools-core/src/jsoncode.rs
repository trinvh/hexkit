//! Generate type definitions from a JSON sample for several languages.

use crate::error::{ToolError, ToolResult};
use serde::Deserialize;
use serde_json::Value;

#[derive(Clone)]
enum TypeRef {
    String,
    Int,
    Float,
    Bool,
    Any,
    Named(String),
    Array(Box<TypeRef>),
}

struct StructDef {
    name: String,
    fields: Vec<(String, TypeRef)>,
}

fn pascal(name: &str) -> String {
    let cases = crate::textcase::convert(name);
    if cases.pascal.is_empty() {
        "Field".to_string()
    } else {
        cases.pascal
    }
}

fn collect(value: &Value, name: &str, structs: &mut Vec<StructDef>) -> TypeRef {
    match value {
        Value::Null => TypeRef::Any,
        Value::Bool(_) => TypeRef::Bool,
        Value::Number(n) => {
            if n.is_i64() || n.is_u64() {
                TypeRef::Int
            } else {
                TypeRef::Float
            }
        }
        Value::String(_) => TypeRef::String,
        Value::Array(items) => {
            let element = items
                .first()
                .map(|item| collect(item, name, structs))
                .unwrap_or(TypeRef::Any);
            TypeRef::Array(Box::new(element))
        }
        Value::Object(map) => {
            let fields = map
                .iter()
                .map(|(key, val)| (key.clone(), collect(val, &pascal(key), structs)))
                .collect();
            structs.push(StructDef {
                name: name.to_string(),
                fields,
            });
            TypeRef::Named(name.to_string())
        }
    }
}

fn build(json: &str) -> ToolResult<Vec<StructDef>> {
    let value: Value =
        serde_json::from_str(json.trim()).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    if !value.is_object() {
        return Err(ToolError::invalid_input(
            "expected a JSON object at the top level",
        ));
    }
    let mut structs = Vec::new();
    collect(&value, "Root", &mut structs);
    Ok(structs)
}

fn join_structs(structs: &[StructDef], render: impl Fn(&StructDef) -> String) -> String {
    structs.iter().map(render).collect::<Vec<_>>().join("\n")
}

fn typescript(structs: &[StructDef]) -> String {
    fn ty(t: &TypeRef) -> String {
        match t {
            TypeRef::String => "string".into(),
            TypeRef::Int | TypeRef::Float => "number".into(),
            TypeRef::Bool => "boolean".into(),
            TypeRef::Any => "unknown".into(),
            TypeRef::Named(n) => n.clone(),
            TypeRef::Array(e) => format!("{}[]", ty(e)),
        }
    }
    join_structs(structs, |s| {
        let fields: String = s
            .fields
            .iter()
            .map(|(k, t)| format!("  {k}: {};\n", ty(t)))
            .collect();
        format!("interface {} {{\n{fields}}}\n", s.name)
    })
}

fn go(structs: &[StructDef]) -> String {
    fn ty(t: &TypeRef) -> String {
        match t {
            TypeRef::String => "string".into(),
            TypeRef::Int => "int".into(),
            TypeRef::Float => "float64".into(),
            TypeRef::Bool => "bool".into(),
            TypeRef::Any => "interface{}".into(),
            TypeRef::Named(n) => n.clone(),
            TypeRef::Array(e) => format!("[]{}", ty(e)),
        }
    }
    join_structs(structs, |s| {
        let fields: String = s
            .fields
            .iter()
            .map(|(k, t)| format!("\t{} {} `json:\"{k}\"`\n", pascal(k), ty(t)))
            .collect();
        format!("type {} struct {{\n{fields}}}\n", s.name)
    })
}

fn rust(structs: &[StructDef]) -> String {
    fn ty(t: &TypeRef) -> String {
        match t {
            TypeRef::String => "String".into(),
            TypeRef::Int => "i64".into(),
            TypeRef::Float => "f64".into(),
            TypeRef::Bool => "bool".into(),
            TypeRef::Any => "serde_json::Value".into(),
            TypeRef::Named(n) => n.clone(),
            TypeRef::Array(e) => format!("Vec<{}>", ty(e)),
        }
    }
    join_structs(structs, |s| {
        let fields: String = s
            .fields
            .iter()
            .map(|(k, t)| format!("    {k}: {},\n", ty(t)))
            .collect();
        format!(
            "#[derive(Serialize, Deserialize)]\nstruct {} {{\n{fields}}}\n",
            s.name
        )
    })
}

fn python(structs: &[StructDef]) -> String {
    fn ty(t: &TypeRef) -> String {
        match t {
            TypeRef::String => "str".into(),
            TypeRef::Int => "int".into(),
            TypeRef::Float => "float".into(),
            TypeRef::Bool => "bool".into(),
            TypeRef::Any => "Any".into(),
            TypeRef::Named(n) => n.clone(),
            TypeRef::Array(e) => format!("list[{}]", ty(e)),
        }
    }
    join_structs(structs, |s| {
        let fields: String = s
            .fields
            .iter()
            .map(|(k, t)| format!("    {k}: {}\n", ty(t)))
            .collect();
        let body = if fields.is_empty() {
            "    pass\n".to_string()
        } else {
            fields
        };
        format!("@dataclass\nclass {}:\n{body}", s.name)
    })
}

fn kotlin(structs: &[StructDef]) -> String {
    fn ty(t: &TypeRef) -> String {
        match t {
            TypeRef::String => "String".into(),
            TypeRef::Int => "Long".into(),
            TypeRef::Float => "Double".into(),
            TypeRef::Bool => "Boolean".into(),
            TypeRef::Any => "Any?".into(),
            TypeRef::Named(n) => n.clone(),
            TypeRef::Array(e) => format!("List<{}>", ty(e)),
        }
    }
    join_structs(structs, |s| {
        let fields: String = s
            .fields
            .iter()
            .map(|(k, t)| format!("    val {k}: {},\n", ty(t)))
            .collect();
        format!("data class {}(\n{})\n", s.name, fields)
    })
}

fn swift(structs: &[StructDef]) -> String {
    fn ty(t: &TypeRef) -> String {
        match t {
            TypeRef::String => "String".into(),
            TypeRef::Int => "Int".into(),
            TypeRef::Float => "Double".into(),
            TypeRef::Bool => "Bool".into(),
            TypeRef::Any => "String".into(),
            TypeRef::Named(n) => n.clone(),
            TypeRef::Array(e) => format!("[{}]", ty(e)),
        }
    }
    join_structs(structs, |s| {
        let fields: String = s
            .fields
            .iter()
            .map(|(k, t)| format!("    let {k}: {}\n", ty(t)))
            .collect();
        format!("struct {}: Codable {{\n{fields}}}\n", s.name)
    })
}

/// Generate types from JSON for `target`
/// (typescript, go, rust, python, kotlin, swift).
pub fn to_code(json: &str, target: &str) -> ToolResult<String> {
    let structs = build(json)?;
    let code = match target {
        "typescript" => typescript(&structs),
        "go" => go(&structs),
        "rust" => rust(&structs),
        "python" => python(&structs),
        "kotlin" => kotlin(&structs),
        "swift" => swift(&structs),
        other => return Err(ToolError::invalid_input(format!("unknown target: {other}"))),
    };
    Ok(code)
}

#[derive(Deserialize)]
struct JsonCodeParams {
    input: String,
    target: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let p: JsonCodeParams =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "jsoncode.generate" => Ok(Value::String(to_code(&p.input, &p.target)?)),
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn typescript_interface() {
        let out = to_code(r#"{"name":"x","age":3}"#, "typescript").unwrap();
        assert!(out.contains("interface Root"));
        assert!(out.contains("name: string;"));
        assert!(out.contains("age: number;"));
    }

    #[test]
    fn nested_objects_become_types() {
        let out = to_code(r#"{"user":{"id":1}}"#, "typescript").unwrap();
        assert!(out.contains("interface Root"));
        assert!(out.contains("interface User"));
        assert!(out.contains("user: User;"));
    }

    #[test]
    fn arrays_map_to_element_type() {
        assert!(to_code(r#"{"tags":["a"]}"#, "typescript")
            .unwrap()
            .contains("tags: string[];"));
    }

    #[test]
    fn go_struct_with_tags() {
        let out = to_code(r#"{"first_name":"x"}"#, "go").unwrap();
        assert!(out.contains("type Root struct"));
        assert!(out.contains(r#"FirstName string `json:"first_name"`"#));
    }

    #[test]
    fn each_language_renders() {
        assert!(to_code(r#"{"a":1}"#, "rust").unwrap().contains("struct Root"));
        assert!(to_code(r#"{"a":1}"#, "python").unwrap().contains("class Root"));
        assert!(to_code(r#"{"a":1}"#, "kotlin")
            .unwrap()
            .contains("data class Root"));
        assert!(to_code(r#"{"a":1}"#, "swift")
            .unwrap()
            .contains("struct Root: Codable"));
    }

    #[test]
    fn rejects_unknown_target() {
        assert!(matches!(
            to_code(r#"{"a":1}"#, "cobol"),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn rejects_non_object_root() {
        assert!(matches!(
            to_code("[1,2]", "typescript"),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn rejects_invalid_json() {
        assert!(matches!(to_code("not json", "go"), Err(ToolError::InvalidInput(_))));
    }
}
