const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'mipos.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌  Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅  Connected to SQLite database:', dbPath);

    db.serialize(() => {
        // Enable WAL mode for better concurrent performance
        db.run('PRAGMA journal_mode = WAL');
        db.run('PRAGMA foreign_keys = ON');

        // ── Staff table ──────────────────────────────────────────────────────
        db.run(`
            CREATE TABLE IF NOT EXISTS staff (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                name     TEXT    NOT NULL,
                username TEXT    UNIQUE NOT NULL,
                password TEXT    NOT NULL,
                role     TEXT    DEFAULT 'staff',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // ── Leads table ──────────────────────────────────────────────────────
        db.run(`
            CREATE TABLE IF NOT EXISTS leads (
                id                INTEGER  PRIMARY KEY AUTOINCREMENT,
                name              TEXT,
                phone             TEXT     NOT NULL,
                company           TEXT,
                date              TEXT,
                time_slot         TEXT,
                purpose           TEXT,
                products_interest TEXT,
                stage             TEXT     DEFAULT 'New Lead',
                status            TEXT     DEFAULT 'Pending',
                assigned_staff    INTEGER,
                quotation_no      TEXT,
                invoice_no        TEXT,
                notes             TEXT,
                created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assigned_staff) REFERENCES staff(id)
            )
        `);

        // ── Sales table ──────────────────────────────────────────────────────
        db.run(`
            CREATE TABLE IF NOT EXISTS sales (
                id             INTEGER  PRIMARY KEY AUTOINCREMENT,
                appointment_id INTEGER,
                invoice_no     TEXT,
                quotation_no   TEXT,
                amount         REAL,
                items          TEXT,
                payment_status TEXT     DEFAULT 'Pending',
                closed_date    DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (appointment_id) REFERENCES leads(id)
            )
        `);

        // ── Seed default admin user ──────────────────────────────────────────
        db.get("SELECT id FROM staff WHERE username = 'admin'", (err, row) => {
            if (!row) {
                const crypto = require('crypto');
                const hash = crypto.createHash('sha256').update('admin123').digest('hex');
                db.run(
                    "INSERT INTO staff (name, username, password, role) VALUES (?, ?, ?, ?)",
                    ['Admin', 'admin', hash, 'admin'],
                    (err) => { if (err) console.error('Seed admin failed:', err.message); }
                );
                console.log('   Seeded default admin (admin / admin123)');
            }
        });

        // ── Migrations: add columns if they don't exist yet ──────────────────
        const migrations = [
            "ALTER TABLE leads ADD COLUMN quotation_no TEXT",
            "ALTER TABLE leads ADD COLUMN invoice_no TEXT",
            "ALTER TABLE leads ADD COLUMN notes TEXT",
            "ALTER TABLE staff ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
        ];

        migrations.forEach(sql => {
            db.run(sql, (err) => {
                // Ignore "duplicate column" errors — expected on existing DBs
                if (err && !err.message.includes('duplicate column')) {
                    console.warn('Migration warning:', err.message);
                }
            });
        });
    });
});

module.exports = db;
