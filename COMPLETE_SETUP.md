# 🚀 Complete Setup Guide - Warehouse Management System

## ✅ All Issues Fixed!

I've fixed the SQLite compatibility issues. The system is now ready to run!

---

## 📋 Step-by-Step Setup Instructions

### Step 1: Install Dependencies

Open terminal in the project folder and run:

```bash
npm install
```

**Wait for:** "added XXX packages" message

---

### Step 2: Create Environment File

Create a file named `.env` in the root directory.

**Windows (PowerShell):**
```powershell
echo 'DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-key-12345"
NEXTAUTH_URL="http://localhost:3000"' > .env
```

**Windows (Command Prompt):**
```cmd
copy con .env
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-key-12345"
NEXTAUTH_URL="http://localhost:3000"
(Press Ctrl+Z then Enter)
```

**Mac/Linux:**
```bash
cat > .env << EOF
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-key-12345"
NEXTAUTH_URL="http://localhost:3000"
EOF
```

**Or manually:** Create `.env` file and paste:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-key-12345"
NEXTAUTH_URL="http://localhost:3000"
```

---

### Step 3: Generate Prisma Client

```bash
npm run db:generate
```

**Expected output:**
```
✔ Generated Prisma Client
```

---

### Step 4: Create Database

```bash
npm run db:push
```

**Expected output:**
```
✔ Your database is now in sync with your schema.
```

This creates `dev.db` file in your project root.

---

### Step 5: Seed Database (Create Admin User)

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
```

---

### Step 6: Start Server

```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
```

---

### Step 7: Open Browser

Go to: **http://localhost:3000**

---

### Step 8: Login

**Credentials:**
- **Login ID:** `admin`
- **Password:** `Admin@123`

Click "Sign in" button.

---

## 🎉 You're Done!

You should now see the Dashboard. You can:

- ✅ View Dashboard statistics
- ✅ Check Stock levels
- ✅ Create Receipts
- ✅ Create Deliveries
- ✅ View Move History
- ✅ Manage Warehouses & Locations in Settings

---

## 🔧 Troubleshooting

### Error: "DATABASE_URL not found"

**Solution:**
1. Check `.env` file exists in root directory
2. Make sure it contains: `DATABASE_URL="file:./dev.db"`
3. No extra spaces or quotes around the entire line

### Error: "Prisma Client not initialized"

**Solution:**
Run these commands in order:
```bash
npm run db:generate
npm run db:push
```

### Error: "Cannot find module '@prisma/client'"

**Solution:**
```bash
npm install
npm run db:generate
```

### Error: "Port 3000 already in use"

**Solution:**
- Close other applications using port 3000
- Or kill the process: `npx kill-port 3000`

### Database file not created

**Solution:**
1. Make sure you ran `npm run db:push`
2. Check you have write permissions
3. Look for `dev.db` in project root

### Seed script fails

**Solution:**
1. Make sure database is created first: `npm run db:push`
2. Then run: `npm run db:seed`

---

## 📁 Project Structure

After setup:
```
FEC_OODO/
├── .env              ← Environment variables (you created this)
├── dev.db            ← SQLite database (auto-created)
├── node_modules/     ← Dependencies
├── prisma/
│   ├── schema.prisma ← Database schema
│   └── seed.ts       ← Seed script
├── app/              ← Next.js pages
├── lib/              ← Utilities (constants, auth, etc.)
└── components/       ← React components
```

---

## 🎯 Quick Command Reference

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Create database
npm run db:push

# Add sample data
npm run db:seed

# Start development server
npm run dev

# View database (optional)
npm run db:studio
```

---

## 📝 What Was Fixed

1. ✅ **SQLite Compatibility** - Converted enums to strings (SQLite doesn't support enums)
2. ✅ **Constants File** - Created `lib/constants.ts` for MoveType and MoveStatus
3. ✅ **Updated All Imports** - Changed from `@prisma/client` to `@/lib/constants`
4. ✅ **Schema Updated** - Prisma schema now works with SQLite
5. ✅ **Seed Script** - Creates admin user and sample data automatically

---

## 🆘 Still Having Issues?

1. **Delete and start fresh:**
   ```bash
   # Delete database
   rm dev.db
   # Or on Windows: del dev.db
   
   # Recreate
   npm run db:push
   npm run db:seed
   ```

2. **Check Node.js version:**
   ```bash
   node --version
   # Should be 18 or higher
   ```

3. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules
   npm install
   ```

---

## ✨ Next Steps After Login

1. **Explore Dashboard** - See overview statistics
2. **View Stock** - Check inventory levels
3. **Create Receipt** - Go to Receipts → New Receipt
4. **Create Delivery** - Go to Delivery → New Delivery
5. **View History** - See all moves in Move History
6. **Settings** - Add more warehouses/locations

---

## 🎊 Success Checklist

- [ ] `npm install` completed
- [ ] `.env` file created with correct values
- [ ] `npm run db:generate` successful
- [ ] `npm run db:push` successful (dev.db created)
- [ ] `npm run db:seed` successful (admin user created)
- [ ] `npm run dev` running
- [ ] Can access http://localhost:3000
- [ ] Can login with admin/Admin@123

**If all checked ✅, you're ready to go!**

---

## 📞 Need Help?

If you encounter any errors:
1. Read the error message carefully
2. Check the troubleshooting section above
3. Make sure all steps were completed in order
4. Verify `.env` file exists and has correct content

**Common Issues:**
- Missing `.env` file → Create it with the content above
- Database not created → Run `npm run db:push`
- Can't login → Run `npm run db:seed` to create admin user
- Port in use → Close other apps or change port

---

**Happy Coding! 🚀**

