import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { generateReference } from '@/lib/references'
import { MoveType, MoveStatus } from '@/lib/constants'
import { z } from 'zod'

const receiptSchema = z.object({
  contact: z.string().optional(),
  scheduleDate: z.string().optional(),
  warehouseShortCode: z.string(),
  moveLines: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number(),
      toLocationId: z.string(),
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

  const receipts = await prisma.inventoryMove.findMany({
    where: {
      moveType: MoveType.RECEIPT,
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
          toLocation: {
            include: {
              warehouse: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ receipts })
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validated = receiptSchema.parse(body)

    // Generate reference
    const reference = await generateReference(validated.warehouseShortCode, MoveType.RECEIPT)

    // Create receipt move
    const receipt = await prisma.inventoryMove.create({
      data: {
        reference,
        moveType: MoveType.RECEIPT,
        status: MoveStatus.DRAFT,
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
            toLocation: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ receipt }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create receipt error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

