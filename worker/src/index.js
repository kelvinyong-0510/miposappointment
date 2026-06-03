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

// ─── Slot capacity ──────────────────────────────────────────────────────────
// A slot is "taken" while an appointment is active. Cancelled appointments
// (stage 'Closed Lost' / 'Lost') free the slot again.
const DEAD_STAGES = "('Closed Lost','Lost')";

// ─── Departments ──────────────────────────────────────────────────────────────
// Purposes are stored as canonical keys. The POS team handles 'pos' only; every
// other purpose is handled by the CS (Customer Success) team. A booking can need
// both teams (e.g. picks POS System + Queue System) and then consumes one seat
// from each team's per-slot capacity.
function teamsForPurposes(purposes) {
  const arr = Array.isArray(purposes) ? purposes : [];
  return {
    needs_pos: arr.includes('pos') ? 1 : 0,
    needs_cs:  arr.some(p => p && p !== 'pos') ? 1 : 0,
  };
}

// "10:00 AM" / "2:30 PM" → 1000 / 1430 (sortable 24h key). null if unparseable.
function timeToSort(slot) {
  const m = String(slot || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 100 + min;
}

// ─── Google Calendar (service account) ────────────────────────────────────────
// Set via `wrangler secret put`: GCAL_CLIENT_EMAIL, GCAL_PRIVATE_KEY, GCAL_CALENDAR_ID.
// When any is missing, calendar sync is silently skipped (booking still works).
function gcalEnabled(env) {
  return !!(env.GCAL_CLIENT_EMAIL && env.GCAL_PRIVATE_KEY && env.GCAL_CALENDAR_ID);
}

function b64url(input) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToPkcs8(pem) {
  const b64 = pem.replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function gcalAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: env.GCAL_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/calendar.events',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const signingInput = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    'pkcs8', pemToPkcs8(env.GCAL_PRIVATE_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput));
  const jwt = `${signingInput}.${b64url(sig)}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Google token error: ' + JSON.stringify(data));
  return data.access_token;
}

// "10:00 AM" / "2:30 PM" on a YYYY-MM-DD date → RFC3339 start/end (+30 min), MYT (+08:00)
function slotToTimes(date, slot) {
  const m = String(slot || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!date || !m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  const pad = n => String(n).padStart(2, '0');
  let eh = h, em = min + 30;
  if (em >= 60) { em -= 60; eh += 1; }
  return {
    start: `${date}T${pad(h)}:${pad(min)}:00+08:00`,
    end:   `${date}T${pad(eh)}:${pad(em)}:00+08:00`,
  };
}

async function gcalCreateEvent(env, lead) {
  const times = slotToTimes(lead.date, lead.time_slot);
  if (!times) return null;
  const token = await gcalAccessToken(env);
  const calId = encodeURIComponent(env.GCAL_CALENDAR_ID);
  const event = {
    summary: `MIPOS Walk-In: ${lead.name || 'Customer'}${lead.purpose ? ' — ' + lead.purpose : ''}`,
    description: [
      `Name: ${lead.name || '-'}`,
      `Phone: ${lead.phone || '-'}`,
      `Company: ${lead.company || '-'}`,
      `Purpose: ${lead.purpose || '-'}`,
      '',
      'Booked via appointment.mipos.me',
    ].join('\n'),
    location: '29, Jalan 2, Taman Len Seng Cheras, 56000 Kuala Lumpur',
    start: { dateTime: times.start, timeZone: 'Asia/Kuala_Lumpur' },
    end:   { dateTime: times.end,   timeZone: 'Asia/Kuala_Lumpur' },
  };
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calId}/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Google event error: ' + JSON.stringify(data));
  return data.id;
}

async function gcalDeleteEvent(env, eventId) {
  if (!eventId) return;
  const token = await gcalAccessToken(env);
  const calId = encodeURIComponent(env.GCAL_CALENDAR_ID);
  await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Patch an existing event's time/details (used when an appointment is rescheduled
// or its name/purpose is edited) so Google Calendar stays in sync.
async function gcalUpdateEvent(env, eventId, lead) {
  const times = slotToTimes(lead.date, lead.time_slot);
  if (!times) return;
  const token = await gcalAccessToken(env);
  const calId = encodeURIComponent(env.GCAL_CALENDAR_ID);
  const body = {
    summary: `MIPOS Walk-In: ${lead.name || 'Customer'}${lead.purpose ? ' — ' + lead.purpose : ''}`,
    description: [
      `Name: ${lead.name || '-'}`,
      `Phone: ${lead.phone || '-'}`,
      `Company: ${lead.company || '-'}`,
      `Purpose: ${lead.purpose || '-'}`,
      '',
      'Booked via appointment.mipos.me',
    ].join('\n'),
    start: { dateTime: times.start, timeZone: 'Asia/Kuala_Lumpur' },
    end:   { dateTime: times.end,   timeZone: 'Asia/Kuala_Lumpur' },
  };
  await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${eventId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
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

      // ── Slots (master config) ─────────────────────────────────────────────
      if (path === '/api/slots' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM slots ORDER BY sort_order').all();
        return json(results);
      }
      if (path === '/api/slots' && method === 'POST') {
        const { time, pos_capacity, cs_capacity } = await request.json();
        const so = timeToSort(time);
        if (so === null) return json({ error: 'Invalid time. Use e.g. "10:00 AM" or "2:30 PM".' }, 400);
        await env.DB.prepare(
          `INSERT OR REPLACE INTO slots(time,sort_order,pos_capacity,cs_capacity,active)
           VALUES(?,?,?,?,COALESCE((SELECT active FROM slots WHERE time=?),1))`
        ).bind(time, so, pos_capacity ?? 1, cs_capacity ?? 2, time).run();
        return json({ success: true }, 201);
      }
      const slotTime = path.match(/^\/api\/slots\/(.+)$/)?.[1];
      if (slotTime) {
        const time = decodeURIComponent(slotTime);
        if (method === 'PUT') {
          const b = await request.json();
          const sets = [], vals = [];
          if (b.pos_capacity !== undefined) { sets.push('pos_capacity=?'); vals.push(b.pos_capacity); }
          if (b.cs_capacity  !== undefined) { sets.push('cs_capacity=?');  vals.push(b.cs_capacity); }
          if (b.active       !== undefined) { sets.push('active=?');       vals.push(b.active ? 1 : 0); }
          if (!sets.length) return json({ success: true, changes: 0 });
          vals.push(time);
          const r = await env.DB.prepare(`UPDATE slots SET ${sets.join(',')} WHERE time=?`).bind(...vals).run();
          return json({ success: true, changes: r.meta.changes });
        }
        if (method === 'DELETE') {
          const r = await env.DB.prepare('DELETE FROM slots WHERE time=?').bind(time).run();
          return r.meta.changes ? json({ success: true }) : json({ error: 'Slot not found' }, 404);
        }
      }

      // ── Availability ──────────────────────────────────────────────────────
      // Per-slot, per-team booked counts + capacities for a date (active slots).
      if (path === '/api/availability' && method === 'GET') {
        const date = url.searchParams.get('date');
        if (!date) return json({ error: 'date query param required' }, 400);
        const { results: slotRows } = await env.DB.prepare(
          'SELECT time, pos_capacity, cs_capacity FROM slots WHERE active=1 ORDER BY sort_order'
        ).all();
        const { results: booked } = await env.DB.prepare(
          `SELECT time_slot,
                  COALESCE(SUM(needs_pos),0) AS pos,
                  COALESCE(SUM(needs_cs),0)  AS cs
           FROM leads
           WHERE date=? AND time_slot IS NOT NULL AND time_slot!='' AND stage NOT IN ${DEAD_STAGES}
           GROUP BY time_slot`
        ).bind(date).all();
        const bmap = {};
        booked.forEach(b => { bmap[b.time_slot] = { pos: b.pos, cs: b.cs }; });
        const slots = slotRows.map(s => ({
          time: s.time,
          pos_capacity: s.pos_capacity,
          cs_capacity: s.cs_capacity,
          pos_booked: bmap[s.time]?.pos || 0,
          cs_booked: bmap[s.time]?.cs || 0,
        }));
        return json({ date, slots });
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
          const body = await request.json();
          if (!body.phone) return json({ error: 'Phone number is required' }, 400);
          // Coerce missing optionals to null — D1 .bind() rejects undefined.
          const name      = body.name      ?? null;
          const phone     = body.phone     ?? null;
          const company   = body.company   ?? null;
          const date      = body.date      ?? null;
          const time_slot = body.time_slot ?? null;
          const purposesArr = Array.isArray(body.purposes) ? body.purposes : [];
          const purposeStr  = body.purpose ?? (purposesArr.length ? purposesArr.join(', ') : null);
          const purposesJson = purposesArr.length ? JSON.stringify(purposesArr) : null;
          const { needs_pos, needs_cs } = teamsForPurposes(purposesArr);
          const source = body.source === 'admin' ? 'admin' : 'customer';

          let newId;
          if (date && time_slot) {
            // Slot must exist and be active.
            const slot = await env.DB.prepare(
              'SELECT pos_capacity, cs_capacity, active FROM slots WHERE time=?'
            ).bind(time_slot).first();
            if (!slot || !slot.active) {
              return json({ error: 'slot_unavailable', message: 'That time slot is not available.' }, 409);
            }
            // Atomic department-aware capacity guard: insert only if each team
            // the booking needs still has a free seat. changes===0 ⇒ full.
            const r = await env.DB.prepare(
              `INSERT INTO leads(name,phone,company,date,time_slot,purpose,purposes,needs_pos,needs_cs,source)
               SELECT ?,?,?,?,?,?,?,?,?,?
               WHERE
                 ( ?=0 OR (SELECT COALESCE(SUM(needs_pos),0) FROM leads
                           WHERE date=? AND time_slot=? AND stage NOT IN ${DEAD_STAGES}) < ? )
                 AND
                 ( ?=0 OR (SELECT COALESCE(SUM(needs_cs),0) FROM leads
                           WHERE date=? AND time_slot=? AND stage NOT IN ${DEAD_STAGES}) < ? )`
            ).bind(
              name, phone, company, date, time_slot, purposeStr, purposesJson, needs_pos, needs_cs, source,
              needs_pos, date, time_slot, slot.pos_capacity,
              needs_cs,  date, time_slot, slot.cs_capacity
            ).run();
            if (!r.meta.changes) {
              return json({ error: 'slot_taken', message: 'That time slot is fully booked for this service. Please pick another.' }, 409);
            }
            newId = r.meta.last_row_id;
          } else {
            const r = await env.DB.prepare(
              'INSERT INTO leads(name,phone,company,date,time_slot,purpose,purposes,needs_pos,needs_cs,source) VALUES(?,?,?,?,?,?,?,?,?,?)'
            ).bind(name, phone, company, date, time_slot, purposeStr, purposesJson, needs_pos, needs_cs, source).run();
            newId = r.meta.last_row_id;
          }

          // Mirror to Google Calendar (best-effort — never fails the booking).
          if (gcalEnabled(env)) {
            try {
              const eid = await gcalCreateEvent(env, { name, phone, company, date, time_slot, purpose: purposeStr });
              if (eid) await env.DB.prepare('UPDATE leads SET google_event_id=? WHERE id=?').bind(eid, newId).run();
            } catch (e) { console.error('[GCal create]', e.message); }
          }

          return json({ id: newId, success: true }, 201);
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
          const FIELDS = ['name','phone','company','date','time_slot','purpose','attendance',
                          'stage','status','products_interest','assigned_staff','quotation_no','invoice_no','notes'];
          const sets = [], vals = [];
          for (const f of FIELDS) {
            if (body[f] !== undefined) {
              sets.push(`${f}=?`);
              vals.push(f === 'assigned_staff' ? (body[f] || null) : body[f]);
            }
          }
          // Multi-purpose edit: store JSON + recompute team flags.
          if (body.purposes !== undefined) {
            const arr = Array.isArray(body.purposes) ? body.purposes : [];
            const { needs_pos, needs_cs } = teamsForPurposes(arr);
            sets.push('purposes=?');  vals.push(arr.length ? JSON.stringify(arr) : null);
            sets.push('needs_pos=?'); vals.push(needs_pos);
            sets.push('needs_cs=?');  vals.push(needs_cs);
          }
          if (!sets.length) return json({ success: true, changes: 0 });
          vals.push(leadId);
          const r = await env.DB.prepare(`UPDATE leads SET ${sets.join(',')} WHERE id=?`).bind(...vals).run();

          // Keep Google Calendar in sync with edits.
          if (gcalEnabled(env)) {
            try {
              const row = await env.DB.prepare(
                'SELECT date,time_slot,name,phone,company,purpose,google_event_id FROM leads WHERE id=?'
              ).bind(leadId).first();
              const dead = ['Closed Lost', 'Lost'].includes(body.stage);
              if (dead && row?.google_event_id) {
                // Cancelled → remove the event (frees the slot on the calendar too).
                await gcalDeleteEvent(env, row.google_event_id);
                await env.DB.prepare('UPDATE leads SET google_event_id=NULL WHERE id=?').bind(leadId).run();
              } else if (!dead && row?.google_event_id &&
                         (body.date !== undefined || body.time_slot !== undefined ||
                          body.name !== undefined || body.purpose !== undefined || body.purposes !== undefined)) {
                // Rescheduled / details edited → patch the event in place.
                await gcalUpdateEvent(env, row.google_event_id, row);
              }
            } catch (e) { console.error('[GCal sync]', e.message); }
          }
          return r.meta.changes ? json({ success: true }) : json({ error: 'Lead not found' }, 404);
        }
        if (method === 'DELETE') {
          let eid = null;
          if (gcalEnabled(env)) {
            const row = await env.DB.prepare('SELECT google_event_id FROM leads WHERE id=?').bind(leadId).first();
            eid = row?.google_event_id || null;
          }
          const r = await env.DB.prepare('DELETE FROM leads WHERE id=?').bind(leadId).run();
          if (eid) { try { await gcalDeleteEvent(env, eid); } catch (e) { console.error('[GCal delete]', e.message); } }
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
