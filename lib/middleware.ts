import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'

export function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  const cookie = request.cookies.get('token')
  return cookie?.value || null
}

export function requireAuth(request: NextRequest): { userId: string; loginId: string; email: string } | null {
  const token = getAuthToken(request)
  if (!token) {
    return null
  }
  const payload = verifyToken(token)
  return payload
}

export function authMiddleware(handler: (req: NextRequest, userId: string) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const auth = requireAuth(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return handler(req, auth.userId)
  }
}

