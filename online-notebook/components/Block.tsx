'use client'

import React, { useRef, useEffect, useState } from 'react'
import { useNotebook, Block } from '@/contexts/NotebookContext'
import { v4 as uuidv4 } from 'uuid'
import styles from './Block.module.css'

interface BlockComponentProps {
  block: Block
  pageId: string
  index: number
}

export default function BlockComponent({ block, pageId, index }: BlockComponentProps) {
  const { updateBlock, deleteBlock, addBlock } = useNotebook()
  const [content, setContent] = useState(block.content)
  const [showMenu, setShowMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setContent(block.content)
  }, [block.content])

  // Auto-focus placeholder blocks on mount
  useEffect(() => {
    if (block.id === 'placeholder' && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [block.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    // If this is a placeholder block, create a real block first
    if (block.id === 'placeholder') {
      const newBlock: Block = {
        id: uuidv4(),
        type: block.type,
        content: newContent,
      }
      addBlock(pageId, newBlock)
      // The placeholder will be removed when Editor re-renders with the new block
      return
    }
    updateBlock(pageId, block.id, { content: newContent })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (block.type === 'paragraph' || block.type.startsWith('heading')) {
        e.preventDefault()
        // If this is a placeholder, first create a block with current content
        if (block.id === 'placeholder' && content) {
          const firstBlock: Block = {
            id: uuidv4(),
            type: block.type,
            content: content,
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
            nextBlock.focus()
          }
        }, 0)
      }
    } else if (e.key === 'Backspace' && content === '') {
      e.preventDefault()
      // Don't delete placeholder blocks
      if (block.id !== 'placeholder') {
        deleteBlock(pageId, block.id)
        // Focus previous block
        if (index > 0) {
          setTimeout(() => {
            const prevBlock = document.querySelectorAll('[data-block-id]')[index - 1] as HTMLElement
            if (prevBlock) {
              prevBlock.focus()
            }
          }, 0)
        }
      }
    } else if (e.key === 'ArrowUp' && (e.target as HTMLElement).selectionStart === 0) {
      e.preventDefault()
      if (index > 0) {
        const prevBlock = document.querySelectorAll('[data-block-id]')[index - 1] as HTMLElement
        if (prevBlock) {
          prevBlock.focus()
          if (prevBlock instanceof HTMLInputElement || prevBlock instanceof HTMLTextAreaElement) {
            prevBlock.setSelectionRange(prevBlock.value.length, prevBlock.value.length)
          }
        }
      }
    } else if (e.key === 'ArrowDown' && (e.target as HTMLElement).selectionStart === (e.target as HTMLElement).value.length) {
      e.preventDefault()
      const nextBlock = document.querySelectorAll('[data-block-id]')[index + 1] as HTMLElement
      if (nextBlock) {
        nextBlock.focus()
        if (nextBlock instanceof HTMLInputElement || nextBlock instanceof HTMLTextAreaElement) {
          nextBlock.setSelectionRange(0, 0)
        }
      }
    } else if (e.key === '/' && content === '') {
      e.preventDefault()
      setShowMenu(true)
    }
  }

  const handleTypeChange = (newType: Block['type']) => {
    updateBlock(pageId, block.id, { type: newType })
    setShowMenu(false)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  const handleBlur = () => {
    setShowMenu(false)
  }

  const getPlaceholder = () => {
    switch (block.type) {
      case 'heading1':
        return '标题 1'
      case 'heading2':
        return '标题 2'
      case 'heading3':
        return '标题 3'
      case 'bullet':
        return '列表项'
      case 'number':
        return '列表项'
      default:
        return '输入 "/" 查看命令'
    }
  }

  const renderInput = () => {
    const commonProps = {
      ref: inputRef,
      value: content,
      onChange: handleChange,
      onKeyDown: handleKeyDown,
      onBlur: handleBlur,
      placeholder: getPlaceholder(),
      className: styles.input,
      'data-block-id': block.id,
    }

    if (block.type === 'heading1') {
      return (
        <input
          {...commonProps}
          type="text"
          className={`${styles.input} ${styles.heading1}`}
        />
      )
    } else if (block.type === 'heading2') {
      return (
        <input
          {...commonProps}
          type="text"
          className={`${styles.input} ${styles.heading2}`}
        />
      )
    } else if (block.type === 'heading3') {
      return (
        <input
          {...commonProps}
          type="text"
          className={`${styles.input} ${styles.heading3}`}
        />
      )
    } else {
      return (
        <div className={styles.paragraphContainer}>
          {block.type === 'bullet' && <span className={styles.bullet}>•</span>}
          {block.type === 'number' && <span className={styles.number}>{index + 1}.</span>}
          <textarea
            {...commonProps}
            className={styles.textarea}
            rows={1}
            style={{ minHeight: '1.5em' }}
          />
        </div>
      )
    }
  }

  return (
    <div className={styles.block}>
      {showMenu && (
        <div className={styles.menu}>
          <div className={styles.menuItem} onClick={() => handleTypeChange('heading1')}>
            <span className={styles.menuIcon}>H1</span>
            <span>标题 1</span>
          </div>
          <div className={styles.menuItem} onClick={() => handleTypeChange('heading2')}>
            <span className={styles.menuIcon}>H2</span>
            <span>标题 2</span>
          </div>
          <div className={styles.menuItem} onClick={() => handleTypeChange('heading3')}>
            <span className={styles.menuIcon}>H3</span>
            <span>标题 3</span>
          </div>
          <div className={styles.menuItem} onClick={() => handleTypeChange('paragraph')}>
            <span className={styles.menuIcon}>¶</span>
            <span>段落</span>
          </div>
          <div className={styles.menuItem} onClick={() => handleTypeChange('bullet')}>
            <span className={styles.menuIcon}>•</span>
            <span>无序列表</span>
          </div>
          <div className={styles.menuItem} onClick={() => handleTypeChange('number')}>
            <span className={styles.menuIcon}>1.</span>
            <span>有序列表</span>
          </div>
        </div>
      )}
      {renderInput()}
    </div>
  )
}

