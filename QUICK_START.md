# Quick Start Guide (No Database Setup Required!)

Want to check out the frontend without setting up PostgreSQL? Use SQLite instead - it's already configured!

## Quick Setup (5 minutes)

### 1. Install dependencies
```bash
npm install
```

### 2. Create `.env` file
Create a `.env` file in the root directory with:
```env
# SQLite database (no server needed!)
DATABASE_URL="file:./dev.db"

# JWT Secret (any random string)
JWT_SECRET="dev-secret-key-12345"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Set up the database
```bash
# Generate Prisma Client
npm run db:generate

# Create database and tables (creates dev.db file)
npm run db:push

# Seed database with sample data (creates default user and sample data)
npm run db:seed
```

### 4. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you're ready to go! 🎉

## Login Credentials

After running the seed script, you can login with:

- **Login ID:** `admin`
- **Password:** `Admin@123`

Or you can create a new account by clicking "Sign up" on the login page.

## What's Included in Seed Data

The seed script creates:
- ✅ Default admin user (login: `admin`, password: `Admin@123`)
- ✅ Sample warehouse (Main Warehouse - WH)
- ✅ Sample locations (Location 1, Location 2)
- ✅ Sample products (Product A, B, C)

## First Steps After Login

1. **Explore Dashboard**: See the statistics overview
2. **Check Stock**: View current stock levels
3. **Create Receipt**: Go to Receipts → New Receipt
4. **Create Delivery**: Go to Delivery → New Delivery
5. **View History**: Check Move History to see all transactions

## Switching to PostgreSQL Later

When you're ready to use PostgreSQL in production:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `.env` with your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/warehouse_db?schema=public"
   ```

3. Run migrations:
   ```bash
   npm run db:push
   ```

That's it! The database file (`dev.db`) will be created automatically in your project root.

