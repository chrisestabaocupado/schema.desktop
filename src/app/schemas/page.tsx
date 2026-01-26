'use client'

import { Button } from '@/components/ui/button'

import { PATHS } from '@/constants/paths'
// import { getThreadsByUserId } from '@/lib/thread'
import { Database, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { ExampleButtons } from './examples'
import { ThreadList } from './thread-list'

export default function SchemasList() {
  const { user } = useUser()

  // Middleware handles authentication protection for this route
  // No need for client-side redirect logic here

  const threads: any[] = []

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
      dbTitle: getDatabaseTitle(thread.diagram),
    }
  })

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <header className="flex justify-between items-center w-full mb-8">
        <Link href="/" className="flex items-center justify-between space-x-2">
          <Database className="h-6 w-6" />
          <span className="font-bold inline-block">schema.ai</span>
        </Link>
        <div className="flex items-center gap-4">
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
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

      <div className="flex flex-col gap-44">
        <ThreadList threads={mappedThreads} />
        <ExampleButtons userId={user ? user.id : ''} />
      </div>
    </div>
  )
}
