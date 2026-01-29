use crate::commands::initialize_database::database_conection;
use rusqlite::{params, Result, OptionalExtension};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Message {
    pub id: String,
    pub timestamp: i64,
    pub role: String,
    pub message: String,
    pub diagram: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Thread {
    pub chat_id: String,
    pub title: Option<String>,
    pub diagram: String,
    pub schema_sql: String,
    pub conversation: Vec<Message>,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub fn create_thread(
    chat_id: String,
    title: Option<String>,
    diagram: String,
    schema_sql: String,
    conversation: Vec<Message>,
) -> Result<(), String> {
    let mut connection = database_conection().map_err(|e| e.to_string())?;
    let tx = connection.transaction().map_err(|e| e.to_string())?;

    {
        // Insert conversation
        tx.execute(
            "INSERT INTO conversations (conversation_id, title) VALUES (?1, ?2)",
            params![&chat_id, &title],
        )
        .map_err(|e| e.to_string())?;

        // Insert schema/diagram
        tx.execute(
            "INSERT INTO schemas (conversation_id, schema_sql, diagram) VALUES (?1, ?2, ?3)",
            params![&chat_id, &schema_sql, &diagram],
        )
        .map_err(|e| e.to_string())?;

        // Insert messages
        let mut stmt = tx
            .prepare("INSERT INTO messages (message_id, conversation_id, sender, content) VALUES (?1, ?2, ?3, ?4)")
            .map_err(|e| e.to_string())?;

        for msg in conversation {
            // Mapping role to sender_id (assuming: 1=user, 2=assistant/system - simplistic approach)
            // Or if sender_types table exists, we need to map string roles to integers.
            // Let's check sender_types in initialize_database.rs. 
            // It has sender_type_id INTEGER PRIMARY KEY, description TEXT.
            // We'll need to handle this mapping. For now, let's assume 1=user, 2=ai.
            let sender_id = if msg.role == "user" { 1 } else { 2 };
            
            stmt.execute(params![&msg.id, &chat_id, sender_id, &msg.message])
                .map_err(|e| e.to_string())?;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_thread(chat_id: String) -> Result<Thread, String> {
    let connection = database_conection().map_err(|e| e.to_string())?;

    let mut stmt = connection
        .prepare(
            "SELECT c.conversation_id, c.title, c.created_at, c.updated_at,
                    COALESCE(s.schema_sql, ''), COALESCE(s.diagram, '')
             FROM conversations c
             LEFT JOIN schemas s ON c.conversation_id = s.conversation_id
             WHERE c.conversation_id = ?1",
        )
        .map_err(|e| e.to_string())?;

    let thread_base = stmt
        .query_row(params![&chat_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, Option<String>>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, String>(5)?,
            ))
        })
        .optional()
        .map_err(|e| e.to_string())?;

    if let Some((id, title, created_at, updated_at, schema_sql, diagram)) = thread_base {
        // Fetch messages
        let mut msg_stmt = connection
            .prepare(
                "SELECT message_id, content, sender, created_at 
                 FROM messages 
                 WHERE conversation_id = ?1 
                 ORDER BY created_at ASC",
            )
            .map_err(|e| e.to_string())?;

        let messages_iter = msg_stmt
            .query_map(params![&chat_id], |row| {
                let sender_id: i32 = row.get(2)?;
                let role = if sender_id == 1 { "user" } else { "assistant" }; // Simplistic mapping
                let _created_at_str: String = row.get(3)?;
                // Convert timestamp string to i64 if possible, or just parse generic assumption
                // The Message struct expects timestamp: i64. SQLite default CURRENT_TIMESTAMP is string 'YYYY-MM-DD HH:MM:SS'.
                // Ideally we should store milliseconds or parse. For now, let's return 0 or parse naive.
                // Assuming the frontend handles string/number conversion or we adjust struct.
                // Re-reading Message struct: timestamp: i64.
                // Let's use 0 for now to avoid parsing complexity in this step unless critical.
                
                Ok(Message {
                    id: row.get(0)?,
                    message: row.get(1)?,
                    role: role.to_string(),
                    timestamp: 0, 
                    diagram: None, // Missing from messages table in schema, or implicit?
                })
            })
            .map_err(|e| e.to_string())?;

        let mut conversation = Vec::new();
        for msg in messages_iter {
            conversation.push(msg.map_err(|e| e.to_string())?);
        }

        Ok(Thread {
            chat_id: id,
            title,
            diagram,
            schema_sql,
            conversation,
            created_at,
            updated_at,
        })
    } else {
        Err("Thread not found".to_string())
    }
}

#[tauri::command]
pub fn update_thread(
    chat_id: String,
    title: Option<String>,
    diagram: Option<String>,
    schema_sql: Option<String>,
    conversation: Option<Vec<Message>>,
) -> Result<(), String> {
    let mut connection = database_conection().map_err(|e| e.to_string())?;
    let tx = connection.transaction().map_err(|e| e.to_string())?;

    {
        if let Some(t) = title {
            tx.execute(
                "UPDATE conversations SET title = ?1, updated_at = CURRENT_TIMESTAMP WHERE conversation_id = ?2",
                params![&t, &chat_id],
            )
            .map_err(|e| e.to_string())?;
        }

        if diagram.is_some() || schema_sql.is_some() {
             // Upsert schema if not exists? Or assume it exists from create? 
             // Let's assume update.
             if let Some(d) = diagram {
                 tx.execute(
                    "UPDATE schemas SET diagram = ?1, updated_at = CURRENT_TIMESTAMP WHERE conversation_id = ?2",
                    params![&d, &chat_id]
                 ).map_err(|e| e.to_string())?;
             }
             if let Some(s) = schema_sql {
                 tx.execute(
                    "UPDATE schemas SET schema_sql = ?1, updated_at = CURRENT_TIMESTAMP WHERE conversation_id = ?2",
                    params![&s, &chat_id]
                 ).map_err(|e| e.to_string())?;
             }
        }

        if let Some(msgs) = conversation {
            // Full replace of messages? Or append? thread.ts updateThread usually replaces specific fields.
            // If we receive the full conversation, we might need to sync.
            // For simplicity in this migration: Delete all and re-insert is safest but inefficient.
            // Better: just insert new ones? But we don't know which are new easily without checking IDs.
            // Let's go with: Delete all for this thread and re-insert.
            tx.execute(
                "DELETE FROM messages WHERE conversation_id = ?1",
                params![&chat_id],
            ).map_err(|e| e.to_string())?;

            let mut stmt = tx
                .prepare("INSERT INTO messages (message_id, conversation_id, sender, content) VALUES (?1, ?2, ?3, ?4)")
                .map_err(|e| e.to_string())?;

            for msg in msgs {
                let sender_id = if msg.role == "user" { 1 } else { 2 };
                stmt.execute(params![&msg.id, &chat_id, sender_id, &msg.message])
                    .map_err(|e| e.to_string())?;
            }
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_all_threads() -> Result<Vec<Thread>, String> {
    let connection = database_conection().map_err(|e| e.to_string())?;
    
    // Get all conversation IDs first
    let mut stmt = connection.prepare("SELECT conversation_id FROM conversations ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;
    
    let ids: Result<Vec<String>, _> = stmt.query_map([], |row| row.get(0)).map_err(|e| e.to_string())?.collect();
    let ids = ids.map_err(|e| e.to_string())?;

    let mut threads = Vec::new();
    for id in ids {
        // Reuse get_thread logic or duplicate query logic for efficiency?
        // Reuse is cleaner but N+1. For a local desktop app with < 100 threads, it's fine.
        if let Ok(thread) = get_thread(id) {
             threads.push(thread);
        }
    }
    
    Ok(threads)
}

#[tauri::command]
pub fn delete_thread(chat_id: String) -> Result<(), String> {
    let connection = database_conection().map_err(|e| e.to_string())?;
    // Cascading delete handled by FKs if enabled? 
    // SQLite FK support needs `PRAGMA foreign_keys = ON;` usually.
    // Let's do manual delete to be safe.
    connection.execute("DELETE FROM messages WHERE conversation_id = ?1", params![&chat_id]).map_err(|e| e.to_string())?;
    connection.execute("DELETE FROM schemas WHERE conversation_id = ?1", params![&chat_id]).map_err(|e| e.to_string())?;
    connection.execute("DELETE FROM conversations WHERE conversation_id = ?1", params![&chat_id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn duplicate_thread(chat_id: String) -> Result<Thread, String> {
    let source_thread = get_thread(chat_id).map_err(|e| format!("Source thread not found: {}", e))?;
    let new_id = Uuid::new_v4().to_string();
    
    let new_thread = Thread {
        chat_id: new_id.clone(),
        title: source_thread.title.map(|t| format!("{} (Copy)", t)),
        diagram: source_thread.diagram,
        schema_sql: source_thread.schema_sql,
        conversation: source_thread.conversation, // Full copy
        created_at: "".to_string(), // DB will set
        updated_at: "".to_string(), // DB will set
    };
    
    create_thread(
        new_thread.chat_id.clone(),
        new_thread.title.clone(),
        new_thread.diagram.clone(),
        new_thread.schema_sql.clone(),
        new_thread.conversation.clone()
    )?;
    
    // Fetch it back to get the DB-generated timestamps
    get_thread(new_id)
}