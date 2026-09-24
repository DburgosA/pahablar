import { type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertTriangle, Check, ChevronDown, ChevronUp, GripVertical, Pencil, Plus, Settings2, Trash2, Volume2, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { loadPhrases, savePhrases, type Phrase, type PhraseColor } from '@/lib/aac-storage';
import { speakSpanish } from '@/lib/aac-speech';

const queryClient = new QueryClient();

const COLORS: Array<{ value: PhraseColor; label: string; css: string }> = [
  { value: 'teal', label: 'Verde agua', css: '173 45% 36%' },
  { value: 'blue', label: 'Azul', css: '207 62% 48%' },
  { value: 'amber', label: 'Amarillo', css: '38 83% 55%' },
  { value: 'coral', label: 'Coral', css: '8 69% 58%' },
  { value: 'violet', label: 'Violeta', css: '263 44% 56%' },
  { value: 'plain', label: 'Sin color', css: '211 19% 52%' },
];

function colorValue(color: PhraseColor): string {
  return COLORS.find((option) => option.value === color)?.css ?? COLORS[0].css;
}

function AppIcon({ size = 22 }: { size?: number }) {
  return <Volume2 size={size} strokeWidth={2.2} aria-hidden="true" />;
}

function PhraseCard({
  phrase,
  selected,
  organizing,
  onSpeak,
  onManage,
  onDelete,
  onMove,
}: {
  phrase: Phrase;
  selected: boolean;
  organizing: boolean;
  onSpeak: (phrase: Phrase) => void;
  onManage: (phrase: Phrase) => void;
  onDelete: (phrase: Phrase) => void;
  onMove: (phrase: Phrase, direction: 'up' | 'down') => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const clearPress = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const startPress = () => {
    longPressed.current = false;
    timer.current = setTimeout(() => {
      longPressed.current = true;
      onManage(phrase);
    }, 680);
  };
  const finishPress = () => clearPress();

  return (
    <article className="relative" style={{ '--phrase-color': colorValue(phrase.color) } as React.CSSProperties} data-testid={`card-phrase-${phrase.id}`}>
      <button
        type="button"
        className={`phrase-button ${selected ? 'is-selected' : ''}`}
        onPointerDown={startPress}
        onPointerUp={finishPress}
        onPointerCancel={finishPress}
        onPointerLeave={finishPress}
        onClick={() => { if (!longPressed.current) onSpeak(phrase); }}
        aria-label={`Decir: ${phrase.text}. Mantén pulsado para editar`}
        data-testid={`button-speak-${phrase.id}`}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[1.35rem] font-semibold leading-tight sm:text-[1.5rem]">{phrase.text}</span>
          <span className="mt-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <AppIcon size={16} /> Toca para decir
          </span>
        </span>
        {organizing && <GripVertical className="drag-handle ml-3 shrink-0" size={26} aria-hidden="true" />}
      </button>
      {organizing && (
        <div className="mt-2 flex items-center justify-end gap-2">
          <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground hover:bg-secondary" onClick={() => onMove(phrase, 'up')} aria-label={`Mover ${phrase.text} arriba`} data-testid={`button-move-up-${phrase.id}`}>
            <ChevronUp size={18} /> Arriba
          </button>
          <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground hover:bg-secondary" onClick={() => onMove(phrase, 'down')} aria-label={`Mover ${phrase.text} abajo`} data-testid={`button-move-down-${phrase.id}`}>
            <ChevronDown size={18} /> Abajo
          </button>
          <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground hover:bg-secondary" onClick={() => onManage(phrase)} data-testid={`button-edit-${phrase.id}`}>
            <Pencil size={17} /> Editar
          </button>
          <button type="button" className="inline-flex min-h-11 w-11 items-center justify-center rounded-xl border border-destructive/30 bg-card text-destructive hover:bg-destructive/10" onClick={() => onDelete(phrase)} aria-label={`Borrar ${phrase.text}`} data-testid={`button-delete-${phrase.id}`}>
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </article>
  );
}

function PhraseActionsDialog({
  phrase,
  onClose,
  onEdit,
  onDelete,
}: {
  phrase: Phrase;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-panel max-w-md" role="dialog" aria-modal="true" aria-labelledby="phrase-actions-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.12em] text-primary">Opciones de frase</p>
            <h2 id="phrase-actions-title" className="mt-1 text-2xl font-bold">{phrase.text}</h2>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Cerrar opciones" data-testid="button-close-phrase-actions"><X size={24} /></button>
        </div>
        <div className="mt-7 grid gap-3">
          <button type="button" onClick={onEdit} className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-border px-4 text-left text-lg font-bold hover:bg-secondary" data-testid="button-longpress-edit"><Pencil size={22} className="text-primary" /> Editar frase</button>
          <button type="button" onClick={onDelete} className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-destructive/25 px-4 text-left text-lg font-bold text-destructive hover:bg-destructive/10" data-testid="button-longpress-delete"><Trash2 size={22} /> Borrar frase</button>
        </div>
      </section>
    </div>
  );
}

function PhraseDialog({
  phrase,
  onClose,
  onSave,
}: {
  phrase: Phrase | null;
  onClose: () => void;
  onSave: (text: string, color: PhraseColor) => void;
}) {
  const [text, setText] = useState(phrase?.text ?? '');
  const [color, setColor] = useState<PhraseColor>(phrase?.color ?? 'teal');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = text.trim();
    if (clean.length > 0) onSave(clean, color);
  };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="phrase-dialog-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.12em] text-primary">{phrase ? 'Cambiar frase' : 'Nueva frase'}</p>
            <h2 id="phrase-dialog-title" className="mt-1 text-2xl font-bold">{phrase ? 'Edita lo que necesitas decir' : '¿Qué quieres poder decir?'}</h2>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Cerrar" data-testid="button-close-dialog"><X size={24} /></button>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-6">
          <div>
            <label htmlFor="phrase-text" className="mb-2 block text-base font-bold">Frase</label>
            <input ref={inputRef} id="phrase-text" value={text} onChange={(event) => setText(event.target.value)} maxLength={120} placeholder="Por ejemplo: Necesito agua" className="min-h-16 w-full rounded-2xl border-2 border-input bg-background px-4 text-xl text-foreground shadow-sm placeholder:text-muted-foreground/70" data-testid="input-phrase-text" />
            <p className="mt-2 text-sm text-muted-foreground">{text.length}/120 caracteres</p>
          </div>
          <fieldset>
            <legend className="mb-3 text-base font-bold">Color opcional</legend>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Color de la frase">
              {COLORS.map((option) => (
                <button key={option.value} type="button" className="color-swatch" style={{ backgroundColor: `hsl(${option.css})` }} aria-label={option.label} aria-checked={color === option.value} role="radio" onClick={() => setColor(option.value)} data-testid={`button-color-${option.value}`} />
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="min-h-14 rounded-2xl border-2 border-border px-6 text-lg font-bold text-foreground hover:bg-secondary" data-testid="button-cancel-dialog">Cancelar</button>
            <button type="submit" disabled={!text.trim()} className="min-h-14 rounded-2xl bg-primary px-7 text-lg font-bold text-primary-foreground shadow-md hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-save-phrase"><Check size={21} className="mr-2 inline" />Guardar frase</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ConfirmDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel max-w-md" role="alertdialog" aria-modal="true" aria-labelledby="clear-dialog-title">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"><AlertTriangle size={26} /></div>
        <h2 id="clear-dialog-title" className="mt-4 text-2xl font-bold">Borrar todas las frases</h2>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">Esta acción no se puede deshacer. Se eliminarán todas las frases guardadas en este dispositivo.</p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="min-h-14 rounded-2xl border-2 border-border px-6 text-lg font-bold hover:bg-secondary" data-testid="button-cancel-clear">Conservar frases</button>
          <button type="button" onClick={onConfirm} className="min-h-14 rounded-2xl bg-destructive px-6 text-lg font-bold text-destructive-foreground hover:brightness-105" data-testid="button-confirm-clear">Sí, borrar todo</button>
        </div>
      </section>
    </div>
  );
}

function Home() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [selected, setSelected] = useState<Phrase | null>(null);
  const [dialogPhrase, setDialogPhrase] = useState<Phrase | null | undefined>(undefined);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [actionPhrase, setActionPhrase] = useState<Phrase | null>(null);
  const [organizing, setOrganizing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ message: string; error?: boolean } | null>(null);
  const [quickPhrase, setQuickPhrase] = useState('');
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (message: string, error = false) => {
    setFeedback({ message, error });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 3200);
  };

  useEffect(() => {
    loadPhrases().then((items) => {
      setPhrases(items);
      setIsLoading(false);
    });
  }, []);

  const persist = async (next: Phrase[], message: string) => {
    setPhrases(next);
    try {
      await savePhrases(next);
      notify(message);
    } catch {
      notify('No se pudo guardar. Inténtalo de nuevo.', true);
    }
  };

  const speak = async (phrase: Phrase) => {
    setSelected(phrase);
    try {
      await speakSpanish(phrase.text);
      notify('Frase reproducida');
    } catch {
      notify('No se pudo reproducir la voz.', true);
    }
  };

  const playQuickPhrase = async () => {
    const clean = quickPhrase.trim();
    if (!clean) return;
    try {
      await speakSpanish(clean);
      notify('Frase reproducida');
    } catch {
      notify('No se pudo reproducir la voz.', true);
    }
  };

  const savePhrase = (text: string, color: PhraseColor) => {
    if (dialogPhrase) {
      const updated = { ...dialogPhrase, text, color };
      const next = phrases.map((item) => item.id === dialogPhrase.id ? updated : item);
      void persist(next, 'Frase actualizada');
      if (selected?.id === dialogPhrase.id) setSelected(updated);
    } else {
      const created = { id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, text, color, createdAt: Date.now() };
      void persist([...phrases, created], 'Frase guardada');
    }
    setDialogPhrase(undefined);
  };

  const deletePhrase = (phrase: Phrase) => {
    if (!window.confirm(`¿Borrar la frase «${phrase.text}»?`)) return;
    const next = phrases.filter((item) => item.id !== phrase.id);
    void persist(next, 'Frase borrada');
    if (selected?.id === phrase.id) setSelected(null);
  };

  const movePhrase = (phrase: Phrase, direction: 'up' | 'down') => {
    const index = phrases.findIndex((item) => item.id === phrase.id);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= phrases.length) return;
    const next = [...phrases];
    [next[index], next[target]] = [next[target], next[index]];
    void persist(next, 'Orden guardado');
  };

  const clearAll = () => {
    void persist([], 'Todas las frases fueron borradas');
    setSelected(null);
    setConfirmClear(false);
    setShowSettings(false);
  };

  return (
    <div className="app-shell">
      <main className="mx-auto max-w-6xl px-4 pb-32 pt-8 sm:px-8 sm:pt-10">
        <section className="mx-auto mb-8 max-w-4xl rounded-[1.6rem] border-2 border-border bg-card px-5 py-5 shadow-sm sm:px-8 sm:py-7" aria-labelledby="quick-phrase-title">
          <h1 id="quick-phrase-title" className="text-2xl font-bold sm:text-3xl">Escribir una frase</h1>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              id="quick-phrase"
              value={quickPhrase}
              onChange={(event) => setQuickPhrase(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  void playQuickPhrase();
                }
              }}
              maxLength={120}
              placeholder="Escribe lo que quieres decir"
              className="min-h-16 min-w-0 flex-1 rounded-2xl border-2 border-input bg-background px-4 text-xl text-foreground shadow-sm placeholder:text-muted-foreground/70"
              aria-label="Frase para reproducir sin guardar"
              data-testid="input-quick-phrase"
            />
            <button
              type="button"
              onClick={() => void playQuickPhrase()}
              disabled={!quickPhrase.trim()}
              className="inline-flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-primary px-6 text-lg font-bold text-primary-foreground shadow-md hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
              data-testid="button-play-quick-phrase"
            >
              <Volume2 size={23} /> Reproducir
            </button>
          </div>
        </section>

        {selected && (
          <section className="mx-auto mb-8 max-w-4xl rounded-[1.6rem] border-2 border-primary/20 bg-card px-5 py-5 shadow-[0_10px_30px_hsl(173_45%_31%_/_0.1)] sm:px-8 sm:py-7" aria-live="polite" data-testid="selected-phrase-display">
            <p className="text-sm font-bold uppercase tracking-[.13em] text-primary">Última frase</p>
            <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-3xl font-bold leading-tight sm:text-4xl">{selected.text}</p>
              <button type="button" onClick={() => void speak(selected)} className="inline-flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-2xl bg-primary px-6 text-lg font-bold text-primary-foreground shadow-md hover:brightness-105" data-testid="button-repeat-selected"><Volume2 size={23} /> Repetir</button>
            </div>
          </section>
        )}

        <section className="mx-auto mt-10 max-w-4xl" aria-labelledby="phrases-title">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h1 id="phrases-title" className="text-3xl font-bold sm:text-4xl">Mis frases</h1>
              {!isLoading && phrases.length > 0 && <p className="mt-1 text-sm font-medium text-muted-foreground">{phrases.length} {phrases.length === 1 ? 'frase guardada' : 'frases guardadas'}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setOrganizing((value) => !value)} className={`inline-flex h-12 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors ${organizing ? 'bg-primary text-primary-foreground' : 'border-2 border-border bg-card text-foreground hover:bg-secondary'}`} aria-pressed={organizing} aria-label={organizing ? 'Terminar de organizar' : 'Organizar frases'} title={organizing ? 'Terminar' : 'Organizar'} data-testid="button-toggle-organize"><GripVertical size={19} /><span className="hidden sm:inline">{organizing ? 'Terminar' : 'Organizar'}</span></button>
              <button type="button" onClick={() => setShowSettings(true)} className="inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border bg-card text-foreground hover:bg-secondary" aria-label="Ajustes" title="Ajustes" data-testid="button-open-settings"><Settings2 size={21} /></button>
            </div>
          </div>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2" aria-label="Cargando frases">
              {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-[1.35rem] bg-secondary" />)}
            </div>
          ) : phrases.length === 0 ? (
            <div className="rounded-[1.6rem] border-2 border-dashed border-primary/30 bg-card/75 px-6 py-12 text-center sm:px-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary"><Plus size={32} /></div>
              <h3 className="mt-5 text-2xl font-bold">Aún no tienes frases</h3>
              <button type="button" onClick={() => setDialogPhrase(null)} className="mt-7 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-lg font-bold text-primary-foreground shadow-md hover:brightness-105" data-testid="button-empty-add"><Plus size={23} /> Crear frase</button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {phrases.map((phrase) => <PhraseCard key={phrase.id} phrase={phrase} selected={selected?.id === phrase.id} organizing={organizing} onSpeak={(item) => void speak(item)} onManage={(item) => setActionPhrase(item)} onDelete={deletePhrase} onMove={movePhrase} />)}
            </div>
          )}
        </section>

      </main>

      <button type="button" onClick={() => setDialogPhrase(null)} className="fixed bottom-6 right-5 z-20 inline-flex min-h-16 items-center gap-3 rounded-2xl bg-accent px-5 text-lg font-bold text-accent-foreground shadow-[0_8px_22px_hsl(35_82%_40%_/_0.28)] transition-transform hover:-translate-y-1 sm:bottom-8 sm:right-8" data-testid="button-add-phrase"><Plus size={26} strokeWidth={2.5} /> <span>Crear frase</span></button>

      {feedback && <div className={`status-toast fixed bottom-28 left-1/2 z-40 -translate-x-1/2 rounded-xl px-4 py-3 text-sm font-bold shadow-lg ${feedback.error ? 'bg-destructive text-destructive-foreground' : 'bg-foreground text-background'}`} role="status" data-testid="status-feedback">{feedback.message}</div>}

      {dialogPhrase !== undefined && <PhraseDialog phrase={dialogPhrase} onClose={() => setDialogPhrase(undefined)} onSave={savePhrase} />}
      {actionPhrase && <PhraseActionsDialog phrase={actionPhrase} onClose={() => setActionPhrase(null)} onEdit={() => { setDialogPhrase(actionPhrase); setActionPhrase(null); }} onDelete={() => { deletePhrase(actionPhrase); setActionPhrase(null); }} />}
      {confirmClear && <ConfirmDialog onClose={() => setConfirmClear(false)} onConfirm={clearAll} />}
      {showSettings && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowSettings(false); }}>
          <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <div className="flex items-start justify-between gap-4">
              <h2 id="settings-title" className="text-2xl font-bold">Ajustes</h2>
              <button type="button" onClick={() => setShowSettings(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary" aria-label="Cerrar ajustes" data-testid="button-close-settings"><X size={24} /></button>
            </div>
            <div className="mt-7 space-y-4">
              <button type="button" onClick={() => setConfirmClear(true)} disabled={phrases.length === 0} className="flex min-h-14 w-full items-center justify-between rounded-2xl border-2 border-destructive/25 px-4 text-left font-bold text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-open-clear"><span>Borrar todas las frases</span><Trash2 size={21} /></button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;