import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function exportCSV(transactions) {
  const header = ['Date', 'Type', 'Description', 'Category', 'Amount (KES)', 'Source'];
  const rows   = transactions
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(t => [t.date, t.type, t.description, t.category, t.amount, t.source || 'manual']);

  const csv = [header, ...rows]
    .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const filename = `pesatrack_${new Date().toISOString().split('T')[0]}.csv`;
  const uri      = FileSystem.documentDirectory + filename;

  await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export PesaTrack data' });
  }

  return uri;
}
