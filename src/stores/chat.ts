'use client'

import defaultMessages from '@/constants/defaultMessages'
import {
  compareJsonSchemas,
  generateDatabaseScriptFromDiagram,
  normalizeChat,
  sendUserMessage,
  validateUserIntent,
} from '@/lib/gemini'
import type { Message, Roles, Schemas } from '@/types/chat'
import type { TauriThread } from '@/types/tauri'
import { invoke } from '@tauri-apps/api/core'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { useConfigStore } from './config'

const ROLES: Record<string, Roles> = {
  user: 'user',
  assistant: 'model',
}

interface ChatStore {
  conversations: string[]
  chatHistory: Message[] | null
  chatId: string | null
  chatDiagram: string | null
  chatSchemas: Schemas
  isLoading: boolean

  addMessageToChat: (role: Roles, text: string, diagram?: string) => void
  handleSendMessage: (
    messageText: string,
    chatId: string,
  ) => Promise<string | null>
  loadChatThread: (chatId: string, thread: TauriThread | null) => Promise<void>
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      chatHistory: null,
      chatId: null,
      chatDiagram: null,
      chatSchemas: { sql: '' },
      isLoading: false,

      addMessageToChat: (role: Roles, text: string, diagram?: string) => {
        const { chatHistory } = get()
        const newMessage: Message = {
          id: Date.now().toString(),
          role,
          message: text, // Textual content (e.g., user query, AI summary)
          diagram: diagram || '', // Diagram JSON string, if this message includes/is a diagram
          timestamp: Date.now(),
        }
        set({ chatHistory: [...(chatHistory || []), newMessage] })
      },

      handleSendMessage: async (
        messageText: string,
        chatId: string,
      ): Promise<string | null> => {
        const {
          addMessageToChat,
          chatHistory: currentLocalHistory,
          chatDiagram: currentDiagramInStore,
          chatSchemas,
        } = get()

        // Check if this is a new conversation
        const isNewConversation = chatId === 'new'

        // Generate new UUID if this is a new conversation
        const effectiveChatId = isNewConversation ? crypto.randomUUID() : chatId

        addMessageToChat(ROLES.user, messageText)
        set({ isLoading: true, chatId: effectiveChatId })

        let apiKey = ''
        try {
          apiKey = await invoke<string>('get_api_key')
        } catch (error) {
          console.error('Failed to get API key:', error)
          addMessageToChat(
            ROLES.assistant,
            'Error: No pude obtener la API key. Por favor configura tu API key en la configuración.',
          )
          set({ isLoading: false })
          return null
        }

        if (!apiKey) {
          addMessageToChat(
            ROLES.assistant,
            'Error: API key no encontrada. Por favor configura tu API key.',
          )
          set({ isLoading: false })
          return null
        }

        // <<< VALIDAR INTENCIÓN DEL USUARIO
        const validationResult = await validateUserIntent(apiKey, messageText)
        if (!validationResult.isValid) {
          addMessageToChat(ROLES.assistant, validationResult.message)
          set({ isLoading: false })
          return null
        }
        // >>> FIN VALIDACIÓN

        const normalizedHistory = await normalizeChat(currentLocalHistory || [])

        try {
          const { responseText: aiDiagramResponse } = await sendUserMessage(
            apiKey,
            normalizedHistory,
            messageText,
          )

          let summaryForChatMessage =
            'El diagrama se ha procesado y no presenta cambios respecto a la versión anterior.'
          if (
            currentDiagramInStore &&
            aiDiagramResponse &&
            currentDiagramInStore !== aiDiagramResponse
          ) {
            const comparisonResult = await compareJsonSchemas(
              apiKey,
              currentDiagramInStore,
              aiDiagramResponse,
            )
            summaryForChatMessage = comparisonResult.summary
          } else if (aiDiagramResponse && !currentDiagramInStore) {
            summaryForChatMessage =
              'He generado el nuevo diagrama de acuerdo a tu solicitud.'
          }

          addMessageToChat(
            ROLES.assistant,
            summaryForChatMessage,
            aiDiagramResponse,
          )

          const sqlSchema = await generateDatabaseScriptFromDiagram(
            apiKey,
            aiDiagramResponse,
            'sql',
          )

          set({
            chatSchemas: {
              sql: sqlSchema.replaceAll(';;', ';\n') || '',
            },
          })

          set({ chatDiagram: aiDiagramResponse })

          const thread = await invoke<TauriThread>('get_thread', {
            chatId: effectiveChatId,
          }).catch(() => null)

          if (thread) {
            const updatedConversationHistory = get().chatHistory || []
            await invoke('update_thread', {
              chatId: effectiveChatId,
              diagram: aiDiagramResponse,
              schemaSql: sqlSchema,
              conversation: updatedConversationHistory,
            })
          } else {
            await invoke('create_thread', {
              chatId: effectiveChatId,
              title: null,
              diagram: aiDiagramResponse,
              schemaSql: sqlSchema,
              conversation: get().chatHistory || [],
            })
            set({ chatId: effectiveChatId })
          }

          set({ isLoading: false })

          // Return the effective chatId (new UUID for new conversations)
          return effectiveChatId
        } catch (error) {
          console.error('Error sending message:', error)
          addMessageToChat(
            ROLES.assistant,
            `Sorry, I encountered an error: ${(error as Error).message}`,
          )
          set({ isLoading: false })
          return null
        }
      },

      loadChatThread: async (chatId: string, thread: TauriThread | null) => {
        const { addMessageToChat } = get()

        // RESET COMPLETO - Limpiar todo el estado primero para evitar mezclar conversaciones
        set({
          chatHistory: [],
          chatDiagram: null,
          chatSchemas: { sql: '' },
          isLoading: true,
        })

        try {
          if (thread) {
            console.log(thread.diagram)
            set({
              chatId: thread.chat_id,
              chatHistory: thread.conversation,
              chatDiagram: thread.diagram,
              chatSchemas: { sql: thread.schema_sql },
              isLoading: false,
            })
          } else if (chatId === 'new') {
            // Special case for new conversations - show welcome message
            const randomIndex = Math.floor(
              Math.random() * defaultMessages.length,
            )
            addMessageToChat(ROLES.assistant, defaultMessages[randomIndex])

            set({
              chatId: 'new',
              isLoading: false,
            })
          } else {
            set({
              chatId,
              isLoading: false,
            })
            const randomIndex = Math.floor(
              Math.random() * defaultMessages.length,
            )
            addMessageToChat(ROLES.user, defaultMessages[randomIndex])
          }
        } catch (error) {
          console.error('Error loading chat thread:', error)
          set({
            chatId,
            chatHistory: [],
            chatDiagram: null,
            chatSchemas: { sql: '' },
            isLoading: false,
          })
        }
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
