import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const locationSchema = z.object({
  name: z.string().min(1),
  shortCode: z.string().min(1),
  warehouseId: z.string().min(1),
})

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const warehouseId = request.nextUrl.searchParams.get('warehouseId')

  const locations = await prisma.location.findMany({
    where: warehouseId ? { warehouseId } : undefined,
    include: {
      warehouse: {
        select: {
          id: true,
          name: true,
          shortCode: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ locations })
}

export async function POST(request: NextRequest) {
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

    // Check if shortCode already exists in this warehouse
    const existing = await prisma.location.findUnique({
      where: {
        warehouseId_shortCode: {
          warehouseId: validated.warehouseId,
          shortCode: validated.shortCode,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Short code already exists in this warehouse' },
        { status: 400 }
      )
    }

    const location = await prisma.location.create({
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

    return NextResponse.json({ location }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create location error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

