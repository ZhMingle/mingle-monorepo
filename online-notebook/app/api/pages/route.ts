import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

// GET /api/pages - Get all pages for current user
export async function GET() {
  try {
    const user = await requireAuth()

    const pages = await prisma.page.findMany({
      where: { userId: user.id },
      include: {
        blocks: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(pages)
  } catch (error: any) {
    console.error('Error fetching pages:', error)
    if (error.message === 'Unauthorized' || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }
    return NextResponse.json(
      { error: '获取页面失败', details: error.message || '未知错误' },
      { status: 500 }
    )
  }
}

// POST /api/pages - Create a new page
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { title } = body

    const page = await prisma.page.create({
      data: {
        title: title || '未命名页面',
        userId: user.id,
      },
      include: {
        blocks: true,
      },
    })

    return NextResponse.json(page, { status: 201 })
  } catch (error: any) {
    console.error('Error creating page:', error)
    if (error.message === 'Unauthorized' || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }
    // Handle foreign key constraint error
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: '用户不存在，请重新登录' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: '创建页面失败', details: error.message || '未知错误' },
      { status: 500 }
    )
  }
}

