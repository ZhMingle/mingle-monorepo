'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError('邮箱或密码不正确')
        } else {
          router.push('/')
          router.refresh()
        }
      } else {
        // Register
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || '注册失败')
        } else {
          // Auto login after successful registration
          const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
          })

          if (result?.error) {
            setError('注册成功，但登录失败，请手动登录')
          } else {
            router.push('/')
            router.refresh()
          }
        }
      }
    } catch (err) {
      setError('发生错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>🎾</div>
        <h1 className={styles.title}>
          {isLogin ? '登录' : '注册'}
        </h1>
        <p className={styles.subtitle}>
          {isLogin
            ? '登录到你的在线笔记'
            : '创建新账户开始使用'}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <div className={styles.field}>
              <label htmlFor="name">姓名</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入您的姓名"
                required={!isLogin}
              />
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="email">邮箱</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              minLength={isLogin ? undefined : 6}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? '处理中...' : isLogin ? '登录' : '注册'}
          </button>
        </form>

        <div className={styles.switch}>
          {isLogin ? (
            <>
              还没有账户？{' '}
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={styles.switchButton}
              >
                立即注册
              </button>
            </>
          ) : (
            <>
              已有账户？{' '}
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={styles.switchButton}
              >
                立即登录
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

