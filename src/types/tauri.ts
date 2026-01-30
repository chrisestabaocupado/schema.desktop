import type { Message } from './chat';

export interface TauriThread {
  chat_id: string;
  title?: string;
  diagram: string;
  schema_sql: string;
  conversation: Message[];
  created_at: string;
  updated_at: string;
}
