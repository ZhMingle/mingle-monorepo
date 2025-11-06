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

  // Remove all existing ranges first to avoid duplicate cursors
  selection.removeAllRanges()

  // If element is empty, just place cursor at the start
  if (!element.textContent || element.textContent.trim() === '') {
    const range = document.createRange()
    range.selectNodeContents(element)
    range.collapse(true)
    selection.addRange(range)
    return
  }

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

  // Traverse all text nodes to find the correct position
  while (!foundEnd && (node = nodeStack.pop())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent || ''
      const nextCharCount = charCount + textContent.length
      
      if (!foundStart && position.start >= charCount && position.start <= nextCharCount) {
        foundStart = true
        startNode = node
        startOffset = Math.min(position.start - charCount, textContent.length)
      }
      if (!foundEnd && position.end >= charCount && position.end <= nextCharCount) {
        foundEnd = true
        endNode = node
        endOffset = Math.min(position.end - charCount, textContent.length)
      }
      charCount = nextCharCount
    } else {
      // Push child nodes in reverse order to maintain document order
      let i = node.childNodes.length
      while (i--) {
        nodeStack.push(node.childNodes[i])
      }
    }
  }

  // If we couldn't find the exact position, try to place cursor at the end
  if (!foundStart || !foundEnd) {
    const textNodes: Node[] = []
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    )
    let textNode
    while ((textNode = walker.nextNode())) {
      textNodes.push(textNode)
    }
    
    if (textNodes.length > 0) {
      const lastNode = textNodes[textNodes.length - 1]
      const textLength = lastNode.textContent?.length || 0
      const offset = Math.min(position.start, textLength)
      range.setStart(lastNode, offset)
      range.setEnd(lastNode, Math.min(position.end, textLength))
    } else {
      // No text nodes, place cursor at end of element
      range.selectNodeContents(element)
      range.collapse(false)
    }
  } else {
    // Use the found nodes
    if (startNode && endNode) {
      range.setStart(startNode, startOffset)
      range.setEnd(endNode, endOffset)
    } else {
      // Fallback: collapse to start position
      if (startNode) {
        range.setStart(startNode, startOffset)
        range.collapse(true)
      } else {
        range.selectNodeContents(element)
        range.collapse(false)
      }
    }
  }
  
  // Ensure only one range is set (already removed all ranges above)
  selection.addRange(range)
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
  const isDeletingRef = useRef(false)
  const lastContentRef = useRef<string>(block.content)

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

  // Get plain text from contentEditable, converting HTML back to markdown
  const getPlainText = useCallback((element: HTMLElement) => {
    // First, check if element contains only a single heading element
    const h1 = element.querySelector('h1')
    const h2 = element.querySelector('h2')
    const h3 = element.querySelector('h3')
    const h4 = element.querySelector('h4')
    const h5 = element.querySelector('h5')
    const h6 = element.querySelector('h6')
    
    // Count heading elements
    const headingCount = [h1, h2, h3, h4, h5, h6].filter(Boolean).length
    
    // If there's exactly one heading and no other block-level content, return markdown heading
    if (headingCount === 1) {
      if (h1) {
        const text = h1.textContent || ''
        return text.trim() === '' ? '# ' : `# ${text}`
      }
      if (h2) {
        const text = h2.textContent || ''
        return text.trim() === '' ? '## ' : `## ${text}`
      }
      if (h3) {
        const text = h3.textContent || ''
        return text.trim() === '' ? '### ' : `### ${text}`
      }
      if (h4) {
        const text = h4.textContent || ''
        return text.trim() === '' ? '#### ' : `#### ${text}`
      }
      if (h5) {
        const text = h5.textContent || ''
        return text.trim() === '' ? '##### ' : `##### ${text}`
      }
      if (h6) {
        const text = h6.textContent || ''
        return text.trim() === '' ? '###### ' : `###### ${text}`
      }
    }
    
    // Check if we're currently inside a heading element (for mixed content)
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      let currentNode: Node | null = range.commonAncestorContainer
      
      // Walk up to find heading element
      while (currentNode && currentNode !== element) {
        if (currentNode.nodeType === Node.ELEMENT_NODE) {
          const tagName = (currentNode as Element).tagName?.toLowerCase()
          const text = currentNode.textContent || ''
          if (tagName === 'h1') {
            return text.trim() === '' ? '# ' : `# ${text}`
          } else if (tagName === 'h2') {
            return text.trim() === '' ? '## ' : `## ${text}`
          } else if (tagName === 'h3') {
            return text.trim() === '' ? '### ' : `### ${text}`
          } else if (tagName === 'h4') {
            return text.trim() === '' ? '#### ' : `#### ${text}`
          } else if (tagName === 'h5') {
            return text.trim() === '' ? '##### ' : `##### ${text}`
          } else if (tagName === 'h6') {
            return text.trim() === '' ? '###### ' : `###### ${text}`
          }
        }
        currentNode = currentNode.parentNode
        if (!currentNode) break
      }
    }
    
    // For plain text or mixed content, use innerText
    // This handles the case when user types "# " in a plain text contentEditable
    const innerText = element.innerText || element.textContent || ''
    
    // If innerText starts with "# " and matches heading pattern, return it as-is
    if (/^#{1,6}\s/.test(innerText)) {
      return innerText
    }
    
    return innerText
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

    // Skip update if content is empty (avoid unnecessary updates for empty blocks)
    if (!plainText || plainText.trim() === '') {
      // For empty content, just set innerHTML to empty
      if (element.innerHTML !== '') {
        isUpdatingRef.current = true
        element.innerHTML = ''
        isUpdatingRef.current = false
      }
      return
    }

    console.log('updateHtmlFromMarkdown called:', { plainText, isJustHash: isJustHashSymbol(plainText), isHeadingPattern: isMarkdownHeadingPattern(plainText) })

    // If it's just "#" without space, don't convert - keep as plain text
    if (isJustHashSymbol(plainText)) {
      console.log('Just hash symbol, not converting')
      // Don't update HTML, keep the plain text "#" visible
      return
    }

    // Check if this is a markdown heading pattern with space - update immediately
    const shouldUpdateImmediately = isMarkdownHeadingPattern(plainText)
    console.log('Should update immediately:', shouldUpdateImmediately)
    
    const updateHtml = () => {
      if (isUpdatingRef.current || !editableRef.current || element !== editableRef.current) {
        console.log('Update blocked:', { isUpdating: isUpdatingRef.current, hasRef: !!editableRef.current, sameElement: element === editableRef.current })
        return
      }
      
      // Save cursor position before updating HTML
      const savedPosition = saveCursorPosition(element)
      if (!savedPosition) {
        console.log('No cursor position to save, skipping update')
        return
      }
      
      let html = markdownToHtml(plainText)
      
      console.log('Updating HTML:', { plainText, html, savedPosition })
      
      // If HTML is just an empty heading (e.g., "<h1></h1>" or "<h1></h1>\n"), keep it empty
      // This happens when user types "# " - we want to show h1 but keep it empty for placeholder
      // Trim whitespace and newlines for matching
      const trimmedHtml = html.trim()
      const emptyHeadingMatch = trimmedHtml.match(/^<(h[1-6])><\/h[1-6]>$/)
      if (emptyHeadingMatch) {
        // For "# ", we want to show "<h1></h1>" (empty) to allow placeholder to show
        // Extract the heading level
        const headingLevel = emptyHeadingMatch[1]
        // Keep it empty so placeholder can show
        html = `<${headingLevel}></${headingLevel}>`
        console.log('Empty heading detected, keeping empty for placeholder:', html)
      }
      
      // Only update if HTML actually changed
      if (element.innerHTML === html) {
        console.log('HTML unchanged, skipping update')
        return
      }
      
      isUpdatingRef.current = true
      element.innerHTML = html
      console.log('HTML updated, innerHTML:', element.innerHTML)
      
      // Update placeholder on heading elements
      const placeholder = getPlaceholder()
      const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6')
      headings.forEach((heading) => {
        heading.setAttribute('data-placeholder', placeholder)
      })
      
      // Restore cursor position - use requestAnimationFrame to ensure DOM is fully updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (savedPosition && editableRef.current && element === editableRef.current) {
            // Adjust position if needed (account for the space we added)
            // Make sure position doesn't exceed the new content length
            const newTextLength = element.textContent?.length || 0
            const adjustedPosition = {
              start: Math.min(Math.max(0, savedPosition.start), newTextLength),
              end: Math.min(Math.max(0, savedPosition.end), newTextLength)
            }
            console.log('Restoring cursor position:', adjustedPosition, 'newTextLength:', newTextLength)
            restoreCursorPosition(editableRef.current, adjustedPosition)
          }
          // Always reset the flag, even if cursor restoration fails
          isUpdatingRef.current = false
          console.log('Update complete, isUpdatingRef reset to false')
        })
      })
    }

    if (shouldUpdateImmediately) {
      // Update immediately for heading patterns with space (e.g., "# " or "# Title")
      console.log('Updating immediately for heading pattern')
      requestAnimationFrame(() => {
        updateHtml()
      })
    } else {
      // Debounce for other content
      console.log('Debouncing update')
      updateTimeoutRef.current = setTimeout(updateHtml, 300) // 300ms debounce
    }
  }, [markdownToHtml, isMarkdownHeadingPattern, isJustHashSymbol])

  // Handle input in contentEditable
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    // Don't process if we're currently updating HTML
    if (isUpdatingRef.current) {
      console.log('Input blocked: isUpdatingRef is true')
      return
    }

    // Don't process if we're in the middle of IME composition (e.g., Chinese input)
    // The compositionend event will handle the final input
    if (isComposing) {
      console.log('Input blocked: IME composition in progress')
      return
    }

    const element = e.currentTarget
    
    // Get plain text from contentEditable
    let plainText = getPlainText(element)
    
    // If getPlainText returns empty, use innerText as fallback
    // This handles the case when user types "# " in a plain text contentEditable
    if (!plainText || plainText.trim() === '') {
      const innerText = element.innerText || element.textContent || ''
      // If innerText matches heading pattern, use it
      if (/^#{1,6}\s/.test(innerText)) {
        plainText = innerText
      } else {
        plainText = innerText
      }
    }
    
    console.log('Input event:', { plainText, innerHTML: element.innerHTML, innerText: element.innerText, isDeleting: isDeletingRef.current })
    
    // Update content state immediately
    setContent(plainText)

    // If we're deleting, skip HTML update during deletion
    // This prevents cursor position issues during deletion
    // We'll update HTML after deletion is complete (handled by handleKeyDown)
    if (isDeletingRef.current) {
      // Just update the content state, but don't update HTML
      // The HTML will be updated when deletion is complete (handled by handleKeyDown)
      // This prevents cursor position issues during deletion
      // But we still need to update the content state so the server sync works
      // Don't return - let the content state update happen
      // But skip HTML update
      return
    }
    
    // Update HTML: immediately for heading patterns, debounced for others
    // Use setTimeout to ensure this runs after the current input event
    setTimeout(() => {
      if (!isUpdatingRef.current && editableRef.current === element) {
        updateHtmlFromMarkdown(element, plainText)
      }
    }, 0)

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
  }, [block.id, block.type, pageId, updateBlock, addBlock, getPlainText, updateHtmlFromMarkdown, isComposing])

  // Initialize HTML content from markdown (only when content changes externally)
  useEffect(() => {
    if (!editableRef.current || isUpdatingRef.current) return

    const element = editableRef.current
    
    // Only update if element is not focused (content changed externally, not from user input)
    if (document.activeElement !== element) {
      const currentText = getPlainText(element)
      
      // Only update if content actually changed
      if (currentText !== content) {
        // For empty content, just set innerHTML to empty
        if (!content || content.trim() === '') {
          if (element.innerHTML !== '') {
            isUpdatingRef.current = true
            element.innerHTML = ''
            isUpdatingRef.current = false
          }
          return
        }
        
        const html = markdownToHtml(content)
        // Only update if HTML actually changed
        if (element.innerHTML !== html) {
          isUpdatingRef.current = true
          element.innerHTML = html
          isUpdatingRef.current = false
        }
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
        // Use requestAnimationFrame to ensure DOM is updated before focusing
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
          const nextBlock = document.querySelector(
            `[data-block-id="${newBlock.id}"]`
          ) as HTMLElement
          if (nextBlock) {
              if (nextBlock instanceof HTMLDivElement && nextBlock.contentEditable === 'true') {
                // Clear any existing selection before focusing
                const selection = window.getSelection()
                if (selection) {
                  selection.removeAllRanges()
                }
                nextBlock.focus()
                // Place cursor at the start of the empty block
                const range = document.createRange()
                range.selectNodeContents(nextBlock)
                range.collapse(true)
                selection?.addRange(range)
              } else if (nextBlock instanceof HTMLInputElement) {
                // Clear any existing selection before focusing
                const selection = window.getSelection()
                if (selection) {
                  selection.removeAllRanges()
                }
            nextBlock.focus()
          }
            }
          })
        })
      }
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      // Mark that we're deleting
      // Clear any pending update timeout first
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
        updateTimeoutRef.current = null
      }
      isDeletingRef.current = true
      
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
        // Reset deletion flag immediately for empty content
        isDeletingRef.current = false
      } else {
        // For non-empty content, let the browser handle the deletion naturally
        // Don't prevent default - let browser handle deletion
        // Reset deletion flag after a delay to allow deletion to complete
        // Use a debounced approach: reset flag after user stops deleting
        // Each time user presses delete, reset the timeout
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current)
        }
        updateTimeoutRef.current = setTimeout(() => {
          isDeletingRef.current = false
          // Update HTML after deletion is complete
          // Don't restore cursor position - let browser handle it naturally
          if (editableRef.current && !isUpdatingRef.current) {
            const element = editableRef.current
            const newPlainText = getPlainText(element)
            
            // Check if we have an empty heading (e.g., "# " or "## ")
            // If so, remove the heading format and convert to plain text
            const emptyHeadingMatch = newPlainText.match(/^(#{1,6})\s*$/)
            if (emptyHeadingMatch) {
              // Remove heading format - convert to empty plain text
              setContent('')
              isUpdatingRef.current = true
              element.innerHTML = ''
              isUpdatingRef.current = false
              // Place cursor at the start
              requestAnimationFrame(() => {
                const selection = window.getSelection()
                if (selection && element) {
                  const range = document.createRange()
                  range.selectNodeContents(element)
                  range.collapse(true)
                  selection.removeAllRanges()
                  selection.addRange(range)
                }
              })
            } else if (newPlainText !== content) {
              setContent(newPlainText)
              // Update HTML without restoring cursor position - let browser handle cursor
              // This prevents cursor position issues after deletion
              const html = markdownToHtml(newPlainText)
              if (element.innerHTML !== html) {
                isUpdatingRef.current = true
                element.innerHTML = html
                isUpdatingRef.current = false
                // Don't restore cursor position - let browser handle it
                // This prevents cursor position issues during deletion
              }
            }
          }
        }, 500) // Longer delay to ensure deletion is complete and user has stopped deleting
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
    // But don't restore cursor position on blur - it's not needed
    if (editableRef.current && !isUpdatingRef.current) {
      const element = editableRef.current
      const plainText = getPlainText(element)
      
      // Clear any pending debounced update
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      
      const html = markdownToHtml(plainText)
      
      // Only update if HTML actually changed
      if (element.innerHTML !== html) {
        isUpdatingRef.current = true
        element.innerHTML = html
        isUpdatingRef.current = false
      }
    }
  }, [getPlainText, markdownToHtml])

  const getPlaceholder = useCallback(() => {
    // Check if current content is a heading format
    if (editableRef.current) {
      const element = editableRef.current
      const h1 = element.querySelector('h1')
      const h2 = element.querySelector('h2')
      const h3 = element.querySelector('h3')
      const h4 = element.querySelector('h4')
      const h5 = element.querySelector('h5')
      const h6 = element.querySelector('h6')
      
      if (h1) return 'Heading 1'
      if (h2) return 'Heading 2'
      if (h3) return 'Heading 3'
      if (h4) return 'Heading 4'
      if (h5) return 'Heading 5'
      if (h6) return 'Heading 6'
      
      // Check if we're inside a heading element
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        let currentNode: Node | null = range.commonAncestorContainer
        while (currentNode && currentNode !== element) {
          if (currentNode.nodeType === Node.ELEMENT_NODE) {
            const tagName = (currentNode as Element).tagName?.toLowerCase()
            if (tagName === 'h1') return 'Heading 1'
            if (tagName === 'h2') return 'Heading 2'
            if (tagName === 'h3') return 'Heading 3'
            if (tagName === 'h4') return 'Heading 4'
            if (tagName === 'h5') return 'Heading 5'
            if (tagName === 'h6') return 'Heading 6'
          }
          currentNode = currentNode.parentNode
          if (!currentNode) break
        }
      }
    }
    
    // Fallback to block.type
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
          onInput={(e) => {
            handleInput(e)
            // Update placeholder dynamically based on content
            const element = e.currentTarget
            const placeholder = getPlaceholder()
            if (element.getAttribute('data-placeholder') !== placeholder) {
              element.setAttribute('data-placeholder', placeholder)
            }
            // Also update placeholder on heading elements
            const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6')
            headings.forEach((heading) => {
              if (heading.getAttribute('data-placeholder') !== placeholder) {
                heading.setAttribute('data-placeholder', placeholder)
              }
            })
          }}
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
