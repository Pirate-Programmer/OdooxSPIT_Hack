import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const warehouseSchema = z.object({
  name: z.string().min(1),
  shortCode: z.string().min(1),
  address: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const warehouse = await prisma.warehouse.findUnique({
    where: { id: params.id },
    include: { locations: true },
  })

  if (!warehouse) {
    return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
  }

  return NextResponse.json({ warehouse })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validated = warehouseSchema.parse(body)

    // Check if shortCode already exists (excluding current warehouse)
    const existing = await prisma.warehouse.findFirst({
      where: {
        shortCode: validated.shortCode,
        NOT: { id: params.id },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Short code already exists' },
        { status: 400 }
      )
    }

    const warehouse = await prisma.warehouse.update({
      where: { id: params.id },
      data: validated,
    })

    return NextResponse.json({ warehouse })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update warehouse error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.warehouse.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Warehouse deleted successfully' })
  } catch (error) {
    console.error('Delete warehouse error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

