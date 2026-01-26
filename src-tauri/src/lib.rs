mod commands;
use commands::{initialize_database, store_api_key, get_api_key};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![initialize_database, store_api_key, get_api_key])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
