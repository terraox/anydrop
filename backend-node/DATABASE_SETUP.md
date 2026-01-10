# Database Setup Guide

## Current Issue

The error `role "anydrop_user" does not exist` means the database user doesn't exist in your PostgreSQL database.

## Solutions

### Option 1: Check Render.com Database (If using Render)

1. Go to your Render.com dashboard
2. Find your PostgreSQL database
3. Check the **Internal Database URL** or **Connection String**
4. The username in the connection string is your actual database user
5. Update `backend-node/.env` with the correct username

Example connection string format:
```
postgresql://username:password@host:port/database
```

### Option 2: Create the Database User

If you have admin access to the database, create the user:

```sql
CREATE USER anydrop_user WITH PASSWORD '5dobE9KCQMyyUQf2kprNjrRzDjlk5vuE';
GRANT ALL PRIVILEGES ON DATABASE anydrop TO anydrop_user;
```

### Option 3: Use Local PostgreSQL (For Development)

1. Install PostgreSQL locally:
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Create database and user
   createdb anydrop
   psql anydrop
   CREATE USER anydrop_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE anydrop TO anydrop_user;
   ```

2. Update `backend-node/.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=anydrop
   DB_USER=anydrop_user
   DB_PASSWORD=your_password
   DB_SSL=false
   ```

### Option 4: Use Default PostgreSQL User

If you're using local PostgreSQL with default setup:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anydrop
DB_USER=postgres  # or your system username
DB_PASSWORD=your_postgres_password
DB_SSL=false
```

## Verify Connection

After updating `.env`, test the connection:

```bash
cd backend-node
npm run dev
```

You should see:
```
✅ Database connection established
✅ Database models synced
```

## Troubleshooting

- **"Connection refused"**: PostgreSQL is not running
- **"Authentication failed"**: Wrong password
- **"Database does not exist"**: Create the database first
- **"Role does not exist"**: Create the user or use existing user
