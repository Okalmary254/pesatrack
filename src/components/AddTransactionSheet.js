import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sheet, Input, TypeToggle, CatPicker, PrimaryBtn, GhostBtn } from './UI';
import { colors, CATEGORIES } from '../utils/theme';
import { todayStr } from '../utils/mpesa';

export default function AddTransactionSheet({ visible, onClose, onSave }) {
  const [type,   setType]   = useState('expense');
  const [amount, setAmount] = useState('');
  const [desc,   setDesc]   = useState('');
  const [cat,    setCat]    = useState('');
  const [date,   setDate]   = useState(todayStr());

  function save() {
    const amt = parseFloat(amount);
    if (!amt || !desc.trim() || !cat || !date) return;
    onSave({ type, amount: amt, description: desc.trim(), category: cat, date });
    setAmount(''); setDesc(''); setCat(''); setDate(todayStr());
    onClose();
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Add Transaction">
      <TypeToggle value={type} onChange={setType} />
      <Input
        placeholder="Amount (KES)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <Input
        placeholder="Description"
        value={desc}
        onChangeText={setDesc}
      />
      <Text style={styles.fieldLabel}>Category</Text>
      <CatPicker value={cat} onChange={setCat} categories={CATEGORIES} />
      <Input
        placeholder="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
      />
      <PrimaryBtn label="Save Transaction" onPress={save} style={{ marginTop: 8 }} />
      <GhostBtn label="Cancel" onPress={onClose} style={{ marginTop: 8 }} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { color: colors.text2, fontSize: 12, marginBottom: 6, marginTop: 4 },
});
