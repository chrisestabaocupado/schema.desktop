use rusqlite::{Connection, Result};

#[tauri::command]
pub fn database_conection() -> Result<Connection> {
    let connection = Connection::open("test.db")?;
    // returning the connection
    Ok(connection)
}

#[tauri::command]
pub fn initialize_database() {
    let connection = database_conection().unwrap();
    connection
        .execute_batch(
            "
        CREATE TABLE IF NOT EXISTS sender_types (
            sender_type_id INTEGER PRIMARY KEY,
            description TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS conversations (
            conversation_id TEXT PRIMARY KEY DEFAULT (uuid()),
            title TEXT, 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS schemas (
            conversation_id TEXT PRIMARY KEY,
            schema_sql TEXT NOT NULL DEFAULT '',
            diagram TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS messages (
            message_id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            sender INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sender) REFERENCES sender_types(sender_type_id),
            FOREIGN KEY(conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
        );
        ",
        )
        .expect("failed to create table");
}