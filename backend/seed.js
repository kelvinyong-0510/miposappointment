const http = require('http');

const leads = [
  { name: 'Ahmad Farid', phone: '012-3456789', company: 'Restoran Farid', date: '2026-04-17', time_slot: '10:00 AM', purpose: 'POS System' },
  { name: 'Lim Mei Yin', phone: '016-7890123', company: 'Kedai Lim', date: '2026-04-17', time_slot: '11:00 AM', purpose: 'Hardware Devices (Sunmi)' },
  { name: 'Rajesh Kumar', phone: '011-2345678', company: 'Spice House', date: '2026-04-18', time_slot: '2:00 PM', purpose: 'Queue System' },
  { name: 'Nurul Ain', phone: '019-8765432', company: 'Beauty Salon Nurul', date: '2026-04-18', time_slot: '3:00 PM', purpose: 'POS System' },
  { name: 'Tan Wei Jie', phone: '017-5551234', company: 'TW Bakery', date: '2026-04-19', time_slot: '10:30 AM', purpose: 'LED Board' },
  { name: 'Siti Rahimah', phone: '013-9994567', company: 'Cafe Siti', date: '2026-04-19', time_slot: '2:30 PM', purpose: 'Technical Support' },
  { name: 'Kevin Wong', phone: '018-1237890', company: 'Wong Brothers', date: '2026-04-20', time_slot: '11:00 AM', purpose: 'Pagers System' },
  { name: 'Hafizuddin', phone: '014-6668888', company: 'Mamak Corner', date: '2026-04-21', time_slot: '4:00 PM', purpose: 'POS System' },
];

function postLead(lead) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(lead);
    const req = http.request({
      hostname: 'localhost', port: 3001, path: '/api/leads', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function updateLead(id, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost', port: 3001, path: `/api/leads/${id}`, method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => { res.resume(); res.on('end', resolve); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function postSale(sale) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(sale);
    const req = http.request({
      hostname: 'localhost', port: 3001, path: '/api/sales', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => { res.resume(); res.on('end', resolve); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log('Seeding leads...');
  const ids = [];
  for (const lead of leads) {
    const r = await postLead(lead);
    ids.push(r.id);
    console.log('Created lead', r.id);
  }

  // Update stages
  const stages = ['New Lead','Appointment Confirmed','Walk-in Arrived','Demo Done','Quotation Sent','Closed Won','Closed Won','New Lead'];
  const products = ['FeedMe POS','Sunmi T2 Mini',null,'Loyverse POS','LED Board 55inch',null,'Pager Set A','FeedMe + Sunmi P2'];
  for (let i = 0; i < ids.length; i++) {
    await updateLead(ids[i], { stage: stages[i], products_interest: products[i] || '', assigned_staff: i < 5 ? 1 : '' });
  }
  console.log('Updated stages');

  // Add sales for Closed Won leads
  await postSale({ appointment_id: ids[5], invoice_no: 'INV-001', amount: 3200, items: 'FeedMe POS Annual Plan', payment_status: 'Paid' });
  await postSale({ appointment_id: ids[6], invoice_no: 'INV-002', amount: 1800, items: 'Pager Set A + Installation', payment_status: 'Paid' });
  console.log('Sales seeded. Done!');
}

run().catch(console.error);
