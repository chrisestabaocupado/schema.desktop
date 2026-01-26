use crate::commands::initialize_database::database_conection;

#[tauri::command]
pub fn create_user(email: &str) {
    let connection = database_conection().unwrap();
    connection.execute("INSERT INTO users (email) VALUES (?)", [email]).unwrap();
}