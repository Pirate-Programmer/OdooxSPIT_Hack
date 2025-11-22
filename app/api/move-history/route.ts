import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { MoveType } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const search = request.nextUrl.searchParams.get('search')
  const fromDate = request.nextUrl.searchParams.get('fromDate')
  const toDate = request.nextUrl.searchParams.get('toDate')

  const moveLines = await prisma.inventoryMoveLine.findMany({
    where: {
      move: {
        ...(search
          ? {
              OR: [
                { reference: { contains: search, mode: 'insensitive' } },
                { contact: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(fromDate || toDate
          ? {
              createdAt: {
                ...(fromDate ? { gte: new Date(fromDate) } : {}),
                ...(toDate ? { lte: new Date(toDate) } : {}),
              },
            }
          : {}),
      },
    },
    include: {
      move: {
        select: {
          id: true,
          reference: true,
          moveType: true,
          contact: true,
          createdAt: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
        },
      },
      fromLocation: {
        select: {
          id: true,
          name: true,
          shortCode: true,
        },
      },
      toLocation: {
        select: {
          id: true,
          name: true,
          shortCode: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return NextResponse.json({ moveLines })
}

