'use client'

import type { TauriThread } from '@/types/tauri'
import { invoke } from '@tauri-apps/api/core'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PageContent from './page-content'

interface ThreadStore extends TauriThread {
  user_id: string
}

export default function Schema() {
  const params = useParams()
  const router = useRouter()
  const chatId = params?.id as string
  const [thread, setThread] = useState<TauriThread | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadThread = async () => {
      try {
        if (!chatId) return

        // Special case: "new" means creating a new conversation
        // Don't try to load from database, just show empty chat
        if (chatId === 'new') {
          console.log(
            'Creating new conversation - thread will be created on first message',
          )
          setThread(null)
          setIsLoading(false)
          return
        }

        const result = await invoke<TauriThread>('get_thread', { chatId })
        console.log('Loaded thread:', result)
        setThread(result)
      } catch (error) {
        console.warn('Thread not found, redirecting to schemas list')
        router.push('/schemas')
      } finally {
        setIsLoading(false)
      }
    }

    loadThread()
  }, [chatId, router])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-muted-foreground">Cargando conversación...</p>
      </div>
    )
  }

  return <PageContent thread={thread} chatId={chatId} />
}
