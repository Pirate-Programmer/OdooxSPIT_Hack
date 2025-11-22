import { prisma } from './prisma'
import { MoveType } from './constants'

export async function generateReference(
  warehouseShortCode: string,
  moveType: string
): Promise<string> {
  // Find or create warehouse
  const warehouse = await prisma.warehouse.findUnique({
    where: { shortCode: warehouseShortCode },
  })

  if (!warehouse) {
    throw new Error(`Warehouse with short code ${warehouseShortCode} not found`)
  }

  // Get or create reference counter
  let counter = await prisma.referenceCounter.findUnique({
    where: {
      warehouseId_moveType: {
        warehouseId: warehouse.id,
        moveType,
      },
    },
  })

  if (!counter) {
    counter = await prisma.referenceCounter.create({
      data: {
        warehouseId: warehouse.id,
        moveType,
        lastNumber: 0,
      },
    })
  }

  // Increment and update
  const newNumber = counter.lastNumber + 1
  await prisma.referenceCounter.update({
    where: { id: counter.id },
    data: { lastNumber: newNumber },
  })

  // Format: WH/IN/00001
  const typeCode = moveType === 'RECEIPT' ? 'IN' : moveType === 'DELIVERY' ? 'OUT' : 'ADJ'
  const paddedNumber = String(newNumber).padStart(5, '0')
  return `${warehouseShortCode}/${typeCode}/${paddedNumber}`
}

