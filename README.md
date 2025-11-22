# Warehouse Management System

A full-stack, responsive Warehouse/Inventory Management System built with Next.js, TypeScript, Prisma, and PostgreSQL.

## Features

### Phase 1: Database Schema & User Management
- ✅ Complete database schema with User, Warehouse, Location, Product, InventoryMove, and InventoryMoveLine
- ✅ User authentication (Sign Up, Sign In, Forgot Password)
- ✅ Password validation (8+ chars, uppercase, lowercase, special character)
- ✅ Login ID validation (6-12 characters, unique)
- ✅ Email validation (unique)

### Phase 2: Core Inventory & Operations Module
- ✅ Dashboard with statistics (Receipts to receive, Late receipts, Deliveries to deliver, Waiting deliveries, Late deliveries)
- ✅ Master Data Management (Warehouse and Location CRUD)
- ✅ Reference auto-increment system (WH/IN/00001, WH/OUT/00001, WH/ADJ/00001)
- ✅ Stock View with update capability (triggers Adjustment moves)

### Phase 3: Receipt and Delivery Workflows
- ✅ Receipts workflow (List, Form, Kanban view, Draft → Ready → Done)
- ✅ Delivery workflow (List, Form, Kanban view, Draft → Waiting → Ready → Done)
- ✅ Stock alerts for delivery (red highlighting when out of stock)
- ✅ Automatic status transitions based on stock availability

### Phase 4: Move History & Adjustments
- ✅ Move History view with color coding
  - Green rows for In-moves (Receipts)
  - Red rows for Out-moves (Deliveries)
- ✅ Search and filter by Reference, Contact, and Date range

## Tech Stack

- **Frontend:** Next.js 14 with TypeScript, React, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** SQLite (development) / PostgreSQL (production) with Prisma ORM
- **Authentication:** JWT tokens with HTTP-only cookies
- **Validation:** Zod for schema validation

## Prerequisites

- Node.js 18+ and npm/yarn
- Git

> **Quick Start**: Want to test the frontend without database setup? See [QUICK_START.md](./QUICK_START.md) for SQLite setup (no database server needed!)

## Setup Instructions

### Option 1: Quick Start with SQLite (No Database Server)

Perfect for testing the frontend! See [QUICK_START.md](./QUICK_START.md) for details.

### Option 2: Production Setup with PostgreSQL

### 1. Clone the repository

```bash
git clone <repository-url>
cd FEC_OODO
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

**For SQLite (Development):**
```env
# SQLite database (no server needed!)
DATABASE_URL="file:./dev.db"

# JWT Secret
JWT_SECRET="your-secret-key-change-this-in-production"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
```

**For PostgreSQL (Production):**
```env
# PostgreSQL database
DATABASE_URL="postgresql://user:password@localhost:5432/warehouse_db?schema=public"

# JWT Secret (change this to a secure random string in production)
JWT_SECRET="your-secret-key-change-this-in-production"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
```

**Note:** The schema is currently configured for SQLite. To use PostgreSQL, update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 4. Set up the database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Or use migrations (recommended for production)
npm run db:migrate
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The system uses the following main entities:

- **User**: Authentication and user management
- **Warehouse**: Warehouse master data
- **Location**: Storage locations within warehouses
- **Product**: Product master data
- **InventoryMove**: Receipts, Deliveries, and Adjustments
- **InventoryMoveLine**: Individual product moves
- **ReferenceCounter**: Auto-increment reference numbers

## Usage Guide

### 1. Sign Up / Sign In

- Navigate to `/signin` or `/signup`
- Create an account with a unique Login ID (6-12 chars) and email
- Password must be 8+ characters with uppercase, lowercase, and special character

### 2. Set Up Master Data

- Go to **Settings** → **Warehouses** to create warehouses
- Go to **Settings** → **Locations** to create locations within warehouses

### 3. Create Products

- Products can be created via API or you can add a Products management page
- Products are required for Receipts and Deliveries

### 4. Receipts Workflow

1. Go to **Receipts** → **New Receipt**
2. Fill in details (Receive From, Schedule Date, Warehouse, Products)
3. Status: **DRAFT** → Click **TODO** → **READY** → Click **Validate** → **DONE**
4. When status is **DONE**, stock is automatically updated

### 5. Delivery Workflow

1. Go to **Delivery** → **New Delivery**
2. Fill in details (Delivery Address, Schedule Date, Warehouse, Products)
3. System checks stock availability:
   - If stock available: Status → **READY**
   - If stock unavailable: Status → **WAITING** (red alert shown)
4. **READY** → Click **Validate** → **DONE**
5. When status is **DONE**, stock is automatically decreased

### 6. Stock Management

- View current stock in **Stock** page
- Update stock manually (creates Adjustment move in background)
- Stock calculations:
  - **On Hand**: Total stock from all DONE receipts/adjustments minus DONE deliveries
  - **Free to Use**: On Hand minus reserved stock (WAITING/READY deliveries)

### 7. Move History

- View all inventory moves in **Move History**
- Green rows = In-moves (Receipts)
- Red rows = Out-moves (Deliveries)
- Filter by Reference, Contact, or Date range

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset

### Master Data
- `GET /api/warehouses` - List warehouses
- `POST /api/warehouses` - Create warehouse
- `PUT /api/warehouses/[id]` - Update warehouse
- `DELETE /api/warehouses/[id]` - Delete warehouse
- `GET /api/locations` - List locations
- `POST /api/locations` - Create location
- `PUT /api/locations/[id]` - Update location
- `DELETE /api/locations/[id]` - Delete location
- `GET /api/products` - List products with stock
- `POST /api/products` - Create product

### Operations
- `GET /api/receipts` - List receipts
- `POST /api/receipts` - Create receipt
- `GET /api/receipts/[id]` - Get receipt
- `PUT /api/receipts/[id]` - Update receipt
- `POST /api/receipts/[id]/status` - Update receipt status
- `GET /api/delivery` - List deliveries
- `POST /api/delivery` - Create delivery
- `GET /api/delivery/[id]` - Get delivery
- `PUT /api/delivery/[id]` - Update delivery
- `POST /api/delivery/[id]/status` - Update delivery status
- `POST /api/stock/adjust` - Adjust stock (creates adjustment move)
- `GET /api/move-history` - Get move history
- `GET /api/dashboard/stats` - Get dashboard statistics

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Production Deployment

1. Set up PostgreSQL database
2. Update `.env` with production database URL and secure JWT_SECRET
3. Run migrations: `npm run db:migrate`
4. Build: `npm run build`
5. Start: `npm run start`

## Notes

- All routes except authentication require valid JWT token
- Stock calculations are real-time based on DONE moves
- Reference numbers are auto-generated and unique per warehouse/type
- Late status is calculated based on schedule date < today
- Waiting status is calculated when required stock > available stock

## License

This project is part of a hackathon submission.

