# How to Login - Quick Guide

## Option 1: Use Pre-seeded Account (Recommended)

After running the seed script, you can login with:

**Login ID:** `admin`  
**Password:** `Admin@123`

## Option 2: Create Your Own Account

1. Go to the login page (http://localhost:3000)
2. Click "Sign up" link
3. Fill in the form:
   - **Login ID**: 6-12 characters (e.g., `myuser123`)
   - **Email**: Your email address
   - **Password**: Must be 8+ characters with:
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one special character
   - **Name**: (Optional)
4. Click "Sign up"
5. You'll be redirected to the login page
6. Login with your new credentials

## Setup Steps (If you haven't done this yet)

```bash
# 1. Install dependencies
npm install

# 2. Create .env file with:
#    DATABASE_URL="file:./dev.db"
#    JWT_SECRET="dev-secret-key-12345"
#    NEXTAUTH_URL="http://localhost:3000"

# 3. Set up database
npm run db:generate
npm run db:push

# 4. Seed database (creates admin user and sample data)
npm run db:seed

# 5. Start server
npm run dev
```

## Troubleshooting

**"Invalid Login Id or Password"**
- Make sure you ran `npm run db:seed` to create the admin user
- Or create a new account using Sign Up

**"Database not found"**
- Make sure you ran `npm run db:push` first
- Check that `dev.db` file exists in your project root

**Can't run seed script**
- Make sure you've run `npm install` first
- The script uses `npx tsx` which will download automatically
