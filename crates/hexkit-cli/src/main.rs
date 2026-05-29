use std::io::{IsTerminal, Read};
use std::process::ExitCode;

const USAGE: &str = "hexkit — Hexkit developer tools CLI

Usage:
  hexkit <action> '<json-params>'
  echo '<json-params>' | hexkit <action>
  hexkit 'hexkit://<action>?key=value'

Examples:
  hexkit base64.encode '{\"input\":\"hello\"}'
  hexkit hash.generate '{\"input\":\"hello\"}'
  hexkit 'hexkit://url.encode?input=a b'";

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();

    match args.first().map(String::as_str) {
        None => {
            eprintln!("{USAGE}");
            return ExitCode::from(2);
        }
        Some("-h" | "--help") => {
            println!("{USAGE}");
            return ExitCode::SUCCESS;
        }
        _ => {}
    }

    let action = &args[0];
    let params = if args.len() > 1 {
        Some(args[1].clone())
    } else if !std::io::stdin().is_terminal() {
        let mut buffer = String::new();
        std::io::stdin().read_to_string(&mut buffer).ok();
        (!buffer.trim().is_empty()).then_some(buffer)
    } else {
        None
    };

    match hexkit_cli::execute(action, params.as_deref()) {
        Ok(output) => {
            println!("{output}");
            ExitCode::SUCCESS
        }
        Err(error) => {
            eprintln!("error: {error}");
            ExitCode::FAILURE
        }
    }
}
