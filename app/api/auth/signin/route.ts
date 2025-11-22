import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { z } from 'zod'

const signinSchema = z.object({
  loginId: z.string(),
  password: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = signinSchema.parse(body)

    // Find user by login ID
    const user = await prisma.user.findUnique({
      where: { loginId: validated.loginId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid Login Id or Password.' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(validated.password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid Login Id or Password.' },
        { status: 401 }
      )
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      loginId: user.loginId,
      email: user.email,
    })

    // Create response with token in cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        loginId: user.loginId,
        email: user.email,
        name: user.name,
      },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Signin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

