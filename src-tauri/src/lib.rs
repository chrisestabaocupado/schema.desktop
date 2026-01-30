mod commands;
use commands::{
    initialize_database, store_api_key, get_api_key, 
    create_thread, get_thread, update_thread, get_all_threads, delete_thread, duplicate_thread
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            initialize_database, store_api_key, get_api_key,
            create_thread, get_thread, update_thread, get_all_threads, delete_thread, duplicate_thread
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
