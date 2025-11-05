# Database Setup Guide

## Overview

This project uses **PostgreSQL** as the database and **Prisma ORM** for data management.

## Why PostgreSQL + Prisma?

- ✅ **Type Safety**: Prisma provides complete TypeScript type support
- ✅ **Developer Experience**: Auto-generated client, easy migration management
- ✅ **Performance**: PostgreSQL is a mature and reliable relational database
- ✅ **Ecosystem**: Perfect integration with Next.js

## Quick Start

### 1. Install PostgreSQL

#### macOS (using Homebrew)
```bash
brew install postgresql@16
brew services start postgresql@16
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows
Download and install PostgreSQL: https://www.postgresql.org/download/windows/

### 2. Create Database

```bash
# Login to PostgreSQL
psql postgres

# Create database
CREATE DATABASE notebook;

# Create user (optional)
CREATE USER notebook_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE notebook TO notebook_user;

# Exit
\q
```

### 3. Configure Environment Variables

Copy `env.example` to `.env`:

```bash
cp env.example .env
```

Edit the `.env` file and set the database connection string:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/notebook"
```

Or if you created a user:

```env
DATABASE_URL="postgresql://notebook_user:your_password@localhost:5432/notebook"
```

### 4. Run Database Migrations

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or use migrations (recommended for production)
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

## Database Management

### View Database (Prisma Studio)

```bash
npm run db:studio
```

This opens a visual interface to view and edit database data.

### Common Commands

```bash
# Generate Prisma client (must run after schema changes)
npm run db:generate

# Push schema changes to database (development)
npm run db:push

# Create and apply migrations (recommended for production)
npm run db:migrate

# Check database status
npx prisma migrate status
```

## Database Schema

The current database contains the following tables:

- **User**: User information
- **Page**: Notebook pages
- **Block**: Page content blocks

See `prisma/schema.prisma` for detailed definitions.

## Cloud Database Options

If you don't want to install PostgreSQL locally, consider:

### 1. Supabase (Recommended for free tier)
- Free tier: 500MB database space
- Includes PostgreSQL + real-time features
- Connection string format: `postgresql://user:password@host:5432/database`

### 2. Vercel Postgres (If deploying on Vercel)
- Great integration with Vercel
- Use Prisma or native SQL

### 3. Railway / Render
- Provides free PostgreSQL instances
- Simple and easy to use

### 4. Neon
- Serverless PostgreSQL
- Pay-as-you-go pricing

## Troubleshooting

### Connection Failed

1. Check if PostgreSQL is running:
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Check if the connection string format is correct

3. Check firewall settings

### Migration Failed

1. Ensure the database user has sufficient permissions
2. Check if other migrations are running
3. View Prisma logs for detailed error information

## Next Steps

- View `prisma/schema.prisma` to understand the data model
- Run `npm run db:studio` to view the database
- Check API routes to see how to use the data

