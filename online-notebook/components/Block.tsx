'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useNotebook, Block } from '@/contexts/NotebookContext'
import { v4 as uuidv4 } from 'uuid'
import { marked } from 'marked'
import styles from './Block.module.css'

interface BlockComponentProps {
  block: Block
  pageId: string
  index: number
}

// Configure marked to output inline HTML
marked.setOptions({
  breaks: true,
  gfm: true,
})

// Helper function to save cursor position
function saveCursorPosition(element: HTMLElement) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null

  const range = selection.getRangeAt(0)
  const preCaretRange = range.cloneRange()
  preCaretRange.selectNodeContents(element)
  preCaretRange.setEnd(range.endContainer, range.endOffset)
  
  return {
    start: preCaretRange.toString().length,
    end: preCaretRange.toString().length + range.toString().length,
  }
}

// Helper function to restore cursor position
function restoreCursorPosition(element: HTMLElement, position: { start: number; end: number } | null) {
  if (!position) return

  const selection = window.getSelection()
  if (!selection) return

  const range = document.createRange()
  let charCount = 0
  let nodeStack: Node[] = [element]
  let node: Node | undefined
  let foundStart = false
  let foundEnd = false
  let startNode: Node | null = null
  let startOffset = 0
  let endNode: Node | null = null
  let endOffset = 0

  while (!foundEnd && (node = nodeStack.pop())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const nextCharCount = charCount + (node.textContent?.length || 0)
      if (!foundStart && position.start >= charCount && position.start <= nextCharCount) {
        foundStart = true
        startNode = node
        startOffset = position.start - charCount
      }
      if (!foundEnd && position.end >= charCount && position.end <= nextCharCount) {
        foundEnd = true
        endNode = node
        endOffset = position.end - charCount
      }
      charCount = nextCharCount
    } else {
      let i = node.childNodes.length
      while (i--) {
        nodeStack.push(node.childNodes[i])
      }
    }
  }

  if (startNode && endNode) {
    range.setStart(startNode, startOffset)
    range.setEnd(endNode, endOffset)
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

export default function BlockComponent({ block, pageId, index }: BlockComponentProps) {
  const { updateBlock, deleteBlock, addBlock } = useNotebook()
  const [content, setContent] = useState(block.content)
  const [showMenu, setShowMenu] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const editableRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isUpdatingRef = useRef(false)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setContent(block.content)
  }, [block.content])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  // Auto-focus placeholder blocks on mount
  useEffect(() => {
    if (block.id === 'placeholder') {
      if (block.type === 'paragraph' || block.type === 'bullet' || block.type === 'number') {
        setTimeout(() => {
          editableRef.current?.focus()
        }, 0)
      } else if (inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus()
        }, 0)
      }
    }
  }, [block.id, block.type])

  // Convert markdown to HTML for contentEditable
  const markdownToHtml = useCallback((markdown: string): string => {
    if (!markdown.trim()) return '<br>'
    try {
      const result = marked.parse(markdown)
      // Handle both sync and async results
      if (typeof result === 'string') {
        return result
      }
      // If it's a Promise, return the markdown as-is for now
      // (in practice, marked.parse should be synchronous)
      return markdown
    } catch (error) {
      console.error('Markdown parsing error:', error)
      return markdown
    }
  }, [])

  // Get plain text from contentEditable
  const getPlainText = useCallback((element: HTMLElement) => {
    return element.innerText || element.textContent || ''
  }, [])

  // Check if text matches markdown heading pattern (e.g., "# ", "## ", "### ")
  // Must have space after # to trigger conversion (not just "#")
  const isMarkdownHeadingPattern = useCallback((text: string) => {
    // Match patterns like "# ", "## ", "### " (with space)
    // But not just "#" (without space)
    return /^#{1,6}\s/.test(text)
  }, [])
  
  // Check if text is just "#" without space (should not convert yet)
  const isJustHashSymbol = useCallback((text: string) => {
    return /^#{1,6}$/.test(text)
  }, [])

  // Update HTML from markdown with debounce, but immediate for certain patterns
  const updateHtmlFromMarkdown = useCallback((element: HTMLElement, plainText: string) => {
    // Clear any pending update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    // If it's just "#" without space, don't convert - keep as plain text
    if (isJustHashSymbol(plainText)) {
      // Don't update HTML, keep the plain text "#" visible
      return
    }

    // Check if this is a markdown heading pattern with space - update immediately
    const shouldUpdateImmediately = isMarkdownHeadingPattern(plainText)
    
    const updateHtml = () => {
      if (isUpdatingRef.current || !editableRef.current || element !== editableRef.current) return
      
      const savedPosition = saveCursorPosition(element)
      let html = markdownToHtml(plainText)
      
      // If HTML is just an empty heading (e.g., "<h1></h1>"), add a space to keep it editable
      const emptyHeadingMatch = html.match(/^<(h[1-6])><\/h[1-6]>$/)
      if (emptyHeadingMatch) {
        // Add a non-breaking space to keep the heading visible and editable
        html = html.replace('></h', '>&nbsp;</h')
      }
      
      isUpdatingRef.current = true
      element.innerHTML = html
      
      // Restore cursor position
      requestAnimationFrame(() => {
        if (savedPosition && editableRef.current) {
          restoreCursorPosition(editableRef.current, savedPosition)
        }
        isUpdatingRef.current = false
      })
    }

    if (shouldUpdateImmediately) {
      // Update immediately for heading patterns with space (e.g., "# " or "# Title")
      requestAnimationFrame(() => {
        updateHtml()
      })
    } else {
      // Debounce for other content
      updateTimeoutRef.current = setTimeout(updateHtml, 300) // 300ms debounce
    }
  }, [markdownToHtml, isMarkdownHeadingPattern, isJustHashSymbol])

  // Handle input in contentEditable
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    if (isUpdatingRef.current) return

    const element = e.currentTarget
    const plainText = getPlainText(element)
    
    // Update content state immediately
    setContent(plainText)

    // Check if user just typed a space after heading pattern
    // This will trigger immediate conversion (e.g., "# " -> h1)
    const isHeadingPattern = /^#{1,6}\s/.test(plainText)
    
    // Update HTML: immediately for heading patterns, debounced for others
    updateHtmlFromMarkdown(element, plainText)

    // If this is a placeholder block, create a real block first
    if (block.id === 'placeholder') {
      const newBlock: Block = {
        id: uuidv4(),
        type: block.type,
        content: plainText,
      }
      addBlock(pageId, newBlock)
      return
    }

    updateBlock(pageId, block.id, { content: plainText })
  }, [block.id, block.type, pageId, updateBlock, addBlock, getPlainText, updateHtmlFromMarkdown])

  // Initialize HTML content from markdown
  useEffect(() => {
    if (!editableRef.current || isUpdatingRef.current) return

    const element = editableRef.current
    const currentText = getPlainText(element)
    
    // Only update if content changed externally (not from user input)
    if (currentText !== content && document.activeElement !== element) {
      isUpdatingRef.current = true
      const savedPosition = saveCursorPosition(element)
      const html = markdownToHtml(content)
      element.innerHTML = html
      
      // Restore cursor position after a brief delay
      requestAnimationFrame(() => {
        if (savedPosition && editableRef.current) {
          restoreCursorPosition(editableRef.current, savedPosition)
        }
        isUpdatingRef.current = false
      })
    }
  }, [content, markdownToHtml, getPlainText])

  // Initialize HTML on mount or when content changes externally
  useEffect(() => {
    if (!editableRef.current || isUpdatingRef.current) return

    const element = editableRef.current
    
    // Only update if element is not focused (content changed externally)
    if (document.activeElement !== element) {
      const currentText = getPlainText(element)
      
      // Only update if content actually changed
      if (currentText !== content) {
        const html = markdownToHtml(content)
        isUpdatingRef.current = true
        element.innerHTML = html
        isUpdatingRef.current = false
      }
    }
  }, [content, markdownToHtml, getPlainText])

  // Handle composition events (for IME input)
  const handleCompositionStart = useCallback(() => {
    setIsComposing(true)
  }, [])

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLDivElement>) => {
    setIsComposing(false)
    handleInput(e as any)
  }, [handleInput])

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement | HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (block.type === 'paragraph' || block.type.startsWith('heading') || block.type === 'bullet' || block.type === 'number') {
        e.preventDefault()
        
        const plainText = block.type.startsWith('heading') && inputRef.current
          ? inputRef.current.value
          : editableRef.current ? getPlainText(editableRef.current) : content

        // If this is a placeholder, first create a block with current content
        if (block.id === 'placeholder' && plainText) {
          const firstBlock: Block = {
            id: uuidv4(),
            type: block.type,
            content: plainText,
          }
          addBlock(pageId, firstBlock)
        }
        
        // Create a new empty block
        const newBlock: Block = {
          id: uuidv4(),
          type: 'paragraph',
          content: '',
        }
        addBlock(pageId, newBlock)
        setTimeout(() => {
          const nextBlock = document.querySelector(
            `[data-block-id="${newBlock.id}"]`
          ) as HTMLElement
          if (nextBlock) {
            if (nextBlock instanceof HTMLDivElement && nextBlock.contentEditable === 'true') {
              nextBlock.focus()
            } else if (nextBlock instanceof HTMLInputElement) {
              nextBlock.focus()
            }
          }
        }, 0)
      }
    } else if (e.key === 'Backspace') {
      const plainText = block.type.startsWith('heading') && inputRef.current
        ? inputRef.current.value
        : editableRef.current ? getPlainText(editableRef.current) : content

      if (plainText === '') {
        e.preventDefault()
        // Don't delete placeholder blocks
        if (block.id !== 'placeholder') {
          deleteBlock(pageId, block.id)
          // Focus previous block
          if (index > 0) {
            setTimeout(() => {
              const prevBlock = document.querySelectorAll('[data-block-id]')[index - 1] as HTMLElement
              if (prevBlock) {
                if (prevBlock instanceof HTMLDivElement && prevBlock.contentEditable === 'true') {
                  prevBlock.focus()
                } else if (prevBlock instanceof HTMLInputElement) {
                  prevBlock.focus()
                }
              }
            }, 0)
          }
        }
      }
    } else if (e.key === '/' && content === '') {
      e.preventDefault()
      setShowMenu(true)
    }
  }, [block.id, block.type, content, pageId, index, addBlock, deleteBlock, getPlainText])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    if (block.id === 'placeholder') {
      const newBlock: Block = {
        id: uuidv4(),
        type: block.type,
        content: newContent,
      }
      addBlock(pageId, newBlock)
      return
    }
    updateBlock(pageId, block.id, { content: newContent })
  }, [block.id, block.type, pageId, addBlock, updateBlock])

  const handleTypeChange = useCallback((newType: Block['type']) => {
    updateBlock(pageId, block.id, { type: newType })
    setShowMenu(false)
    setTimeout(() => {
      if (newType.startsWith('heading')) {
        inputRef.current?.focus()
      } else {
        editableRef.current?.focus()
      }
    }, 0)
  }, [pageId, block.id, updateBlock])

  const handleBlur = useCallback(() => {
    setShowMenu(false)
    
    // Update HTML immediately on blur to show final formatted result
    if (editableRef.current && !isUpdatingRef.current) {
      const element = editableRef.current
      const plainText = getPlainText(element)
      
      // Clear any pending debounced update
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      
      const savedPosition = saveCursorPosition(element)
      const html = markdownToHtml(plainText)
      
      isUpdatingRef.current = true
      element.innerHTML = html
      
      requestAnimationFrame(() => {
        if (savedPosition && editableRef.current) {
          restoreCursorPosition(editableRef.current, savedPosition)
        }
        isUpdatingRef.current = false
      })
    }
  }, [getPlainText, markdownToHtml])

  const getPlaceholder = useCallback(() => {
    switch (block.type) {
      case 'heading1':
        return 'Heading 1'
      case 'heading2':
        return 'Heading 2'
      case 'heading3':
        return 'Heading 3'
      case 'bullet':
        return 'List item'
      case 'number':
        return 'List item'
      default:
        return 'Type "/" for commands'
    }
  }, [block.type])

  const renderContent = () => {
    // For headings, always use input (not markdown)
    if (block.type === 'heading1' || block.type === 'heading2' || block.type === 'heading3') {
      return (
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={getPlaceholder()}
          className={`${styles.input} ${
            block.type === 'heading1' ? styles.heading1 :
            block.type === 'heading2' ? styles.heading2 :
            styles.heading3
          }`}
          data-block-id={block.id}
        />
      )
    }

    // For paragraph and list items, use contentEditable
    return (
      <div className={styles.paragraphContainer}>
        {block.type === 'bullet' && <span className={styles.bullet}>•</span>}
        {block.type === 'number' && <span className={styles.number}>{index + 1}.</span>}
        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          data-block-id={block.id}
          className={styles.contentEditable}
          data-placeholder={getPlaceholder()}
        />
      </div>
    )
  }

  return (
    <div className={styles.block}>
      {showMenu && (
        <div className={styles.menu}>
          <div className={styles.menuItem} onClick={() => handleTypeChange('heading1')}>
            <span className={styles.menuIcon}>H1</span>
            <span>Heading 1</span>
          </div>
          <div className={styles.menuItem} onClick={() => handleTypeChange('heading2')}>
            <span className={styles.menuIcon}>H2</span>
            <span>Heading 2</span>
          </div>
          <div className={styles.menuItem} onClick={() => handleTypeChange('heading3')}>
            <span className={styles.menuIcon}>H3</span>
            <span>Heading 3</span>
          </div>
          <div className={styles.menuItem} onClick={() => handleTypeChange('paragraph')}>
            <span className={styles.menuIcon}>¶</span>
            <span>Paragraph</span>
          </div>
          <div className={styles.menuItem} onClick={() => handleTypeChange('bullet')}>
            <span className={styles.menuIcon}>•</span>
            <span>Bullet List</span>
          </div>
          <div className={styles.menuItem} onClick={() => handleTypeChange('number')}>
            <span className={styles.menuIcon}>1.</span>
            <span>Numbered List</span>
          </div>
        </div>
      )}
      {renderContent()}
    </div>
  )
}
