use rusqlite::{Connection, Result};

struct User {
    user_id: String,
    email: String,
    created_at: String,
    updated_at: String,
}

struct Conversation {
    conversation_id: String,
    user_id: String,
    title: String,
    created_at: String,
    updated_at: String, 
}

struct Message {
    message_id: String,
    conversation_id: String,
    sender: String,
    content: String,
    created_at: String,
}

#[tauri::command]
pub fn database_conection() -> Result<Connection> {
    let connection = Connection::open("test.db")?;
    // returning the connection
    Ok(connection)
}

#[tauri::command]
pub fn initialize_database() {
    let connection = database_conection().unwrap();
    connection.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS sender_types (
            sender_type_id INTEGER PRIMARY KEY,
            description TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            email TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS conversations (
            conversation_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT, 
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        );

        CREATE TABLE IF NOT EXISTS schemas (
            conversation_id TEXT PRIMARY KEY,
            schema_sql TEXT NOT NULL,    
            FOREIGN KEY(conversation_id) REFERENCES conversations(conversation_id)
        );

        CREATE TABLE IF NOT EXISTS messages (
            message_id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            sender INTEGER NOT NULL,
            content TEXT NOT NULL,
            FOREIGN KEY(sender) REFERENCES sender_types(sender_type_id),
            FOREIGN KEY(conversation_id) REFERENCES conversations(conversation_id)
        );
        ",
    ).expect("failed to create table");
}