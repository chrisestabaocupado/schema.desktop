'use client'

import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useParams, useRouter } from 'next/navigation'
import PageContent from './page-content'
import type { TauriThread } from '@/types/tauri'

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
        const result = await invoke<TauriThread>('get_thread', { chatId })
        console.log('Loaded thread:', result)
        // Convert to match IThread interface if needed by PageContent using type assertion or wrapper
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

  // Cast TauriThread to IThread compatible type if necessary for PageContent
  // Or update PageContent to accept TauriThread.
  // PageContent expects IThread | null. Let's check PageContent signature.
  // PageContent accepts { thread: IThread | null }.
  // IThread has user_id, schemas.mongo etc.
  // We need to either update PageContent or mock missing fields.
  // Since we are migrating, let's update PageContent props type next.
  // For now, pass as is and let's update PageContent.

  return <PageContent thread={thread} />
}
