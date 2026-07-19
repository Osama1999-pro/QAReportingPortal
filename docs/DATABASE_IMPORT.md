# Database Import Guide

QA Portal needs one MySQL database with a specific set of tables. The file `database/schema.sql` creates all of them for you, along with a few sample records so the app isn't empty on first login.

## Option A — using the command line (recommended)

```bash
# 1. Create an empty database called "qa_portal"
mysql -u root -p -e "CREATE DATABASE qa_portal CHARACTER SET utf8mb4;"

# 2. Import the schema into it
mysql -u root -p qa_portal < database/schema.sql
```
You'll be asked for your MySQL root password each time (the one from installation step 2).

That's it — this creates all 8 tables (`users`, `evaluations`, `evaluation_scorecard_items`, `coaching_sessions`, `teams`, `departments`, `settings`, `audit_logs`), the foreign key relationships between them, and a handful of sample departments/teams/employees/evaluations.

## Option B — using a visual tool (if you prefer clicking over typing)

1. Install **phpMyAdmin** (often included free with hosting, including Hostinger) or **MySQL Workbench** (free download from mysql.com).
2. Create a new, empty database named `qa_portal`.
3. Find the "Import" tab/button.
4. Choose the file `database/schema.sql` from this project.
5. Click Import/Go.

## Using a dedicated database user (recommended for anything beyond your own laptop)

Using the MySQL `root` account for the live app isn't great practice. Instead, create a limited user just for this app:

```sql
CREATE USER 'qa_portal_user'@'localhost' IDENTIFIED BY 'choose-a-strong-password-here';
GRANT ALL PRIVILEGES ON qa_portal.* TO 'qa_portal_user'@'localhost';
FLUSH PRIVILEGES;
```

Then in your `.env` file, set:
```
DB_USER=qa_portal_user
DB_PASSWORD=choose-a-strong-password-here
```

## Generating real passwords for the sample accounts

`schema.sql` inserts sample users, but their password field is a placeholder. Run this once after importing:

```bash
npm run seed
```

This hashes the real password (`Password123!` by default) with `bcrypt` and updates every sample account so you can actually log in. It's safe to run more than once.

## Verifying it worked

```bash
mysql -u root -p qa_portal -e "SHOW TABLES; SELECT COUNT(*) FROM users;"
```
You should see the 8 table names listed, and a user count of 7 or more.

## Starting fresh

If you ever want to wipe everything and start over:
```bash
mysql -u root -p -e "DROP DATABASE qa_portal;"
mysql -u root -p -e "CREATE DATABASE qa_portal CHARACTER SET utf8mb4;"
mysql -u root -p qa_portal < database/schema.sql
npm run seed
```
**Warning:** `DROP DATABASE` permanently deletes every evaluation, employee, and coaching record. Only do this on a database you're okay losing (e.g. your local testing copy) — never on your live production database without a backup first.

## Backing up your live database
Once this is live and your team is using it, back it up regularly:
```bash
mysqldump -u root -p qa_portal > backup-$(date +%Y%m%d).sql
```
Most hosting providers, including Hostinger, also offer automatic scheduled backups from their control panel — worth turning on once you're live.
