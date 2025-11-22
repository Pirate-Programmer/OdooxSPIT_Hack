import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, validatePassword, validateLoginId } from '@/lib/auth'
import { z } from 'zod'

const signupSchema = z.object({
  loginId: z.string().min(6).max(12),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = signupSchema.parse(body)

    // Validate login ID
    const loginIdValidation = validateLoginId(validated.loginId)
    if (!loginIdValidation.valid) {
      return NextResponse.json(
        { error: loginIdValidation.error },
        { status: 400 }
      )
    }

    // Validate password
    const passwordValidation = validatePassword(validated.password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      )
    }

    // Check if login ID already exists
    const existingLoginId = await prisma.user.findUnique({
      where: { loginId: validated.loginId },
    })
    if (existingLoginId) {
      return NextResponse.json(
        { error: 'Login ID already exists' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: validated.email },
    })
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(validated.password)
    const user = await prisma.user.create({
      data: {
        loginId: validated.loginId,
        email: validated.email,
        password: hashedPassword,
        name: validated.name,
      },
      select: {
        id: true,
        loginId: true,
        email: true,
        name: true,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

