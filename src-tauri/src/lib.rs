// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_autolaunch_enabled() -> Result<bool, String> {
    use tauri_plugin_autostart::ManagerExt;
    let manager = tauri_plugin_autostart::get_autostart_manager();
    manager.is_enabled().map_err(|e| e.to_string())
}

#[tauri::command]
async fn set_autolaunch_enabled(enabled: bool) -> Result<(), String> {
    use tauri_plugin_autostart::ManagerExt;
    let manager = tauri_plugin_autostart::get_autostart_manager();
    if enabled {
        manager.enable().map_err(|e| e.to_string())
    } else {
        manager.disable().map_err(|e| e.to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_autolaunch_enabled,
            set_autolaunch_enabled
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
