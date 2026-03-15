import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { colors } from '../utils/theme';
import { fmtKes } from '../utils/mpesa';
import { TxnRow } from './OverviewScreen';
import { EmptyState } from '../components/UI';

const TYPES = ['All', 'Income', 'Expense'];

export default function TransactionsScreen({ state, onDelete }) {
  const [typeFilter, setTypeFilter] = useState('All');
  const [catFilter,  setCatFilter]  = useState('All');

  const allCats = useMemo(() => {
    const s = new Set(state.transactions.map(t => t.category).filter(Boolean));
    return ['All', ...s];
  }, [state.transactions]);

  const filtered = useMemo(() => {
    let txns = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (typeFilter !== 'All') txns = txns.filter(t => t.type === typeFilter.toLowerCase());
    if (catFilter  !== 'All') txns = txns.filter(t => t.category === catFilter);
    return txns;
  }, [state.transactions, typeFilter, catFilter]);

  return (
    <View style={styles.screen}>
      {/* Type filter */}
      <View style={styles.filterRow}>
        {TYPES.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, typeFilter === t && styles.chipActive]}
            onPress={() => setTypeFilter(t)}
          >
            <Text style={[styles.chipTxt, typeFilter === t && { color: colors.accent }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {allCats.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, catFilter === c && styles.chipActive]}
            onPress={() => setCatFilter(c)}
          >
            <Text style={[styles.chipTxt, catFilter === c && { color: colors.accent }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}>
        {filtered.length === 0
          ? <EmptyState message="No transactions found" />
          : filtered.map(t => <TxnRow key={t.id} txn={t} onDelete={onDelete} />)
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 8,
  },
  catScroll: { paddingHorizontal: 16, paddingVertical: 10 },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.bg3,
  },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  chipTxt: { color: colors.text2, fontSize: 13 },
});
