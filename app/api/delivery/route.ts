import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { generateReference } from '@/lib/references'
import { getProductStock } from '@/lib/inventory'
import { MoveType, MoveStatus } from '@/lib/constants'
import { z } from 'zod'

const deliverySchema = z.object({
  contact: z.string().optional(),
  scheduleDate: z.string().optional(),
  warehouseShortCode: z.string(),
  moveLines: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number(),
      fromLocationId: z.string(),
    })
  ),
})

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = request.nextUrl.searchParams.get('status')
  const search = request.nextUrl.searchParams.get('search')

  const deliveries = await prisma.inventoryMove.findMany({
    where: {
      moveType: MoveType.DELIVERY,
      ...(status && status !== 'all' ? { status: status as MoveStatus } : {}),
      ...(search
        ? {
            OR: [
              { reference: { contains: search, mode: 'insensitive' } },
              { contact: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
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
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ deliveries })
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validated = deliverySchema.parse(body)

    // Check stock availability for each product
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

    // Generate reference
    const reference = await generateReference(validated.warehouseShortCode, MoveType.DELIVERY)

    // Determine initial status
    const initialStatus = allInStock ? MoveStatus.READY : MoveStatus.WAITING

    // Create delivery move
    const delivery = await prisma.inventoryMove.create({
      data: {
        reference,
        moveType: MoveType.DELIVERY,
        status: initialStatus,
        contact: validated.contact,
        scheduleDate: validated.scheduleDate ? new Date(validated.scheduleDate) : null,
        responsibleId: auth.userId,
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

    return NextResponse.json({ delivery, stockChecks }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create delivery error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

