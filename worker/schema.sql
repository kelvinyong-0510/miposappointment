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

-- Per-day-of-week slot configuration (per-team capacity, enable/disable).
-- day_of_week: 0=Sun … 6=Sat. Hours: Mon–Fri 9:30–4:30 (lunch 12–2 excluded),
-- Sat 10:00–12:30, Sun closed.
CREATE TABLE IF NOT EXISTS slots (
    day_of_week  INTEGER NOT NULL,           -- 0=Sun … 6=Sat
    time         TEXT    NOT NULL,           -- "10:00 AM"
    sort_order   INTEGER NOT NULL,           -- HHMM 24h, for ordering
    pos_capacity INTEGER NOT NULL DEFAULT 1, -- POS team seats per slot
    cs_capacity  INTEGER NOT NULL DEFAULT 2, -- CS team seats per slot
    active       INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (day_of_week, time)
);

-- Mon–Fri (1–5): 10:00–11:30 and 2:00–4:30.
INSERT OR IGNORE INTO slots (day_of_week, time, sort_order, pos_capacity, cs_capacity, active)
  SELECT d.day, t.time, t.sort_order, 1, 2, 1
  FROM (SELECT 1 AS day UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) d
  JOIN (
    SELECT '10:00 AM' time, 1000 sort_order UNION ALL SELECT '10:30 AM',1030 UNION ALL
    SELECT '11:00 AM',1100 UNION ALL SELECT '11:30 AM',1130 UNION ALL
    SELECT '2:00 PM',1400 UNION ALL SELECT '2:30 PM',1430 UNION ALL
    SELECT '3:00 PM',1500 UNION ALL SELECT '3:30 PM',1530 UNION ALL
    SELECT '4:00 PM',1600 UNION ALL SELECT '4:30 PM',1630
  ) t;

-- Saturday (6): 10:00–12:30.
INSERT OR IGNORE INTO slots (day_of_week, time, sort_order, pos_capacity, cs_capacity, active) VALUES
 (6,'10:00 AM',1000,1,2,1),(6,'10:30 AM',1030,1,2,1),(6,'11:00 AM',1100,1,2,1),
 (6,'11:30 AM',1130,1,2,1),(6,'12:00 PM',1200,1,2,1);
-- Sunday (0): no slots.

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
