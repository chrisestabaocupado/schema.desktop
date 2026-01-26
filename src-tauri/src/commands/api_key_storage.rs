use keyring::Entry;

const SERVICE_NAME: &str = "schema_desktop_app";
const SERVICE_USERNAME: &str = "user_api_key";

#[tauri::command]
pub fn store_api_key(api_key: String) -> Result<(), String> {
    // Implementation for storing the API key
    if api_key.trim().is_empty() {
        return Err("No API key provided.".into());
    }

    match Entry::new(SERVICE_NAME, SERVICE_USERNAME){
        Ok(entry) => {
            match entry.set_password(&api_key) {
                Ok(_) => Ok(()),
                Err(e) => Err(format!("Failed to store API key: {}", e).into()),
            }
        },
        Err(e) => Err(format!("Failed to create keyring entry: {}", e).into()),
    }
}

#[tauri::command]
pub fn get_api_key() -> Result<String, String> {
    match Entry::new(SERVICE_NAME, SERVICE_USERNAME) {
        Ok(entry) => match entry.get_password() {
            Ok(api_key) => Ok(api_key),
            Err(e) => Err(format!("Failed to retrieve API key: {}", e).into()),
        },
        Err(e) => Err(format!("Failed to create keyring entry: {}", e).into()),
    }
}