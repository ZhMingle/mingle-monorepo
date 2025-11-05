'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useSession } from 'next-auth/react'

export interface Block {
  id: string
  type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'bullet' | 'number'
  content: string
}

export interface Page {
  id: string
  title: string
  blocks: Block[]
  createdAt: number
  updatedAt: number
}

// API response data type (timestamps may be Date objects)
interface ApiPage {
  id: string
  title: string
  blocks: Block[]
  createdAt: Date | number
  updatedAt: Date | number
}

interface NotebookContextType {
  pages: Page[]
  currentPageId: string | null
  currentPage: Page | null
  loading: boolean
  createPage: () => Promise<string>
  selectPage: (pageId: string) => void
  updatePageTitle: (pageId: string, title: string) => void
  addBlock: (pageId: string, block: Block) => void
  updateBlock: (pageId: string, blockId: string, updates: Partial<Block>) => void
  deleteBlock: (pageId: string, blockId: string) => void
  deletePage: (pageId: string) => Promise<void>
}

const NotebookContext = createContext<NotebookContextType | undefined>(undefined)

export function NotebookProvider({ children }: { children: ReactNode }) {
  const [pages, setPages] = useState<Page[]>([])
  const [currentPageId, setCurrentPageId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { data: session, status } = useSession()

  // Convert API response timestamps
  const convertPage = (apiPage: ApiPage): Page => ({
    ...apiPage,
    createdAt: typeof apiPage.createdAt === 'string' 
      ? new Date(apiPage.createdAt).getTime() 
      : apiPage.createdAt instanceof Date 
      ? apiPage.createdAt.getTime() 
      : apiPage.createdAt,
    updatedAt: typeof apiPage.updatedAt === 'string' 
      ? new Date(apiPage.updatedAt).getTime() 
      : apiPage.updatedAt instanceof Date 
      ? apiPage.updatedAt.getTime() 
      : apiPage.updatedAt,
  })

  // Load pages data
  const loadPages = useCallback(async () => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/pages')
      if (response.ok) {
        const apiPages: ApiPage[] = await response.json()
        const convertedPages = apiPages.map(convertPage)
        setPages(convertedPages)
        if (convertedPages.length > 0) {
          setCurrentPageId(convertedPages[0].id)
        }
      } else if (response.status === 401) {
        // Unauthorized, may need to login
        console.error('Unauthorized, please login first')
      }
    } catch (error) {
      console.error('Failed to load pages:', error)
    } finally {
      setLoading(false)
    }
  }, [status])

  // Load data on initialization
  useEffect(() => {
    loadPages()
  }, [loadPages])

  // Update page to server (debounced)
  const updatePageOnServer = useCallback(async (pageId: string, updates: Partial<Page>) => {
    if (status !== 'authenticated') return

    try {
      console.log('Updating page on server:', { pageId, hasTitle: updates.title !== undefined, hasBlocks: updates.blocks !== undefined, blocksLength: updates.blocks?.length || 0 })
      
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updates.title,
          blocks: updates.blocks,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to update page (${response.status})`
        const errorDetails = errorData.details || ''
        
        console.error('Failed to update page on server:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          details: errorDetails,
          pageId,
        })
        
        // If unauthorized error, may need to re-login
        if (response.status === 401) {
          console.warn('User unauthorized, may need to re-login')
        }
      } else {
        console.log('Page updated successfully on server')
      }
    } catch (error) {
      console.error('Failed to update page on server:', error)
    }
  }, [status])

  // Debounced update function
  const debouncedUpdate = useCallback(
    (() => {
      let timeout: NodeJS.Timeout | null = null
      return (pageId: string, updates: Partial<Page>) => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => {
          updatePageOnServer(pageId, updates)
        }, 500) // 500ms debounce
      }
    })(),
    [updatePageOnServer]
  )

  const createPage = async () => {
    if (status !== 'authenticated') {
      // If not logged in, use local storage as fallback
      const newPage: Page = {
        id: uuidv4(),
        title: 'Untitled Page',
        blocks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setPages((prev) => [...prev, newPage])
      setCurrentPageId(newPage.id)
      return newPage.id
    }

    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Page' }),
      })

      if (response.ok) {
        const apiPage: ApiPage = await response.json()
        const newPage = convertPage(apiPage)
        setPages((prev) => [...prev, newPage])
        setCurrentPageId(newPage.id)
        return newPage.id
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to create page (${response.status})`
        console.error('Failed to create page:', errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Failed to create page:', error)
      // Create local page on failure
      const newPage: Page = {
        id: uuidv4(),
        title: 'Untitled Page',
        blocks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setPages((prev) => [...prev, newPage])
      setCurrentPageId(newPage.id)
      return newPage.id
    }
  }

  const selectPage = (pageId: string) => {
    setCurrentPageId(pageId)
  }

  const updatePageTitle = (pageId: string, title: string) => {
    setPages((prev) =>
      prev.map((page) =>
        page.id === pageId
          ? { ...page, title, updatedAt: Date.now() }
          : page
      )
    )
    debouncedUpdate(pageId, { title })
  }

  const addBlock = (pageId: string, block: Block) => {
    setPages((prev) => {
      const updated = prev.map((page) =>
        page.id === pageId
          ? {
              ...page,
              blocks: [...page.blocks, block],
              updatedAt: Date.now(),
            }
          : page
      )
      const updatedPage = updated.find((p) => p.id === pageId)
      if (updatedPage && status === 'authenticated') {
        debouncedUpdate(pageId, { blocks: updatedPage.blocks })
      }
      return updated
    })
  }

  const updateBlock = (pageId: string, blockId: string, updates: Partial<Block>) => {
    setPages((prev) => {
      const updated = prev.map((page) =>
        page.id === pageId
          ? {
              ...page,
              blocks: page.blocks.map((block) =>
                block.id === blockId ? { ...block, ...updates } : block
              ),
              updatedAt: Date.now(),
            }
          : page
      )
      const updatedPage = updated.find((p) => p.id === pageId)
      if (updatedPage && status === 'authenticated') {
        debouncedUpdate(pageId, { blocks: updatedPage.blocks })
      }
      return updated
    })
  }

  const deleteBlock = (pageId: string, blockId: string) => {
    setPages((prev) => {
      const updated = prev.map((page) =>
        page.id === pageId
          ? {
              ...page,
              blocks: page.blocks.filter((block) => block.id !== blockId),
              updatedAt: Date.now(),
            }
          : page
      )
      const updatedPage = updated.find((p) => p.id === pageId)
      if (updatedPage && status === 'authenticated') {
        debouncedUpdate(pageId, { blocks: updatedPage.blocks })
      }
      return updated
    })
  }

  const deletePage = async (pageId: string) => {
    if (status === 'authenticated') {
      try {
        console.log('Deleting page on server:', pageId)
        const response = await fetch(`/api/pages/${pageId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.error || `Failed to delete page (${response.status})`
          const errorDetails = errorData.details || ''
          
          console.error('Failed to delete page on server:', {
            status: response.status,
            statusText: response.statusText,
            error: errorMessage,
            details: errorDetails,
            pageId,
          })
          
          // Show error to user
          alert(`Failed to delete: ${errorMessage}`)
          return
        }
        
        console.log('Page deleted successfully on server')
      } catch (error) {
        console.error('Failed to delete page:', error)
        alert('Failed to delete, please try again')
        return
      }
    }

    // Update local state
    setPages((prev) => {
      const filtered = prev.filter((page) => page.id !== pageId)
      if (currentPageId === pageId && filtered.length > 0) {
        setCurrentPageId(filtered[0].id)
      } else if (filtered.length === 0) {
        // If all pages are deleted, create a new page
        const newPage: Page = {
          id: uuidv4(),
          title: 'Untitled Page',
          blocks: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        setCurrentPageId(newPage.id)
        return [newPage]
      }
      return filtered
    })
  }

  const currentPage = pages.find((page) => page.id === currentPageId) || null

  return (
    <NotebookContext.Provider
      value={{
        pages,
        currentPageId,
        currentPage,
        loading,
        createPage,
        selectPage,
        updatePageTitle,
        addBlock,
        updateBlock,
        deleteBlock,
        deletePage,
      }}
    >
      {children}
    </NotebookContext.Provider>
  )
}

export function useNotebook() {
  const context = useContext(NotebookContext)
  if (context === undefined) {
    throw new Error('useNotebook must be used within a NotebookProvider')
  }
  return context
}

