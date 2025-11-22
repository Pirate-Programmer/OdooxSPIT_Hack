import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const warehouseSchema = z.object({
  name: z.string().min(1),
  shortCode: z.string().min(1),
  address: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const warehouses = await prisma.warehouse.findMany({
    include: {
      locations: true,
      _count: {
        select: { locations: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ warehouses })
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validated = warehouseSchema.parse(body)

    // Check if shortCode already exists
    const existing = await prisma.warehouse.findUnique({
      where: { shortCode: validated.shortCode },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Short code already exists' },
        { status: 400 }
      )
    }

    const warehouse = await prisma.warehouse.create({
      data: validated,
    })

    return NextResponse.json({ warehouse }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create warehouse error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

