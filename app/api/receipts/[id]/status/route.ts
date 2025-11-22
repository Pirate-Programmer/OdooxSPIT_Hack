import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
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

    const receipt = await prisma.inventoryMove.findFirst({
      where: {
        id: params.id,
        moveType: MoveType.RECEIPT,
      },
      include: {
        moveLines: true,
      },
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    // Validate status transitions
    if (receipt.status === MoveStatus.DRAFT && status !== MoveStatus.READY) {
      return NextResponse.json(
        { error: 'Can only move from DRAFT to READY' },
        { status: 400 }
      )
    }

    if (receipt.status === MoveStatus.READY && status !== MoveStatus.DONE) {
      return NextResponse.json(
        { error: 'Can only move from READY to DONE' },
        { status: 400 }
      )
    }

    if (receipt.status === MoveStatus.DONE) {
      return NextResponse.json(
        { error: 'Cannot change status of completed receipt' },
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
            toLocation: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ receipt: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update receipt status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

