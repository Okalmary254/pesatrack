import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Platform, TextInput,
  ActivityIndicator, ScrollView, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { loadStore, saveStore }              from './src/store';
import { useSmsImport, isNativeAvailable }   from './src/utils/useSmsImport';
import { exportCSV }                         from './src/utils/export';
import { colors }                            from './src/utils/theme';

import OverviewScreen      from './src/screens/OverviewScreen';
import TransactionsScreen  from './src/screens/TransactionsScreen';
import AnalyticsScreen     from './src/screens/AnalyticsScreen';
import BudgetScreen        from './src/screens/BudgetScreen';
import SavingsScreen       from './src/screens/SavingsScreen';
import AddTransactionSheet from './src/components/AddTransactionSheet';
import { Toast }           from './src/components/UI';

const TABS = [
  { key: 'overview',     label: 'Overview',     icon: '◎'  },
  { key: 'analytics',    label: 'Analytics',    icon: '📈' },
  { key: 'transactions', label: 'Transactions', icon: '☰'  },
  { key: 'budget',       label: 'Budget',       icon: '⊞'  },
  { key: 'savings',      label: 'Savings',      icon: '🎯' },
];

// ─── screens ────────────────────────────────────────────────────────────────
const SPLASH       = 'splash';       // first-run permission splash
const PASTE_IMPORT = 'paste_import'; // paste SMS text
const MAIN         = 'main';         // main app

export default function App() {
  const [appState,  setAppState]  = useState(null);
  const [screen,    setScreen]    = useState(SPLASH);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAdd,   setShowAdd]   = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [toast,     setToast]     = useState({ msg: '', error: false, visible: false });

  const { requestAndImport, importFromPaste, loading: smsLoading } = useSmsImport();
  const toastTimer = useRef(null);

  // ── boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadStore().then(s => {
      setAppState(s);
      if (s.smsGranted || s.transactions.length > 0) setScreen(MAIN);
    });
  }, []);

  useEffect(() => { if (appState) saveStore(appState); }, [appState]);

  // ── toast ──────────────────────────────────────────────────────────────────
  function showToast(msg, error = false) {
    clearTimeout(toastTimer.current);
    setToast({ msg, error, visible: true });
    toastTimer.current = setTimeout(
      () => setToast(t => ({ ...t, visible: false })), 2800
    );
  }

  // ── state helpers ──────────────────────────────────────────────────────────
  function patch(obj) { setAppState(p => ({ ...p, ...obj })); }

  function goMain(smsGranted = true) {
    patch({ smsGranted });
    setScreen(MAIN);
  }

  // ── SMS: native (standalone APK) ───────────────────────────────────────────
  async function handleNativeImport() {
    const result = await requestAndImport(appState.transactions);
    if (result.error === 'dev_mode') { setScreen(PASTE_IMPORT); return; }
    if (result.error === 'denied')   { showToast('SMS permission denied', true); goMain(); return; }
    if (result.error)                { showToast(result.error, true); goMain(); return; }

    patch({ transactions: result.transactions, smsGranted: true });
    setScreen(MAIN);
    if (result.added > 0)
      showToast(`${result.added} M-Pesa transaction${result.added > 1 ? 's' : ''} imported`);
    else
      showToast('No new transactions found');
  }

  // ── SMS: paste (Expo Go) ───────────────────────────────────────────────────
  function handlePasteImport() {
    if (!pasteText.trim()) { showToast('Paste at least one message', true); return; }
    const result = importFromPaste(pasteText, appState.transactions);
    patch({ transactions: result.transactions, smsGranted: true });
    setPasteText('');
    setScreen(MAIN);
    if (result.added > 0)
      showToast(`${result.added} M-Pesa transaction${result.added > 1 ? 's' : ''} imported`);
    else
      showToast('No M-Pesa messages recognised');
  }

  // ── rescan ────────────────────────────────────────────────────────────────
  async function handleRescan() {
    if (!isNativeAvailable) { setScreen(PASTE_IMPORT); return; }
    showToast('Scanning messages…');
    const result = await requestAndImport(appState.transactions);
    if (result.error) { showToast(result.error, true); return; }
    patch({ transactions: result.transactions });
    showToast(result.added > 0 ? `${result.added} new transaction${result.added > 1 ? 's' : ''}` : 'Already up to date');
  }

  // ── transactions ──────────────────────────────────────────────────────────
  function addTransaction(txn) {
    const t = { ...txn, id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, source: 'manual' };
    patch({ transactions: [...appState.transactions, t] });
    showToast('Transaction saved');
  }
  function deleteTransaction(id) {
    patch({ transactions: appState.transactions.filter(t => t.id !== id) });
  }
  function saveBudget(budget) {
    const list = [...appState.budgets];
    const idx  = list.findIndex(b => b.category === budget.category);
    if (idx > -1) list[idx] = { ...list[idx], limit: budget.limit };
    else list.push({ id: `b_${Date.now()}`, ...budget });
    patch({ budgets: list });
    showToast('Budget saved');
  }
  function deleteBudget(id) { patch({ budgets: appState.budgets.filter(b => b.id !== id) }); }
  function saveGoal(goal)   { patch({ savings: [...appState.savings, { id: `g_${Date.now()}`, ...goal }] }); showToast('Goal saved'); }
  function topUpGoal(id, amount) {
    patch({ savings: appState.savings.map(g => g.id === id ? { ...g, current: Math.min(g.current + amount, g.target) } : g) });
  }
  async function handleExport() {
    try { await exportCSV(appState.transactions); showToast('Export ready'); }
    catch (e) { showToast('Export failed: ' + e.message, true); }
  }

  // ── render guards ──────────────────────────────────────────────────────────
  if (!appState) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  // ── SPLASH ─────────────────────────────────────────────────────────────────
  if (screen === SPLASH) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.splash} edges={['top','bottom']}>
          <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
          <View style={styles.logoBox}>
            <Text style={{ fontSize: 36 }}>📊</Text>
          </View>
          <Text style={styles.splashTitle}>PesaTrack</Text>
          <Text style={styles.splashSub}>Your money, crystal clear.</Text>

          <View style={styles.permCard}>
            <Text style={{ fontSize: 22, marginTop: 2 }}>💬</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.permTitle}>M-Pesa SMS Import</Text>
              <Text style={styles.permDesc}>
                {isNativeAvailable
                  ? 'Tap Allow and PesaTrack will read your M-Pesa inbox automatically. Nothing leaves your device.'
                  : 'Running in Expo Go — tap Continue to paste your M-Pesa messages manually. Build the standalone APK for fully automatic import.'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleNativeImport}
            disabled={smsLoading}
            activeOpacity={0.85}
          >
            {smsLoading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.primaryBtnTxt}>
                  {isNativeAvailable ? 'Allow SMS Access' : 'Continue → Paste Messages'}
                </Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={() => goMain(false)} activeOpacity={0.7}>
            <Text style={styles.ghostBtnTxt}>Skip — add manually</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // ── PASTE IMPORT ───────────────────────────────────────────────────────────
  if (screen === PASTE_IMPORT) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top','bottom']}>
          <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView contentContainerStyle={styles.pasteScreen} keyboardShouldPersistTaps="handled">
              <Text style={styles.pasteTitle}>Paste M-Pesa Messages</Text>
              <Text style={styles.pasteDesc}>
                Open your Messages app, find SMS from <Text style={{ color: colors.accent }}>MPESA</Text>,
                long-press → Copy text, then paste below.
                You can paste multiple messages at once.
              </Text>

              {/* How-to steps */}
              <View style={styles.howTo}>
                {[
                  '1. Open Messages app on your phone',
                  '2. Find messages from MPESA',
                  '3. Long-press a message → Copy',
                  '4. Come back here and paste',
                  '5. Repeat for as many as you want',
                ].map(s => (
                  <Text key={s} style={styles.howToStep}>{s}</Text>
                ))}
              </View>

              <TextInput
                style={styles.pasteInput}
                multiline
                numberOfLines={10}
                placeholder={'Paste M-Pesa messages here…\n\nExample:\nConfirmed. Ksh2,500 sent to Jane Doe on 10/06/2025 at 09:15 AM\n\nYou have received Ksh45,000 from EMPLOYER LTD on 01/06/2025'}
                placeholderTextColor={colors.text3}
                value={pasteText}
                onChangeText={setPasteText}
                textAlignVertical="top"
              />

              <TouchableOpacity style={[styles.primaryBtn, { marginTop: 12 }]} onPress={handlePasteImport} activeOpacity={0.85}>
                <Text style={styles.primaryBtnTxt}>Parse & Import</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.ghostBtn, { marginTop: 10 }]} onPress={() => goMain(false)} activeOpacity={0.7}>
                <Text style={styles.ghostBtnTxt}>Skip for now</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
          <Toast message={toast.msg} error={toast.error} visible={toast.visible} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // ── MAIN APP ───────────────────────────────────────────────────────────────
  const screenProps = { state: appState };
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLogo}>◎</Text>
            <Text style={styles.headerTitle}>PesaTrack</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleRescan} disabled={smsLoading}>
              {smsLoading
                ? <ActivityIndicator color={colors.accent} size="small" />
                : <Text style={{ color: colors.text2, fontSize: 16 }}>↺</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleExport}>
              <Text style={{ color: colors.text2, fontSize: 15 }}>⬇</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.accentDim, borderColor: 'rgba(0,229,160,0.3)' }]}
              onPress={() => setShowAdd(true)}
            >
              <Text style={{ color: colors.accent, fontSize: 22, lineHeight: 24 }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Screens */}
        <View style={{ flex: 1 }}>
          {activeTab === 'overview'     && <OverviewScreen     {...screenProps} />}
          {activeTab === 'analytics'    && <AnalyticsScreen    {...screenProps} />}
          {activeTab === 'transactions' && <TransactionsScreen {...screenProps} onDelete={deleteTransaction} />}
          {activeTab === 'budget'       && <BudgetScreen       {...screenProps} onSaveBudget={saveBudget} onDeleteBudget={deleteBudget} />}
          {activeTab === 'savings'      && <SavingsScreen      {...screenProps} onSaveGoal={saveGoal} onTopUp={topUpGoal} />}
        </View>

        {/* Tab bar */}
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.bg }}>
          <View style={styles.tabBar}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabIcon,  activeTab === tab.key && { color: colors.accent }]}>{tab.icon}</Text>
                <Text style={[styles.tabLabel, activeTab === tab.key && { color: colors.accent }]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>

        <AddTransactionSheet visible={showAdd} onClose={() => setShowAdd(false)} onSave={addTransaction} />
        <Toast message={toast.msg} error={toast.error} visible={toast.visible} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader:  { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },

  // Splash
  splash:       { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  logoBox:      { width: 72, height: 72, borderRadius: 20, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  splashTitle:  { fontSize: 36, fontWeight: '800', letterSpacing: -1, color: colors.accent, marginBottom: 6 },
  splashSub:    { color: colors.text2, fontSize: 15, marginBottom: 36 },
  permCard:     { backgroundColor: colors.bg3, borderRadius: 14, borderWidth: 1, borderColor: colors.border2, padding: 16, flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 24, width: '100%' },
  permTitle:    { color: colors.text, fontWeight: '600', fontSize: 14, marginBottom: 4 },
  permDesc:     { color: colors.text2, fontSize: 12, lineHeight: 18 },
  primaryBtn:   { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 15, width: '100%', alignItems: 'center', marginBottom: 12 },
  primaryBtnTxt:{ color: '#000', fontWeight: '700', fontSize: 16 },
  ghostBtn:     { borderRadius: 10, borderWidth: 1, borderColor: colors.border2, paddingVertical: 13, width: '100%', alignItems: 'center' },
  ghostBtnTxt:  { color: colors.text2, fontSize: 15 },

  // Paste import
  pasteScreen:  { padding: 20, paddingBottom: 40 },
  pasteTitle:   { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 10 },
  pasteDesc:    { color: colors.text2, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  howTo:        { backgroundColor: colors.bg3, borderRadius: 10, padding: 14, marginBottom: 16, gap: 6 },
  howToStep:    { color: colors.text2, fontSize: 13, lineHeight: 20 },
  pasteInput:   { backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border2, borderRadius: 10, color: colors.text, fontSize: 13, padding: 14, minHeight: 180, lineHeight: 20 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerLogo:  { color: colors.accent, fontSize: 20 },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  iconBtn:     { width: 36, height: 36, borderRadius: 8, borderWidth: 0.5, borderColor: colors.border, backgroundColor: colors.bg3, alignItems: 'center', justifyContent: 'center' },

  // Tab bar
  tabBar:   { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: colors.border, paddingTop: 8, paddingBottom: 4 },
  tabItem:  { flex: 1, alignItems: 'center', gap: 2 },
  tabIcon:  { fontSize: 16, color: colors.text3 },
  tabLabel: { fontSize: 9, color: colors.text3, fontWeight: '500' },
});