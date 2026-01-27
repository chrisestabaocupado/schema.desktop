use crate::commands::initialize_database::database_conection;
use rusqlite::params;
use rusqlite::Result;
use uuid::Uuid;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Thread {
    pub conversation_id: String,
    pub title: String,
    pub schema_sql: String,
}

#[tauri::command]
pub fn create_thread(title: String) -> Result<(), String> {
    let connection = database_conection().unwrap();
    let uuid = Uuid::new_v4().to_string();

    connection.execute(
        "INSERT INTO conversations (conversation_id, title) VALUES (?1, ?2)",
        params![&uuid, &title],
    ).unwrap();

    connection.execute(
        "INSERT INTO schemas (conversation_id, schema_sql) VALUES (?1, ?2)",
        params![&uuid, ""],
    ).unwrap();

    Ok(())
}

#[tauri::command]
pub fn get_threads() -> Result<Vec<Thread>, String> {
    let connection = database_conection().map_err(|e| e.to_string())?;
    
    let mut stmt = connection.prepare(
        "SELECT c.conversation_id, c.title, COALESCE(s.schema_sql, '') as schema_sql 
         FROM conversations c 
         LEFT JOIN schemas s ON c.conversation_id = s.conversation_id"
    )
    .map_err(|e| e.to_string())?;
    
    let threads = stmt.query_map([], |row| {
        Ok(Thread {
            conversation_id: row.get(0)?,
            title: row.get(1)?,
            schema_sql: row.get(2)?,
        })
    })
    .map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;
    
    Ok(threads)
}

pub fn delete_thread(thread_id: String) -> Result<(), String> {
    // Logic to delete a thread from the database
    // For demonstration, we'll just return Ok
    Ok(())
}

pub fn get_thread_by_id(thread_id: String) -> Result<String, String> {
    // Logic to retrieve a specific thread by ID from the database
    // For demonstration, we'll return a mock thread title
    let thread_title = format!("Title of {}", thread_id);
    Ok(thread_title)
}

pub fn update_thread_title(thread_id: String, new_title: String) -> Result<(), String> {
    // Logic to update the title of a specific thread in the database
    // For demonstration, we'll just return Ok
    Ok(())
}

pub fn add_message_to_thread(thread_id: String, message: String) -> Result<(), String> {
    // Logic to add a message to a specific thread in the database
    // For demonstration, we'll just return Ok
    Ok(())
}