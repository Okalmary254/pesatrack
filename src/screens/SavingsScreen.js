import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../utils/theme';
import { fmtKes } from '../utils/mpesa';
import { Sheet, Input, PrimaryBtn, SectionHeader, EmptyState, ProgressBar } from '../components/UI';

export default function SavingsScreen({ state, onSaveGoal, onTopUp }) {
  const [showSheet, setShowSheet] = useState(false);
  const [name,      setName]      = useState('');
  const [target,    setTarget]    = useState('');
  const [current,   setCurrent]   = useState('');
  const [topupAmt,  setTopupAmt]  = useState({});

  function save() {
    if (!name || !target) return;
    onSaveGoal({
      name,
      target:  parseFloat(target),
      current: parseFloat(current) || 0,
    });
    setName(''); setTarget(''); setCurrent('');
    setShowSheet(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}>
        <SectionHeader title="Savings goals" right={
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowSheet(true)}>
            <Text style={styles.addBtnTxt}>+ Add</Text>
          </TouchableOpacity>
        } />

        {state.savings.length === 0
          ? <EmptyState message="No savings goals yet" action="Add Goal" onAction={() => setShowSheet(true)} />
          : state.savings.map(g => {
              const pct = Math.min((g.current / g.target) * 100, 100);
              return (
                <View key={g.id} style={styles.card}>
                  <View style={styles.cardHead}>
                    <View>
                      <Text style={styles.goalName}>🎯 {g.name}</Text>
                      <Text style={styles.goalSub}>{fmtKes(g.current)} of {fmtKes(g.target)}</Text>
                    </View>
                    <View style={[styles.pctBadge, pct >= 100 && styles.pctDone]}>
                      <Text style={[styles.pctTxt, pct >= 100 && { color: colors.accent }]}>
                        {Math.round(pct)}%
                      </Text>
                    </View>
                  </View>

                  <ProgressBar pct={pct} color={colors.blue} />

                  {pct < 100 ? (
                    <View style={styles.topupRow}>
                      <Input
                        style={{ flex: 1, marginBottom: 0 }}
                        placeholder="Add KES"
                        keyboardType="decimal-pad"
                        value={topupAmt[g.id] || ''}
                        onChangeText={v => setTopupAmt(p => ({ ...p, [g.id]: v }))}
                      />
                      <TouchableOpacity
                        style={styles.topupBtn}
                        onPress={() => {
                          const amt = parseFloat(topupAmt[g.id]);
                          if (amt > 0) {
                            onTopUp(g.id, amt);
                            setTopupAmt(p => ({ ...p, [g.id]: '' }));
                          }
                        }}
                      >
                        <Text style={styles.topupTxt}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.done}>✓ Goal reached!</Text>
                  )}
                </View>
              );
            })
        }
      </ScrollView>

      <Sheet visible={showSheet} onClose={() => setShowSheet(false)} title="New Savings Goal">
        <Input placeholder="Goal name (e.g. iPhone, Vacation)" value={name} onChangeText={setName} />
        <Input placeholder="Target amount (KES)" value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
        <Input placeholder="Current savings (KES)" value={current} onChangeText={setCurrent} keyboardType="decimal-pad" />
        <PrimaryBtn label="Save Goal" onPress={save} style={{ marginTop: 8 }} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: { backgroundColor: colors.blueDim, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5 },
  addBtnTxt: { color: colors.blue, fontSize: 13, fontWeight: '600' },
  card: {
    backgroundColor: colors.bg3, borderRadius: 12,
    borderWidth: 0.5, borderColor: colors.border,
    padding: 14, marginBottom: 10,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  goalName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  goalSub:  { color: colors.text2, fontSize: 12, marginTop: 2 },
  pctBadge: { backgroundColor: colors.blueDim, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  pctDone:  { backgroundColor: colors.accentDim },
  pctTxt:   { color: colors.blue, fontSize: 12, fontWeight: '700' },
  topupRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  topupBtn: { backgroundColor: colors.blueDim, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
  topupTxt: { color: colors.blue, fontWeight: '600', fontSize: 13 },
  done: { color: colors.accent, fontSize: 12, fontWeight: '600', marginTop: 10 },
});
