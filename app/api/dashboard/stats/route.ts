import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { MoveType, MoveStatus } from '@/lib/constants'
import { isBefore, startOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = startOfDay(new Date())

  // Receipts stats
  const receipts = await prisma.inventoryMove.findMany({
    where: {
      moveType: MoveType.RECEIPT,
      status: { in: [MoveStatus.READY, MoveStatus.DRAFT] },
    },
    include: {
      moveLines: true,
    },
  })

  const receiptsReady = receipts.filter((r) => r.status === MoveStatus.READY).length
  const receiptsLate = receipts.filter(
    (r) => r.scheduleDate && isBefore(startOfDay(r.scheduleDate), today)
  ).length

  // Delivery stats
  const deliveries = await prisma.inventoryMove.findMany({
    where: {
      moveType: MoveType.DELIVERY,
      status: { in: [MoveStatus.READY, MoveStatus.WAITING, MoveStatus.DRAFT] },
    },
    include: {
      moveLines: {
        include: {
          product: true,
        },
      },
    },
  })

  const deliveriesReady = deliveries.filter((d) => d.status === MoveStatus.READY).length
  const deliveriesWaiting = deliveries.filter((d) => d.status === MoveStatus.WAITING).length
  const deliveriesLate = deliveries.filter(
    (d) => d.scheduleDate && isBefore(startOfDay(d.scheduleDate), today)
  ).length

  return NextResponse.json({
    receipts: {
      toReceive: receiptsReady,
      late: receiptsLate,
    },
    deliveries: {
      toDeliver: deliveriesReady,
      waiting: deliveriesWaiting,
      late: deliveriesLate,
    },
  })
}

