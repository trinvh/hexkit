//! CIDR / subnet calculator for IPv4 and IPv6.

use crate::error::{ToolError, ToolResult};
use ipnet::{IpNet, Ipv4Net, Ipv6Net};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::net::IpAddr;

/// A parsed CIDR block, flattened into the fields the UI displays. Host counts
/// are strings because an IPv6 block can hold far more addresses than `u64`.
#[derive(Serialize, PartialEq, Eq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CidrInfo {
    /// IP version: `4` or `6`.
    pub version: u8,
    /// Network address (the block's first address).
    pub network: String,
    /// Prefix length, e.g. `24`.
    pub prefix_len: u8,
    /// Subnet mask, e.g. `255.255.255.0` (IPv4) or `ffff:ffff::` (IPv6).
    pub netmask: String,
    /// Wildcard (host) mask. IPv4 only — empty for IPv6.
    pub host_mask: String,
    /// Broadcast address. IPv4 only — empty for IPv6.
    pub broadcast: String,
    /// First host address in the block.
    pub first_host: String,
    /// Last host address in the block.
    pub last_host: String,
    /// Count of usable host addresses, as a decimal string.
    pub usable_hosts: String,
    /// Count of all addresses in the block, as a decimal string.
    pub total_addresses: String,
}

/// Parse a CIDR block or a bare IP address (treated as `/32` or `/128`).
///
/// Returns [`ToolError::InvalidInput`] when the input is neither a valid CIDR
/// block nor a valid IP address.
pub fn parse(input: &str) -> ToolResult<CidrInfo> {
    let trimmed = input.trim();
    let net = parse_net(trimmed)?;
    Ok(match net {
        IpNet::V4(v4) => describe_v4(v4),
        IpNet::V6(v6) => describe_v6(v6),
    })
}

/// Accept `a.b.c.d/n` / `::/n` CIDR syntax, falling back to a bare IP address
/// promoted to a host route (`/32` for IPv4, `/128` for IPv6).
fn parse_net(input: &str) -> ToolResult<IpNet> {
    if let Ok(net) = input.parse::<IpNet>() {
        return Ok(net);
    }
    match input.parse::<IpAddr>() {
        Ok(IpAddr::V4(addr)) => Ok(IpNet::V4(Ipv4Net::new(addr, 32).unwrap())),
        Ok(IpAddr::V6(addr)) => Ok(IpNet::V6(Ipv6Net::new(addr, 128).unwrap())),
        Err(_) => Err(ToolError::invalid_input(format!(
            "not a valid CIDR block or IP address: {input}"
        ))),
    }
}

fn describe_v4(net: Ipv4Net) -> CidrInfo {
    let prefix_len = net.prefix_len();
    let total = 1u64 << (32 - prefix_len as u32);
    // A /31 or /32 has no separate network/broadcast pair, so every address is
    // usable; wider blocks reserve the network and broadcast addresses.
    let usable = if prefix_len >= 31 { total } else { total - 2 };

    CidrInfo {
        version: 4,
        network: net.network().to_string(),
        prefix_len,
        netmask: net.netmask().to_string(),
        host_mask: net.hostmask().to_string(),
        broadcast: net.broadcast().to_string(),
        first_host: first_host_v4(&net).to_string(),
        last_host: last_host_v4(&net).to_string(),
        usable_hosts: usable.to_string(),
        total_addresses: total.to_string(),
    }
}

fn first_host_v4(net: &Ipv4Net) -> std::net::Ipv4Addr {
    let network = u32::from(net.network());
    if net.prefix_len() >= 31 {
        net.network()
    } else {
        std::net::Ipv4Addr::from(network + 1)
    }
}

fn last_host_v4(net: &Ipv4Net) -> std::net::Ipv4Addr {
    let broadcast = u32::from(net.broadcast());
    if net.prefix_len() >= 31 {
        net.broadcast()
    } else {
        std::net::Ipv4Addr::from(broadcast - 1)
    }
}

fn describe_v6(net: Ipv6Net) -> CidrInfo {
    let prefix_len = net.prefix_len();
    // IPv6 host counts routinely exceed u128, so compute via big-endian masks.
    let total = total_v6(prefix_len);

    CidrInfo {
        version: 6,
        network: net.network().to_string(),
        prefix_len,
        netmask: net.netmask().to_string(),
        host_mask: String::new(),
        broadcast: String::new(),
        first_host: net.network().to_string(),
        last_host: net.broadcast().to_string(),
        // IPv6 does not reserve network/broadcast addresses, so all are usable.
        usable_hosts: total.clone(),
        total_addresses: total,
    }
}

/// `2^(128 - prefix_len)` rendered as a decimal string via repeated doubling,
/// since the result overflows every fixed-width integer for small prefixes.
fn total_v6(prefix_len: u8) -> String {
    let bits = 128 - prefix_len as u32;
    let mut digits = vec![1u8]; // little-endian decimal digits
    for _ in 0..bits {
        let mut carry = 0u8;
        for d in digits.iter_mut() {
            let value = *d * 2 + carry;
            *d = value % 10;
            carry = value / 10;
        }
        while carry > 0 {
            digits.push(carry % 10);
            carry /= 10;
        }
    }
    digits.iter().rev().map(|d| (b'0' + d) as char).collect()
}

#[derive(Deserialize)]
struct OneInput {
    input: String,
}

pub fn dispatch(action: &str, params: Value) -> ToolResult<Value> {
    let parsed: OneInput =
        serde_json::from_value(params).map_err(|e| ToolError::invalid_input(e.to_string()))?;
    match action {
        "cidr.parse" => {
            let info = parse(&parsed.input)?;
            serde_json::to_value(info).map_err(|e| ToolError::invalid_input(e.to_string()))
        }
        _ => Err(ToolError::invalid_input(format!("unknown action: {action}"))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_ipv4_slash_24() {
        let info = parse("192.168.1.0/24").unwrap();
        assert_eq!(info.version, 4);
        assert_eq!(info.network, "192.168.1.0");
        assert_eq!(info.prefix_len, 24);
        assert_eq!(info.netmask, "255.255.255.0");
        assert_eq!(info.host_mask, "0.0.0.255");
        assert_eq!(info.broadcast, "192.168.1.255");
        assert_eq!(info.first_host, "192.168.1.1");
        assert_eq!(info.last_host, "192.168.1.254");
        assert_eq!(info.usable_hosts, "254");
        assert_eq!(info.total_addresses, "256");
    }

    #[test]
    fn parses_ipv4_slash_30() {
        let info = parse("10.0.0.0/30").unwrap();
        assert_eq!(info.network, "10.0.0.0");
        assert_eq!(info.broadcast, "10.0.0.3");
        assert_eq!(info.first_host, "10.0.0.1");
        assert_eq!(info.last_host, "10.0.0.2");
        assert_eq!(info.usable_hosts, "2");
        assert_eq!(info.total_addresses, "4");
    }

    #[test]
    fn parses_ipv4_slash_31_has_no_reserved_addresses() {
        let info = parse("10.0.0.0/31").unwrap();
        assert_eq!(info.first_host, "10.0.0.0");
        assert_eq!(info.last_host, "10.0.0.1");
        assert_eq!(info.usable_hosts, "2");
        assert_eq!(info.total_addresses, "2");
    }

    #[test]
    fn bare_ipv4_is_a_host_route() {
        let info = parse("8.8.8.8").unwrap();
        assert_eq!(info.prefix_len, 32);
        assert_eq!(info.network, "8.8.8.8");
        assert_eq!(info.first_host, "8.8.8.8");
        assert_eq!(info.last_host, "8.8.8.8");
        assert_eq!(info.usable_hosts, "1");
        assert_eq!(info.total_addresses, "1");
    }

    #[test]
    fn parses_ipv6_slash_32() {
        let info = parse("2001:db8::/32").unwrap();
        assert_eq!(info.version, 6);
        assert_eq!(info.network, "2001:db8::");
        assert_eq!(info.prefix_len, 32);
        assert_eq!(info.host_mask, "");
        assert_eq!(info.broadcast, "");
        assert_eq!(info.first_host, "2001:db8::");
        assert_eq!(info.last_host, "2001:db8:ffff:ffff:ffff:ffff:ffff:ffff");
        // 2^96 — far beyond u64.
        assert_eq!(info.total_addresses, "79228162514264337593543950336");
        assert_eq!(info.usable_hosts, info.total_addresses);
    }

    #[test]
    fn bare_ipv6_is_a_host_route() {
        let info = parse("::1").unwrap();
        assert_eq!(info.version, 6);
        assert_eq!(info.prefix_len, 128);
        assert_eq!(info.total_addresses, "1");
    }

    #[test]
    fn rejects_malformed_input() {
        assert!(matches!(parse("not-an-ip"), Err(ToolError::InvalidInput(_))));
        assert!(matches!(
            parse("192.168.1.0/33"),
            Err(ToolError::InvalidInput(_))
        ));
        assert!(matches!(parse(""), Err(ToolError::InvalidInput(_))));
    }

    #[test]
    fn dispatch_parse_returns_object() {
        let out = dispatch(
            "cidr.parse",
            serde_json::json!({ "input": "192.168.1.0/24" }),
        )
        .unwrap();
        assert_eq!(out["version"], 4);
        assert_eq!(out["network"], "192.168.1.0");
        assert_eq!(out["usableHosts"], "254");
    }

    #[test]
    fn dispatch_unknown_action_is_invalid_input() {
        let err = dispatch("cidr.nope", serde_json::json!({ "input": "x" })).unwrap_err();
        assert!(matches!(err, ToolError::InvalidInput(_)));
    }
}
