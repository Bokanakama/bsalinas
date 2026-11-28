import type { CityEventKind, LuckCard, Square } from "./game";
import { BORO_BOARD } from "./boro";

export const ALTARS = [0, 17, 28, 45] as const;
export const FOG_MS = 90_000;
export const CRISIS_MS = 8 * FOG_MS;
export const SEAL_REWARD = 250;
export const PENALTY_PER_SEAL = 15;
export const SHIFT_MIN_MS = 45_000;
export const SHIFT_MAX_MS = 90_000;
export const GHOST_MIN_MS = 15_000;
export const GHOST_MAX_MS = 30_000;
export const GHOST_TRIBUTE = 50;
export const CURSE_ROUND = 8;
export const RITUAL_COST = 200;
export const CURSE_MESSAGE = "Vocês não foram escolhidos para comprar esta cidade. Foram escolhidos para permanecer nela.";
export interface Curse {
  stage: "awake" | "escaped" | "forgotten";
  /** Missing version denotes the original terminal ritual. */
  version?: 2;
  deadline?: number;
  resolvedAt?: number;
  penaltyRate?: number;
  lastSealRollId?: number;
  layout?: number[];
  nextShiftAt?: number;
  shifts?: number;
  lastShift?: [number, number];
  ghost?: number;
  nextGhostAt?: number;
  awakenedAt: number;
  nextFogAt: number;
  fogGroups: number[];
  consumed: number[];
  altars: Record<string, string>;
  sanity: Record<string, number>;
  torches: Record<string, number>;
  clue: number;
  order: number[];
}

const NAMES = [
  "Altar do Início", "Beco da Neblina", "Ponte dos Sussurros", "Rua Sem Nome", "Tributo das Sombras", "Bonde das Almas",
  "Praça do Relógio Parado", "Carta dos Esquecidos", "Casa das Fotografias", "Banca do Último Jornal", "Vila dos Retratos", "Dívida do Passado",
  "Orfanato Abandonado", "Usina Silenciosa", "Pátio das Bonecas", "Escola Sem Voz", "Baú das Memórias", "Masmorra Esquecida",
  "Estação Fantasma", "Solar dos Corvos", "Carta dos Esquecidos", "Jardim das Estátuas", "Mansão da Janela Acesa", "Carta dos Esquecidos",
  "Casa do Último Morador", "Passagem das Correntes", "Taxa do Esquecimento", "Carta dos Esquecidos", "Santuário em Ruínas", "Asilo do Esquecimento",
  "Carta dos Esquecidos", "Hospital das Portas Fechadas", "Sanatório do Eco", "Enfermaria 13", "Barca Sem Piloto", "Teatro das Máscaras",
  "Cinema da Meia-Noite", "Farol Apagado", "Hotel dos Ausentes", "Banquete dos Corvos", "Palácio do Silêncio", "Contrato da Eternidade",
  "Cripta da Família Real", "Cemitério das Chaves", "Capela dos Nomes", "O Abismo", "Trem do Último Adeus", "Moeda da Saudade",
  "Torre do Vigia", "Carta dos Esquecidos", "Imposto da Eternidade", "Arquivo dos Desaparecidos", "Herança Sem Dono", "Carta dos Esquecidos",
  "Túnel do Retorno", "Portão da Cidade",
];
export const ESQUECIDOS_BOARD: Square[] = BORO_BOARD.map((sq, i) => ({ ...sq, name: NAMES[i] ?? sq.name }));
export const ESQUECIDOS_CARDS: LuckCard[] = [
  { text: "Uma carta endereçada a você, datada de cem anos atrás", amount: 100 },
  { text: "O retrato na parede agora tem seu rosto", amount: -60 },
  { text: "O relojoeiro vendeu um minuto que nunca passa", amount: 80 },
  { text: "Uma voz no telefone cobra uma dívida esquecida", amount: -100 },
  { text: "As moedas do poço voltaram para seu bolso", amount: 150 },
  { text: "As portas da casa respiram. Pague o carpinteiro", amount: -90 },
  { text: "O trem vazio te leva ao Altar do Início", amount: 0, goto: 0, passStart: true },
  { text: "Uma chave de osso abre as correntes da Masmorra", amount: 0, freeJail: true },
  { text: "Seu nome apareceu no livro dos desaparecidos", amount: 0, jail: true },
  { text: "O último morador deixou uma herança em Borós", amount: 200 },
  { text: "Os corvos levaram suas moedas", amount: -70 },
  { text: "Uma fotografia revela um tesouro sob a praça", amount: 120 },
];
export const ESQUECIDOS_EVENTS: { kind: CityEventKind; text: string }[] = [
  { kind: "feriado", text: "O último bonde: os transportes cobram o triplo por 1 rodada." },
  { kind: "temporal", text: "Silêncio nas criptas: o bairro das capelas não cobra aluguel por 1 rodada." },
  { kind: "padroeira", text: "Relógio ao contrário: o Altar do Início paga B$ 400 por 2 minutos." },
];