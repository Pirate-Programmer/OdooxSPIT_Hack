import { prisma } from './prisma'

export async function getProductStock(productId: string): Promise<{
  onHand: number
  reserved: number
  freeToUse: number
}> {
  // Get all move lines for this product
  const moveLines = await prisma.inventoryMoveLine.findMany({
    where: { productId },
    include: {
      move: {
        select: {
          moveType: true,
          status: true,
        },
      },
    },
  })

  let onHand = 0
  let reserved = 0

  for (const line of moveLines) {
    const { move } = line

    // Receipts and Adjustments that increase stock
    if (move.moveType === 'RECEIPT' || move.moveType === 'ADJUSTMENT') {
      if (move.status === 'DONE' && line.toLocationId) {
        onHand += line.quantity
      }
    }

    // Deliveries that decrease stock
    if (move.moveType === 'DELIVERY') {
      if (move.status === 'DONE' && line.fromLocationId) {
        onHand -= line.quantity
      } else if ((move.status === 'WAITING' || move.status === 'READY') && line.fromLocationId) {
        reserved += line.quantity
      }
    }
  }

  const freeToUse = onHand - reserved
  return { onHand, reserved, freeToUse: Math.max(0, freeToUse) }
}

export async function getAllProductsStock() {
  const products = await prisma.product.findMany({
    include: {
      moveLines: {
        include: {
          move: {
            select: {
              moveType: true,
              status: true,
            },
          },
        },
      },
    },
  })

  return Promise.all(
    products.map(async (product) => {
      const stock = await getProductStock(product.id)
      return {
        ...product,
        ...stock,
      }
    })
  )
}

