use serde_json::Value;
use tauri::Emitter;
use tauri_plugin_deep_link::DeepLinkExt;

mod cli_tools;
mod mcp_server;
mod updates;

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
        .manage(mcp_server::McpState::default())
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

            // Native menu bar, built on every platform: the system menu bar on
            // macOS and the window menu bar on Windows/Linux. It carries a View
            // menu (toggle the header bar / sidebar) plus the CLI and app items.
            build_app_menu(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            run_action,
            cli_tools::cli_status,
            cli_tools::install_cli,
            cli_tools::uninstall_cli,
            set_cli_menu_label,
            set_view_menu_state,
            mcp_server::mcp_status,
            mcp_server::mcp_start,
            mcp_server::mcp_stop,
            updates::fetch_latest_releases,
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
            // The frontend owns the layout state (it's persisted) and pushes
            // the authoritative checkmark back via `set_view_menu_state`.
            "view-toggle-sidebar" => {
                let _ = app.emit("view:toggle-sidebar", ());
            }
            "view-toggle-header" => {
                let _ = app.emit("view:toggle-header", ());
            }
            "view-settings" => {
                let _ = app.emit("view:open-settings", ());
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Build the application menu for the current platform.
///
/// Layout differs by convention: macOS gets the app menu (Hexkit) + Edit +
/// View + Window; Windows/Linux get File + Edit + View + Help. The **View**
/// menu (toggle header bar / sidebar) and the CLI/app items are available on
/// every platform. The two View entries are `CheckMenuItem`s whose checkmarks
/// are kept in sync with the frontend via `set_view_menu_state`.
fn build_app_menu(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{CheckMenuItemBuilder, MenuBuilder, MenuItemBuilder, SubmenuBuilder};

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

    // View toggles. Start checked; the frontend re-syncs from persisted state
    // on launch. Accelerators mirror common editors (sidebar on Cmd/Ctrl+B).
    let toggle_sidebar = CheckMenuItemBuilder::with_id("view-toggle-sidebar", "Show Sidebar")
        .checked(true)
        .accelerator("CmdOrCtrl+B")
        .build(app)?;
    let toggle_header = CheckMenuItemBuilder::with_id("view-toggle-header", "Show Header Bar")
        .checked(true)
        .accelerator("CmdOrCtrl+Shift+B")
        .build(app)?;

    let settings = MenuItemBuilder::with_id("view-settings", "Settings…")
        .accelerator("CmdOrCtrl+,")
        .build(app)?;

    let view_submenu = SubmenuBuilder::new(app, "View")
        .item(&toggle_sidebar)
        .item(&toggle_header)
        .separator()
        .item(&settings)
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

    let menu = MenuBuilder::new(app);

    #[cfg(target_os = "macos")]
    let menu = {
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
        let window_submenu = SubmenuBuilder::new(app, "Window")
            .minimize()
            .fullscreen()
            .close_window()
            .build()?;
        menu.item(&app_submenu)
            .item(&edit_submenu)
            .item(&view_submenu)
            .item(&window_submenu)
            .build()?
    };

    #[cfg(not(target_os = "macos"))]
    let menu = {
        let file_submenu = SubmenuBuilder::new(app, "File").quit().build()?;
        let help_submenu = SubmenuBuilder::new(app, "Help")
            .item(&app_info)
            .item(&check_update)
            .separator()
            .item(&cli_status)
            .item(&install_cli)
            .build()?;
        menu.item(&file_submenu)
            .item(&edit_submenu)
            .item(&view_submenu)
            .item(&help_submenu)
            .build()?
    };

    app.set_menu(menu)?;
    Ok(())
}

/// Sync the View menu checkmarks with the frontend's layout state.
///
/// The frontend store is the source of truth (it persists across restarts), so
/// it calls this whenever the header/sidebar visibility changes — and once on
/// launch — to keep the native menu's checkmarks matching what's on screen.
#[tauri::command]
fn set_view_menu_state(
    app: tauri::AppHandle,
    sidebar_visible: bool,
    header_visible: bool,
) -> Result<(), String> {
    let Some(menu) = app.menu() else { return Ok(()) };
    let items = menu.items().map_err(|e| e.to_string())?;
    for kind in items {
        let Some(submenu) = kind.as_submenu() else { continue };
        let sub_items = submenu.items().map_err(|e| e.to_string())?;
        for sub in sub_items {
            let Some(check) = sub.as_check_menuitem() else { continue };
            match check.id().as_ref() {
                "view-toggle-sidebar" => {
                    check.set_checked(sidebar_visible).map_err(|e| e.to_string())?;
                }
                "view-toggle-header" => {
                    check.set_checked(header_visible).map_err(|e| e.to_string())?;
                }
                _ => {}
            }
        }
    }
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
