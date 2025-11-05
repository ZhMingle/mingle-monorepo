'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Editor from '@/components/Editor'
import { NotebookProvider } from '@/contexts/NotebookContext'
import styles from './page.module.css'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <NotebookProvider>
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.main}>
          <Editor />
        </main>
      </div>
    </NotebookProvider>
  )
}

