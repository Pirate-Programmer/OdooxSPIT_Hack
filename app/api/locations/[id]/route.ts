import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const locationSchema = z.object({
  name: z.string().min(1),
  shortCode: z.string().min(1),
  warehouseId: z.string().min(1),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const location = await prisma.location.findUnique({
    where: { id: params.id },
    include: {
      warehouse: {
        select: {
          id: true,
          name: true,
          shortCode: true,
        },
      },
    },
  })

  if (!location) {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 })
  }

  return NextResponse.json({ location })
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
    const validated = locationSchema.parse(body)

    // Check if warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: validated.warehouseId },
    })

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 400 }
      )
    }

    // Check if shortCode already exists in this warehouse (excluding current location)
    const existing = await prisma.location.findFirst({
      where: {
        warehouseId: validated.warehouseId,
        shortCode: validated.shortCode,
        NOT: { id: params.id },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Short code already exists in this warehouse' },
        { status: 400 }
      )
    }

    const location = await prisma.location.update({
      where: { id: params.id },
      data: validated,
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            shortCode: true,
          },
        },
      },
    })

    return NextResponse.json({ location })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update location error:', error)
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
    await prisma.location.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Location deleted successfully' })
  } catch (error) {
    console.error('Delete location error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

