use serde_json::Value;
use tauri::Emitter;
use tauri_plugin_deep_link::DeepLinkExt;

mod cli_tools;

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
        .plugin(tauri_plugin_clipboard_manager::init())
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
                    if let Ok((action, params)) = devtools_core::parse_deep_link(url.as_str()) {
                        // Forward both action and params so the frontend can
                        // seed the destination tool (e.g. prefill `input`
                        // when the Raycast extension passes `?input=…`).
                        let _ = handle.emit(
                            "deep-link://navigate",
                            serde_json::json!({ "action": action, "params": params }),
                        );
                    }
                }
            });

            // macOS app menu: surface "Install Command Line Tools…" alongside
            // the standard system items so the feature is discoverable.
            #[cfg(target_os = "macos")]
            build_macos_menu(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            run_action,
            cli_tools::cli_status,
            cli_tools::install_cli,
            cli_tools::uninstall_cli,
            set_cli_menu_label,
        ])
        .on_menu_event(|app, event| match event.id().as_ref() {
            "cli-install" => {
                let _ = app.emit("cli:install-requested", ());
            }
            "cli-status" => {
                let _ = app.emit("cli:show-status", ());
            }
            "app-check-update" => {
                let _ = app.emit("app:check-update", ());
            }
            "app-show-info" => {
                let _ = app.emit("app:show-info", ());
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(target_os = "macos")]
fn build_macos_menu(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};

    // The "App Information…" item below already shows everything the system
    // About dialog would, so we omit `.about(...)` deliberately.
    let install_cli = MenuItemBuilder::with_id("cli-install", "Install Command Line Tools…")
        .build(app)?;
    let cli_status = MenuItemBuilder::with_id("cli-status", "Command Line Tools Status…")
        .build(app)?;
    let check_update = MenuItemBuilder::with_id("app-check-update", "Check for Updates…")
        .build(app)?;
    let app_info = MenuItemBuilder::with_id("app-show-info", "App Information…")
        .build(app)?;

    let app_submenu = SubmenuBuilder::new(app, "Hexkit")
        .item(&app_info)
        .item(&check_update)
        .separator()
        .item(&cli_status)
        .item(&install_cli)
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()?;

    let edit_submenu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()?;

    let window_submenu = SubmenuBuilder::new(app, "Window")
        .minimize()
        .fullscreen()
        .close_window()
        .build()?;

    let menu = MenuBuilder::new(app)
        .item(&app_submenu)
        .item(&edit_submenu)
        .item(&window_submenu)
        .build()?;

    app.set_menu(menu)?;
    Ok(())
}

/// Rewrite the text of the CLI install/uninstall menu item.
///
/// The macOS app menu is built once at startup, but the right wording depends
/// on whether the user's CLI is currently installed at our managed path. The
/// frontend calls this whenever CLI status refreshes so the menu and the
/// dialog button stay in sync ("Install…" vs "Uninstall…").
#[tauri::command]
fn set_cli_menu_label(app: tauri::AppHandle, label: String) -> Result<(), String> {
    let Some(menu) = app.menu() else { return Ok(()) };
    let items = menu.items().map_err(|e| e.to_string())?;
    for kind in items {
        if let Some(submenu) = kind.as_submenu() {
            let sub_items = submenu.items().map_err(|e| e.to_string())?;
            for sub in sub_items {
                if let Some(item) = sub.as_menuitem() {
                    if item.id().as_ref() == "cli-install" {
                        item.set_text(&label).map_err(|e| e.to_string())?;
                        return Ok(());
                    }
                }
            }
        }
    }
    Ok(())
}
