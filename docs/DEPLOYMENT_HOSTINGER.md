# Deploying to Hostinger (step by step)

This assumes you have a Hostinger plan that includes **Node.js hosting** (their "Business" or higher shared hosting plans, or a VPS). Menu names occasionally move around in Hostinger's control panel (hPanel) — if something below doesn't match exactly what you see, look for the closest equivalent; the underlying steps don't change.

## 1. Create the MySQL database in hPanel

1. Log in to **hPanel** → go to **Databases → MySQL Databases**.
2. Click **Create New Database**. Note down the database name, username, and password Hostinger gives you — you'll need all three.
3. Under **Remote MySQL** (same section), you generally don't need to enable remote access — the Node app and the database both live on Hostinger's servers.

## 2. Import the schema

1. In hPanel, open **phpMyAdmin** (Databases → phpMyAdmin), and select the database you just created.
2. Click the **Import** tab.
3. Choose the file `database/schema.sql` from this project.
4. Click **Go**. You should see a success message and 8 new tables appear on the left.

## 3. Upload the project files

**Easiest option — File Manager:**
1. On your computer, zip the entire `qa-app` folder (excluding `node_modules` — you don't need to upload that, Hostinger installs it for you).
2. hPanel → **Files → File Manager**, navigate to your Node.js app's root folder (Hostinger creates one when you set up the Node app in step 4).
3. Upload the zip and use "Extract" to unzip it there.

**Alternative — Git:** if you're comfortable with Git and have pushed this project to GitHub/GitLab, hPanel → **Website → Git** lets you deploy directly from a repository, which makes future updates a one-click "pull" instead of re-uploading files.

## 4. Set up the Node.js application

1. hPanel → **Advanced → Node.js**.
2. Click **Create Application**.
3. **Application root**: point it at the folder where you uploaded the project (or where Git deployed it).
4. **Application startup file**: `server/server.js`
5. **Node.js version**: choose 18 or newer.
6. Click **Create**.

## 5. Set your environment variables

Still in the Node.js application settings, find **Environment Variables** and add each of these (values come from step 1 for the DB_* ones):

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | (leave as whatever Hostinger auto-assigns, or the port it shows you) |
| `DB_HOST` | usually `localhost` on Hostinger — check the DB creation screen for the exact host |
| `DB_USER` | the database username from step 1 |
| `DB_PASSWORD` | the database password from step 1 |
| `DB_NAME` | the database name from step 1 |
| `JWT_SECRET` | a long random string — generate one locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_RESET_SECRET` | a **different** long random string, same method |
| `CLIENT_URL` / `APP_URL` | your domain, e.g. `https://qa.yourcompany.com` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | from Hostinger's **Emails** section if you want password-reset emails to actually send — otherwise the app still works, it just prints the reset link to the server log instead of emailing it |

## 6. Install dependencies and seed the database

Most Hostinger Node.js panels have a **Run NPM Install** button — click it. Then open the **Terminal** / **SSH** access from hPanel (or the "Run command" box some panels provide) and run:

```bash
npm run seed
```

This is the step that turns the sample accounts into real, working logins.

## 7. Start the application

Back in the Node.js application page, click **Restart** (or **Start**). Check the **Logs** panel — you're looking for:
```
QA PORTAL API
Listening on: http://localhost:<port>
```
and a line confirming the MySQL connection pool was established. If you instead see a database connection error, double check the `DB_*` environment variables against what phpMyAdmin/hPanel shows for your database.

## 8. Connect your domain

1. hPanel → **Domains**. If you already own a domain, point it at Hostinger's nameservers (Hostinger's domain setup wizard walks you through this if it isn't already).
2. Back in **Advanced → Node.js**, there's usually a **Domain** field on your application — set it to your domain or subdomain (e.g. `qa.yourcompany.com`).
3. hPanel → **SSL** → issue a free SSL certificate for that domain (Hostinger includes free Let's Encrypt SSL). Wait a few minutes for it to activate.
4. Visit `https://yourdomain.com` — you should land on the QA Portal login page.

## 9. Create your real first admin account

Log in with the seeded account (`admin@qaportal.test` / `Password123!`), then:
1. Go to **Employees** → **Add Employee**, create yourself with the `super_admin` role and your real email.
2. Log out, log back in as yourself.
3. Go to **Employees**, find the `admin@qaportal.test` account, and either deactivate it or change its password to something only you know (nobody should be using the seeded demo account once you're live).
4. Update **Settings** with your real company name and QA pass percentage.

## Keeping it running

- Hostinger typically keeps Node apps running continuously and restarts them if they crash — but check hPanel's Node.js section periodically, especially right after deploying changes.
- Any time you upload new code, click **Restart** on the Node.js application for the change to take effect.
- Back up your database on a schedule (see `docs/DATABASE_IMPORT.md`).

## If something won't start
Check **Logs** in the Node.js application panel first — the error message there almost always says exactly what's wrong (missing environment variable, wrong DB password, etc.). If you're stuck, copy the exact error text — that's usually enough to fix quickly.
