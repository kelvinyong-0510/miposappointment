// MIPOS API — Cloudflare Worker + D1  ·  v3.0
// ─────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

const html = (body, status = 200) =>
  new Response(body, {
    status,
    headers: { ...CORS, 'Content-Type': 'text/html;charset=UTF-8' },
  });

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Stage helpers ────────────────────────────────────────────────────────────

const STAGE_HEX = {
  'New Lead':              '#3b82f6',
  'Contacted':             '#06b6d4',
  'Appointment Confirmed': '#a78bfa',
  'Walk-In Arrived':       '#8b5cf6',
  'Demo Done':             '#f59e0b',
  'Quotation sent':        '#f97316',
  'Invoice sent':          '#10b981',
  'Closed Won':            '#22c55e',
  'Closed Lost':           '#ef4444',
  'Lost':                  '#ef4444',
};

const stageColor = s => STAGE_HEX[s] || '#64748b';

// ─── Backend Dashboard HTML ───────────────────────────────────────────────────

function buildDashboard(leads, now) {
  const total    = leads.length;
  const won      = leads.filter(l => l.stage === 'Closed Won').length;
  const lost     = leads.filter(l => ['Closed Lost', 'Lost'].includes(l.stage)).length;
  const pending  = total - won - lost;
  const convRate = total > 0 ? ((won / total) * 100).toFixed(1) : '0.0';
  const prefix   = now.toISOString().slice(0, 7);
  const monthly  = leads.filter(l => l.date?.startsWith(prefix)).length;

  const rows = leads.slice(0, 50).map(l => {
    const c = stageColor(l.stage);
    return `
    <tr>
      <td class="id">#${l.id}</td>
      <td><strong>${esc(l.name || '—')}</strong><br><small>${esc(l.phone || '')}</small></td>
      <td>${esc(l.company || '—')}</td>
      <td>${esc(l.date || '—')}<br><small>${esc(l.time_slot || '')}</small></td>
      <td>${esc(l.purpose || '—')}</td>
      <td><span class="badge" style="background:${c}22;color:${c};border:1px solid ${c}44">${esc(l.stage || 'New Lead')}</span></td>
      <td>${esc(l.assigned_staff_name || '') || '<span class="dim">Unassigned</span>'}</td>
    </tr>`;
  }).join('');

  const apiCards = [
    ['/api/leads','Leads'],
    ['/api/staff','Staff'],
    ['/api/sales','Sales'],
    ['/api/analytics','Summary'],
    ['/api/analytics/funnel','Funnel'],
    ['/api/analytics/monthly','Monthly'],
    ['/api/analytics/staff','By Staff'],
    ['/api/health','Health'],
  ].map(([p, n]) => `<a class="api-chip" href="${p}" target="_blank"><code>${p}</code><span>${n}</span></a>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>MIPOS — Backend API v3</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
*,::before,::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#060812;--surface:#0e1120;--surface2:#141726;--border:rgba(255,255,255,.08);
  --text:#e2e8f0;--muted:#64748b;--orange:#f97316;--green:#22c55e;--red:#ef4444;
  --font:'Inter',system-ui,sans-serif;
}
body{font-family:var(--font);background:var(--bg);color:var(--text);min-height:100vh;padding:28px 20px;
  background-image:radial-gradient(ellipse 80% 50% at 50% -20%,rgba(249,115,22,.12),transparent);
}
.wrap{max-width:1360px;margin:0 auto}

/* header */
header{display:flex;align-items:center;gap:14px;margin-bottom:36px;padding-bottom:22px;border-bottom:1px solid var(--border)}
.logo{width:48px;height:48px;background:linear-gradient(135deg,#f97316,#ea580c);border-radius:14px;
  display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;
  box-shadow:0 0 30px rgba(249,115,22,.4)}
.brand h1{font-size:1.25rem;font-weight:800;color:#fff;letter-spacing:-.02em}
.brand p{font-size:.75rem;color:var(--muted);margin-top:2px}
.pill{margin-left:auto;display:flex;align-items:center;gap:8px;
  background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);
  padding:7px 16px;border-radius:99px;font-size:.8rem;font-weight:600;color:#4ade80}
.dot{width:7px;height:7px;border-radius:50%;background:#4ade80;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}

/* KPIs */
.kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:24px}
.kpi{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px 18px}
.kpi-label{font-size:.7rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
.kpi-value{font-size:2rem;font-weight:800;color:#fff;margin-top:6px;letter-spacing:-.03em}
.kpi-value.orange{color:var(--orange)}
.kpi-value.green{color:var(--green)}
.kpi-value.red{color:var(--red)}
.kpi-value.cyan{color:#06b6d4}

/* API chips */
.api-strip{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}
.api-chip{display:flex;align-items:center;gap:8px;padding:8px 14px;
  background:var(--surface);border:1px solid var(--border);border-radius:10px;
  text-decoration:none;transition:all .2s;font-size:.78rem}
.api-chip code{color:#94a3b8;font-family:monospace}
.api-chip span{color:var(--muted);font-size:.7rem}
.api-chip:hover{border-color:rgba(249,115,22,.4);background:rgba(249,115,22,.08)}
.api-chip:hover code{color:var(--orange)}

/* Table */
.card{background:var(--surface);border:1px solid var(--border);border-radius:18px;overflow:hidden;margin-bottom:20px}
.card-head{display:flex;align-items:center;justify-content:space-between;
  padding:16px 20px;border-bottom:1px solid var(--border)}
.card-title{font-size:.875rem;font-weight:700;color:#f1f5f9}
.card-meta{font-size:.72rem;color:var(--muted)}
table{width:100%;border-collapse:collapse;font-size:.8rem}
thead tr{background:rgba(255,255,255,.03)}
th{padding:11px 16px;text-align:left;font-size:.68rem;font-weight:600;
  color:var(--muted);text-transform:uppercase;letter-spacing:.07em;white-space:nowrap}
td{padding:13px 16px;border-top:1px solid rgba(255,255,255,.04);vertical-align:middle;color:#cbd5e1}
td.id{color:var(--muted);font-size:.72rem;font-family:monospace}
td strong{color:#f1f5f9;font-weight:600}
td small{color:#475569;font-size:.72rem;display:block;margin-top:2px}
.dim{color:#334155}
tr:hover td{background:rgba(249,115,22,.04)}
.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:99px;
  font-size:.68rem;font-weight:700;white-space:nowrap}

footer{text-align:center;margin-top:28px;font-size:.72rem;color:#1e293b}

@media(max-width:900px){
  .kpi-grid{grid-template-columns:repeat(2,1fr)}
  th:nth-child(n+5),td:nth-child(n+5){display:none}
}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="logo">M</div>
    <div class="brand">
      <h1>MIPOS Backend API</h1>
      <p>Cloudflare Worker · D1 Database · v3.0</p>
    </div>
    <div class="pill"><div class="dot"></div> Worker Online</div>
  </header>

  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-label">Total Leads</div><div class="kpi-value">${total}</div></div>
    <div class="kpi"><div class="kpi-label">This Month</div><div class="kpi-value cyan">${monthly}</div></div>
    <div class="kpi"><div class="kpi-label">Closed Won</div><div class="kpi-value green">${won}</div></div>
    <div class="kpi"><div class="kpi-label">Pending</div><div class="kpi-value orange">${pending}</div></div>
    <div class="kpi"><div class="kpi-label">Conversion</div><div class="kpi-value" style="color:#a78bfa">${convRate}%</div></div>
  </div>

  <div class="api-strip">${apiCards}</div>

  <div class="card">
    <div class="card-head">
      <span class="card-title">Recent Appointments <span style="color:var(--muted);font-weight:400">(last 50)</span></span>
      <span class="card-meta">Loaded ${now.toLocaleString('en-MY',{timeZone:'Asia/Kuala_Lumpur'})}</span>
    </div>
    <table>
      <thead><tr>
        <th>#</th><th>Customer</th><th>Company</th><th>Date / Time</th>
        <th>Purpose</th><th>Stage</th><th>Staff</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="7" style="text-align:center;padding:48px;color:#334155">No appointments yet</td></tr>'}</tbody>
    </table>
  </div>

  <footer>MIPOS ShopTech Centre · Backend v3.0 · Cloudflare D1</footer>
</div>
</body>
</html>`;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Router ───────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') return new Response(null, { headers: CORS });

    try {

      // ── Root: HTML Dashboard ──────────────────────────────────────────────
      if (path === '/' && method === 'GET') {
        const { results: leads } = await env.DB.prepare(`
          SELECT leads.*, staff.name as assigned_staff_name
          FROM leads LEFT JOIN staff ON leads.assigned_staff = staff.id
          ORDER BY leads.date DESC, leads.time_slot DESC
        `).all();
        return html(buildDashboard(leads, new Date()));
      }

      // ── Health ────────────────────────────────────────────────────────────
      if (path === '/api/health' && method === 'GET')
        return json({ status: 'ok', timestamp: new Date().toISOString(), version: '3.0.0' });

      if ((path === '/api' || path === '/api/') && method === 'GET')
        return json({ message: 'MIPOS API is running', version: '3.0.0' });

      // ── Auth ──────────────────────────────────────────────────────────────
      if (path === '/api/login' && method === 'POST') {
        const { username, password } = await request.json();
        if (!username || !password)
          return json({ error: 'Username and password required' }, 400);
        const hash = await sha256(password);
        const row  = await env.DB.prepare(
          'SELECT id, name, username, role FROM staff WHERE username=? AND password=?'
        ).bind(username, hash).first();
        return row ? json({ user: row }) : json({ error: 'Invalid credentials' }, 401);
      }

      // ── Staff ─────────────────────────────────────────────────────────────
      if (path === '/api/staff') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare(
            'SELECT id,name,username,role FROM staff ORDER BY name ASC'
          ).all();
          return json(results);
        }
        if (method === 'POST') {
          const { name, username, password, role } = await request.json();
          if (!name || !username || !password)
            return json({ error: 'name, username, password required' }, 400);
          try {
            const r = await env.DB.prepare(
              'INSERT INTO staff(name,username,password,role) VALUES(?,?,?,?)'
            ).bind(name, username, await sha256(password), role || 'staff').run();
            return json({ id: r.meta.last_row_id, success: true }, 201);
          } catch (e) {
            if (e.message.includes('UNIQUE')) return json({ error: 'Username already exists' }, 409);
            throw e;
          }
        }
      }

      const staffId = path.match(/^\/api\/staff\/(\d+)$/)?.[1];
      if (staffId) {
        if (method === 'PUT') {
          const body = await request.json();
          const sets = [], vals = [];
          if (body.name)     { sets.push('name=?');     vals.push(body.name); }
          if (body.username) { sets.push('username=?'); vals.push(body.username); }
          if (body.password) { sets.push('password=?'); vals.push(await sha256(body.password)); }
          if (body.role)     { sets.push('role=?');     vals.push(body.role); }
          if (!sets.length) return json({ success: true, changes: 0 });
          vals.push(staffId);
          const r = await env.DB.prepare(`UPDATE staff SET ${sets.join(',')} WHERE id=?`).bind(...vals).run();
          return json({ changes: r.meta.changes, success: true });
        }
        if (method === 'DELETE') {
          const r = await env.DB.prepare('DELETE FROM staff WHERE id=?').bind(staffId).run();
          return r.meta.changes ? json({ success: true }) : json({ error: 'Staff not found' }, 404);
        }
      }

      // ── Leads ─────────────────────────────────────────────────────────────
      const SEL = `SELECT leads.*,staff.name as assigned_staff_name
                   FROM leads LEFT JOIN staff ON leads.assigned_staff=staff.id`;

      if (path === '/api/leads') {
        if (method === 'GET') {
          const p   = url.searchParams;
          const cond = [], vals = [];
          if (p.get('stage'))  { cond.push('leads.stage=?');           vals.push(p.get('stage')); }
          if (p.get('staff'))  { cond.push('leads.assigned_staff=?');   vals.push(p.get('staff')); }
          if (p.get('date'))   { cond.push('leads.date=?');             vals.push(p.get('date')); }
          if (p.get('search')) {
            cond.push('(leads.name LIKE ? OR leads.phone LIKE ? OR leads.company LIKE ?)');
            const q = `%${p.get('search')}%`;
            vals.push(q, q, q);
          }
          const sql = SEL + (cond.length ? ' WHERE ' + cond.join(' AND ') : '') +
                      ' ORDER BY leads.date DESC,leads.time_slot DESC';
          const { results } = await env.DB.prepare(sql).bind(...vals).all();
          return json(results);
        }
        if (method === 'POST') {
          const { name, phone, company, date, time_slot, purpose } = await request.json();
          if (!phone) return json({ error: 'Phone number is required' }, 400);
          const r = await env.DB.prepare(
            'INSERT INTO leads(name,phone,company,date,time_slot,purpose) VALUES(?,?,?,?,?,?)'
          ).bind(name, phone, company, date, time_slot, purpose).run();
          return json({ id: r.meta.last_row_id, success: true }, 201);
        }
      }

      const leadId = path.match(/^\/api\/leads\/(\d+)$/)?.[1];
      if (leadId) {
        if (method === 'GET') {
          const row = await env.DB.prepare(SEL + ' WHERE leads.id=?').bind(leadId).first();
          return row ? json(row) : json({ error: 'Lead not found' }, 404);
        }
        if (method === 'PUT') {
          const body  = await request.json();
          const FIELDS = ['stage','status','products_interest','assigned_staff','quotation_no','invoice_no','notes'];
          const sets = [], vals = [];
          for (const f of FIELDS) {
            if (body[f] !== undefined) {
              sets.push(`${f}=?`);
              vals.push(f === 'assigned_staff' ? (body[f] || null) : body[f]);
            }
          }
          if (!sets.length) return json({ success: true, changes: 0 });
          vals.push(leadId);
          const r = await env.DB.prepare(`UPDATE leads SET ${sets.join(',')} WHERE id=?`).bind(...vals).run();
          return r.meta.changes ? json({ success: true }) : json({ error: 'Lead not found' }, 404);
        }
        if (method === 'DELETE') {
          const r = await env.DB.prepare('DELETE FROM leads WHERE id=?').bind(leadId).run();
          return r.meta.changes ? json({ success: true }) : json({ error: 'Lead not found' }, 404);
        }
      }

      // ── Sales ─────────────────────────────────────────────────────────────
      if (path === '/api/sales') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare(`
            SELECT sales.*,leads.name as customer_name,leads.company,leads.stage
            FROM sales LEFT JOIN leads ON sales.appointment_id=leads.id
            ORDER BY sales.closed_date DESC`).all();
          return json(results);
        }
        if (method === 'POST') {
          const { appointment_id, invoice_no, quotation_no, amount, items, payment_status } = await request.json();
          if (!appointment_id || !amount) return json({ error: 'appointment_id and amount required' }, 400);
          const r = await env.DB.prepare(
            'INSERT INTO sales(appointment_id,invoice_no,quotation_no,amount,items,payment_status) VALUES(?,?,?,?,?,?)'
          ).bind(appointment_id, invoice_no, quotation_no, amount, items, payment_status || 'Pending').run();
          return json({ id: r.meta.last_row_id, success: true }, 201);
        }
      }

      const saleId = path.match(/^\/api\/sales\/(\d+)$/)?.[1];
      if (saleId) {
        if (method === 'PUT') {
          const body = await request.json();
          const SFS  = ['invoice_no','quotation_no','amount','items','payment_status'];
          const sets = [], vals = [];
          for (const f of SFS) if (body[f] !== undefined) { sets.push(`${f}=?`); vals.push(body[f]); }
          if (!sets.length) return json({ success: true, changes: 0 });
          vals.push(saleId);
          const r = await env.DB.prepare(`UPDATE sales SET ${sets.join(',')} WHERE id=?`).bind(...vals).run();
          return json({ changes: r.meta.changes, success: true });
        }
        if (method === 'DELETE') {
          const r = await env.DB.prepare('DELETE FROM sales WHERE id=?').bind(saleId).run();
          return r.meta.changes ? json({ success: true }) : json({ error: 'Sale not found' }, 404);
        }
      }

      // ── Analytics ─────────────────────────────────────────────────────────
      if (path === '/api/analytics' && method === 'GET') {
        const { results: leads } = await env.DB.prepare('SELECT stage,date FROM leads').all();
        const { results: sales } = await env.DB.prepare('SELECT amount,payment_status FROM sales').all();
        const prefix = new Date().toISOString().slice(0, 7);
        const total  = leads.length;
        const won    = leads.filter(l => l.stage === 'Closed Won').length;
        const lost   = leads.filter(l => ['Closed Lost', 'Lost'].includes(l.stage)).length;
        return json({
          total,
          monthlyWalkIns: leads.filter(l => l.date?.startsWith(prefix)).length,
          won, lost,
          pending: total - won - lost,
          conversionRate: total ? parseFloat(((won / total) * 100).toFixed(1)) : 0,
          totalRevenue:   sales.filter(s => s.payment_status === 'Paid').reduce((a, s) => a + (s.amount || 0), 0),
          pendingRevenue: sales.filter(s => s.payment_status !== 'Paid').reduce((a, s) => a + (s.amount || 0), 0),
          quotation: leads.filter(l => l.stage === 'Quotation sent').length,
          invoice:   leads.filter(l => l.stage === 'Invoice sent').length,
          contacted: leads.filter(l => l.stage === 'Contacted').length,
        });
      }

      if (path === '/api/analytics/funnel' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT stage,COUNT(*) as count FROM leads GROUP BY stage ORDER BY count DESC'
        ).all();
        return json(results);
      }

      if (path === '/api/analytics/monthly' && method === 'GET') {
        const { results } = await env.DB.prepare(`
          SELECT substr(date,1,7) as month, COUNT(*) as count
          FROM leads WHERE date IS NOT NULL AND date!=''
          GROUP BY month ORDER BY month ASC LIMIT 12`).all();
        return json(results);
      }

      if (path === '/api/analytics/staff' && method === 'GET') {
        const { results } = await env.DB.prepare(`
          SELECT staff.id, staff.name,
            COUNT(leads.id) as total_leads,
            SUM(CASE WHEN leads.stage='Closed Won' THEN 1 ELSE 0 END) as won,
            SUM(CASE WHEN leads.stage IN ('Closed Lost','Lost') THEN 1 ELSE 0 END) as lost,
            ROUND(CAST(SUM(CASE WHEN leads.stage='Closed Won' THEN 1 ELSE 0 END) AS FLOAT)
              / NULLIF(COUNT(leads.id),0)*100,1) as conversion_rate
          FROM staff LEFT JOIN leads ON leads.assigned_staff=staff.id
          GROUP BY staff.id ORDER BY won DESC`).all();
        return json(results);
      }

      return json({ error: 'Not found' }, 404);

    } catch (err) {
      console.error('[MIPOS Worker]', err);
      return json({ error: err.message }, 500);
    }
  },
};
