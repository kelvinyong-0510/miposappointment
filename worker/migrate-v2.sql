-- MIPOS schema v2: multi-purpose, 2-department capacity, attendance, slot config
-- Run: wrangler d1 execute mipos-db --remote --file=migrate-v2.sql

-- Leads: multi-purpose + team flags + attendance + source
ALTER TABLE leads ADD COLUMN purposes   TEXT;            -- JSON array of canonical keys
ALTER TABLE leads ADD COLUMN needs_pos  INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN needs_cs   INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN attendance TEXT;            -- NULL | 'attended' | 'no_show'
ALTER TABLE leads ADD COLUMN source     TEXT DEFAULT 'customer'; -- 'customer' | 'admin'

-- Existing rows predate teams; treat them as CS occupancy so old behaviour holds.
UPDATE leads SET needs_cs = 1 WHERE COALESCE(needs_cs,0) = 0 AND COALESCE(needs_pos,0) = 0;

-- Master slot configuration (per-team capacity, enable/disable)
CREATE TABLE IF NOT EXISTS slots (
  time         TEXT    PRIMARY KEY,        -- "10:00 AM"
  sort_order   INTEGER NOT NULL,           -- HHMM 24h, for ordering
  pos_capacity INTEGER NOT NULL DEFAULT 1, -- POS team seats per slot
  cs_capacity  INTEGER NOT NULL DEFAULT 2, -- CS team seats per slot
  active       INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO slots (time, sort_order, pos_capacity, cs_capacity, active) VALUES
 ('10:00 AM', 1000, 1, 2, 1),
 ('10:30 AM', 1030, 1, 2, 1),
 ('11:00 AM', 1100, 1, 2, 1),
 ('11:30 AM', 1130, 1, 2, 1),
 ('2:00 PM',  1400, 1, 2, 1),
 ('2:30 PM',  1430, 1, 2, 1),
 ('3:00 PM',  1500, 1, 2, 1),
 ('3:30 PM',  1530, 1, 2, 1),
 ('4:00 PM',  1600, 1, 2, 1),
 ('4:30 PM',  1630, 1, 2, 1);
