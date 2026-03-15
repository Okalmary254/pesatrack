// All known M-Pesa SMS patterns
const PATTERNS = [
  // Received money: "You have received Ksh1,500 from JOHN DOE on 10/06/2025"
  {
    re: /You\s+have\s+received\s+Ksh\s*([\d,]+(?:\.\d+)?)\s+from\s+(.+?)\s+on\s+(\d+\/\d+\/\d+)/i,
    type: 'income', cat: 'Business',
    desc: m => `Received from ${m[2].trim()}`,
    amt:  m => parseFloat(m[1].replace(/,/g, '')),
    date: m => parseMpesaDate(m[3]),
  },
  // Sent money: "Confirmed. Ksh850 sent to JANE DOE on 11/06/2025"
  {
    re: /Confirmed\.\s*Ksh\s*([\d,]+(?:\.\d+)?)\s+sent\s+to\s+(.+?)\s+on\s+(\d+\/\d+\/\d+)/i,
    type: 'expense', cat: 'Other',
    desc: m => `Sent to ${m[2].trim()}`,
    amt:  m => parseFloat(m[1].replace(/,/g, '')),
    date: m => parseMpesaDate(m[3]),
  },
  // Paybill: "Ksh2,200 sent to KENYA POWER for account 12345 on 12/06/2025"
  {
    re: /Ksh\s*([\d,]+(?:\.\d+)?)\s+sent\s+to\s+(.+?)\s+for\s+account\s+(.+?)\s+on\s+(\d+\/\d+\/\d+)/i,
    type: 'expense', cat: 'Bills',
    desc: m => `Bill: ${m[2].trim()}`,
    amt:  m => parseFloat(m[1].replace(/,/g, '')),
    date: m => parseMpesaDate(m[4]),
  },
  // Buy goods (till): "Ksh600 paid to JAVA HOUSE on 09/06/2025"
  {
    re: /Ksh\s*([\d,]+(?:\.\d+)?)\s+paid\s+to\s+(.+?)\s+on\s+(\d+\/\d+\/\d+)/i,
    type: 'expense', cat: 'Shopping',
    desc: m => `Paid to ${m[2].trim()}`,
    amt:  m => parseFloat(m[1].replace(/,/g, '')),
    date: m => parseMpesaDate(m[3]),
  },
  // Airtime: "Ksh150 airtime..."
  {
    re: /Ksh\s*([\d,]+(?:\.\d+)?)\s+airtime/i,
    type: 'expense', cat: 'Bills',
    desc: () => 'M-Pesa Airtime',
    amt:  m => parseFloat(m[1].replace(/,/g, '')),
    date: () => todayStr(),
  },
  // Withdrawal: "Withdraw Ksh500 from..."
  {
    re: /Withdraw\s+Ksh\s*([\d,]+(?:\.\d+)?)\s+from\s+/i,
    type: 'expense', cat: 'Other',
    desc: () => 'M-Pesa Withdrawal',
    amt:  m => parseFloat(m[1].replace(/,/g, '')),
    date: () => todayStr(),
  },
];

function parseMpesaDate(str) {
  if (!str) return todayStr();
  const parts = str.split('/');
  if (parts.length === 3) {
    const [d, mo, y] = parts;
    const year = y.length === 2 ? '20' + y : y;
    return `${year}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return todayStr();
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function parseMpesaSMS(body) {
  if (!body) return null;
  for (const p of PATTERNS) {
    const m = body.match(p.re);
    if (m) {
      return {
        id:          `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type:        p.type,
        amount:      p.amt(m),
        description: p.desc(m),
        category:    p.cat,
        date:        p.date(m),
        source:      'mpesa',
      };
    }
  }
  return null;
}

export function processMessages(messages, existing = []) {
  let added = 0;
  const result = [...existing];

  for (const msg of messages) {
    const body = msg.body || msg.message || (typeof msg === 'string' ? msg : '');
    if (!body) continue;

    const txn = parseMpesaSMS(body);
    if (!txn) continue;

    const isDup = result.some(
      t => t.source === 'mpesa' &&
           t.description === txn.description &&
           t.amount      === txn.amount &&
           t.date        === txn.date
    );
    if (!isDup) { result.push(txn); added++; }
  }

  return { transactions: result, added };
}

export function fmtKes(n) {
  return 'KES ' + Math.round(n).toLocaleString('en-KE');
}

export function fmtShort(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return Math.round(n).toString();
}
