'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'
import { getRelativeTime } from '@/utils/get-relative-time'
import { Trash2 } from 'lucide-react'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { useRouter } from 'next/navigation'
import type { ThreadUI } from './page'
import { invoke } from '@tauri-apps/api/core'

export function ThreadList({ threads }: { threads: ThreadUI[] }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentThreadToDelete, setCurrentThreadToDelete] =
    useState<ThreadUI | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  if (!threads.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">No tienes chats todavía</h3>
        <p className="text-muted-foreground mt-1">
          Inicia una nueva conversación para crear tu esquema de base de datos
        </p>
        <Link href={PATHS.CHAT} className="mt-4 inline-block">
          <Button>Iniciar nuevo chat</Button>
        </Link>
      </div>
    )
  }

  const updatedAt = (threadUpdatedAt: string) => {
    // If empty string or invalid, return current date or handle gracefully
    if (!threadUpdatedAt) return new Date();
    return new Date(threadUpdatedAt);
  }

  const handleDeleteClick = (e: React.MouseEvent, thread: ThreadUI) => {
    e.preventDefault()
    setCurrentThreadToDelete(thread)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (currentThreadToDelete?.chat_id) {
      setIsDeleting(true)
      try {
        await invoke('delete_thread', { chatId: currentThreadToDelete.chat_id })
        // Since we are in a client component and list is passed as prop, 
        // refreshing router won't update the state in parent automatically 
        // unless parent re-fetches.
        // Option 1: Trigger full page reload (window.location.reload())
        // Option 2: Pass a callback from parent to remove item from state.
        // For now, full reload is simplest migration step, 
        // or ensure parent useEffect re-runs on focus/nav.
        // Ideally: router.refresh() works if checking server components, but here 
        // we fetch in client useEffect.
        // Let's reload page to ensure list is fresh.
        window.location.reload();
      } catch (error) {
        console.error('Failed to delete thread:', error)
      } finally {
        setIsDeleting(false)
        setShowDeleteModal(false)
        setCurrentThreadToDelete(null)
      }
    }
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {threads.map((thread) => (
          <div key={thread.chat_id} className="relative group">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={(e) => handleDeleteClick(e, thread)}
              type="button"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
            <Link href={`${PATHS.CHAT}/${thread.chat_id}`} className="block">
              <Card className="h-full transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="line-clamp-1">
                    {thread.dbTitle}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Last updated: {getRelativeTime(thread?.updated_at || '')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {thread.conversation?.at(-1)?.message}
                  </p>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground">
                  {updatedAt(thread?.updated_at || '').toLocaleDateString()} at{' '}
                  {updatedAt(thread?.updated_at || '').toLocaleTimeString()}
                </CardFooter>
              </Card>
            </Link>
          </div>
        ))}
      </div>
      {currentThreadToDelete && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="¿Quieres eliminar este Chat?"
          description={`Esta acción no se puede deshacer. Esto eliminará permanentemente el chat \"${currentThreadToDelete.dbTitle}\".`}
          confirmText="Eliminar"
          isLoading={isDeleting}
        />
      )}
    </>
  )
}
