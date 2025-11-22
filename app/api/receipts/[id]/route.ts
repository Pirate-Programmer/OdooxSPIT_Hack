import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { MoveType, MoveStatus } from '@/lib/constants'
import { z } from 'zod'

const receiptSchema = z.object({
  contact: z.string().optional(),
  scheduleDate: z.string().optional(),
  moveLines: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number(),
      toLocationId: z.string(),
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

  const receipt = await prisma.inventoryMove.findFirst({
    where: {
      id: params.id,
      moveType: MoveType.RECEIPT,
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

  if (!receipt) {
    return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
  }

  return NextResponse.json({ receipt })
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
    const validated = receiptSchema.parse(body)

    // Get existing receipt
    const existing = await prisma.inventoryMove.findFirst({
      where: {
        id: params.id,
        moveType: MoveType.RECEIPT,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    // Only allow editing if in DRAFT status
    if (existing.status !== MoveStatus.DRAFT) {
      return NextResponse.json(
        { error: 'Can only edit receipts in DRAFT status' },
        { status: 400 }
      )
    }

    // Delete existing move lines and create new ones
    await prisma.inventoryMoveLine.deleteMany({
      where: { moveId: params.id },
    })

    const receipt = await prisma.inventoryMove.update({
      where: { id: params.id },
      data: {
        contact: validated.contact,
        scheduleDate: validated.scheduleDate ? new Date(validated.scheduleDate) : null,
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

    return NextResponse.json({ receipt })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update receipt error:', error)
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
        moveType: MoveType.RECEIPT,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    if (existing.status !== MoveStatus.DRAFT) {
      return NextResponse.json(
        { error: 'Can only delete receipts in DRAFT status' },
        { status: 400 }
      )
    }

    await prisma.inventoryMove.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Receipt deleted successfully' })
  } catch (error) {
    console.error('Delete receipt error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

