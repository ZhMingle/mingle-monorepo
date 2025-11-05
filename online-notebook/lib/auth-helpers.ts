import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const sessionUser = await getCurrentUser()
  if (!sessionUser?.id) {
    throw new Error('Unauthorized')
  }

  // Verify that user actually exists in database
  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, email: true, name: true },
  })

  if (!dbUser) {
    throw new Error('Unauthorized: User not found in database')
  }

  return dbUser
}

