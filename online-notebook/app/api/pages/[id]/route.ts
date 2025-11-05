import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

// GET /api/pages/[id] - Get a single page
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    const page = await prisma.page.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        blocks: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!page) {
      return NextResponse.json({ error: '页面不存在' }, { status: 404 })
    }

    return NextResponse.json(page)
  } catch (error: any) {
    console.error('Error fetching page:', error)
    if (error.message === 'Unauthorized' || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }
    return NextResponse.json(
      { error: '获取页面失败', details: error.message || '未知错误' },
      { status: 500 }
    )
  }
}

// PUT /api/pages/[id] - Update a page
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { title, blocks } = body

    console.log('Update page request:', { pageId: params.id, hasTitle: title !== undefined, hasBlocks: blocks !== undefined, blocksLength: Array.isArray(blocks) ? blocks.length : 0 })

    // Check if page exists and belongs to current user
    const existingPage = await prisma.page.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingPage) {
      return NextResponse.json({ error: '页面不存在' }, { status: 404 })
    }

    // Update blocks if provided
    if (blocks !== undefined && Array.isArray(blocks)) {
      console.log('Updating blocks:', blocks.length, 'blocks')
      console.log('Sample block:', blocks[0])
      
      // Delete all existing blocks
      await prisma.block.deleteMany({
        where: { pageId: params.id },
      })

      // Validate and filter valid blocks
      const validBlocks = blocks
        .filter((block: any) => {
          // Ensure block has required fields
          if (!block) {
            console.warn('Null block filtered out')
            return false
          }
          if (!block.id || typeof block.id !== 'string') {
            console.warn('Invalid block id:', block)
            return false
          }
          if (!block.type || typeof block.type !== 'string') {
            console.warn('Invalid block type:', block)
            return false
          }
          return true
        })
        .map((block: any, index: number) => {
          // Validate UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          const blockId = String(block.id).trim()
          
          if (!uuidRegex.test(blockId)) {
            console.warn('Invalid UUID format for block id:', blockId, 'Generating new UUID')
            // If id is not a valid UUID, we'll let Prisma generate it
            // But we need to use create instead of createMany
            return null
          }

          return {
            id: blockId,
            type: String(block.type).trim(),
            content: String(block.content || '').trim(),
            order: index,
            pageId: params.id,
          }
        })
        .filter((block: any) => block !== null) as Array<{
          id: string
          type: string
          content: string
          order: number
          pageId: string
        }>

      console.log('Valid blocks to create:', validBlocks.length)

      // Create blocks if there are valid ones
      if (validBlocks.length > 0) {
        try {
          // Since we already deleted all blocks, we can use createMany
          // But we need to ensure all IDs are unique
          const uniqueBlocks = validBlocks.filter((block, index, self) =>
            index === self.findIndex((b) => b.id === block.id)
          )
          
          if (uniqueBlocks.length !== validBlocks.length) {
            console.warn('Duplicate block IDs found, filtering duplicates')
          }

          await prisma.block.createMany({
            data: uniqueBlocks,
            skipDuplicates: true, // Skip duplicates just in case
          })
          console.log(`Blocks created successfully: ${uniqueBlocks.length} blocks`)
        } catch (blockError: any) {
          console.error('Error creating blocks:', blockError)
          console.error('Error code:', blockError.code)
          console.error('Error message:', blockError.message)
          console.error('Error meta:', blockError.meta)
          console.error('Sample block data:', validBlocks[0])
          console.error('All block IDs:', validBlocks.map(b => b.id))
          throw new Error(`Failed to create blocks: ${blockError.message || 'Unknown error'}`)
        }
      } else {
        console.log('No valid blocks to create, all blocks deleted')
      }
    }

    // Prepare update data
    const updateData: { title?: string } = {}
    if (title !== undefined && title !== null) {
      updateData.title = title
    }

    console.log('Update data:', updateData)

    // Always fetch the page with blocks after update
    let page = await prisma.page.findUnique({
      where: { id: params.id },
      include: {
        blocks: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!page) {
      return NextResponse.json({ error: '页面不存在' }, { status: 404 })
    }

    // Update title if provided
    if (Object.keys(updateData).length > 0) {
      page = await prisma.page.update({
        where: { id: params.id },
        data: updateData,
        include: {
          blocks: {
            orderBy: { order: 'asc' },
          },
        },
      })
      console.log('Page title updated')
    }

    console.log('Page updated successfully, blocks count:', page.blocks.length)

    return NextResponse.json(page)
  } catch (error: any) {
    console.error('Error updating page:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta,
    })
    
    if (error.message === 'Unauthorized' || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: '用户不存在，请重新登录' },
        { status: 401 }
      )
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: '数据冲突，请刷新页面后重试' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { 
        error: '更新页面失败', 
        details: error.message || '未知错误',
        code: error.code || 'UNKNOWN',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/pages/[id] - Delete a page
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    // Check if page exists and belongs to current user
    const existingPage = await prisma.page.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingPage) {
      return NextResponse.json({ error: '页面不存在' }, { status: 404 })
    }

    // Delete page (blocks will be cascade deleted)
    await prisma.page.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting page:', error)
    if (error.message === 'Unauthorized' || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }
    return NextResponse.json(
      { error: '删除页面失败', details: error.message || '未知错误' },
      { status: 500 }
    )
  }
}

