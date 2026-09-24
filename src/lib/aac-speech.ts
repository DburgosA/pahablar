type NativeSpeech = {
  speak: (options: { text: string; lang?: string; rate?: number; pitch?: number }) => Promise<void>;
};

function nativeSpeech(): NativeSpeech | null {
  const plugins = (window as Window & { Capacitor?: { Plugins?: { TextToSpeech?: NativeSpeech } } }).Capacitor?.Plugins;
  return plugins?.TextToSpeech ?? null;
}

export async function speakSpanish(text: string): Promise<void> {
  const native = nativeSpeech();
  if (native) {
    try {
      await native.speak({ text, lang: 'es-ES', rate: 0.88, pitch: 1 });
      return;
    } catch {
      // Continue with the browser fallback when the Android voice engine is unavailable.
    }
  }
  if (!('speechSynthesis' in window)) throw new Error('La voz no está disponible');
  window.speechSynthesis.cancel();
  await new Promise<void>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.88;
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error('No se pudo reproducir la voz'));
    window.speechSynthesis.speak(utterance);
  });
}