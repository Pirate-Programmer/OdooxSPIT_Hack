import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { getProductStock } from '@/lib/inventory'
import { MoveType, MoveStatus } from '@/lib/constants'
import { z } from 'zod'

const deliverySchema = z.object({
  contact: z.string().optional(),
  scheduleDate: z.string().optional(),
  moveLines: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number(),
      fromLocationId: z.string(),
    })
  ),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const delivery = await prisma.inventoryMove.findFirst({
    where: {
      id: params.id,
      moveType: MoveType.DELIVERY,
    },
    include: {
      responsible: {
        select: {
          id: true,
          loginId: true,
          name: true,
        },
      },
      moveLines: {
        include: {
          product: true,
          fromLocation: {
            include: {
              warehouse: true,
            },
          },
        },
      },
    },
  })

  if (!delivery) {
    return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
  }

  // Check stock for each line
  const stockChecks = await Promise.all(
    delivery.moveLines.map(async (line) => {
      const stock = await getProductStock(line.productId)
      return {
        productId: line.productId,
        available: stock.freeToUse,
        required: line.quantity,
        inStock: stock.freeToUse >= line.quantity,
      }
    })
  )

  return NextResponse.json({ delivery, stockChecks })
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
    const validated = deliverySchema.parse(body)

    // Get existing delivery
    const existing = await prisma.inventoryMove.findFirst({
      where: {
        id: params.id,
        moveType: MoveType.DELIVERY,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    // Only allow editing if in DRAFT status
    if (existing.status !== MoveStatus.DRAFT) {
      return NextResponse.json(
        { error: 'Can only edit deliveries in DRAFT status' },
        { status: 400 }
      )
    }

    // Check stock availability
    const stockChecks = await Promise.all(
      validated.moveLines.map(async (line) => {
        const stock = await getProductStock(line.productId)
        return {
          productId: line.productId,
          available: stock.freeToUse,
          required: line.quantity,
          inStock: stock.freeToUse >= line.quantity,
        }
      })
    )

    const allInStock = stockChecks.every((check) => check.inStock)
    const newStatus = allInStock ? MoveStatus.READY : MoveStatus.WAITING

    // Delete existing move lines and create new ones
    await prisma.inventoryMoveLine.deleteMany({
      where: { moveId: params.id },
    })

    const delivery = await prisma.inventoryMove.update({
      where: { id: params.id },
      data: {
        contact: validated.contact,
        scheduleDate: validated.scheduleDate ? new Date(validated.scheduleDate) : null,
        status: newStatus,
        moveLines: {
          create: validated.moveLines,
        },
      },
      include: {
        responsible: {
          select: {
            id: true,
            loginId: true,
            name: true,
          },
        },
        moveLines: {
          include: {
            product: true,
            fromLocation: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ delivery, stockChecks })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update delivery error:', error)
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
    const existing = await prisma.inventoryMove.findFirst({
      where: {
        id: params.id,
        moveType: MoveType.DELIVERY,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    if (existing.status !== MoveStatus.DRAFT) {
      return NextResponse.json(
        { error: 'Can only delete deliveries in DRAFT status' },
        { status: 400 }
      )
    }

    await prisma.inventoryMove.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Delivery deleted successfully' })
  } catch (error) {
    console.error('Delete delivery error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

