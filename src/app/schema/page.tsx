'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { invoke } from '@tauri-apps/api/core'

export default function NewChat() {
  const router = useRouter()

  useEffect(() => {
    const createNewThread = async () => {
      try {
        // Generate new chat ID
        const chatId = crypto.randomUUID()

        // Create empty thread in database
        await invoke('create_thread', {
          chatId,
          title: null,
          diagram: '',
          schemaSql: '',
          conversation: [],
        })

        // Redirect to the new chat
        router.push(`/schema/${chatId}`)
      } catch (error) {
        console.error('Error creating new thread:', error)
        // Fallback: redirect to schemas list
        router.push('/schemas')
      }
    }

    createNewThread()
  }, [router])

  return (
    <div className="flex justify-center items-center h-screen">
      <p className="text-muted-foreground">Creando nueva conversación...</p>
    </div>
  )
}