import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, ScrollView,
} from 'react-native';
import { colors } from '../utils/theme';

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── Section header ──────────────────────────────────────────────────────────
export function SectionHeader({ title, right }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right}
    </View>
  );
}

// ─── Primary button ──────────────────────────────────────────────────────────
export function PrimaryBtn({ label, onPress, style, loading }) {
  return (
    <TouchableOpacity style={[styles.primaryBtn, style]} onPress={onPress} activeOpacity={0.85}>
      {loading
        ? <ActivityIndicator color="#000" size="small" />
        : <Text style={styles.primaryBtnTxt}>{label}</Text>}
    </TouchableOpacity>
  );
}

// ─── Ghost button ────────────────────────────────────────────────────────────
export function GhostBtn({ label, onPress, style }) {
  return (
    <TouchableOpacity style={[styles.ghostBtn, style]} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.ghostBtnTxt}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Icon button ─────────────────────────────────────────────────────────────
export function IconBtn({ onPress, children, style }) {
  return (
    <TouchableOpacity style={[styles.iconBtn, style]} onPress={onPress} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
}

// ─── Bottom sheet modal ──────────────────────────────────────────────────────
export function Sheet({ visible, onClose, children, title }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        {title && <Text style={styles.sheetTitle}>{title}</Text>}
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Form input ──────────────────────────────────────────────────────────────
export function Input({ style, ...props }) {
  return <TextInput style={[styles.input, style]} placeholderTextColor={colors.text3} {...props} />;
}

// ─── Type toggle (Income / Expense) ──────────────────────────────────────────
export function TypeToggle({ value, onChange }) {
  return (
    <View style={styles.toggle}>
      {['income', 'expense'].map(t => (
        <TouchableOpacity
          key={t}
          style={[styles.toggleBtn, value === t && styles.toggleActive]}
          onPress={() => onChange(t)}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.toggleTxt,
            value === t && { color: t === 'income' ? colors.accent : colors.red },
          ]}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Category picker ─────────────────────────────────────────────────────────
export function CatPicker({ value, onChange, categories }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
      {categories.map(cat => (
        <TouchableOpacity
          key={cat}
          style={[styles.catChip, value === cat && styles.catChipActive]}
          onPress={() => onChange(cat)}
          activeOpacity={0.8}
        >
          <Text style={[styles.catChipTxt, value === cat && { color: colors.accent }]}>{cat}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────
// Usage: <Toast message="..." error visible onHide={() => ...} />
export function Toast({ message, error, visible }) {
  if (!visible || !message) return null;
  return (
    <View style={[styles.toast, error && styles.toastError]}>
      <Text style={[styles.toastTxt, error && { color: colors.red }]}>{message}</Text>
    </View>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
export function EmptyState({ message, action, onAction }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTxt}>{message}</Text>
      {action && <PrimaryBtn label={action} onPress={onAction} style={{ marginTop: 12 }} />}
    </View>
  );
}

// ─── Progress bar ────────────────────────────────────────────────────────────
export function ProgressBar({ pct, color }) {
  return (
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg3,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnTxt: { color: '#000', fontWeight: '700', fontSize: 15 },
  ghostBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border2,
    paddingVertical: 13,
    alignItems: 'center',
  },
  ghostBtnTxt: { color: colors.text2, fontSize: 14 },
  iconBtn: {
    backgroundColor: colors.bg3,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: colors.border,
    width: 38, height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: colors.bg2,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: colors.border2,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: '90%',
  },
  handle: {
    width: 36, height: 4,
    backgroundColor: colors.bg4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: { color: colors.text, fontSize: 17, fontWeight: '600', marginBottom: 16 },
  input: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: 8,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.bg3,
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 9,
    borderRadius: 6, alignItems: 'center',
  },
  toggleActive: { backgroundColor: colors.bg4 },
  toggleTxt: { color: colors.text2, fontWeight: '500', fontSize: 14 },
  catChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: colors.bg3,
  },
  catChipActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  catChipTxt: { color: colors.text2, fontSize: 13 },
  toast: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: 'rgba(0,229,160,0.3)',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    zIndex: 999,
  },
  toastError: {
    backgroundColor: colors.redDim,
    borderColor: 'rgba(255,82,82,0.3)',
  },
  toastTxt: { color: colors.accent, fontSize: 13 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyTxt: { color: colors.text2, fontSize: 14 },
  progressBg: {
    height: 6, borderRadius: 3,
    backgroundColor: colors.bg4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
});
