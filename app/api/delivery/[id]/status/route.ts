import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { getProductStock } from '@/lib/inventory'
import { MoveType, MoveStatus } from '@/lib/constants'
import { z } from 'zod'

const statusSchema = z.object({
  status: z.enum(['DRAFT', 'WAITING', 'READY', 'DONE']),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { status } = statusSchema.parse(body)

    const delivery = await prisma.inventoryMove.findFirst({
      where: {
        id: params.id,
        moveType: MoveType.DELIVERY,
      },
      include: {
        moveLines: true,
      },
    })

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    // Validate status transitions
    if (delivery.status === MoveStatus.DRAFT && status !== MoveStatus.READY && status !== MoveStatus.WAITING) {
      return NextResponse.json(
        { error: 'Can only move from DRAFT to READY or WAITING' },
        { status: 400 }
      )
    }

    if (delivery.status === MoveStatus.WAITING) {
      // Allow transition to READY - check stock first
      if (status === MoveStatus.READY) {
        // Check if stock is now available
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

        const allInStock = stockChecks.every((check) => check.inStock)

        if (!allInStock) {
          return NextResponse.json(
            { 
              error: 'Stock not available for all products. Please ensure stock is available before moving to READY.', 
              stockChecks 
            },
            { status: 400 }
          )
        }
        // If all in stock, allow the transition
      } else if (status !== MoveStatus.READY) {
        return NextResponse.json(
          { error: 'Can only move from WAITING to READY' },
          { status: 400 }
        )
      }
    }

    if (delivery.status === MoveStatus.READY && status !== MoveStatus.DONE) {
      return NextResponse.json(
        { error: 'Can only move from READY to DONE' },
        { status: 400 }
      )
    }

    if (delivery.status === MoveStatus.DONE) {
      return NextResponse.json(
        { error: 'Cannot change status of completed delivery' },
        { status: 400 }
      )
    }

    // Update status
    const updated = await prisma.inventoryMove.update({
      where: { id: params.id },
      data: { status },
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

    return NextResponse.json({ delivery: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update delivery status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

