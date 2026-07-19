# Installation Guide (start here if you're not a developer)

This walks through getting QA Portal running on your own computer first, so you can see it working before you put it on a live server. Every command below is something you copy and paste — you don't need to understand it.

## 1. Install Node.js

Node.js is the program that runs the QA Portal server.

1. Go to https://nodejs.org
2. Download the **LTS** version (the button that says "Recommended for most users")
3. Run the installer, click through with the defaults
4. Confirm it worked: open a terminal (on Windows: search for "Command Prompt" or "PowerShell"; on Mac: search for "Terminal") and type:
   ```bash
   node -v
   npm -v
   ```
   You should see two version numbers print out (e.g. `v20.11.0` and `10.2.4`). If you see "command not found", restart your computer and try again.

## 2. Install MySQL

MySQL is the database that stores everything — employees, evaluations, coaching, settings.

1. Go to https://dev.mysql.com/downloads/installer/
2. Download "MySQL Installer for Windows" (Mac users: use `brew install mysql` in Terminal, or download the macOS installer from the same site)
3. During setup, it will ask you to set a **root password** — write this down somewhere safe, you'll need it in a moment.
4. Once installed, confirm it's running:
   ```bash
   mysql -u root -p
   ```
   Enter the root password when prompted. If you see a `mysql>` prompt, it worked. Type `exit` to leave.

## 3. Get the project files

If you received a `.zip` file, unzip it anywhere on your computer (e.g. your Desktop). If you're using GitHub Copilot / VS Code, you should already have the folder open — it's called `qa-app`.

## 4. Install the project's dependencies

Open a terminal **inside the `qa-app` folder** (in VS Code: Terminal → New Terminal; it opens in the right place automatically). Then run:

```bash
npm install
```

This downloads all the code libraries the project needs. It can take a minute or two — that's normal.

## 5. Set up your configuration file

The project needs to know your database password and a few other settings. There's a template for this:

```bash
cp .env.example .env
```
(On Windows Command Prompt, use `copy .env.example .env` instead.)

Now open the new `.env` file in any text editor (or in VS Code) and fill in:
- `DB_PASSWORD` → the MySQL root password you set in step 2 (or a dedicated database user's password — see `docs/DATABASE_IMPORT.md`)
- `JWT_SECRET` and `JWT_RESET_SECRET` → replace these with any long, random string of letters and numbers (at least 32 characters). You can generate one by running:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  and pasting the result in.

Leave everything else as-is for now.

## 6. Create the database

Follow `docs/DATABASE_IMPORT.md` — it's three copy-paste commands.

## 7. Create real login passwords

```bash
npm run seed
```
This turns the sample accounts into real, working logins (all using the password `Password123!` until you change them).

## 8. Run it

```bash
npm start
```

You should see:
```
==================================================
  QA PORTAL API
  Environment : development
  Listening on: http://localhost:5000
==================================================
```

Open your browser to **http://localhost:5000** and log in with:
- Email: `admin@qaportal.test`
- Password: `Password123!`

**Change this password immediately** — go to your profile once logged in, or have another admin reset it.

## Something not working?

- `Failed to connect to MySQL` → double-check `DB_PASSWORD` in `.env` matches your MySQL root password, and that MySQL is actually running.
- `Cannot find module` → run `npm install` again from inside the `qa-app` folder.
- `Port 5000 already in use` → change `PORT=5000` in `.env` to something else, like `PORT=5050`, and restart.

If you get stuck on a specific error message, copy the exact text of the error and ask — that's usually enough to diagnose in seconds.

## Next step
Once this works locally, move on to `docs/DEPLOYMENT_HOSTINGER.md` to put it live for your team.
