import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'pesatrack_v2';

const defaultState = {
  transactions: [],
  budgets:      [],
  savings:      [],
  smsGranted:   false,
};

export async function loadStore() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch (e) {}
  return { ...defaultState };
}

export async function saveStore(state) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {}
}

export function currentMonthTxns(transactions) {
  const ym = new Date().toISOString().slice(0, 7); // "2025-06"
  return transactions.filter(t => t.date?.startsWith(ym));
}

export function getMonthlyData(transactions, months = 6) {
  const result = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d  = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = d.toISOString().slice(0, 7);
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    const inc = transactions.filter(t => t.type === 'income'  && t.date?.startsWith(ym))
                            .reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.type === 'expense' && t.date?.startsWith(ym))
                            .reduce((s, t) => s + t.amount, 0);
    result.push({ label, inc, exp, net: inc - exp });
  }
  return result;
}
