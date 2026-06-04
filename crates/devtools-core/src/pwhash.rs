//! Password hashing and verification with bcrypt and Argon2.
//!
//! Both algorithms emit and consume self-describing strings (bcrypt's `$2b$…`
//! and Argon2's PHC `$argon2id$…`), so the cost/parameters travel with the hash
//! and `verify` needs only the password and the stored hash.

use argon2::password_hash::rand_core::OsRng;
use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::error::{ToolError, ToolResult};

/// Hash `password` with `algorithm` (`bcrypt` or `argon2`).
///
/// For bcrypt, `cost` selects the work factor (defaults to
/// [`bcrypt::DEFAULT_COST`]); for Argon2 it is ignored and a random salt is
/// generated. Returns [`ToolError::InvalidInput`] for an unknown algorithm or
/// an out-of-range bcrypt cost.
pub fn hash(algorithm: &str, password: &str, cost: Option<u32>) -> ToolResult<String> {
    match algorithm {
        "bcrypt" => {
            let cost = cost.unwrap_or(bcrypt::DEFAULT_COST);
            bcrypt::hash(password, cost).map_err(|e| ToolError::invalid_input(e.to_string()))
        }
        "argon2" => {
            let salt = SaltString::generate(&mut OsRng);
            Argon2::default()
                .hash_password(password.as_bytes(), &salt)
                .map(|h| h.to_string())
                .map_err(|e| ToolError::invalid_input(e.to_string()))
        }
        other => Err(ToolError::invalid_input(format!(
            "unknown algorithm: {other}"
        ))),
    }
}

/// Verify `password` against `hash` for `algorithm` (`bcrypt` or `argon2`).
///
/// Returns `Ok(false)` for a non-matching password and
/// [`ToolError::InvalidInput`] for an unknown algorithm or a malformed hash.
pub fn verify(algorithm: &str, password: &str, hash: &str) -> ToolResult<bool> {
    match algorithm {
        "bcrypt" => {
            bcrypt::verify(password, hash).map_err(|e| ToolError::invalid_input(e.to_string()))
        }
        "argon2" => {
            let parsed =
                PasswordHash::new(hash).map_err(|e| ToolError::invalid_input(e.to_string()))?;
            Ok(Argon2::default()
                .verify_password(password.as_bytes(), &parsed)
                .is_ok())
        }
        other => Err(ToolError::invalid_input(format!(
            "unknown algorithm: {other}"
        ))),
    }
}

#[derive(Deserialize)]
struct HashParams {
    algorithm: String,
    password: String,
    #[serde(default)]
    cost: Option<u32>,
}

#[derive(Deserialize)]
struct VerifyParams {
    algorithm: String,
    password: String,
    hash: String,
}

#[derive(Serialize)]
struct HashResult {
    hash: String,
}

#[derive(Serialize)]
struct VerifyResult {
    valid: bool,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    match action {
        "pwhash.hash" => {
            let p: HashParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            let hash = hash(&p.algorithm, &p.password, p.cost)?;
            serde_json::to_value(HashResult { hash })
                .map_err(|e| ToolError::other(e.to_string()))
        }
        "pwhash.verify" => {
            let p: VerifyParams = serde_json::from_value(params)
                .map_err(|e| ToolError::invalid_input(e.to_string()))?;
            let valid = verify(&p.algorithm, &p.password, &p.hash)?;
            serde_json::to_value(VerifyResult { valid })
                .map_err(|e| ToolError::other(e.to_string()))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bcrypt_hash_then_verify_true() {
        let hashed = hash("bcrypt", "hunter2", None).unwrap();
        assert!(hashed.starts_with("$2"));
        assert!(verify("bcrypt", "hunter2", &hashed).unwrap());
    }

    #[test]
    fn bcrypt_wrong_password_verify_false() {
        let hashed = hash("bcrypt", "hunter2", None).unwrap();
        assert!(!verify("bcrypt", "wrong", &hashed).unwrap());
    }

    #[test]
    fn bcrypt_honors_explicit_cost() {
        let hashed = hash("bcrypt", "hunter2", Some(4)).unwrap();
        assert!(hashed.contains("$04$"));
        assert!(verify("bcrypt", "hunter2", &hashed).unwrap());
    }

    #[test]
    fn argon2_hash_then_verify_true() {
        let hashed = hash("argon2", "hunter2", None).unwrap();
        assert!(hashed.starts_with("$argon2"));
        assert!(verify("argon2", "hunter2", &hashed).unwrap());
    }

    #[test]
    fn argon2_wrong_password_verify_false() {
        let hashed = hash("argon2", "hunter2", None).unwrap();
        assert!(!verify("argon2", "wrong", &hashed).unwrap());
    }

    #[test]
    fn argon2_salt_is_random() {
        // Distinct salts mean two hashes of the same password never collide.
        let a = hash("argon2", "hunter2", None).unwrap();
        let b = hash("argon2", "hunter2", None).unwrap();
        assert_ne!(a, b);
    }

    #[test]
    fn rejects_unknown_algorithm() {
        assert!(matches!(
            hash("scrypt", "pw", None),
            Err(ToolError::InvalidInput(_))
        ));
        assert!(matches!(
            verify("scrypt", "pw", "x"),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn verify_rejects_malformed_argon2_hash() {
        assert!(matches!(
            verify("argon2", "pw", "not-a-phc-string"),
            Err(ToolError::InvalidInput(_))
        ));
    }

    #[test]
    fn dispatch_hash_then_verify_round_trip() {
        let out = dispatch(
            "pwhash.hash",
            serde_json::json!({ "algorithm": "bcrypt", "password": "s3cret", "cost": 4 }),
        )
        .unwrap();
        let hashed = out["hash"].as_str().unwrap().to_string();

        let verified = dispatch(
            "pwhash.verify",
            serde_json::json!({ "algorithm": "bcrypt", "password": "s3cret", "hash": hashed }),
        )
        .unwrap();
        assert_eq!(verified["valid"], serde_json::Value::Bool(true));
    }

    #[test]
    fn dispatch_rejects_unknown_action() {
        assert!(matches!(
            dispatch("pwhash.nope", serde_json::json!({})),
            Err(ToolError::InvalidInput(_))
        ));
    }
}
