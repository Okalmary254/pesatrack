import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { colors, CAT_COLORS, CAT_EMOJI } from '../utils/theme';
import { fmtKes, fmtShort } from '../utils/mpesa';
import { getMonthlyData, currentMonthTxns } from '../store';
import { SectionHeader, Card } from '../components/UI';

const W = Dimensions.get('window').width - 32;
const RANGES = [
  { label: '3M', value: 3 },
  { label: '6M', value: 6 },
  { label: '12M', value: 12 },
];

export default function AnalyticsScreen({ state }) {
  const [range, setRange] = useState(6);
  const { transactions } = state;

  const monthly = useMemo(() => getMonthlyData(transactions, range), [transactions, range]);

  const totalInc = monthly.reduce((s, m) => s + m.inc, 0);
  const totalExp = monthly.reduce((s, m) => s + m.exp, 0);
  const saveRate = totalInc > 0 ? ((totalInc - totalExp) / totalInc * 100) : 0;

  // Category breakdown this month
  const monthExp = useMemo(() =>
    currentMonthTxns(transactions).filter(t => t.type === 'expense'),
  [transactions]);

  const catBreakdown = useMemo(() => {
    const m = {};
    for (const t of monthExp) m[t.category] = (m[t.category] || 0) + t.amount;
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [monthExp]);

  const totalMonthExp = catBreakdown.reduce((s, [, v]) => s + v, 0);

  const maxBar = Math.max(...monthly.map(m => Math.max(m.inc, m.exp)), 1);
  const barW   = Math.floor((W - 40 - monthly.length * 8) / (monthly.length * 2));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}>

      {/* Range selector */}
      <View style={styles.rangeRow}>
        {RANGES.map(r => (
          <TouchableOpacity
            key={r.value}
            style={[styles.rangeBtn, range === r.value && styles.rangeBtnActive]}
            onPress={() => setRange(r.value)}
          >
            <Text style={[styles.rangeTxt, range === r.value && { color: colors.accent }]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stat cards */}
      <View style={styles.statsRow}>
        <StatCard label="Total In"    value={fmtShort(totalInc)} color={colors.accent} />
        <StatCard label="Total Out"   value={fmtShort(totalExp)} color={colors.red} />
        <StatCard label="Save Rate"   value={`${Math.round(saveRate)}%`} color={colors.blue} />
      </View>

      {/* Income vs Expenses bar chart */}
      <SectionHeader title="Income vs expenses" />
      <View style={styles.chartCard}>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.accent }]} /><Text style={styles.legendTxt}>Income</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.red }]} /><Text style={styles.legendTxt}>Expenses</Text></View>
        </View>
        <View style={styles.barChart}>
          {monthly.map((m, i) => (
            <View key={i} style={styles.barGroup}>
              <View style={styles.barPair}>
                <View style={[styles.bar, {
                  height: Math.max(4, (m.inc / maxBar) * 120),
                  backgroundColor: colors.accent,
                  width: barW,
                }]} />
                <View style={[styles.bar, {
                  height: Math.max(4, (m.exp / maxBar) * 120),
                  backgroundColor: colors.red,
                  width: barW,
                  opacity: 0.75,
                }]} />
              </View>
              <Text style={styles.barLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Category donut-style list */}
      <SectionHeader title="Spending breakdown" right={
        <Text style={styles.muted}>{new Date().toLocaleString('default', { month: 'long' })}</Text>
      } />
      <View style={styles.chartCard}>
        {catBreakdown.length === 0
          ? <Text style={styles.emptyNote}>No expenses this month</Text>
          : catBreakdown.map(([cat, amt], i) => {
              const pct = totalMonthExp > 0 ? (amt / totalMonthExp) * 100 : 0;
              return (
                <View key={cat} style={styles.catRow}>
                  <View style={[styles.catDot, { backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }]} />
                  <Text style={styles.catName}>{CAT_EMOJI[cat] || '📦'} {cat}</Text>
                  <View style={styles.catBarBg}>
                    <View style={[styles.catBarFill, {
                      width: `${pct}%`,
                      backgroundColor: CAT_COLORS[i % CAT_COLORS.length],
                    }]} />
                  </View>
                  <Text style={styles.catPct}>{Math.round(pct)}%</Text>
                  <Text style={styles.catAmt}>{fmtShort(amt)}</Text>
                </View>
              );
            })
        }
      </View>

      {/* Net savings line-style chart */}
      <SectionHeader title="Net savings trend" />
      <View style={styles.chartCard}>
        <View style={styles.netChart}>
          {monthly.map((m, i) => {
            const isPos  = m.net >= 0;
            const absMax = Math.max(...monthly.map(x => Math.abs(x.net)), 1);
            const h      = Math.max(4, (Math.abs(m.net) / absMax) * 80);
            return (
              <View key={i} style={styles.netCol}>
                <View style={[styles.netBar, {
                  height: h,
                  backgroundColor: isPos ? colors.accent : colors.red,
                  opacity: isPos ? 1 : 0.8,
                }]} />
                <Text style={styles.barLabel}>{m.label}</Text>
                <Text style={[styles.netVal, { color: isPos ? colors.accent : colors.red }]}>
                  {isPos ? '+' : ''}{fmtShort(m.net)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, color }) {
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  rangeBtn: {
    borderRadius: 8, borderWidth: 1, borderColor: colors.border2,
    paddingHorizontal: 16, paddingVertical: 7, backgroundColor: colors.bg3,
  },
  rangeBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  rangeTxt: { color: colors.text2, fontSize: 13, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  chartCard: {
    backgroundColor: colors.bg3, borderRadius: 12,
    borderWidth: 0.5, borderColor: colors.border,
    padding: 14, marginBottom: 20,
  },
  chartLegend: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { color: colors.text2, fontSize: 12 },
  barChart: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', height: 140,
  },
  barGroup: { alignItems: 'center', flex: 1 },
  barPair:  { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { borderRadius: 3 },
  barLabel: { color: colors.text3, fontSize: 9, marginTop: 4 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  catDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  catName: { color: colors.text2, fontSize: 12, width: 90 },
  catBarBg: { flex: 1, height: 5, backgroundColor: colors.bg4, borderRadius: 3, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 3 },
  catPct: { color: colors.text3, fontSize: 11, width: 28, textAlign: 'right' },
  catAmt: { color: colors.text2, fontSize: 11, width: 44, textAlign: 'right' },
  emptyNote: { color: colors.text3, fontSize: 13, textAlign: 'center', padding: 16 },
  netChart: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', height: 110,
  },
  netCol: { alignItems: 'center', flex: 1 },
  netBar: { width: '60%', minWidth: 14, borderRadius: 3 },
  netVal: { fontSize: 8, marginTop: 2 },
  muted: { color: colors.text3, fontSize: 11 },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: colors.bg3,
    borderRadius: 10, borderWidth: 0.5, borderColor: colors.border,
    padding: 12, alignItems: 'center',
  },
  label: { color: colors.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  value: { fontSize: 16, fontWeight: '700' },
});
