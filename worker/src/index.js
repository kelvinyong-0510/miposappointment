// MIPOS API — Cloudflare Worker + D1 Database
// Replaces the Express + SQLite3 backend entirely

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function hashPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Router ───────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // ── Health ──────────────────────────────────────────────────────────────
      if ((path === '/api' || path === '/api/') && method === 'GET') {
        return json({ message: 'MIPOS API is running', version: '3.0.0-d1' });
      }

      if (path === '/api/health' && method === 'GET') {
        return json({ status: 'ok', timestamp: new Date().toISOString(), version: '3.0.0-d1' });
      }

      // ── Auth ─────────────────────────────────────────────────────────────────
      if (path === '/api/login' && method === 'POST') {
        const { username, password } = await request.json();
        if (!username || !password) return json({ error: 'Username and password required' }, 400);
        const hash = await hashPassword(password);
        const row = await env.DB.prepare(
          'SELECT id, name, username, role FROM staff WHERE username = ? AND password = ?'
        ).bind(username, hash).first();
        if (row) return json({ user: row });
        return json({ error: 'Invalid credentials' }, 401);
      }

      // ── Staff ─────────────────────────────────────────────────────────────────
      if (path === '/api/staff') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare('SELECT id, name, username, role FROM staff ORDER BY name ASC').all();
          return json(results);
        }
        if (method === 'POST') {
          const { name, username, password, role } = await request.json();
          if (!name || !username || !password) return json({ error: 'name, username, password required' }, 400);
          const hash = await hashPassword(password);
          try {
            const r = await env.DB.prepare(
              'INSERT INTO staff (name, username, password, role) VALUES (?, ?, ?, ?)'
            ).bind(name, username, hash, role || 'staff').run();
            return json({ id: r.meta.last_row_id, success: true }, 201);
          } catch (e) {
            if (e.message.includes('UNIQUE')) return json({ error: 'Username already exists' }, 409);
            throw e;
          }
        }
      }

      const staffMatch = path.match(/^\/api\/staff\/(\d+)$/);
      if (staffMatch) {
        const id = staffMatch[1];
        if (method === 'PUT') {
          const body = await request.json();
          const updates = [], params = [];
          if (body.name) { updates.push('name = ?'); params.push(body.name); }
          if (body.username) { updates.push('username = ?'); params.push(body.username); }
          if (body.password) { updates.push('password = ?'); params.push(await hashPassword(body.password)); }
          if (body.role) { updates.push('role = ?'); params.push(body.role); }
          if (!updates.length) return json({ success: true, changes: 0 });
          params.push(id);
          const r = await env.DB.prepare(`UPDATE staff SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
          return json({ changes: r.meta.changes, success: true });
        }
        if (method === 'DELETE') {
          const r = await env.DB.prepare('DELETE FROM staff WHERE id = ?').bind(id).run();
          if (!r.meta.changes) return json({ error: 'Staff not found' }, 404);
          return json({ changes: r.meta.changes, success: true });
        }
      }

      // ── Leads ─────────────────────────────────────────────────────────────────
      const LEADS_SELECT = `
        SELECT leads.*, staff.name as assigned_staff_name
        FROM leads LEFT JOIN staff ON leads.assigned_staff = staff.id
      `;

      if (path === '/api/leads') {
        if (method === 'GET') {
          const { stage, staff, date, search } = Object.fromEntries(url.searchParams);
          let sql = LEADS_SELECT;
          const conditions = [], params = [];
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
          const { results } = await env.DB.prepare(sql).bind(...params).all();
          return json(results);
        }
        if (method === 'POST') {
          const { name, phone, company, date, time_slot, purpose } = await request.json();
          if (!phone) return json({ error: 'Phone number is required' }, 400);
          const r = await env.DB.prepare(
            'INSERT INTO leads (name, phone, company, date, time_slot, purpose) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(name, phone, company, date, time_slot, purpose).run();
          return json({ id: r.meta.last_row_id, success: true }, 201);
        }
      }

      const leadMatch = path.match(/^\/api\/leads\/(\d+)$/);
      if (leadMatch) {
        const id = leadMatch[1];
        if (method === 'GET') {
          const row = await env.DB.prepare(LEADS_SELECT + ' WHERE leads.id = ?').bind(id).first();
          if (!row) return json({ error: 'Lead not found' }, 404);
          return json(row);
        }
        if (method === 'PUT') {
          const body = await request.json();
          const updates = [], params = [];
          const fields = ['stage','status','products_interest','assigned_staff','quotation_no','invoice_no','notes'];
          for (const f of fields) {
            if (body[f] !== undefined) {
              updates.push(`${f} = ?`);
              params.push(f === 'assigned_staff' ? (body[f] || null) : body[f]);
            }
          }
          if (!updates.length) return json({ success: true, changes: 0 });
          params.push(id);
          const r = await env.DB.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
          if (!r.meta.changes) return json({ error: 'Lead not found' }, 404);
          return json({ changes: r.meta.changes, success: true });
        }
        if (method === 'DELETE') {
          const r = await env.DB.prepare('DELETE FROM leads WHERE id = ?').bind(id).run();
          if (!r.meta.changes) return json({ error: 'Lead not found' }, 404);
          return json({ changes: r.meta.changes, success: true });
        }
      }

      // ── Sales ─────────────────────────────────────────────────────────────────
      if (path === '/api/sales') {
        if (method === 'GET') {
          const { results } = await env.DB.prepare(
            `SELECT sales.*, leads.name as customer_name, leads.company, leads.stage
             FROM sales LEFT JOIN leads ON sales.appointment_id = leads.id
             ORDER BY sales.closed_date DESC`
          ).all();
          return json(results);
        }
        if (method === 'POST') {
          const { appointment_id, invoice_no, quotation_no, amount, items, payment_status } = await request.json();
          if (!appointment_id || !amount) return json({ error: 'appointment_id and amount required' }, 400);
          const r = await env.DB.prepare(
            'INSERT INTO sales (appointment_id, invoice_no, quotation_no, amount, items, payment_status) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(appointment_id, invoice_no, quotation_no, amount, items, payment_status || 'Pending').run();
          return json({ id: r.meta.last_row_id, success: true }, 201);
        }
      }

      const saleMatch = path.match(/^\/api\/sales\/(\d+)$/);
      if (saleMatch) {
        const id = saleMatch[1];
        if (method === 'PUT') {
          const body = await request.json();
          const updates = [], params = [];
          for (const f of ['invoice_no','quotation_no','amount','items','payment_status']) {
            if (body[f] !== undefined) { updates.push(`${f} = ?`); params.push(body[f]); }
          }
          if (!updates.length) return json({ success: true, changes: 0 });
          params.push(id);
          const r = await env.DB.prepare(`UPDATE sales SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
          return json({ changes: r.meta.changes, success: true });
        }
        if (method === 'DELETE') {
          const r = await env.DB.prepare('DELETE FROM sales WHERE id = ?').bind(id).run();
          if (!r.meta.changes) return json({ error: 'Sale not found' }, 404);
          return json({ changes: r.meta.changes, success: true });
        }
      }

      // ── Analytics ─────────────────────────────────────────────────────────────
      if (path === '/api/analytics' && method === 'GET') {
        const { results: leads } = await env.DB.prepare('SELECT stage, date, assigned_staff FROM leads').all();
        const { results: sales } = await env.DB.prepare('SELECT amount, payment_status FROM sales').all();
        const prefix = new Date().toISOString().slice(0, 7);
        const total = leads.length;
        const monthlyWalkIns = leads.filter(l => l.date?.startsWith(prefix)).length;
        const won = leads.filter(l => l.stage === 'Closed Won').length;
        const lost = leads.filter(l => ['Closed Lost', 'Lost'].includes(l.stage)).length;
        const totalRevenue = sales.filter(s => s.payment_status === 'Paid').reduce((a, s) => a + (s.amount || 0), 0);
        const pendingRevenue = sales.filter(s => s.payment_status !== 'Paid').reduce((a, s) => a + (s.amount || 0), 0);
        return json({
          total, monthlyWalkIns, won, lost,
          pending: total - won - lost,
          conversionRate: total > 0 ? parseFloat(((won / total) * 100).toFixed(1)) : 0,
          totalRevenue, pendingRevenue,
          quotation: leads.filter(l => l.stage === 'Quotation sent').length,
          invoice: leads.filter(l => l.stage === 'Invoice sent').length,
          contacted: leads.filter(l => l.stage === 'Contacted').length,
        });
      }

      if (path === '/api/analytics/funnel' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT stage, COUNT(*) as count FROM leads GROUP BY stage ORDER BY count DESC'
        ).all();
        return json(results);
      }

      if (path === '/api/analytics/monthly' && method === 'GET') {
        const { results } = await env.DB.prepare(
          `SELECT substr(date, 1, 7) as month, COUNT(*) as count
           FROM leads WHERE date IS NOT NULL AND date != ''
           GROUP BY month ORDER BY month ASC LIMIT 12`
        ).all();
        return json(results);
      }

      if (path === '/api/analytics/staff' && method === 'GET') {
        const { results } = await env.DB.prepare(
          `SELECT staff.id, staff.name,
             COUNT(leads.id) as total_leads,
             SUM(CASE WHEN leads.stage = 'Closed Won' THEN 1 ELSE 0 END) as won,
             SUM(CASE WHEN leads.stage IN ('Closed Lost','Lost') THEN 1 ELSE 0 END) as lost,
             ROUND(
               CAST(SUM(CASE WHEN leads.stage = 'Closed Won' THEN 1 ELSE 0 END) AS FLOAT)
               / NULLIF(COUNT(leads.id), 0) * 100, 1
             ) as conversion_rate
           FROM staff LEFT JOIN leads ON leads.assigned_staff = staff.id
           GROUP BY staff.id ORDER BY won DESC`
        ).all();
        return json(results);
      }

      return json({ error: 'Not found' }, 404);

    } catch (err) {
      console.error(err);
      return json({ error: err.message }, 500);
    }
  },
};
