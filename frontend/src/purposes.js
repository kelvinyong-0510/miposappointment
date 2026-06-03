/* Canonical purposes shared by the booking page and the admin.
   Stable keys + per-language labels + department (POS team handles 'pos' only;
   every other purpose is Customer Success). */
export const PURPOSES = [
  { key: 'pos',      team: 'pos', en: 'POS System',               my: 'Sistem POS',         zh: 'POS 收银系统' },
  { key: 'hardware', team: 'cs',  en: 'Hardware Devices (Sunmi)', my: 'Perkakasan (Sunmi)', zh: '硬件设备 (Sunmi)' },
  { key: 'support',  team: 'cs',  en: 'Technical Support',        my: 'Sokongan Teknikal',  zh: '技术支持' },
  { key: 'led',      team: 'cs',  en: 'LED Board',                my: 'Papan LED',          zh: 'LED 显示板' },
  { key: 'pager',    team: 'cs',  en: 'Pager System',             my: 'Sistem Pager',       zh: '呼叫器系统' },
  { key: 'queue',    team: 'cs',  en: 'Queue System',             my: 'Sistem Giliran',     zh: '排队管理系统' },
  { key: 'calling',  team: 'cs',  en: 'Calling System',           my: 'Sistem Panggilan',   zh: '叫号系统' },
  { key: 'others',   team: 'cs',  en: 'Others',                   my: 'Lain-lain',          zh: '其他' },
];

export const purposeLabel = (key, lang = 'en') => {
  const p = PURPOSES.find(x => x.key === key);
  return p ? p[lang] : key;
};

export const teamsForPurposes = (keys = []) => ({
  needs_pos: keys.includes('pos') ? 1 : 0,
  needs_cs:  keys.some(k => k && k !== 'pos') ? 1 : 0,
});

// Parse a lead's stored purposes (JSON array of keys) → labels for display.
export const leadPurposeLabels = (lead, lang = 'en') => {
  let keys = [];
  try { keys = lead?.purposes ? JSON.parse(lead.purposes) : []; } catch { keys = []; }
  if (Array.isArray(keys) && keys.length) return keys.map(k => purposeLabel(k, lang));
  return lead?.purpose ? [lead.purpose] : [];
};

export const teamLabel = (lead) => {
  if (lead?.needs_pos && lead?.needs_cs) return 'POS + CS';
  if (lead?.needs_pos) return 'POS Team';
  if (lead?.needs_cs)  return 'CS Team';
  return '—';
};
