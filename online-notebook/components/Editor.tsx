'use client'

import React from 'react'
import { useNotebook } from '@/contexts/NotebookContext'
import BlockComponent from './Block'
import { v4 as uuidv4 } from 'uuid'
import { Block } from '@/contexts/NotebookContext'
import styles from './Editor.module.css'

export default function Editor() {
  const { currentPage, currentPageId, updatePageTitle, addBlock, updateBlock } =
    useNotebook()

  if (!currentPage || !currentPageId) {
    return (
      <div className={styles.editor}>
        <div className={styles.empty}>暂无页面</div>
      </div>
    )
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePageTitle(currentPageId, e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const newBlock: Block = {
        id: uuidv4(),
        type: 'paragraph',
        content: '',
      }
      addBlock(currentPageId, newBlock)
      // Focus the new block after a short delay
      setTimeout(() => {
        const blockElement = document.querySelector(
          `[data-block-id="${newBlock.id}"]`
        ) as HTMLElement
        if (blockElement) {
          blockElement.focus()
        }
      }, 0)
    }
  }

  return (
    <div className={styles.editor}>
      <div className={styles.content}>
        <input
          type="text"
          className={styles.title}
          value={currentPage.title}
          onChange={handleTitleChange}
          onKeyDown={handleKeyDown}
          placeholder="无标题"
        />
        <div className={styles.blocks}>
          {currentPage.blocks.map((block, index) => (
            <BlockComponent
              key={block.id}
              block={block}
              pageId={currentPageId}
              index={index}
            />
          ))}
          {currentPage.blocks.length === 0 && (
            <BlockComponent
              key="empty-block"
              block={{
                id: 'placeholder',
                type: 'paragraph',
                content: '',
              }}
              pageId={currentPageId}
              index={0}
            />
          )}
        </div>
      </div>
    </div>
  )
}

