use serde_json::Value;
use tauri::Emitter;
use tauri_plugin_deep_link::DeepLinkExt;

/// Single entry point for every tool, routed through the shared dispatcher in
/// `devtools-core`. The same dispatcher backs the CLI and deep-link adapters.
#[tauri::command]
fn run_action(action: String, params: Value) -> Result<Value, devtools_core::ToolError> {
    devtools_core::run(&action, params)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            // On Linux/Windows the scheme must be registered at runtime; macOS
            // uses the bundled Info.plist generated from tauri.conf.json.
            #[cfg(any(target_os = "linux", windows))]
            {
                let _ = app.deep_link().register_all();
            }

            let handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                for url in event.urls() {
                    if let Ok((action, _params)) = devtools_core::parse_deep_link(url.as_str()) {
                        let _ = handle.emit("deep-link://navigate", action);
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![run_action])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
