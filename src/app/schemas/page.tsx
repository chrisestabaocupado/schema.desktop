'use client'

import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'
import { Database, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { ThreadList } from './thread-list'
import { TauriThread } from '@/types/tauri'

// Interface extending TauriThread to include the UI-specific property
export interface ThreadUI extends TauriThread {
  dbTitle: string
}

export default function SchemasList() {
  const [threads, setThreads] = useState<TauriThread[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadThreads = async () => {
      try {
        const result = await invoke<TauriThread[]>('get_all_threads')
        console.log('Loaded threads:', result)
        setThreads(result)
      } catch (error) {
        console.error('Error loading threads:', error)
        setThreads([])
      } finally {
        setIsLoading(false)
      }
    }

    loadThreads()
  }, [])

  const getDatabaseTitle = (diagram: string) => {
    try {
      return JSON.parse(diagram)?.database?.name || 'Untitled'
    } catch {
      return 'Untitled'
    }
  }

  const mappedThreads: ThreadUI[] = threads.map((thread) => {
    return {
      ...thread,
      dbTitle: getDatabaseTitle(thread.diagram),
    }
  })

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-5xl">
      <header className="flex justify-between items-center w-full mb-8">
        <Link href="/" className="flex items-center justify-between space-x-2">
          <Database className="h-6 w-6" />
          <span className="font-bold inline-block">schema.ai</span>
        </Link>
      </header>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tus conversaciones</h1>
          <p className="text-muted-foreground mt-1">
            Visualiza y continúa tus conversaciones sobre esquemas de bases de
            datos
          </p>
        </div>
        <Link href={PATHS.CHAT}>
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Nueva Conversación
          </Button>
        </Link>
      </div>

      {isLoading && <p className="text-center text-muted-foreground">Cargando esquemas...</p>}

      {!isLoading && threads.length === 0 && (
        <p className="text-center text-muted-foreground">No hay esquemas creados aún</p>
      )}

      {!isLoading && threads.length > 0 && (
        <div className="flex flex-col gap-4">
          <ThreadList threads={mappedThreads} />
        </div>
      )}
    </div>
  )
}
