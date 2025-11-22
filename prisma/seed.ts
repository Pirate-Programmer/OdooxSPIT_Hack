import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default user
  const hashedPassword = await bcrypt.hash('Admin@123', 10)
  const user = await prisma.user.upsert({
    where: { loginId: 'admin' },
    update: {},
    create: {
      loginId: 'admin',
      email: 'admin@warehouse.com',
      password: hashedPassword,
      name: 'Admin User',
    },
  })
  console.log('✅ Created user:', user.loginId)

  // Create sample warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { shortCode: 'WH' },
    update: {},
    create: {
      name: 'Main Warehouse',
      shortCode: 'WH',
      address: '123 Warehouse Street, City, Country',
    },
  })
  console.log('✅ Created warehouse:', warehouse.name)

  // Create sample locations
  const location1 = await prisma.location.upsert({
    where: {
      warehouseId_shortCode: {
        warehouseId: warehouse.id,
        shortCode: 'LOC1',
      },
    },
    update: {},
    create: {
      name: 'Location 1',
      shortCode: 'LOC1',
      warehouseId: warehouse.id,
    },
  })

  const location2 = await prisma.location.upsert({
    where: {
      warehouseId_shortCode: {
        warehouseId: warehouse.id,
        shortCode: 'LOC2',
      },
    },
    update: {},
    create: {
      name: 'Location 2',
      shortCode: 'LOC2',
      warehouseId: warehouse.id,
    },
  })
  console.log('✅ Created locations')

  // Create sample products (check if they exist first)
  const existingProducts = await prisma.product.findMany({
    where: {
      name: { in: ['Product A', 'Product B', 'Product C'] },
    },
  })

  if (existingProducts.length === 0) {
    await prisma.product.createMany({
      data: [
        {
          name: 'Product A',
          description: 'Sample Product A',
          perUnitCost: 10.50,
        },
        {
          name: 'Product B',
          description: 'Sample Product B',
          perUnitCost: 25.00,
        },
        {
          name: 'Product C',
          description: 'Sample Product C',
          perUnitCost: 15.75,
        },
      ],
    })
    console.log('✅ Created products')
  } else {
    console.log('✅ Products already exist')
  }

  console.log('\n🎉 Seeding completed!')
  console.log('\n📝 Login Credentials:')
  console.log('   Login ID: admin')
  console.log('   Password: Admin@123')
  console.log('\n✨ You can now login and start testing!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

