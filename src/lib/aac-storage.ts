export type PhraseColor = 'teal' | 'blue' | 'amber' | 'coral' | 'violet' | 'plain';

export type Phrase = {
  id: string;
  text: string;
  color: PhraseColor;
  createdAt: number;
};

const KEY = 'comunicador-aac-phrases-v1';

type NativePreferences = {
  get: (options: { key: string }) => Promise<{ value: string | null }>;
  set: (options: { key: string; value: string }) => Promise<void>;
};

function nativePreferences(): NativePreferences | null {
  const plugins = (window as Window & { Capacitor?: { Plugins?: { Preferences?: NativePreferences } } }).Capacitor?.Plugins;
  return plugins?.Preferences ?? null;
}

export async function loadPhrases(): Promise<Phrase[]> {
  let stored: string | null = null;
  try {
    const native = nativePreferences();
    stored = native
      ? (await native.get({ key: KEY })).value
      : window.localStorage.getItem(KEY);
  } catch {
    stored = window.localStorage.getItem(KEY);
  }
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is Phrase =>
      typeof item === 'object' && item !== null &&
      typeof (item as Phrase).id === 'string' &&
      typeof (item as Phrase).text === 'string' &&
      typeof (item as Phrase).createdAt === 'number'
    );
  } catch {
    return [];
  }
}

export async function savePhrases(phrases: Phrase[]): Promise<void> {
  const value = JSON.stringify(phrases);
  const native = nativePreferences();
  try {
    if (native) {
      await native.set({ key: KEY, value });
    } else {
      window.localStorage.setItem(KEY, value);
    }
  } catch {
    window.localStorage.setItem(KEY, value);
  }
}