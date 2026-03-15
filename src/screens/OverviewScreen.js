import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { colors, CAT_COLORS, CAT_EMOJI } from '../utils/theme';
import { fmtKes, fmtShort } from '../utils/mpesa';
import { currentMonthTxns } from '../store';
import { SectionHeader, Card } from '../components/UI';

const W = Dimensions.get('window').width;

export default function OverviewScreen({ state, onAddTxn }) {
  const { transactions } = state;

  const totalInc = useMemo(() =>
    transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
  [transactions]);

  const totalExp = useMemo(() =>
    transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  [transactions]);

  const balance = totalInc - totalExp;

  const monthTxns  = useMemo(() => currentMonthTxns(transactions), [transactions]);
  const monthExp   = monthTxns.filter(t => t.type === 'expense');
  const recent     = useMemo(() =>
    [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
  [transactions]);

  // Category breakdown for this month
  const catMap = useMemo(() => {
    const m = {};
    for (const t of monthExp) m[t.category] = (m[t.category] || 0) + t.amount;
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [monthExp]);

  const maxCat = catMap[0]?.[1] || 1;

  const monthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}>

      {/* Balance card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balLabel}>Total Balance</Text>
        <Text style={[styles.balAmount, { color: balance >= 0 ? colors.accent : colors.red }]}>
          {fmtKes(balance)}
        </Text>
        <View style={styles.balRow}>
          <View style={styles.balItem}>
            <Text style={styles.balItemArrow}>↑</Text>
            <Text style={styles.balItemLabel}>Income</Text>
            <Text style={[styles.balItemVal, { color: colors.accent }]}>{fmtShort(totalInc)}</Text>
          </View>
          <View style={styles.balDivider} />
          <View style={styles.balItem}>
            <Text style={[styles.balItemArrow, { color: colors.red }]}>↓</Text>
            <Text style={styles.balItemLabel}>Expenses</Text>
            <Text style={[styles.balItemVal, { color: colors.red }]}>{fmtShort(totalExp)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {/* Category breakdown */}
        <SectionHeader title="Spending by category" right={
          <Text style={styles.muted}>{monthLabel}</Text>
        } />

        {catMap.length === 0
          ? <Text style={styles.emptyNote}>No expenses this month</Text>
          : catMap.map(([cat, amt], i) => (
              <View key={cat} style={styles.catRow}>
                <Text style={styles.catLabel}>{CAT_EMOJI[cat] || '📦'} {cat}</Text>
                <View style={styles.catBarBg}>
                  <View style={[styles.catBar, {
                    width: `${(amt / maxCat) * 100}%`,
                    backgroundColor: CAT_COLORS[i % CAT_COLORS.length],
                  }]} />
                </View>
                <Text style={styles.catAmt}>{fmtShort(amt)}</Text>
              </View>
            ))
        }

        {/* Recent transactions */}
        <SectionHeader
          title="Recent transactions"
          right={<Text style={{ color: colors.accent, fontSize: 12 }}>See all →</Text>}
          style={{ marginTop: 20 }}
        />

        {recent.length === 0
          ? <Text style={styles.emptyNote}>No transactions yet</Text>
          : recent.map(t => <TxnRow key={t.id} txn={t} />)
        }
      </View>
    </ScrollView>
  );
}

export function TxnRow({ txn, onDelete }) {
  const sign  = txn.type === 'income' ? '+' : '-';
  const emoji = CAT_EMOJI[txn.category] || '📦';
  const dateStr = txn.date
    ? new Date(txn.date + 'T00:00:00').toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
    : '';

  return (
    <View style={txnStyles.row}>
      <View style={[txnStyles.icon, { backgroundColor: txn.type === 'income' ? colors.accentDim : colors.redDim }]}>
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
      </View>
      <View style={txnStyles.info}>
        <Text style={txnStyles.desc} numberOfLines={1}>{txn.description}</Text>
        <Text style={txnStyles.meta}>
          {txn.category} · {dateStr}{txn.source === 'mpesa' ? ' · M-Pesa' : ''}
        </Text>
      </View>
      <Text style={[txnStyles.amt, { color: txn.type === 'income' ? colors.accent : colors.red }]}>
        {sign}{fmtKes(txn.amount)}
      </Text>
      {onDelete && (
        <TouchableOpacity onPress={() => onDelete(txn.id)} style={txnStyles.del}>
          <Text style={{ color: colors.text3, fontSize: 12 }}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  balanceCard: {
    margin: 16,
    borderRadius: 18,
    padding: 20,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: 'rgba(0,229,160,0.2)',
  },
  balLabel: { color: colors.text2, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  balAmount: { fontSize: 34, fontWeight: '700', letterSpacing: -1, marginBottom: 18 },
  balRow: { flexDirection: 'row', alignItems: 'center' },
  balItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  balItemArrow: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  balItemLabel: { color: colors.text2, fontSize: 12, flex: 1 },
  balItemVal: { fontSize: 13, fontWeight: '600' },
  balDivider: { width: 1, height: 24, backgroundColor: colors.border2, marginHorizontal: 10 },
  body: { paddingHorizontal: 16 },
  muted: { color: colors.text3, fontSize: 11 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  catLabel: { color: colors.text2, fontSize: 12, width: 110 },
  catBarBg: { flex: 1, height: 6, backgroundColor: colors.bg4, borderRadius: 3, overflow: 'hidden' },
  catBar: { height: '100%', borderRadius: 3 },
  catAmt: { color: colors.text2, fontSize: 11, width: 50, textAlign: 'right' },
  emptyNote: { color: colors.text3, fontSize: 13, textAlign: 'center', paddingVertical: 20 },
});

const txnStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg3, borderRadius: 10,
    borderWidth: 0.5, borderColor: colors.border,
    padding: 12, marginBottom: 8, gap: 12,
  },
  icon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  desc: { color: colors.text, fontSize: 14, fontWeight: '500' },
  meta: { color: colors.text2, fontSize: 11, marginTop: 2 },
  amt: { fontSize: 13, fontWeight: '600' },
  del: { padding: 4 },
});
