const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashPassword(pw) {
    return crypto.createHash('sha256').update(pw).digest('hex');
}

function stageColor(stage) {
    const map = {
        'New Lead': '#3b82f6',
        'Walk-In Arrived': '#8b5cf6',
        'Demo Done': '#f59e0b',
        'Quotation sent': '#f97316',
        'Invoice sent': '#10b981',
        'Closed Won': '#22c55e',
        'Closed Lost': '#ef4444',
        'Lost': '#ef4444',
        'Contacted': '#06b6d4',
        'Appointment Confirmed': '#a78bfa',
    };
    return map[stage] || '#64748b';
}

// ─── Backend HTML Dashboard ────────────────────────────────────────────────────

app.get('/', (req, res) => {
    db.all(
        "SELECT leads.*, staff.name as assigned_staff_name FROM leads LEFT JOIN staff ON leads.assigned_staff = staff.id ORDER BY date DESC, time_slot DESC",
        [],
        (err, leads) => {
            if (err) return res.status(500).send('Database error');

            const rows = leads.map(l => `
              <tr>
                <td>${l.id}</td>
                <td><strong>${l.name || '-'}</strong><br><small>${l.phone || ''}</small></td>
                <td>${l.company || '-'}</td>
                <td>${l.date || '-'}<br><small>${l.time_slot || ''}</small></td>
                <td>${l.purpose || '-'}</td>
                <td><span class="badge" style="background:${stageColor(l.stage)}22;color:${stageColor(l.stage)};border:1px solid ${stageColor(l.stage)}44">${l.stage || 'New Lead'}</span></td>
                <td>${l.assigned_staff_name || '<span style="color:#475569">Unassigned</span>'}</td>
                <td>${l.quotation_no || '-'}</td>
                <td>${l.invoice_no || '-'}</td>
              </tr>`).join('');

            const total = leads.length;
            const won = leads.filter(l => l.stage === 'Closed Won').length;
            const pending = leads.filter(l => !['Closed Won', 'Closed Lost', 'Lost'].includes(l.stage)).length;
            const lost = leads.filter(l => ['Closed Lost', 'Lost'].includes(l.stage)).length;

            res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>MIPOS — Backend Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;background:#0a0a0f;color:#e2e8f0;min-height:100vh;padding:32px 24px}
    .container{max-width:1300px;margin:0 auto}
    header{display:flex;align-items:center;gap:14px;margin-bottom:32px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.07)}
    .logo{width:46px;height:46px;background:linear-gradient(135deg,#f97316,#ea580c);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff;box-shadow:0 4px 20px rgba(249,115,22,0.3)}
    h1{font-size:1.4rem;font-weight:700;color:#fff}
    header p{font-size:0.8rem;color:#64748b;margin-top:2px}
    .dot-wrap{margin-left:auto;display:flex;align-items:center;gap:8px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);padding:7px 14px;border-radius:100px;font-size:0.8rem;font-weight:600;color:#4ade80}
    .dot{width:7px;height:7px;border-radius:50%;background:#4ade80;animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px}
    .stat{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:20px}
    .stat-label{font-size:0.7rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.08em}
    .stat-value{font-size:1.9rem;font-weight:700;color:#fff;margin-top:6px}
    .stat-value.green{color:#22c55e}
    .stat-value.orange{color:#f97316}
    .stat-value.red{color:#ef4444}
    .table-wrap{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;margin-bottom:24px}
    .table-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06)}
    .table-title{font-size:0.85rem;font-weight:600;color:#e2e8f0}
    .refresh{font-size:0.75rem;color:#64748b}
    table{width:100%;border-collapse:collapse;font-size:0.82rem}
    thead tr{background:rgba(255,255,255,0.04)}
    th{padding:12px 16px;text-align:left;font-size:0.7rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap}
    td{padding:13px 16px;border-top:1px solid rgba(255,255,255,0.05);vertical-align:middle;color:#cbd5e1}
    td strong{color:#f1f5f9}
    td small{color:#475569;font-size:0.75rem}
    tr:hover td{background:rgba(249,115,22,0.04)}
    .badge{display:inline-block;padding:3px 10px;border-radius:100px;font-size:0.72rem;font-weight:600;white-space:nowrap}
    .api-links{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px}
    .api-link{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);padding:6px 14px;border-radius:8px;font-size:0.78rem;color:#94a3b8;text-decoration:none;font-family:monospace}
    .api-link:hover{background:rgba(249,115,22,0.15);border-color:rgba(249,115,22,0.4);color:#f97316}
    footer{text-align:center;margin-top:24px;font-size:0.72rem;color:#334155}
    @media(max-width:900px){.stats{grid-template-columns:repeat(2,1fr)}}
  </style>
</head>
<body>
<div class="container">
  <header>
    <div class="logo">M</div>
    <div>
      <h1>MIPOS Backend Dashboard</h1>
      <p>SQLite3 + Node.js + Express · Port 3001</p>
    </div>
    <div class="dot-wrap"><div class="dot"></div> Server Online</div>
  </header>

  <div class="stats">
    <div class="stat"><div class="stat-label">Total Appointments</div><div class="stat-value">${total}</div></div>
    <div class="stat"><div class="stat-label">Active / Pending</div><div class="stat-value orange">${pending}</div></div>
    <div class="stat"><div class="stat-label">Closed Won</div><div class="stat-value green">${won}</div></div>
    <div class="stat"><div class="stat-label">Lost</div><div class="stat-value red">${lost}</div></div>
  </div>

  <div class="api-links">
    <a class="api-link" href="/api/leads" target="_blank">GET /api/leads</a>
    <a class="api-link" href="/api/staff" target="_blank">GET /api/staff</a>
    <a class="api-link" href="/api/sales" target="_blank">GET /api/sales</a>
    <a class="api-link" href="/api/analytics" target="_blank">GET /api/analytics</a>
    <a class="api-link" href="/api/analytics/funnel" target="_blank">GET /api/analytics/funnel</a>
    <a class="api-link" href="/api/analytics/monthly" target="_blank">GET /api/analytics/monthly</a>
    <a class="api-link" href="/api/analytics/staff" target="_blank">GET /api/analytics/staff</a>
    <a class="api-link" href="/api/health" target="_blank">GET /api/health</a>
  </div>

  <div class="table-wrap">
    <div class="table-head">
      <span class="table-title">All Appointments</span>
      <span class="refresh">Last loaded: ${new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th><th>Customer</th><th>Company</th><th>Date / Time</th>
          <th>Purpose</th><th>Stage</th><th>Staff</th><th>Quotation</th><th>Invoice</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="9" style="text-align:center;padding:40px;color:#475569">No appointments found</td></tr>'}</tbody>
    </table>
  </div>

  <footer>MIPOS ShopTech Centre · v2.0</footer>
</div>
</body>
</html>`);
        }
    );
});

// ─── Health Check ──────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        version: '2.0.0',
    });
});

// ─── Authentication ────────────────────────────────────────────────────────────

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Username and password are required' });

    const hash = hashPassword(password);
    db.get(
        "SELECT id, name, username, role FROM staff WHERE username = ? AND password = ?",
        [username, hash],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (row) return res.json({ user: row });
            return res.status(401).json({ error: 'Invalid credentials' });
        }
    );
});

// ─── Staff ────────────────────────────────────────────────────────────────────

app.get('/api/staff', (req, res) => {
    db.all("SELECT id, name, username, role FROM staff ORDER BY name ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/staff', (req, res) => {
    const { name, username, password, role } = req.body;
    if (!name || !username || !password)
        return res.status(400).json({ error: 'name, username, and password are required' });

    const hash = hashPassword(password);
    db.run(
        "INSERT INTO staff (name, username, password, role) VALUES (?, ?, ?, ?)",
        [name, username, hash, role || 'staff'],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username already exists' });
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, success: true });
        }
    );
});

app.put('/api/staff/:id', (req, res) => {
    const { name, username, password, role } = req.body;
    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (username) { updates.push('username = ?'); params.push(username); }
    if (password) { updates.push('password = ?'); params.push(hashPassword(password)); }
    if (role) { updates.push('role = ?'); params.push(role); }

    if (updates.length === 0) return res.json({ success: true, changes: 0 });

    params.push(req.params.id);
    db.run(`UPDATE staff SET ${updates.join(', ')} WHERE id = ?`, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes, success: true });
    });
});

app.delete('/api/staff/:id', (req, res) => {
    db.run('DELETE FROM staff WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Staff not found' });
        res.json({ changes: this.changes, success: true });
    });
});

// ─── Leads ────────────────────────────────────────────────────────────────────

const LEADS_SELECT = `
    SELECT leads.*, staff.name as assigned_staff_name
    FROM leads
    LEFT JOIN staff ON leads.assigned_staff = staff.id
`;

// GET /api/leads?stage=&staff=&date=&search=
app.get('/api/leads', (req, res) => {
    const { stage, staff, date, search } = req.query;
    let sql = LEADS_SELECT;
    const params = [];
    const conditions = [];

    if (stage) { conditions.push('leads.stage = ?'); params.push(stage); }
    if (staff) { conditions.push('leads.assigned_staff = ?'); params.push(staff); }
    if (date) { conditions.push('leads.date = ?'); params.push(date); }
    if (search) {
        conditions.push('(leads.name LIKE ? OR leads.phone LIKE ? OR leads.company LIKE ?)');
        const q = `%${search}%`;
        params.push(q, q, q);
    }

    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY leads.date DESC, leads.time_slot DESC';

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/leads/:id', (req, res) => {
    const sql = LEADS_SELECT + ' WHERE leads.id = ?';
    db.get(sql, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Lead not found' });
        res.json(row);
    });
});

app.post('/api/leads', (req, res) => {
    const { name, phone, company, date, time_slot, purpose } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    db.run(
        `INSERT INTO leads (name, phone, company, date, time_slot, purpose) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, phone, company, date, time_slot, purpose],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, success: true });
        }
    );
});

app.put('/api/leads/:id', (req, res) => {
    const { stage, status, products_interest, assigned_staff, quotation_no, invoice_no, notes } = req.body;
    const updates = [];
    const params = [];

    if (stage !== undefined) { updates.push('stage = ?'); params.push(stage); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (products_interest !== undefined) { updates.push('products_interest = ?'); params.push(products_interest); }
    if (assigned_staff !== undefined) { updates.push('assigned_staff = ?'); params.push(assigned_staff || null); }
    if (quotation_no !== undefined) { updates.push('quotation_no = ?'); params.push(quotation_no); }
    if (invoice_no !== undefined) { updates.push('invoice_no = ?'); params.push(invoice_no); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }

    if (updates.length === 0) return res.json({ success: true, changes: 0 });

    params.push(req.params.id);
    db.run(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Lead not found' });
        res.json({ changes: this.changes, success: true });
    });
});

app.delete('/api/leads/:id', (req, res) => {
    db.run('DELETE FROM leads WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Lead not found' });
        res.json({ changes: this.changes, success: true });
    });
});

// ─── Sales ────────────────────────────────────────────────────────────────────

app.get('/api/sales', (req, res) => {
    db.all(
        `SELECT sales.*, leads.name as customer_name, leads.company, leads.stage
         FROM sales
         LEFT JOIN leads ON sales.appointment_id = leads.id
         ORDER BY sales.closed_date DESC`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

app.post('/api/sales', (req, res) => {
    const { appointment_id, invoice_no, quotation_no, amount, items, payment_status } = req.body;
    if (!appointment_id || !amount)
        return res.status(400).json({ error: 'appointment_id and amount are required' });

    db.run(
        `INSERT INTO sales (appointment_id, invoice_no, quotation_no, amount, items, payment_status) VALUES (?, ?, ?, ?, ?, ?)`,
        [appointment_id, invoice_no, quotation_no, amount, items, payment_status || 'Pending'],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, success: true });
        }
    );
});

app.put('/api/sales/:id', (req, res) => {
    const { invoice_no, quotation_no, amount, items, payment_status } = req.body;
    const updates = [];
    const params = [];

    if (invoice_no !== undefined) { updates.push('invoice_no = ?'); params.push(invoice_no); }
    if (quotation_no !== undefined) { updates.push('quotation_no = ?'); params.push(quotation_no); }
    if (amount !== undefined) { updates.push('amount = ?'); params.push(amount); }
    if (items !== undefined) { updates.push('items = ?'); params.push(items); }
    if (payment_status !== undefined) { updates.push('payment_status = ?'); params.push(payment_status); }

    if (updates.length === 0) return res.json({ success: true, changes: 0 });

    params.push(req.params.id);
    db.run(`UPDATE sales SET ${updates.join(', ')} WHERE id = ?`, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ changes: this.changes, success: true });
    });
});

app.delete('/api/sales/:id', (req, res) => {
    db.run('DELETE FROM sales WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Sale not found' });
        res.json({ changes: this.changes, success: true });
    });
});

// ─── Analytics ────────────────────────────────────────────────────────────────

// GET /api/analytics — Summary KPIs
app.get('/api/analytics', (req, res) => {
    db.all("SELECT stage, date, assigned_staff FROM leads", [], (err, leads) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all("SELECT amount, payment_status FROM sales", [], (err2, sales) => {
            if (err2) return res.status(500).json({ error: err2.message });

            const currentMonthPrefix = new Date().toISOString().slice(0, 7);
            const total = leads.length;
            const monthlyWalkIns = leads.filter(l => l.date && l.date.startsWith(currentMonthPrefix)).length;
            const won = leads.filter(l => l.stage === 'Closed Won').length;
            const lost = leads.filter(l => ['Closed Lost', 'Lost'].includes(l.stage)).length;
            const pending = total - won - lost;
            const conversionRate = total > 0 ? parseFloat(((won / total) * 100).toFixed(1)) : 0;
            const totalRevenue = sales.filter(s => s.payment_status === 'Paid').reduce((a, s) => a + (s.amount || 0), 0);
            const pendingRevenue = sales.filter(s => s.payment_status !== 'Paid').reduce((a, s) => a + (s.amount || 0), 0);

            res.json({
                total,
                monthlyWalkIns,
                won,
                lost,
                pending,
                conversionRate,
                totalRevenue,
                pendingRevenue,
                quotation: leads.filter(l => l.stage === 'Quotation sent').length,
                invoice: leads.filter(l => l.stage === 'Invoice sent').length,
                contacted: leads.filter(l => l.stage === 'Contacted').length,
            });
        });
    });
});

// GET /api/analytics/funnel — Stage breakdown
app.get('/api/analytics/funnel', (req, res) => {
    db.all(
        "SELECT stage, COUNT(*) as count FROM leads GROUP BY stage ORDER BY count DESC",
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// GET /api/analytics/monthly — Monthly walk-ins (last 12 months)
app.get('/api/analytics/monthly', (req, res) => {
    db.all(
        `SELECT substr(date, 1, 7) as month, COUNT(*) as count
         FROM leads
         WHERE date IS NOT NULL AND date != ''
         GROUP BY month
         ORDER BY month ASC
         LIMIT 12`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// GET /api/analytics/staff — Per-staff performance
app.get('/api/analytics/staff', (req, res) => {
    db.all(
        `SELECT
           staff.id,
           staff.name,
           COUNT(leads.id) as total_leads,
           SUM(CASE WHEN leads.stage = 'Closed Won' THEN 1 ELSE 0 END) as won,
           SUM(CASE WHEN leads.stage IN ('Closed Lost','Lost') THEN 1 ELSE 0 END) as lost,
           ROUND(
             CAST(SUM(CASE WHEN leads.stage = 'Closed Won' THEN 1 ELSE 0 END) AS FLOAT)
             / NULLIF(COUNT(leads.id), 0) * 100, 1
           ) as conversion_rate
         FROM staff
         LEFT JOIN leads ON leads.assigned_staff = staff.id
         GROUP BY staff.id
         ORDER BY won DESC`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n✅  MIPOS Backend v2.0 running on http://localhost:${PORT}`);
    console.log(`    Dashboard  → http://localhost:${PORT}/`);
    console.log(`    Health     → http://localhost:${PORT}/api/health`);
    console.log(`    Leads API  → http://localhost:${PORT}/api/leads\n`);
});
