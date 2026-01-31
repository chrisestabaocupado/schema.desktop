'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function NewChat() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to /schema/new without creating a thread
    // The thread will be created when the user sends the first message
    router.push('/schema/new')
  }, [router])

  return (
    <div className="flex justify-center items-center h-screen">
      <p className="text-muted-foreground">Preparando nueva conversación...</p>
    </div>
  )
}
