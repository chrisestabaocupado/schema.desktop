'use client'

import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'
import { Database, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { ExampleButtons } from './examples'
import { ThreadList } from './thread-list'

interface Thread {
  conversation_id: string
  title: string
  schema_sql: string
}

export default function SchemasList() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadThreads = async () => {
      try {
        const result = await invoke<Thread[]>('get_threads')
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
      return JSON.parse(diagram)?.database?.name
    } catch {
      return 'Untitled'
    }
  }

  const mappedThreads = threads.map((thread) => {
    return {
      ...thread,
      dbTitle: getDatabaseTitle(thread.schema_sql),
    }
  })

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <header className="flex justify-between items-center w-full mb-8">
        <Link href="/" className="flex items-center justify-between space-x-2">
          <Database className="h-6 w-6" />
          <span className="font-bold inline-block">schema.ai</span>
        </Link>
      </header>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tus chats</h1>
          <p className="text-muted-foreground mt-1">
            Visualiza y continúa tus conversaciones sobre esquemas de bases de
            datos
          </p>
        </div>
        <Link href={PATHS.CHAT}>
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Nuevo Chat
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
