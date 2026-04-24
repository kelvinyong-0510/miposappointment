-- MIPOS D1 Database Schema
-- Run: wrangler d1 execute mipos-db --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS staff (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    username   TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    role       TEXT DEFAULT 'staff',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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
    assigned_staff    INTEGER  REFERENCES staff(id),
    quotation_no      TEXT,
    invoice_no        TEXT,
    notes             TEXT,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
    id             INTEGER  PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER  REFERENCES leads(id),
    invoice_no     TEXT,
    quotation_no   TEXT,
    amount         REAL,
    items          TEXT,
    payment_status TEXT     DEFAULT 'Pending',
    closed_date    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed default admin (password: admin123)
-- SHA-256 of "admin123" = 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
INSERT OR IGNORE INTO staff (name, username, password, role)
VALUES ('Admin', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin');
