import coelho from "@/assets/coelho.webp";
import gato from "@/assets/gato.webp";
import coala from "@/assets/coala.webp";
import panda from "@/assets/panda.webp";
import cachorro from "@/assets/cachorro.webp";
import capivara from "@/assets/capivara.webp";
import tucano from "@/assets/tucano.webp";
import arara from "@/assets/arara.webp";
import macaco from "@/assets/macaco.webp";
import boto from "@/assets/boto.webp";
import preguica from "@/assets/preguica.webp";
import pato from "@/assets/pato.webp";
import { ANIMALS } from "@/lib/game";

const IMG: Record<string, string> = { coelho, gato, coala, panda, cachorro, capivara, tucano, arara, macaco, boto, preguica, pato };

export function Animal({ id, className = "", alt, badge }: { id: string | undefined; className?: string; alt?: string; badge?: boolean }) {
  const name = ANIMALS.find((a) => a.id === id)?.name ?? "Personagem";
  const color = ANIMALS.find((a) => a.id === id)?.color;
  const style = badge && color ? { backgroundColor: color, borderRadius: 9999, padding: "6%", boxShadow: "0 0 0 2px var(--card)" } : undefined;
  return <img style={style} src={IMG[id ?? ""] ?? coelho} alt={alt ?? name} width={320} height={320} decoding="async" loading="eager" draggable={false} className={`object-contain drop-shadow-[0_3px_0_var(--foreground)] ${className}`} />;
}
