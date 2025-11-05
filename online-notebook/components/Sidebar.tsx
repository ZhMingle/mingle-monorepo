'use client'

import React from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useNotebook } from '@/contexts/NotebookContext'
import styles from './Sidebar.module.css'

export default function Sidebar() {
  const { pages, currentPageId, selectPage, createPage, deletePage } = useNotebook()
  const { data: session } = useSession()

  const handleNewPage = () => {
    createPage()
  }

  const handleDeletePage = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this page?')) {
      deletePage(pageId)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.logo}>🎾</div>
        <button className={styles.newPageButton} onClick={handleNewPage}>
          + New Page
        </button>
      </div>
      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{session?.user?.name || session?.user?.email}</div>
          <div className={styles.userEmail}>{session?.user?.email}</div>
        </div>
        <button className={styles.signOutButton} onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
      <div className={styles.pagesList}>
        {pages.map((page) => (
          <div
            key={page.id}
            className={`${styles.pageItem} ${
              currentPageId === page.id ? styles.active : ''
            }`}
            onClick={() => selectPage(page.id)}
          >
            <span className={styles.pageTitle}>{page.title || 'Untitled Page'}</span>
            {pages.length > 1 && (
              <button
                className={styles.deleteButton}
                onClick={(e) => handleDeletePage(e, page.id)}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}

