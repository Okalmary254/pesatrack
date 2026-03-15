import { useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { processMessages } from './mpesa';

// react-native-get-sms-android only works in a custom dev build / standalone APK.
// In Expo Go this module is not bundled, so we detect and handle gracefully.
let SmsAndroid = null;
try {
  SmsAndroid = require('react-native-get-sms-android').default;
} catch (_) {}

export const isNativeAvailable = !!SmsAndroid;

export function useSmsImport() {
  const [loading, setLoading] = useState(false);

  // Called when user taps "Allow SMS Access" on splash
  async function requestAndImport(existingTransactions) {
    if (Platform.OS !== 'android') {
      return { transactions: existingTransactions, added: 0, error: 'ios' };
    }

    // Expo Go — native module not bundled, must use paste import
    if (!SmsAndroid) {
      return { transactions: existingTransactions, added: 0, error: 'dev_mode' };
    }

    // ── Standalone APK / custom dev build ──────────────────────────────────
    setLoading(true);
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title:          'M-Pesa SMS Access',
          message:        'PesaTrack reads your M-Pesa messages to log transactions automatically. Nothing leaves your device.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        setLoading(false);
        return { transactions: existingTransactions, added: 0, error: 'denied' };
      }

      const messages = await readMpesaSms();
      const result   = processMessages(messages, existingTransactions);
      setLoading(false);
      return result;
    } catch (e) {
      setLoading(false);
      return { transactions: existingTransactions, added: 0, error: e.message };
    }
  }

  // Called from paste-import screen with raw text the user copied
  function importFromPaste(rawText, existingTransactions) {
    // Split on blank lines or "---" separators so multiple messages can be pasted at once
    const chunks = rawText
      .split(/\n{2,}|---+/)
      .map(s => s.trim())
      .filter(Boolean);

    const messages = chunks.map(body => ({ body }));
    return processMessages(messages, existingTransactions);
  }

  return { requestAndImport, importFromPaste, loading };
}

function readMpesaSms() {
  return new Promise((resolve, reject) => {
    SmsAndroid.list(
      JSON.stringify({ box: 'inbox', address: 'MPESA', maxCount: 1000 }),
      err  => reject(new Error(err)),
      (_n, list) => {
        try { resolve(JSON.parse(list)); }
        catch (e) { reject(e); }
      }
    );
  });
}