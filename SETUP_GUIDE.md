# Complete Setup Guide - Step by Step

Follow these steps exactly to get your Warehouse Management System up and running.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A code editor (VS Code recommended)

## Step 1: Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all required packages including Next.js, Prisma, React, and other dependencies.

**Expected time:** 2-3 minutes

---

## Step 2: Create Environment File

Create a file named `.env` in the root directory (same level as `package.json`).

**On Windows (PowerShell):**
```powershell
New-Item -Path .env -ItemType File
```

**On Mac/Linux:**
```bash
touch .env
```

Then open `.env` and add the following content:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-this-in-production-12345"
NEXTAUTH_URL="http://localhost:3000"
```

**Important:** 
- The `DATABASE_URL` uses SQLite (file-based database, no server needed)
- The `JWT_SECRET` can be any random string (change it in production)
- Save the file after adding these lines

---

## Step 3: Generate Prisma Client

Run this command to generate the Prisma client:

```bash
npm run db:generate
```

**Expected output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
✔ Generated Prisma Client
```

**If you see errors:**
- Make sure `.env` file exists and has `DATABASE_URL`
- Check that you're in the project root directory

---

## Step 4: Create Database and Tables

Run this command to create the database file and all tables:

```bash
npm run db:push
```

**Expected output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": SQLite database "dev.db" at "file:./dev.db"

✔ Generated Prisma Client

The following models have been created:
- User
- Warehouse
- Location
- Product
- InventoryMove
- InventoryMoveLine
- ReferenceCounter

✔ Your database is now in sync with your schema.
```

**What happened:**
- Created `dev.db` file in your project root
- Created all database tables
- No PostgreSQL server needed!

---

## Step 5: Seed Database with Sample Data

Run this command to add a default user and sample data:

```bash
npm run db:seed
```

**Expected output:**
```
🌱 Seeding database...
✅ Created user: admin
✅ Created warehouse: Main Warehouse
✅ Created locations
✅ Created products

🎉 Seeding completed!

📝 Login Credentials:
   Login ID: admin
   Password: Admin@123

✨ You can now login and start testing!
```

**What was created:**
- Admin user (login: `admin`, password: `Admin@123`)
- Sample warehouse (Main Warehouse - WH)
- Sample locations (Location 1, Location 2)
- Sample products (Product A, B, C)

---

## Step 6: Start the Development Server

Run this command:

```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
- Ready in 2.5s
```

**If you see errors:**
- Make sure ports 3000 is not in use
- Check that all previous steps completed successfully

---

## Step 7: Open in Browser

Open your web browser and go to:

**http://localhost:3000**

You should see the login page!

---

## Step 8: Login

Use these credentials to login:

- **Login ID:** `admin`
- **Password:** `Admin@123`

Click "Sign in" and you'll be redirected to the Dashboard!

---

## Troubleshooting

### Error: "DATABASE_URL not found"
- Make sure `.env` file exists in the root directory
- Check that the file contains `DATABASE_URL="file:./dev.db"`
- No quotes around the entire value, just the path

### Error: "Prisma Client not initialized"
- Run `npm run db:generate` first
- Then run `npm run db:push`
- Then try again

### Error: "Cannot find module"
- Run `npm install` again
- Delete `node_modules` folder and run `npm install` fresh

### Error: "Port 3000 already in use"
- Close other applications using port 3000
- Or change the port in `package.json` scripts

### Database file not created
- Make sure you ran `npm run db:push`
- Check that you have write permissions in the project directory
- Look for `dev.db` file in the project root

---

## What's Next?

After logging in, you can:

1. **Explore Dashboard** - See statistics and overview
2. **View Stock** - Check current inventory levels
3. **Create Receipts** - Go to Receipts → New Receipt
4. **Create Deliveries** - Go to Delivery → New Delivery
5. **View Move History** - See all inventory transactions
6. **Manage Settings** - Add warehouses and locations

---

## File Structure

After setup, your project should have:

```
FEC_OODO/
├── .env                    ← Your environment variables
├── dev.db                  ← SQLite database (created automatically)
├── node_modules/          ← Dependencies
├── prisma/
│   ├── schema.prisma      ← Database schema
│   └── seed.ts            ← Seed script
├── app/                    ← Next.js pages
├── lib/                    ← Utility functions
├── components/            ← React components
└── package.json           ← Project config
```

---

## Need Help?

If you encounter any issues:

1. Check the error message carefully
2. Make sure all steps were completed in order
3. Verify `.env` file exists and has correct content
4. Try deleting `dev.db` and running `npm run db:push` again
5. Check that Node.js version is 18+

---

## Success Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with correct values
- [ ] Prisma client generated (`npm run db:generate`)
- [ ] Database created (`npm run db:push`)
- [ ] Sample data seeded (`npm run db:seed`)
- [ ] Server running (`npm run dev`)
- [ ] Can access http://localhost:3000
- [ ] Can login with admin/Admin@123

If all checkboxes are done, you're ready to go! 🎉

