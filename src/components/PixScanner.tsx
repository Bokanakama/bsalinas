import { useEffect, useRef, useState } from "react";

/** Opens the rear camera and reports decoded QR text. */
export function PixScanner({ onScan }: { onScan: (text: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stop = false;
    (async () => {
      try {
        const jsQR = (await import("jsqr")).default;
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const v = video.current!;
        v.srcObject = stream;
        await v.play();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        const tick = () => {
          if (stop) return;
          if (v.videoWidth) {
            canvas.width = v.videoWidth; canvas.height = v.videoHeight;
            ctx.drawImage(v, 0, 0);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const r = jsQR(img.data, img.width, img.height);
            if (r?.data) { onScan(r.data); }
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setErr("Não foi possível abrir a câmera.");
      }
    })();
    return () => { stop = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, [onScan]);
  return (
    <div className="relative overflow-hidden rounded-xl border-4 border-border bg-foreground">
      <video ref={video} playsInline muted className="aspect-square w-full object-cover" />
      <div className="pointer-events-none absolute inset-8 rounded-lg border-4 border-dashed border-secondary" />
      {err && <p className="absolute inset-x-0 bottom-2 text-center text-sm font-bold text-secondary">{err}</p>}
    </div>
  );
}
