import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, CAT_EMOJI, CATEGORIES } from '../utils/theme';
import { fmtKes, fmtShort } from '../utils/mpesa';
import { currentMonthTxns } from '../store';
import { Sheet, Input, PrimaryBtn, CatPicker, SectionHeader, EmptyState, ProgressBar } from '../components/UI';

export default function BudgetScreen({ state, onSaveBudget, onDeleteBudget }) {
  const [showSheet, setShowSheet] = useState(false);
  const [cat,       setCat]       = useState('');
  const [limit,     setLimit]     = useState('');

  const monthExp = useMemo(() =>
    currentMonthTxns(state.transactions).filter(t => t.type === 'expense'),
  [state.transactions]);

  function save() {
    if (!cat || !limit) return;
    onSaveBudget({ category: cat, limit: parseFloat(limit) });
    setCat(''); setLimit(''); setShowSheet(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}>
        <SectionHeader title="Monthly budgets" right={
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowSheet(true)}>
            <Text style={styles.addBtnTxt}>+ Add</Text>
          </TouchableOpacity>
        } />

        {state.budgets.length === 0
          ? <EmptyState message="No budgets set yet" action="Create Budget" onAction={() => setShowSheet(true)} />
          : state.budgets.map(b => {
              const spent = monthExp.filter(t => t.category === b.category)
                                    .reduce((s, t) => s + t.amount, 0);
              const pct   = (spent / b.limit) * 100;
              const barColor = pct >= 100 ? colors.red : pct >= 75 ? colors.amber : colors.accent;

              return (
                <View key={b.id} style={styles.budgetCard}>
                  <View style={styles.budgetHead}>
                    <Text style={styles.budgetCat}>
                      {CAT_EMOJI[b.category] || '📦'} {b.category}
                    </Text>
                    <Text style={styles.budgetNums}>{fmtShort(spent)} / {fmtShort(b.limit)}</Text>
                  </View>
                  <ProgressBar pct={pct} color={barColor} />
                  <View style={styles.budgetFoot}>
                    <Text style={[styles.budgetPct, { color: barColor }]}>
                      {Math.round(pct)}%{pct >= 100 ? ' — over budget!' : pct >= 75 ? ' — almost there' : ' used'}
                    </Text>
                    <TouchableOpacity onPress={() => onDeleteBudget(b.id)}>
                      <Text style={{ color: colors.text3, fontSize: 12 }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
        }
      </ScrollView>

      <Sheet visible={showSheet} onClose={() => setShowSheet(false)} title="Set Budget">
        <Text style={styles.fieldLabel}>Category</Text>
        <CatPicker value={cat} onChange={setCat} categories={CATEGORIES.filter(c => c !== 'Salary' && c !== 'Business')} />
        <Input
          placeholder="Monthly limit (KES)"
          value={limit}
          onChangeText={setLimit}
          keyboardType="decimal-pad"
        />
        <PrimaryBtn label="Save Budget" onPress={save} style={{ marginTop: 8 }} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    backgroundColor: colors.accentDim,
    borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5,
  },
  addBtnTxt: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  budgetCard: {
    backgroundColor: colors.bg3, borderRadius: 12,
    borderWidth: 0.5, borderColor: colors.border,
    padding: 14, marginBottom: 10,
  },
  budgetHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  budgetCat:  { color: colors.text, fontSize: 14, fontWeight: '500' },
  budgetNums: { color: colors.text2, fontSize: 12 },
  budgetFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  budgetPct:  { fontSize: 12 },
  fieldLabel: { color: colors.text2, fontSize: 12, marginBottom: 6 },
});
