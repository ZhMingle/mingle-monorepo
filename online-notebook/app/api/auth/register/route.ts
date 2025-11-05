import { NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '邮箱、密码和姓名都是必填项' },
        { status: 400 }
      )
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
    }

    // Password length validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码至少需要 6 个字符' },
        { status: 400 }
      )
    }

    await registerUser(email, password, name)

    return NextResponse.json({ success: true, message: '注册成功' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '注册失败' },
      { status: 400 }
    )
  }
}

