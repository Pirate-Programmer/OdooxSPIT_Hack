import { prisma } from './prisma'
import { getProductStock } from './inventory'
import { MoveType, MoveStatus } from './constants'

/**
 * Automatically move WAITING deliveries to READY when stock becomes available
 */
export async function checkAndUpdateWaitingDeliveries() {
  try {
    // Get all WAITING deliveries
    const waitingDeliveries = await prisma.inventoryMove.findMany({
      where: {
        moveType: MoveType.DELIVERY,
        status: MoveStatus.WAITING,
      },
      include: {
        moveLines: true,
      },
    })

    const updatedDeliveries = []

    for (const delivery of waitingDeliveries) {
      // Check stock for each product in the delivery
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

      // If all products are in stock, move to READY
      if (allInStock) {
        await prisma.inventoryMove.update({
          where: { id: delivery.id },
          data: { status: MoveStatus.READY },
        })
        updatedDeliveries.push(delivery.id)
      }
    }

    return {
      checked: waitingDeliveries.length,
      updated: updatedDeliveries.length,
      updatedIds: updatedDeliveries,
    }
  } catch (error) {
    console.error('Error checking waiting deliveries:', error)
    throw error
  }
}

