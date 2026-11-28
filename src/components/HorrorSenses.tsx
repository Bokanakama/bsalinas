import { useEffect, useRef, useState } from "react";
import { Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { horrorFeedback } from "@/lib/horror-feedback";
import type { GameState } from "@/lib/game";
import whisper from "@/assets/esquecidos-sussurro.asset.json";

const defaults = { vibration: false, whispers: false, visuals: true };

/** Local sensory preferences never travel through room state or action queues. */
export function HorrorSenses({ state, playerId }: { state: GameState; playerId: string }) {
  const [settings, setSettings] = useState(defaults);
  const [open, setOpen] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(false);
  const [supported, setSupported] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const { active, lowSanity, lost, heartbeatMs } = horrorFeedback(state, playerId);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem("esquecidos-senses") ?? "null");
      if (saved && typeof saved === "object") {
        const p = saved as Record<string, unknown>;
        setSettings({ vibration: p["vibration"] === true, whispers: p["whispers"] === true, visuals: p["visuals"] !== false });
      }
    } catch { /* Optional storage must not prevent gameplay. */ }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(media.matches);
    const visibility = () => setVisible(document.visibilityState === "visible" && document.hasFocus());
    motion(); visibility(); setSupported(typeof navigator.vibrate === "function");
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("focus", visibility);
    window.addEventListener("blur", visibility);
    return () => {
      media.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("focus", visibility);
      window.removeEventListener("blur", visibility);
    };
  }, []);

  function change(key: keyof typeof defaults, checked: boolean) {
    const next = { ...settings, [key]: checked };
    setSettings(next);
    try { localStorage.setItem("esquecidos-senses", JSON.stringify(next)); } catch { /* Optional. */ }
    // Establish playback permission inside the user's gesture, not on a timer.
    if (key === "whispers" && checked) {
      audio.current ??= new Audio(whisper.url);
      const clip = audio.current;
      clip.volume = lowSanity && active ? .18 : 0;
      setAudioBlocked(false);
      void clip.play().then(() => { if (!(lowSanity && active)) { clip.pause(); clip.currentTime = 0; } }).catch(() => setAudioBlocked(true));
    }
  }

  useEffect(() => {
    if (!active || !visible || !settings.vibration || reduced || !supported || !heartbeatMs || open) return;
    const beat = () => { try { navigator.vibrate([45, 80, 45]); } catch { /* Unsupported device. */ } };
    beat(); const timer = setInterval(beat, heartbeatMs);
    return () => { clearInterval(timer); try { navigator.vibrate(0); } catch { /* Optional. */ } };
  }, [active, visible, settings.vibration, reduced, supported, heartbeatMs, open]);

  useEffect(() => {
    if (!active || !visible || !lowSanity || lost || !settings.whispers || open) {
      audio.current?.pause();
      return;
    }
    const play = () => {
      audio.current ??= new Audio(whisper.url);
      audio.current.volume = .18;
      audio.current.currentTime = 0;
      void audio.current.play().catch(() => setAudioBlocked(true));
    };
    const start = setTimeout(play, 6000);
    const timer = setInterval(play, 35000);
    return () => { clearTimeout(start); clearInterval(timer); audio.current?.pause(); };
  }, [active, visible, lowSanity, lost, settings.whispers, open]);

  useEffect(() => () => { if (audio.current) { audio.current.pause(); audio.current.removeAttribute("src"); audio.current.load(); audio.current = null; } }, []);

  return <>
    <Button variant="outline" size="icon" aria-label="Efeitos de terror" title="Efeitos de terror" onClick={() => setOpen(true)}><Settings2 /></Button>
    {active && lowSanity && settings.visuals && !reduced && visible && !open && <div aria-hidden="true" className="sanity-static" />}
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4"><section role="dialog" aria-modal="true" aria-label="Efeitos de terror" className="w-full max-w-sm rounded-lg border border-border bg-card p-5"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-xl">Efeitos de terror</h2><Button autoFocus variant="ghost" size="icon" aria-label="Fechar efeitos" onClick={() => setOpen(false)}><X /></Button></div><div className="space-y-5">{([
      ["vibration", "Batimento no celular"], ["whispers", "Sussurros"], ["visuals", "Bordas de baixa sanidade"],
    ] as const).map(([key, label]) => <label key={key} className="flex items-center justify-between gap-3 text-sm"><span>{label}</span><Switch aria-label={label} checked={settings[key]} disabled={key === "vibration" && (!supported || reduced)} onCheckedChange={(checked) => change(key, checked)} /></label>)}</div>{!supported && <p className="mt-4 text-xs text-muted-foreground">Este navegador não oferece vibração.</p>}{reduced && <p className="mt-4 text-xs text-muted-foreground">Movimento reduzido: bordas animadas e batimento desativados.</p>}{audioBlocked && <p role="status" className="mt-4 text-xs text-destructive">O navegador bloqueou o som. Desative e ative os sussurros para tentar novamente.</p>}<Button variant="secondary" className="mt-5 w-full" onClick={() => setOpen(false)}>Voltar à partida</Button></section></div>}
  </>;
}