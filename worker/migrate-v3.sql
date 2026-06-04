-- MIPOS schema v3: per-day-of-week slot schedule.
-- Run: wrangler d1 execute mipos-db --remote --file=migrate-v3.sql
--
-- day_of_week: 0=Sun, 1=Mon, ... 6=Sat (matches JS getUTCDay()).
-- Operating hours: Mon-Fri 9:30-4:30 (lunch 12-2 already excluded by the slot
-- list), Sat 10:00-12:30, Sun closed.

CREATE TABLE IF NOT EXISTS slots_new (
  day_of_week  INTEGER NOT NULL,
  time         TEXT    NOT NULL,
  sort_order   INTEGER NOT NULL,
  pos_capacity INTEGER NOT NULL DEFAULT 1,
  cs_capacity  INTEGER NOT NULL DEFAULT 2,
  active       INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (day_of_week, time)
);

-- Existing flat slot list → apply to Mon–Fri (1–5).
INSERT OR IGNORE INTO slots_new (day_of_week, time, sort_order, pos_capacity, cs_capacity, active)
  SELECT d.day, s.time, s.sort_order, s.pos_capacity, s.cs_capacity, s.active
  FROM slots s
  JOIN (SELECT 1 AS day UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) d;

-- Saturday (6): 10:00 AM – 12:30 PM.
INSERT OR IGNORE INTO slots_new (day_of_week, time, sort_order, pos_capacity, cs_capacity, active) VALUES
  (6,'10:00 AM',1000,1,2,1),
  (6,'10:30 AM',1030,1,2,1),
  (6,'11:00 AM',1100,1,2,1),
  (6,'11:30 AM',1130,1,2,1),
  (6,'12:00 PM',1200,1,2,1);

-- Sunday (0): no slots (closed).

DROP TABLE slots;
ALTER TABLE slots_new RENAME TO slots;
