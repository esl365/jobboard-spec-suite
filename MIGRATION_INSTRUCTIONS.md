# Database Migration Instructions

## ⚠️ Prisma CLI Unavailable

The Prisma CLI cannot download engine binaries in this environment (403 Forbidden).

## 🔧 Solution: Manual SQL Migration

A SQL migration script has been created at:
```
prisma/migrations/manual_migration.sql
```

## 📋 Migration Steps

### Option 1: Using Prisma CLI (Recommended - if you have local access)

```bash
# Run this on your local machine or server with Prisma access
npx prisma migrate dev --name add_job_enhancements_and_bookmarks
```

### Option 2: Manual SQL Execution

If Prisma CLI is not available, execute the SQL manually:

#### A. Using MySQL CLI
```bash
mysql -u your_username -p your_database < prisma/migrations/manual_migration.sql
```

#### B. Using MySQL Workbench or phpMyAdmin
1. Open the SQL file: `prisma/migrations/manual_migration.sql`
2. Copy the contents
3. Execute in your database tool

#### C. Using Node.js script
```bash
node -e "
const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'jobboard_db'
  });

  const sql = fs.readFileSync('prisma/migrations/manual_migration.sql', 'utf8');
  const statements = sql.split(';').filter(s => s.trim());

  for (const statement of statements) {
    if (statement.trim()) {
      await connection.query(statement);
      console.log('✓ Executed:', statement.substring(0, 50) + '...');
    }
  }

  await connection.end();
  console.log('\\n✅ Migration completed!');
})();
"
```

## 📝 What This Migration Does

### 1. Job Table Updates
- Adds `location` column (VARCHAR 255, nullable)
- Adds `remote` column (BOOLEAN, default false)
- Adds `skills` column (TEXT, nullable - stores JSON array)
- Creates indexes on `location` and `remote`

### 2. UserCompanyProfile Table
- Adds `logo_url` column (VARCHAR 500, nullable)

### 3. New Bookmark Table
- Creates `Bookmark` table with:
  - `id` (Primary key)
  - `userId` (Foreign key to User)
  - `jobId` (Foreign key to Job)
  - `createdAt` (Timestamp)
- Unique constraint on `userId + jobId` (prevent duplicates)
- Indexes on `userId` and `jobId`
- Cascade delete (if user or job deleted, bookmarks deleted)

## ✅ Verification

After running the migration, verify with:

```sql
-- Check Job table columns
DESCRIBE Job;

-- Check UserCompanyProfile columns
DESCRIBE UserCompanyProfile;

-- Check Bookmark table exists
DESCRIBE Bookmark;

-- Verify indexes
SHOW INDEX FROM Job WHERE Key_name IN ('Job_location_idx', 'Job_remote_idx');
SHOW INDEX FROM Bookmark;
```

## 🔄 Rollback (if needed)

If you need to rollback:

```sql
-- Remove Bookmark table
DROP TABLE IF EXISTS `Bookmark`;

-- Remove columns from Job
ALTER TABLE `Job`
  DROP COLUMN `location`,
  DROP COLUMN `remote`,
  DROP COLUMN `skills`;

-- Remove column from UserCompanyProfile
ALTER TABLE `UserCompanyProfile`
  DROP COLUMN `logo_url`;
```

## 🚀 After Migration

Once migration is complete:

1. Restart your backend server
2. Test the new features:
   - Search jobs
   - Filter by location/remote
   - Bookmark jobs
   - Share jobs
   - View enhanced job details with SEO

## 📞 Need Help?

If you encounter any issues:
1. Check database connection settings in `.env`
2. Ensure database user has ALTER TABLE privileges
3. Backup your database before running migrations
4. Check MySQL error logs for detailed error messages
