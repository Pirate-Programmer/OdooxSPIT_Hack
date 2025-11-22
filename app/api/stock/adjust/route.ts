import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { generateReference } from '@/lib/references'
import { checkAndUpdateWaitingDeliveries } from '@/lib/delivery-auto-ready'
import { MoveType, MoveStatus } from '@/lib/constants'
import { z } from 'zod'

const adjustSchema = z.object({
  productId: z.string(),
  locationId: z.string(),
  quantity: z.number(),
  warehouseShortCode: z.string(),
})

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validated = adjustSchema.parse(body)

    // Verify location exists and belongs to warehouse
    const location = await prisma.location.findUnique({
      where: { id: validated.locationId },
      include: { warehouse: true },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 400 })
    }

    if (location.warehouse.shortCode !== validated.warehouseShortCode) {
      return NextResponse.json(
        { error: 'Location does not belong to warehouse' },
        { status: 400 }
      )
    }

    // Generate reference
    const reference = await generateReference(validated.warehouseShortCode, MoveType.ADJUSTMENT)

    // Create adjustment move
    const move = await prisma.inventoryMove.create({
      data: {
        reference,
        moveType: MoveType.ADJUSTMENT,
        status: MoveStatus.DONE, // Adjustments are immediately done
        responsibleId: auth.userId,
        moveLines: {
          create: {
            productId: validated.productId,
            quantity: validated.quantity,
            toLocationId: validated.locationId,
          },
        },
      },
      include: {
        moveLines: {
          include: {
            product: true,
            toLocation: true,
          },
        },
      },
    })

    // Check if any WAITING deliveries can now be READY after stock adjustment
    try {
      await checkAndUpdateWaitingDeliveries()
    } catch (error) {
      console.error('Error checking waiting deliveries after stock adjustment:', error)
      // Don't fail the adjustment if this fails
    }

    return NextResponse.json({ move }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Stock adjustment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

