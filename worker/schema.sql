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
    google_event_id   TEXT,
    purposes          TEXT,                       -- JSON array of canonical purpose keys
    needs_pos         INTEGER DEFAULT 0,          -- consumes a POS-team seat
    needs_cs          INTEGER DEFAULT 0,          -- consumes a CS-team seat
    attendance        TEXT,                       -- NULL | 'attended' | 'no_show'
    source            TEXT DEFAULT 'customer',    -- 'customer' | 'admin'
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Master slot configuration (per-team capacity, enable/disable)
CREATE TABLE IF NOT EXISTS slots (
    time         TEXT    PRIMARY KEY,        -- "10:00 AM"
    sort_order   INTEGER NOT NULL,           -- HHMM 24h, for ordering
    pos_capacity INTEGER NOT NULL DEFAULT 1, -- POS team seats per slot
    cs_capacity  INTEGER NOT NULL DEFAULT 2, -- CS team seats per slot
    active       INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO slots (time, sort_order, pos_capacity, cs_capacity, active) VALUES
 ('10:00 AM', 1000, 1, 2, 1), ('10:30 AM', 1030, 1, 2, 1),
 ('11:00 AM', 1100, 1, 2, 1), ('11:30 AM', 1130, 1, 2, 1),
 ('2:00 PM',  1400, 1, 2, 1), ('2:30 PM',  1430, 1, 2, 1),
 ('3:00 PM',  1500, 1, 2, 1), ('3:30 PM',  1530, 1, 2, 1),
 ('4:00 PM',  1600, 1, 2, 1), ('4:30 PM',  1630, 1, 2, 1);

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
