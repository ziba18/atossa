// Share PDF / Print for the doctor summary. Native: expo-print + expo-sharing (both in Expo Go).
// Web (design preview): expo-print's web build prints the whole app window, so instead the
// document HTML is printed from a hidden iframe (the browser dialog can "Save as PDF").
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const A4_PT = { width: 595, height: 842 };
// iOS ignores @page margins in expo-print; it takes them here instead (≈14 mm / 12 mm).
const IOS_MARGINS = { top: 40, bottom: 34, left: 40, right: 40 };

/** Print one HTML document from a hidden iframe (web only). Returns false if not possible. */
function printHtmlOnWeb(html: string): boolean {
  if (typeof document === 'undefined') return false;
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(frame);
  const win = frame.contentWindow;
  if (!win) { frame.remove(); return false; }
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
    setTimeout(() => frame.remove(), 1000);
  }, 250);
  return true;
}

// The PDF holds the user's health notes. It is not deleted right after the share sheet closes (an
// AirDrop or "Save to Files" may still be reading it), so the previous one is removed the next time
// a PDF is made, and by `deleteLastSharedPdf` at sign-out.
let lastPdfUri: string | null = null;

export async function deleteLastSharedPdf(): Promise<void> {
  const uri = lastPdfUri;
  lastPdfUri = null;
  if (!uri || Platform.OS === 'web') return;
  try {
    const { File } = await import('expo-file-system');
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {}
}

/**
 * Make the PDF and open the share sheet. `onReady` fires once the file exists (success haptic +
 * toast), before the share sheet opens. Throws on failure (caller shows InlineError).
 */
export async function shareSummaryPdf(html: string, title: string, onReady: () => void): Promise<void> {
  if (Platform.OS === 'web') {
    if (!printHtmlOnWeb(html)) throw new Error('print unavailable');
    onReady();
    return;
  }
  await deleteLastSharedPdf();
  const { uri } = await Print.printToFileAsync({ html, ...A4_PT, margins: IOS_MARGINS });
  lastPdfUri = uri;
  onReady();
  if (!(await Sharing.isAvailableAsync())) throw new Error('sharing unavailable');
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
}

/** System print dialog for the document only. Throws on failure. */
export async function printSummary(html: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (!printHtmlOnWeb(html)) throw new Error('print unavailable');
    return;
  }
  await Print.printAsync({ html, ...A4_PT, margins: IOS_MARGINS });
}
