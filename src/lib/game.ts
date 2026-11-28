import { ALTARS, CURSE_MESSAGE, CURSE_ROUND, ESQUECIDOS_BOARD, ESQUECIDOS_CARDS, ESQUECIDOS_EVENTS, FOG_MS, RITUAL_COST, type Curse } from "./esquecidos";
import { BORO_BOARD, BORO_CARDS, BORO_EVENTS } from "./boro";
import { BEAST_BITE, BEAST_START, RELIC_NAMES, RELIC_SQUARES, RELIC_STEAL, SELVA_BOARD, SELVA_CARDS, SELVA_EVENTS } from "./selva";
// Pure game rules for Banco Imobiliário Salinas. The master device is the only writer of GameState.
export type SquareKind = "start" | "property" | "toll" | "fine" | "bonus" | "rest" | "luck" | "gojail" | "samba";
export interface Square {
  name: string;
  kind: SquareKind;
  price?: number;
  rent?: number;
  amount?: number;
  group?: number;
  /** Selva: index of the relic found on this square. */
  relic?: number;
}

export const START_BONUS = 200;
export const START_BALANCE = 1500;
export const CURRENCY = "B$";
export const JAIL = 17;
export const GOJAIL = 45;
export const JAIL_FINE = 50;
export const JAIL_TURNS = 3;
/** Rent multiplier by number of barraquinhas (4 = Sobrado). */
export const HOUSE_MULT = [1, 5, 15, 30, 45];
export const MAX_HOUSES = 4;
export const AUCTION_MS = 15000;
export const AUCTION_STEP = 10;
export const EVENT_EVERY = 4;
export type CityEventKind = "feriado" | "temporal" | "padroeira";
export const CITY_EVENTS: { kind: CityEventKind; text: string }[] = [
  { kind: "feriado", text: "Férias de Julho em Salinas: moto-táxis, táxis, aeroporto e Boa-Esperança cobram o triplo por 1 rodada!" },
  { kind: "temporal", text: "Baixa temporada: aluguel pela metade em qualquer hotel por 1 rodada" },
  { kind: "padroeira", text: "Círio de N. Sra. do Socorro: passar pelo Início paga B$ 400 por 2 minutos!" },
];
/** Negociação: `from` gives `square` (and optionally asks for `want`), with an optional cash difference. */
/** Mesa de negociação: cada lado pode entregar vários imóveis; o dinheiro corre num só sentido. */
export interface Offer { id: string; from: string; to: string; giveSquares: number[]; wantSquares: number[]; cashFrom: number; cashTo: number }
export const groupTag = (g?: number) => (g === undefined ? "" : g === 8 ? "R" : g === 9 ? "U" : `B${g + 1}`);
export const mortgageValue = (square: number, s?: GameState) => Math.floor((boardFor(s)[square]?.price ?? 0) / 2);
export const unmortgageCost = (square: number, s?: GameState) => Math.ceil(mortgageValue(square, s) * 1.1);
export const houseCost = (group: number) => 50 * (1 + Math.floor(group / 2));

export const BOARD: Square[] = [
  { name: "Início", kind: "start" },
  { name: "Vila de Cuiarana", kind: "property", price: 60, rent: 10, group: 0 },
  { name: "Pagou o suborno na Barreira", kind: "toll", amount: 30 },
  { name: "Trevo", kind: "property", price: 80, rent: 16, group: 0 },
  { name: "Imposto de Renda", kind: "fine", amount: 100 },
  { name: "Associação dos Moto-Táxis", kind: "property", price: 200, rent: 25, group: 8 },
  { name: "Igreja Matriz", kind: "property", price: 100, rent: 14, group: 1 },
  { name: "Sorte ou Revés", kind: "luck" },
  { name: "Farol", kind: "property", price: 100, rent: 14, group: 1 },
  { name: "Praça do Pescador", kind: "property", price: 120, rent: 16, group: 1 },
  { name: "Posto São Francisco", kind: "property", price: 90, rent: 12, group: 0 },
  { name: "Imposto Predial", kind: "fine", amount: 50 },
  { name: "Porto Grande", kind: "property", price: 140, rent: 20, group: 2 },
  { name: "LC Virtual Net", kind: "property", price: 150, rent: 24, group: 9 },
  { name: "Praia do Atalaia", kind: "property", price: 140, rent: 20, group: 2 },
  { name: "Praia da Corvina", kind: "property", price: 160, rent: 22, group: 2 },
  { name: "Açaí Gelado", kind: "bonus", amount: 50 },
  { name: "Delegacia de Salinas (visita)", kind: "rest" },
  { name: "Associação dos Taxistas", kind: "property", price: 200, rent: 25, group: 8 },
  { name: "Tubão", kind: "property", price: 180, rent: 26, group: 3 },
  { name: "Sorte ou Revés", kind: "luck" },
  { name: "Farol Velho", kind: "property", price: 180, rent: 26, group: 3 },
  { name: "Praça", kind: "property", price: 200, rent: 28, group: 3 },
  { name: "Sorte ou Revés", kind: "luck" },
  { name: "Lago da Coca-Cola", kind: "property", price: 210, rent: 30, group: 3 },
  { name: "Pedágio da Ponte", kind: "toll", amount: 40 },
  { name: "Taxa do Lixo", kind: "fine", amount: 40 },
  { name: "Sorte ou Revés", kind: "luck" },
  { name: "Sombra de Coqueiro", kind: "rest" },
  { name: "Nova Orla", kind: "property", price: 220, rent: 30, group: 4 },
  { name: "Sorte ou Revés", kind: "luck" },
  { name: "Praia do Spardate", kind: "property", price: 220, rent: 30, group: 4 },
  { name: "Pé na Areia", kind: "property", price: 230, rent: 32, group: 4 },
  { name: "Orla do Maçarico", kind: "property", price: 240, rent: 34, group: 4 },
  { name: "Transporte Boa-Esperança", kind: "property", price: 200, rent: 25, group: 8 },
  { name: "Praça do Skate", kind: "property", price: 260, rent: 36, group: 5 },
  { name: "Policlínica Valdecy", kind: "property", price: 260, rent: 36, group: 5 },
  { name: "SEA Telecom", kind: "property", price: 150, rent: 24, group: 9 },
  { name: "Corpo de Bombeiros", kind: "property", price: 280, rent: 40, group: 5 },
  { name: "Caiu na blitz", kind: "samba", amount: 20 },
  { name: "Mercado Bom Jesus", kind: "property", price: 290, rent: 42, group: 5 },
  { name: "Taxa das Férias de Julho", kind: "fine", amount: 60 },
  { name: "Restô do Atlântico", kind: "property", price: 300, rent: 44, group: 6 },
  { name: "Sorveteria Blaus", kind: "property", price: 300, rent: 44, group: 6 },
  { name: "Atalaia Sushi", kind: "property", price: 320, rent: 48, group: 6 },
  { name: "Vá para a Delegacia", kind: "gojail" },
  { name: "Aeroporto de Salinópolis", kind: "property", price: 200, rent: 25, group: 8 },
  { name: "Achou B$ na Areia!", kind: "bonus", amount: 100 },
  { name: "Hotel Privê", kind: "property", price: 350, rent: 55, group: 7 },
  { name: "Sorte ou Revés", kind: "luck" },
  { name: "Imposto de Luxo", kind: "fine", amount: 100 },
  { name: "GAV Resorts", kind: "property", price: 400, rent: 65, group: 7 },
  { name: "Tacacá com Camarão", kind: "bonus", amount: 150 },
  { name: "Sorte ou Revés", kind: "luck" },
  { name: "Pagou por estacionar no Pé na Areia", kind: "toll", amount: 40 },
  { name: "Aqualand", kind: "property", price: 450, rent: 75, group: 7 },
];

/** Sorte ou Revés cards: positive = bank pays player, negative = player pays bank. */
export interface LuckCard { text: string; amount: number; freeJail?: boolean; goto?: number; jail?: boolean; each?: number; perHouse?: number; /** Only cards that cross the Início pay the bonus. */ passStart?: boolean }
export const LUCK_CARDS: LuckCard[] = [
  { text: "A maré subiu e pegou seu carro no Atalaia: pague o reboque do trator", amount: -120 },
  { text: "Vendeu caranguejada e camarão rosa na barraca da praia", amount: 100 },
  { text: "Tarde de paz no Lago da Coca-Cola", amount: 50 },
  { text: "Multa por manobra perigosa na areia da praia", amount: -100 },
  { text: "Seu aniversário no veraneio de julho! Cada jogador te faz um Pix", amount: 0, each: 30 },
  { text: "A aparelhagem tocou seu brega favorito: ganhou o concurso de dança", amount: 80 },
  { text: "Pneu atolou na rampa do Atalaia: pague a ajuda dos banhistas", amount: -50 },
  { text: "Consórcio do resort foi sorteado!", amount: 200 },
  { text: "Som alto depois do horário na praia: vá para a Delegacia", amount: 0, jail: true },
  { text: "Taxa de marina e guarda-barco em Cuiarana", amount: -60 },
  { text: "Carona de buggy até o Início", amount: 0, goto: 0, passStart: true },
  { text: "A maré de março estragou suas construções: pague por chalé", amount: 0, perHouse: 25 },
  { text: "Turistas de Belém lotaram sua pousada no feriado", amount: 150 },
  { text: "Ganhou o bolão do Círio", amount: 120 },
  { text: "Vendeu tacacá na orla do Maçarico", amount: 70 },
  { text: "Achou B$ no bolso da bermuda", amount: 30 },
  { text: "Prêmio no concurso de carimbó", amount: 90 },
  { text: "Conta de luz do veraneio chegou alta", amount: -90 },
  { text: "Celular caiu no mar do Atalaia", amount: -120 },
  { text: "Pagou o açaí da família toda", amount: -70 },
  { text: "Moto-táxi lotado até a Associação", amount: 0, goto: 5 },
  { text: "Mutirão de limpeza da praia: pague por chalé", amount: 0, perHouse: 15 },
  { text: "Rifa da festa de São Pedro! Cada jogador te faz um Pix", amount: 0, each: 20 },
  { text: "Passe Livre da Delegacia de Salinas! Guarde este cartão", amount: 0, freeJail: true },
];

export const cityOf = (s?: Pick<GameState, "city">): CityId => s?.city === "boro" || s?.city === "selva" || s?.city === "esquecidos" ? s.city : "salinas";
export const boardFor = (s?: Pick<GameState, "city">) => ({ salinas: BOARD, boro: BORO_BOARD, selva: SELVA_BOARD, esquecidos: ESQUECIDOS_BOARD })[cityOf(s)];
export const cardsFor = (s: GameState) => ({ salinas: LUCK_CARDS, boro: BORO_CARDS, selva: SELVA_CARDS, esquecidos: ESQUECIDOS_CARDS })[cityOf(s)];
export const eventsFor = (s: GameState) => ({ salinas: CITY_EVENTS, boro: BORO_EVENTS, selva: SELVA_EVENTS, esquecidos: ESQUECIDOS_EVENTS })[cityOf(s)];
export const cityName = (s: GameState) => ({ salinas: "Salinas", boro: "Cidade Boró", selva: "Selva dos Tambores", esquecidos: "Cidade dos Esquecidos" })[cityOf(s)];
/** Feminine building names take "uma". */
export const buildingArticle = (s: GameState) => (cityOf(s) === "salinas" ? "um" : "uma");
export const buildingName = (s: GameState, hotel = false, plural = false) => {
  const [h, hp, b, bp] = ({ salinas: ["resort", "resorts", "chalé", "chalés"], boro: ["sobrado", "sobrados", "barraca", "barracas"], selva: ["templo", "templos", "cabana", "cabanas"], esquecidos: ["mansão", "mansões", "casa", "casas"] })[cityOf(s)];
  return hotel ? (plural ? hp : h) : (plural ? bp : b);
};

export const PLAYER_COLORS = ["#d9480f", "#1864ab", "#2b8a3e", "#e8a317", "#862e9c", "#c2255c"];
export const ANIMALS = [
  { id: "coelho", name: "Coelhinho", color: "#1c7ed6" },
  { id: "gato", name: "Gato", color: "#e8590c" },
  { id: "coala", name: "Coala", color: "#2b8a3e" },
  { id: "panda", name: "Panda", color: "#343a40" },
  { id: "cachorro", name: "Caramelo", color: "#f0a500" },
  { id: "capivara", name: "Capivara", color: "#ae3ec9" },
  { id: "tucano", name: "Tucano", color: "#f76707" },
  { id: "arara", name: "Arara Azul", color: "#1971c2" },
  { id: "macaco", name: "Macaquinho", color: "#8d5524" },
  { id: "boto", name: "Boto Cor-de-Rosa", color: "#e64980" },
  { id: "preguica", name: "Bicho-Preguiça", color: "#a07850" },
  { id: "pato", name: "Pato", color: "#fab005" },
] as const;
export type AnimalId = (typeof ANIMALS)[number]["id"];
export const BANK = "bank";

export interface Player {
  id: string;
  name: string;
  color: string;
  balance: number;
  pos: number;
  animal: AnimalId;
  /** Turns left in the Delegacia (0 = free). */
  jail?: number;
  doubles?: number;
  out?: boolean;
  /** Times this player passed the Início (no forced auction before the 1st). */
  laps?: number;
  /** Hall da Fama counters: rent earned, arrests/fines, luck net, constructions. */
  stats?: { rent: number; jail: number; luck: number; built: number };
  /** "Saia Livre da Delegacia" cards held. */
  freeJail?: number;
  /** Financiamento bancário em aberto (pago quando e quanto o jogador quiser). */
  loan?: number;
}
export interface Transfer { id: number; from: string; to: string; amount: number; reason: string }

export type Pending =
  | { kind: "buy"; playerId: string; square: number }
  | { kind: "auction"; square: number; bid: number; bidder: string | null; endsAt: number; order: string[]; turn: number }
  | { kind: "scratch"; playerId: string; card: number; since: number }
  | { kind: "pix"; id: string; from: string; to: string; amount: number; reason: string }
  /** Risco de falência: player must raise `amount` (mortgage/sell) then pay `to`, or give up. */
  | { kind: "debt"; playerId: string; to: string; amount: number; reason: string }
  /** Cobrança coletiva: every other active player taps "Enviar Boró" to pay `targetId`. */
  | { kind: "collect"; targetId: string; amount: number; reason: string; paid: string[]; endsAt: number };

export type CityId = "salinas" | "boro" | "selva" | "esquecidos";
export interface GameState {
  /** Missing city in existing rooms means Salinas. */
  city?: CityId;
  phase: "lobby" | "playing" | "over";
  houses?: Record<string, number>;
  mortgaged?: Record<string, boolean>;
  round?: number;
  cityEvent?: { kind: CityEventKind; text: string; expiresAt?: number; until?: number } | null;
  offer?: Offer | null;
  winner?: string | null;
  players: Player[];
  turn: number;
  dice: [number, number];
  rollId: number;
  moving: boolean;
  owners: Record<string, string>;
  pending: Pending | null;
  log: string[];
  lastActionAt: string | null;
  event: { id: number; text: string; tone: "good" | "bad" | "info" } | null;
  transfer?: Transfer | null;
  /** Last Sorte ou Revés card drawn (for the raspadinha). */
  card?: { id: number; playerId: string; text: string; good: boolean } | null;
  /** Monotonic raspadinha counter so every card gets a fresh id. */
  cardSeq?: number;
  /** Selva: square of the Onça (neutral beast). */
  beast?: number;
  /** Selva: relic index -> holder player id. */
  relics?: Record<string, string>;
  /** Esquecidos only: shared cooperative finale, no private roles in public state. */
  curse?: Curse;
}

export const newState = (city: CityId = "salinas"): GameState => ({
  city,
  ...(city === "selva" ? { beast: BEAST_START, relics: {} } : {}),
  phase: "lobby",
  players: [],
  turn: 0,
  dice: [1, 1],
  rollId: 0,
  moving: false,
  owners: {},
  pending: null,
  log: [],
  lastActionAt: null,
  event: null,
});

export const money = (n: number) => `${CURRENCY} ${n.toLocaleString("pt-BR")}`;
export const current = (s: GameState) => s.players[s.turn % Math.max(1, s.players.length)]!;
export const isMortgaged = (s: GameState, i: number) => !!s.mortgaged?.[i];
export const CITY_EVENT_MS = 120_000;
/** Bônus do Início: 2 min para 2 jogadores, +1 min por jogador adicional. */
export const cityEventMs = (s: GameState) => CITY_EVENT_MS + 60_000 * Math.max(0, s.players.filter((p) => !p.out).length - 2);
export function activeCityEvent(s: GameState, now = Date.now()) {
  const ev = s.cityEvent;
  if (!ev) return null;
  return ev.expiresAt !== undefined ? (now < ev.expiresAt ? ev : null) : ((ev.until ?? 0) > (s.round ?? 0) ? ev : null);
}
export const startBonus = (s: GameState, now = Date.now()) => horrorActive(s) ? 0 : (activeCityEvent(s, now)?.kind === "padroeira" ? 400 : START_BONUS);
export function expireCityEvent(s: GameState, now = Date.now()): GameState {
  return s.cityEvent && !activeCityEvent(s, now) ? { ...s, cityEvent: null } : s;
}
export const housesAt = (s: GameState, i: number) => s.houses?.[i] ?? 0;
export const ownsGroup = (s: GameState, id: string, group: number) =>
  boardFor(s).every((b, i) => b.group !== group || s.owners[i] === id);
/** Balance + land value + barraquinhas value. */
export function netWorth(s: GameState, id: string): number {
  const p = s.players.find((x) => x.id === id);
  if (!p || p.out) return 0;
  return Object.entries(s.owners).reduce((t, [i, o]) => {
    if (o !== id) return t;
    const sq = boardFor(s)[+i]!;
    return t + (isMortgaged(s, +i) ? mortgageValue(+i, s) : sq.price ?? 0) + housesAt(s, +i) * houseCost(sq.group ?? 0);
  }, p.balance) - (p.loan ?? 0);
}

/** Crédito do Banco no leilão: até o valor de tabela do imóvel, menos o que já deve. */
export const auctionCredit = (s: GameState, id: string, square: number) =>
  Math.max(0, (boardFor(s)[square]?.price ?? 0) - (s.players.find((p) => p.id === id)?.loan ?? 0));
/** Poder de lance = saldo + crédito disponível. */
export const bidPower = (s: GameState, id: string, square: number) =>
  (s.players.find((p) => p.id === id)?.balance ?? 0) + auctionCredit(s, id, square);
/** Lance acima do saldo: paga metade do saldo e financia o resto, para não zerar a carteira. */
export function financeSplit(balance: number, amount: number) {
  if (amount <= balance) return { cash: amount, loan: 0 };
  const cash = Math.floor(Math.max(0, balance) / 2);
  return { cash, loan: amount - cash };
}
/** Amortização voluntária: o jogador escolhe quanto pagar do financiamento. */
export function repayLoan(s: GameState, id: string, amount: number): GameState {
  if (horrorActive(s)) return s;
  const p = s.players.find((x) => x.id === id);
  if (!p || p.out || !p.loan) return s;
  const a = Math.min(Math.floor(amount), p.loan, p.balance);
  if (!(a > 0)) return s;
  const next = move(patch(s, id, { loan: p.loan - a }), id, BANK, a, "Financiamento");
  return say(next, p.loan - a ? `${p.name} amortizou ${money(a)} do financiamento` : `${p.name} quitou o financiamento!`, "good");
}

function say(s: GameState, text: string, tone: "good" | "bad" | "info" = "info"): GameState {
  return { ...s, log: [text, ...s.log].slice(0, 30), event: { id: (s.event?.id ?? 0) + 1, text, tone } };
}
function adjust(s: GameState, id: string, delta: number): GameState {
  return { ...s, players: s.players.map((p) => (p.id === id ? { ...p, balance: p.balance + delta } : p)) };
}
/** Records a money movement (BANK or player ids) so screens can animate it. */
function bump(s: GameState, id: string, k: keyof NonNullable<Player["stats"]>, v: number): GameState {
  return { ...s, players: s.players.map((p) => (p.id === id ? { ...p, stats: { rent: 0, jail: 0, luck: 0, built: 0, ...p.stats, [k]: (p.stats?.[k] ?? 0) + v } } : p)) };
}
function move(s: GameState, from: string, to: string, amount: number, reason: string): GameState {
  let n = s;
  if (to !== BANK && from !== BANK && reason.startsWith("Aluguel")) n = bump(n, to, "rent", amount);
  if (from !== BANK && reason.startsWith("Obra")) n = bump(n, from, "built", 1);
  if (from !== BANK && reason === "Fiança") n = bump(n, from, "jail", 1);
  if (from !== BANK) n = adjust(n, from, -amount);
  if (to !== BANK) n = adjust(n, to, amount);
  return { ...n, transfer: { id: (s.transfer?.id ?? 0) + 1, from, to, amount, reason } };
}
const nameOf = (s: GameState, id: string) => s.players.find((p) => p.id === id)?.name ?? "?";

export const takenAnimals = (s: GameState) => new Set(s.players.map((p) => p.animal));

export function join(s: GameState, id: string, name: string, animal?: string): GameState {
  if (s.players.some((p) => p.id === id) || s.players.length >= 6 || s.phase !== "lobby") return s;
  const taken = takenAnimals(s);
  const pick = ANIMALS.find((a) => a.id === animal && !taken.has(a.id)) ?? (animal ? undefined : ANIMALS.find((a) => !taken.has(a.id)));
  if (!pick) return s;
  const clean = name.trim().slice(0, 16) || "Jogador";
  return say(
    { ...s, players: [...s.players, { id, name: clean, color: pick.color, animal: pick.id, balance: START_BALANCE, pos: 0 }] },
    `${clean} entrou na sala`,
  );
}

export function start(s: GameState): GameState {
  if (s.players.length < 2) return s;
  return say({ ...s, phase: "playing", turn: 0, players: s.players.map((p) => ({ ...p, doubles: 0 })) }, `Começou! Vez de ${s.players[0]!.name}`);
}

const patch = (s: GameState, id: string, f: Partial<Player>): GameState => ({ ...s, players: s.players.map((p) => (p.id === id ? { ...p, ...f } : p)) });
function sendToJail(s: GameState, id: string, why: string): GameState {
  const held = s.players.find((p) => p.id === id)?.freeJail ?? 0;
  if (held > 0) return say(patch(s, id, { freeJail: held - 1, doubles: 0 }), `${nameOf(s, id)} usou o cartão Saia Livre da Delegacia!`, "good");
  return say(patch(bump(s, id, "jail", 1), id, { pos: JAIL, jail: JAIL_TURNS, doubles: 0 }), `${nameOf(s, id)} ${why}: vai para a Delegacia!`, "bad");
}

/** Pay the fiança and leave the Delegacia before rolling. */
export function payBail(s: GameState, id: string): GameState {
  if (horrorActive(s)) return s;
  const p = s.players.find((x) => x.id === id);
  if (s.phase !== "playing" || s.moving || s.pending || current(s)?.id !== id || !p?.jail || p.balance < JAIL_FINE) return s;
  return say(move(patch(s, id, { jail: 0, doubles: 0 }), id, BANK, JAIL_FINE, "Fiança"), `${p.name} pagou fiança de ${money(JAIL_FINE)}`, "info");
}

/** Step 1 of a roll: dice + new position (master animates movement). moving=false means no movement. */
export function roll(s: GameState, id: string, d1: number, d2: number, seenRollId?: number): GameState {
  if (s.phase !== "playing" || s.moving || s.pending || current(s)?.id !== id) return s;
  if (seenRollId !== undefined && seenRollId !== s.rollId) return s;
  if (horrorActive(s)) {
    const p = current(s);
    if (!p || (s.curse?.sanity[id] ?? 0) <= 0) return s;
    return { ...patch(s, id, { pos: (p.pos + d1 + d2) % boardFor(s).length, jail: 0, doubles: 0 }), card: null, dice: [d1, d2], rollId: s.rollId + 1, moving: true };
  }
  // Stale roll ids were rejected above, before either city's movement rules.
  let p = current(s);
  const dbl = d1 === d2;
  let base: GameState = { ...s, card: null, dice: [d1, d2], rollId: s.rollId + 1 };
  if (p.jail) {
    if (dbl) base = say(patch(base, id, { jail: 0, doubles: 0 }), `${p.name} tirou dupla e saiu da Delegacia!`, "good");
    else if (p.jail > 1) return endTurn(say(patch(base, id, { jail: p.jail - 1, doubles: 0 }), `${p.name} continua na Delegacia`, "bad"));
    else base = say(move(patch(base, id, { jail: 0, doubles: 0 }), id, BANK, JAIL_FINE, "Fiança"), `${p.name} pagou fiança de ${money(JAIL_FINE)} e saiu`, "bad");
    p = base.players.find((x) => x.id === id)!;
    base = patch(base, id, { doubles: 0 });
  } else {
    const doubles = dbl ? (p.doubles ?? 0) + 1 : 0;
    if (doubles >= 3) return endTurn(sendToJail(base, id, "tirou 3 duplas seguidas"));
    base = patch(base, id, { doubles });
  }
  const steps = d1 + d2;
  const to = (p.pos + steps) % boardFor(s).length;
  let next: GameState = { ...patch(base, id, { pos: to }), moving: true };
  if (p.pos + steps >= boardFor(s).length) {
    next = say(move(patch(next, id, { laps: (p.laps ?? 0) + 1 }), BANK, id, startBonus(s), "Passou pelo Início"), `${p.name} passou pelo Início: +${money(startBonus(s))}`, "good");
  }
  return cityOf(s) === "selva" ? beastStep(next, id, dbl ? steps : 0) : next;
}

/** Selva: doubles wake the Onça, which runs `steps` squares; sharing her square costs a bite paid to the bank. */
export function beastStep(s: GameState, id: string, steps: number): GameState {
  const size = boardFor(s).length;
  const beast = ((s.beast ?? BEAST_START) + steps) % size;
  let next: GameState = { ...s, beast };
  if (steps) next = say(next, `🐆 A Onça acordou e correu ${steps} casas!`, "info");
  const p = next.players.find((x) => x.id === id);
  if (!p || p.pos !== beast) return next;
  const bite = Math.min(BEAST_BITE, Math.max(0, p.balance));
  return say(bite ? move(next, id, BANK, bite, "Mordida da Onça") : next, `🐆 A Onça pegou ${p.name}: −${money(bite)}`, "bad");
}

/** Selva: land on a relic square to claim it, or pay its holder to steal it; 3 relics win the game. */
export function claimRelic(s: GameState, id: string, relic: number): GameState {
  const p = s.players.find((x) => x.id === id)!;
  const holder = s.relics?.[relic];
  const name = RELIC_NAMES[relic] ?? "Relíquia";
  if (holder === id) return say(s, `${p.name} já guarda o ${name}`);
  let next = s;
  if (holder) {
    if (p.balance < RELIC_STEAL) return say(s, `${p.name} não tem ${money(RELIC_STEAL)} para roubar o ${name}`, "bad");
    next = move(next, id, holder, RELIC_STEAL, `Roubo da relíquia ${name}`);
  }
  const relics: Record<string, string> = { ...(next.relics ?? {}), [relic]: id };
  next = say({ ...next, relics }, holder ? `💎 ${p.name} roubou o ${name} de ${nameOf(s, holder)}!` : `💎 ${p.name} encontrou o ${name}!`, "good");
  if (RELIC_SQUARES.every((_, k) => relics[k] === id)) next = say({ ...next, phase: "over", winner: id }, `${p.name} reuniu as 3 relíquias e venceu a Selva!`, "good");
  return next;
}
export const relicCount = (s: GameState, id: string) => Object.values(s.relics ?? {}).filter((h) => h === id).length;

/** Step 2: resolve the square the player landed on. */
export function land(s: GameState, pixId: string, luck: number = Math.random(), now: number = Date.now()): GameState {
  if (horrorActive(s)) return horrorLand(s, luck);
  const p = current(s);
  let next: GameState = { ...s, moving: false };
  const sq = boardFor(s)[p.pos]!;
  switch (sq.kind) {
    case "property": {
      const owner = s.owners[p.pos];
      if (!owner) {
        if (p.balance >= (sq.price ?? 0)) return say({ ...next, pending: { kind: "buy", playerId: p.id, square: p.pos } }, `${p.name} pode comprar ${sq.name}`);
        return startAuction(say(next, `${p.name} não tem saldo para ${sq.name}`), p.pos, now, p.id);
      }
      if (owner === p.id) return endTurn(say(next, `${p.name} está na própria ${sq.name}`));
      const rent = rentFor(s, p.pos);
      if (rent === 0) return endTurn(say(next, `${sq.name} não cobra aluguel agora${isMortgaged(s, p.pos) ? " (hipotecado)" : ""}`));
      if (rent > p.balance) return endTurn(debtOrBankrupt(next, p.id, owner, rent, `Aluguel ${sq.name}`));
      return say(
        { ...next, pending: { kind: "pix", id: pixId, from: p.id, to: owner, amount: rent, reason: `Aluguel ${sq.name}` } },
        `${p.name} deve ${money(rent)} de aluguel para ${nameOf(s, owner)}`,
        "bad",
      );
    }
    case "toll":
    case "fine":
      next = move(next, p.id, BANK, sq.amount ?? 0, sq.name);
      return endTurn(checkBroke(say(next, `${sq.name}: ${p.name} pagou ${money(sq.amount ?? 0)} ao banco`, "bad"), p.id));
    case "gojail":
      return endTurn(sendToJail(next, p.id, "foi pego pela polícia"));
    case "bonus":
      if (sq.relic !== undefined) return endTurn(claimRelic(next, p.id, sq.relic));
      next = move(next, BANK, p.id, sq.amount ?? 0, sq.name);
      return endTurn(say(next, `${sq.name}: ${p.name} ganhou ${money(sq.amount ?? 0)}`, "good"));
    case "samba": {
      const each = sq.amount ?? 0;
      for (const o of next.players) if (o.id !== p.id && !o.out) next = adjust(adjust(next, p.id, -each), o.id, each);
      const total = each * next.players.filter((o) => o.id !== p.id && !o.out).length;
      next = { ...next, transfer: { id: (next.transfer?.id ?? 0) + 1, from: p.id, to: BANK, amount: total, reason: sq.name } };
      return endTurn(checkBroke(say(next, `${sq.name}: ${p.name} pagou a rodada, ${money(each)} para cada jogador`, "bad"), p.id));
    }
    case "luck": {
      const idx = Math.floor(luck * cardsFor(s).length) % cardsFor(s).length;
      const card = cardsFor(s)[idx]!;
      const seq = (s.cardSeq ?? 0) + 1;
      next = { ...next, cardSeq: seq, card: { id: seq, playerId: p.id, text: card.text, good: card.amount > 0 || !!card.each || !!card.freeJail || card.goto !== undefined } };
      return say({ ...next, pending: { kind: "scratch", playerId: p.id, card: idx, since: now } }, `🎟️ ${p.name} está raspando uma Sorte ou Revés…`);
    }
    default:
      return endTurn(say(next, `${p.name} parou em ${sq.name}`));
  }
}

/** The raspadinha was scratched (or timed out): apply the Sorte ou Revés card and move on. */
export function revealCard(s: GameState, id?: string): GameState {
  const pd = s.pending;
  if (pd?.kind !== "scratch" || (id !== undefined && pd.playerId !== id)) return s;
  const bal = (x: GameState) => x.players.find((q) => q.id === pd.playerId)?.balance ?? 0;
  const n = applyCard(s);
  return bump(n, pd.playerId, "luck", bal(n) - bal(s));
}
function applyCard(s: GameState): GameState {
  const pd = s.pending as Extract<Pending, { kind: "scratch" }>;
  const card = cardsFor(s)[pd.card]!;
  let next: GameState = { ...s, pending: null };
  const p = next.players.find((x) => x.id === pd.playerId)!;
  if (card.freeJail) return endTurn(say(patch(next, p.id, { freeJail: (p.freeJail ?? 0) + 1 }), `Sorte: ${p.name} ganhou o cartão Saia Livre da Delegacia!`, "good"));
      if (card.jail) return endTurn(sendToJail(next, p.id, `Revés: ${card.text}`.replace(": vá para a Delegacia", "")));
      if (card.goto !== undefined) {
        next = patch(next, p.id, { pos: card.goto });
        if (!card.passStart) return endTurn(say(next, `Sorte: ${card.text}`, "info"));
        next = move(patch(next, p.id, { laps: (p.laps ?? 0) + 1 }), BANK, p.id, startBonus(s), "Passou pelo Início");
        return endTurn(say(next, `Sorte: ${card.text} (+${money(startBonus(s))})`, "good"));
      }
      if (card.each) {
        const payers = next.players.filter((o) => o.id !== p.id && !o.out);
        if (!payers.length) return endTurn(say(next, `Sorte: ${card.text} (ninguém para pagar)`));
        return say({ ...next, pending: { kind: "collect", targetId: p.id, amount: card.each, reason: card.text, paid: [], endsAt: Date.now() + COLLECT_MS } }, `🎉 ${p.name}: ${card.text}! Cada jogador envia ${money(card.each)}`, "good");
      }
      const amt = card.perHouse
        ? Object.entries(next.owners).filter(([, o]) => o === p.id).reduce((t, [i]) => t + housesAt(next, +i) * card.perHouse!, 0)
        : Math.abs(card.amount);
      const good = card.amount > 0;
      if (amt === 0) return endTurn(say(next, `Revés: ${card.text} (nada a pagar)`));
      next = good ? move(next, BANK, p.id, amt, card.text) : move(next, p.id, BANK, amt, card.text);
      next = say(next, `${good ? "Sorte" : "Revés"}: ${card.text} (${good ? "+" : "−"}${money(amt)})`, good ? "good" : "bad");
      return endTurn(good ? next : checkBroke(next, p.id));
}
export const SCRATCH_MS = 30000;
export const COLLECT_MS = 30000;
/** Players who still owe in the current cobrança coletiva. */
export function collectPending(s: GameState): string[] {
  const pd = s.pending;
  if (pd?.kind !== "collect") return [];
  return s.players.filter((o) => o.id !== pd.targetId && !o.out && !pd.paid.includes(o.id)).map((o) => o.id);
}
function payOne(s: GameState, id: string): GameState {
  const pd = s.pending as Extract<Pending, { kind: "collect" }>;
  const o = s.players.find((x) => x.id === id)!;
  const amt = Math.min(pd.amount, Math.max(0, o.balance));
  let next = move(s, id, pd.targetId, amt, pd.reason);
  next = bump(next, pd.targetId, "luck", amt);
  return { ...next, pending: { ...pd, paid: [...pd.paid, id] } };
}
function closeCollect(s: GameState): GameState {
  if (collectPending(s).length) return s;
  const pd = s.pending as Extract<Pending, { kind: "collect" }>;
  return endTurn(say({ ...s, pending: null }, `Todos enviaram ${money(pd.amount)} para ${nameOf(s, pd.targetId)}!`, "good"));
}
/** A player taps "Enviar Boró" for the cobrança coletiva. */
export function payCollect(s: GameState, id: string): GameState {
  if (!collectPending(s).includes(id)) return s;
  return closeCollect(say(payOne(s, id), `${nameOf(s, id)} enviou ${money((s.pending as Extract<Pending, { kind: "collect" }>).amount)}`, "info"));
}
/** Safety timeout: charge whoever has not sent yet and move on. */
export function finishCollect(s: GameState, now = Date.now()): GameState {
  if (s.pending?.kind !== "collect" || now < s.pending.endsAt) return s;
  let next = s;
  for (const id of collectPending(s)) next = payOne(next, id);
  return closeCollect(next);
}

/** Rent: stations scale by count, utilities by dice, streets double with full color and multiply with barraquinhas. */
export function rentFor(s: GameState, square: number): number {
  if (horrorActive(s)) return 0;
  const sq = boardFor(s)[square]!;
  const owner = s.owners[square];
  const base = sq.rent ?? 0;
  if (!owner || isMortgaged(s, square)) return owner ? 0 : base;
  const cityEvent = activeCityEvent(s);
  const lowSeason = cityEvent?.kind === "temporal" && cityOf(s) === "salinas";
  if (cityEvent?.kind === "temporal" && !lowSeason && sq.group === 6) return 0;
  const count = boardFor(s).filter((b, i) => b.group === sq.group && s.owners[i] === owner).length;
  if (sq.group === 8) return base * 2 ** (count - 1) * (cityEvent?.kind === "feriado" ? 3 : 1);
  if (sq.group === 9) return (s.dice[0] + s.dice[1]) * (count >= 2 ? 10 : 4);
  const h = housesAt(s, square);
  const raw = h > 0 ? base * HOUSE_MULT[h]! : base * (ownsGroup(s, owner, sq.group!) ? 2 : 1);
  return lowSeason && sq.group === 7 ? Math.floor(raw / 2) : raw;
}

/** Build one barraquinha (4th = Sobrado) on a street of a full color group the player owns. */
export function build(s: GameState, id: string, square: number): GameState {
  if (horrorActive(s)) return s;
  const sq = boardFor(s)[square];
  const p = s.players.find((x) => x.id === id);
  if (!sq || !p || p.out || s.phase !== "playing" || s.moving || sq.kind !== "property" || (sq.group ?? 9) > 7) return s;
  if (p.loan) return s; // o Banco exige quitar o financiamento antes de liberar obras
  if (s.owners[square] !== id || !ownsGroup(s, id, sq.group!)) return s;
  if (boardFor(s).some((b, i) => b.group === sq.group && isMortgaged(s, i))) return s;
  const h = housesAt(s, square);
  const cost = houseCost(sq.group!);
  if (h >= MAX_HOUSES || p.balance < cost) return s;
  // Construção nivelada: build on the street with the fewest chalés of the color first.
  if (boardFor(s).some((b, i) => b.group === sq.group && housesAt(s, i) < h)) return s;
  const next = move({ ...s, houses: { ...s.houses, [square]: h + 1 } }, id, BANK, cost, `Obra ${sq.name}`);
  return say(next, `${p.name} construiu ${h + 1 === MAX_HOUSES ? `um ${buildingName(s, true)}` : `${buildingArticle(s)} ${buildingName(s)}`} em ${sq.name}`, "good");
}

export const houseSaleValue = (group: number) => Math.floor(houseCost(group) / 2);
/** Vender chalé: the bank pays half the build cost. Demolition is uniform (most-built street first). */
export function sellHouse(s: GameState, id: string, square: number): GameState {
  if (horrorActive(s)) return s;
  const sq = boardFor(s)[square];
  const p = s.players.find((x) => x.id === id);
  if (!sq || !p || p.out || s.phase !== "playing" || s.moving || s.owners[square] !== id) return s;
  const h = housesAt(s, square);
  if (h <= 0 || boardFor(s).some((b, i) => b.group === sq.group && housesAt(s, i) > h)) return s;
  const houses: Record<string, number> = { ...s.houses, [square]: h - 1 };
  if (!houses[square]) delete houses[square];
  const value = houseSaleValue(sq.group!);
  const next = move({ ...s, houses }, BANK, id, value, `Venda de ${buildingName(s)} ${sq.name}`);
  return say(next, `${p.name} vendeu ${h === MAX_HOUSES ? `o ${buildingName(s, true)}` : `${buildingArticle(s)} ${buildingName(s)}`} de ${sq.name} (+${money(value)})`, "info");
}

/** Player out: remaining money and lands go to the creditor (or back to the bank). */
function bankrupt(s: GameState, id: string, creditor: string, keepPending = false): GameState {
  const p = s.players.find((x) => x.id === id)!;
  const owners: Record<string, string> = {};
  const houses = { ...s.houses };
  const mortgaged = { ...s.mortgaged };
  for (const [i, o] of Object.entries(s.owners)) {
    if (o !== id) owners[i] = o;
    else if (creditor !== BANK) owners[i] = creditor;
    else { delete houses[i]; delete mortgaged[i]; }
  }
  const offer = s.offer && (s.offer.from === id || s.offer.to === id) ? null : s.offer;
  let next: GameState = { ...s, owners, houses, mortgaged, offer: offer ?? null, pending: keepPending ? s.pending : null };
  if (creditor !== BANK && p.balance > 0) next = move(next, id, creditor, p.balance, "Falência");
  next = patch(next, id, { out: true, balance: 0, jail: 0, doubles: 0 });
  next = say(next, `${p.name} faliu!${creditor !== BANK ? ` Bens vão para ${nameOf(s, creditor)}` : ""}`, "bad");
  const alive = next.players.filter((x) => !x.out);
  if (horrorActive(next)) {
    if (!alive.some((x) => (next.curse?.sanity[x.id] ?? 0) > 0)) return horrorFinish(next, false);
  } else if (alive.length <= 1) next = say({ ...next, phase: "over", winner: alive[0]?.id ?? null }, `${alive[0]?.name ?? "Ninguém"} venceu a partida!`, "good");
  return next;
}
/** Cash the player could still raise by mortgaging lands (no barraquinhas in their color). */
export function liquidity(s: GameState, id: string): number {
  return Object.entries(s.owners).filter(([, o]) => o === id).reduce((t, [i]) => {
    const g = boardFor(s)[+i]!.group ?? 0;
    return t + housesAt(s, +i) * houseSaleValue(g) + (isMortgaged(s, +i) ? 0 : mortgageValue(+i, s));
  }, 0);
}
/** Owes more than the balance: open the Risco de Falência window if assets cover it, otherwise go bankrupt. */
function debtOrBankrupt(s: GameState, id: string, to: string, amount: number, reason: string): GameState {
  const p = s.players.find((x) => x.id === id)!;
  if (p.balance + liquidity(s, id) < amount) return bankrupt(s, id, to);
  return say({ ...s, pending: { kind: "debt", playerId: id, to, amount, reason } }, `⚠️ ${p.name} está em risco de falência: precisa de ${money(amount)}`, "bad");
}
const checkBroke = (s: GameState, id: string) => {
  const bal = s.players.find((p) => p.id === id)?.balance ?? 0;
  if (bal >= 0) return s;
  return debtOrBankrupt(adjust(s, id, -bal), id, BANK, -bal, "Dívida com o banco");
};
export function payDebt(s: GameState, id: string): GameState {
  const pd = s.pending;
  if (pd?.kind !== "debt" || pd.playerId !== id) return s;
  const p = s.players.find((x) => x.id === id)!;
  if (p.balance < pd.amount) return s;
  const next = move({ ...s, pending: null }, id, pd.to, pd.amount, pd.reason);
  return endTurn(say(next, `${p.name} quitou a dívida de ${money(pd.amount)}`, "good"));
}
export function giveUp(s: GameState, id: string): GameState {
  const pd = s.pending;
  if (pd?.kind !== "debt" || pd.playerId !== id) return s;
  return endTurn(bankrupt(s, id, pd.to));
}

export function buy(s: GameState, id: string, accept: boolean, now: number = Date.now()): GameState {
  if (horrorActive(s)) return s;
  if (s.pending?.kind !== "buy" || s.pending.playerId !== id) return s;
  const sq = boardFor(s)[s.pending.square]!;
  let next: GameState = { ...s, pending: null };
  if (accept && (s.players.find((p) => p.id === id)?.balance ?? 0) >= (sq.price ?? 0)) {
    next = move({ ...next, owners: { ...s.owners, [s.pending.square]: id } }, id, BANK, sq.price ?? 0, `Compra ${sq.name}`);
    next = say(next, `${nameOf(s, id)} comprou ${sq.name} por ${money(sq.price ?? 0)}`, "good");
    return endTurn(next);
  }
  return startAuction(say(next, `${nameOf(s, id)} não comprou ${sq.name}`), s.pending.square, now, id);
}

/** Leilão por vez: each player in turn order gets AUCTION_MS to raise or pass. Not before the 1st lap. */
function startAuction(s: GameState, square: number, now: number, by: string): GameState {
  if (((s.players.find((p) => p.id === by)?.laps) ?? 0) < 1) return endTurn(say(s, `${boardFor(s)[square]!.name} continua à venda (leilão só depois da 1ª volta)`));
  const n = s.players.length;
  const start = s.players.findIndex((p) => p.id === by);
  const order = Array.from({ length: n }, (_, k) => s.players[(start + k) % n]!).filter((p) => !p.out && bidPower(s, p.id, square) >= AUCTION_STEP).map((p) => p.id);
  if (!order.length) return endTurn(s);
  return say({ ...s, pending: { kind: "auction", square, bid: 0, bidder: null, endsAt: now + AUCTION_MS, order, turn: 0 } }, `Leilão: ${boardFor(s)[square]!.name}! Vez de ${nameOf(s, order[0]!)}`, "info");
}
export const auctionTurn = (s: GameState) => (s.pending?.kind === "auction" ? s.pending.order[s.pending.turn] ?? null : null);

/** Move on to the next bidder who can still raise; finish when nobody else can. */
function nextBidder(s: GameState, pd: Extract<Pending, { kind: "auction" }>, order: string[], from: number, now: number): GameState {
  const can = (id: string) => id !== pd.bidder && bidPower(s, id, pd.square) >= pd.bid + AUCTION_STEP;
  const left = order.filter((id) => id === pd.bidder || can(id));
  const others = left.filter((id) => id !== pd.bidder);
  if (!others.length) return finishAuction(s, pd);
  // next player after position `from` in the original ordering who can bid
  for (let k = 0; k < order.length; k++) {
    const id = order[(from + k) % order.length]!;
    if (can(id)) return { ...s, pending: { ...pd, order: left, turn: left.indexOf(id), endsAt: now + AUCTION_MS } };
  }
  return finishAuction(s, pd);
}
function finishAuction(s: GameState, pd: Extract<Pending, { kind: "auction" }>): GameState {
  const sq = boardFor(s)[pd.square]!;
  const next: GameState = { ...s, pending: null };
  if (!pd.bidder) return endTurn(say(next, `Ninguém deu lance em ${sq.name}`));
  const w = s.players.find((p) => p.id === pd.bidder)!;
  const { cash, loan } = financeSplit(w.balance, pd.bid);
  let won = { ...next, owners: { ...s.owners, [pd.square]: pd.bidder } };
  if (loan) won = patch(won, w.id, { loan: (w.loan ?? 0) + loan });
  if (cash) won = move(won, pd.bidder, BANK, cash, `Leilão ${sq.name}`);
  return endTurn(say(won, `${nameOf(s, pd.bidder)} arrematou ${sq.name} por ${money(pd.bid)}${loan ? ` (${money(loan)} financiado)` : ""}`, "good"));
}
export function bid(s: GameState, id: string, amount: number, now: number = Date.now()): GameState {
  if (horrorActive(s)) return s;
  const pd = s.pending;
  const p = s.players.find((x) => x.id === id);
  if (pd?.kind !== "auction" || !p || p.out || pd.order[pd.turn] !== id) return s;
  const a = Math.floor(amount);
  if (a < pd.bid + AUCTION_STEP || a > bidPower(s, id, pd.square)) return s;
  const np = { ...pd, bid: a, bidder: id };
  return nextBidder(say(s, `${p.name} deu lance de ${money(a)}`), np, pd.order, pd.turn + 1, now);
}
/** Current bidder gives up (also used on timeout). */
export function passBid(s: GameState, id: string, now: number = Date.now()): GameState {
  const pd = s.pending;
  if (pd?.kind !== "auction" || pd.order[pd.turn] !== id) return s;
  const order = pd.order.filter((x) => x !== id);
  if (!order.length) return finishAuction(s, pd);
  return nextBidder(say(s, `${nameOf(s, id)} passou`), { ...pd, order }, order, pd.turn % order.length, now);
}
/** Host: "Dispensar leilão" — closes it now; the highest bid so far (if any) wins. */
export function dismissAuction(s: GameState): GameState {
  const pd = s.pending;
  if (pd?.kind !== "auction") return s;
  return finishAuction(s, pd);
}
/** Emojis allowed in the TV reaction bar. */
export const REACTIONS = ["😂", "😱", "🔥", "👏", "😭", "😡", "🤑", "🦀"] as const;
export const isReaction = (e: unknown): e is (typeof REACTIONS)[number] => typeof e === "string" && (REACTIONS as readonly string[]).includes(e);
/** Rent/fee big enough to sound the alarm on the TV. */
export const BIG_HIT = 200;
/** Clock tick: whoever's turn it is passes when their time runs out. */
export function closeAuction(s: GameState, now: number = Date.now()): GameState {
  const pd = s.pending;
  if (pd?.kind !== "auction" || now < pd.endsAt) return s;
  return passBid(s, pd.order[pd.turn]!, now);
}

/** Hipoteca: bank pays half the price; the land stops charging rent. Needs no barraquinhas in its color. */
export function mortgage(s: GameState, id: string, square: number): GameState {
  if (horrorActive(s)) return s;
  const sq = boardFor(s)[square];
  if (!sq || s.phase !== "playing" || s.moving || s.owners[square] !== id || isMortgaged(s, square)) return s;
  if (boardFor(s).some((b, i) => b.group === sq.group && housesAt(s, i) > 0)) return s;
  const next = move({ ...s, mortgaged: { ...s.mortgaged, [square]: true } }, BANK, id, mortgageValue(square, s), `Hipoteca ${sq.name}`);
  return say(next, `${nameOf(s, id)} hipotecou ${sq.name} (+${money(mortgageValue(square, s))})`, "info");
}
export function unmortgage(s: GameState, id: string, square: number): GameState {
  if (horrorActive(s)) return s;
  const sq = boardFor(s)[square];
  const p = s.players.find((x) => x.id === id);
  if (!sq || !p || s.moving || s.owners[square] !== id || !isMortgaged(s, square) || p.balance < unmortgageCost(square, s)) return s;
  const mortgaged = { ...s.mortgaged };
  delete mortgaged[square];
  const next = move({ ...s, mortgaged }, id, BANK, unmortgageCost(square, s), `Resgate ${sq.name}`);
  return say(next, `${p.name} resgatou ${sq.name}`, "info");
}

const names = (s: GameState, l: number[]) => l.map((i) => boardFor(s)[i]!.name).join(", ");
const side = (s: GameState, l: number[], cash: number) => [l.length ? `[${names(s, l)}]` : "", cash > 0 ? money(cash) : ""].filter(Boolean).join(" + ") || "nada";
/** Plain-language summary of a negotiation. */
export function offerText(s: GameState, o: Offer): string {
  const n = (id: string) => s.players.find((p) => p.id === id)?.name ?? "?";
  if (!Array.isArray(o.giveSquares) || !Array.isArray(o.wantSquares)) return `${n(o.from)} fez uma proposta para ${n(o.to)}`;
  return `${n(o.from)} oferece ${side(s, o.giveSquares, o.cashFrom)} por ${side(s, o.wantSquares, o.cashTo)} de ${n(o.to)}`;
}
const owns = (s: GameState, id: string, sq: number) => s.owners[sq] === id && housesAt(s, sq) === 0;
const clean = (s: GameState, l: unknown): number[] => [...new Set((Array.isArray(l) ? l : []).map(Number).filter((i) => Number.isInteger(i) && boardFor(s)[i]?.kind === "property"))];
/** Negociação: compra, venda ou permuta de vários imóveis, com dinheiro líquido num só sentido. */
export function proposeTrade(s: GameState, from: string, to: string, give: number[], want: number[], cashFrom: number, cashTo: number, offerId: string): GameState {
  const other = s.players.find((p) => p.id === to);
  const me = s.players.find((p) => p.id === from);
  const giveSquares = clean(s, give), wantSquares = clean(s, want);
  const net = Math.floor(Math.max(0, cashFrom || 0)) - Math.floor(Math.max(0, cashTo || 0));
  const cf = Math.max(0, net), ct = Math.max(0, -net);
  if (s.phase !== "playing" || s.offer || from === to || !other || !me || other.out || me.out) return s;
  if (!giveSquares.length && !wantSquares.length) return s;
  if (!giveSquares.every((i) => owns(s, from, i)) || !wantSquares.every((i) => owns(s, to, i))) return s;
  if (cf > me.balance) return s;
  const o: Offer = { id: offerId, from, to, giveSquares, wantSquares, cashFrom: cf, cashTo: ct };
  return say({ ...s, offer: o }, offerText(s, o));
}
export function answerTrade(s: GameState, id: string, offerId: string, accept: boolean): GameState {
  const o = s.offer;
  if (!o || o.id !== offerId) return s;
  if (id === o.from && !accept) return say({ ...s, offer: null }, "Oferta cancelada");
  if (id !== o.to) return s;
  const to = s.players.find((p) => p.id === o.to)!;
  const from = s.players.find((p) => p.id === o.from)!;
  const give = o.giveSquares ?? [], want = o.wantSquares ?? [];
  const broke = to.balance < (o.cashTo ?? 0) || from.balance < (o.cashFrom ?? 0);
  if (!accept || broke || !give.every((i) => owns(s, o.from, i)) || !want.every((i) => owns(s, o.to, i))) return say({ ...s, offer: null }, `${to.name} recusou a oferta`);
  const owners: Record<string, string> = { ...s.owners };
  give.forEach((i) => (owners[i] = o.to));
  want.forEach((i) => (owners[i] = o.from));
  let next: GameState = { ...s, offer: null, owners };
  if (o.cashFrom > 0) next = move(next, o.from, o.to, o.cashFrom, "Negociação");
  if (o.cashTo > 0) next = move(next, o.to, o.from, o.cashTo, "Negociação");
  return say(next, `Negócio fechado: ${from.name} ⇄ ${to.name}`, "good");
}

export function requestTransfer(s: GameState, from: string, to: string, amount: number, pixId: string): GameState {
  if (s.pending || s.moving || from === to || amount <= 0 || !s.players.some((p) => p.id === to)) return s;
  const bal = s.players.find((p) => p.id === from)?.balance ?? 0;
  if (amount > bal) return s;
  return say({ ...s, pending: { kind: "pix", id: pixId, from, to, amount: Math.floor(amount), reason: "Pix" } }, `${nameOf(s, from)} vai fazer um Pix para ${nameOf(s, to)}`);
}

export function confirmPix(s: GameState, id: string, pixId: string): GameState {
  const pd = s.pending;
  if (pd?.kind !== "pix" || pd.id !== pixId || pd.from !== id) return s;
  let next = move({ ...s, pending: null }, pd.from, pd.to, pd.amount, pd.reason);
  next = say(next, `Pix de ${money(pd.amount)}: ${nameOf(s, pd.from)} → ${nameOf(s, pd.to)}`, "good");
  return pd.reason === "Pix" ? next : endTurn(next);
}

export function cancelPix(s: GameState, id: string): GameState {
  const pd = s.pending;
  if (pd?.kind !== "pix" || pd.reason !== "Pix" || pd.from !== id) return s;
  return say({ ...s, pending: null }, "Pix cancelado");
}

function endTurn(s: GameState): GameState {
  if (s.pending || s.phase !== "playing") return s;
  if (horrorActive(s)) return horrorEndTurn(s);
  const cur = current(s);
  if (cur && !cur.out && !cur.jail && (cur.doubles ?? 0) > 0) return { ...s, log: [`${cur.name} tirou dupla e joga de novo`, ...s.log].slice(0, 30) };
  let next = cur ? patch(s, cur.id, { doubles: 0 }) : s;
  let turn = next.turn;
  for (let k = 0; k < next.players.length; k++) {
    turn = (turn + 1) % next.players.length;
    if (!next.players[turn]!.out) break;
  }
  if (turn <= next.turn) {
    const round = (next.round ?? 0) + 1;
    let ev = activeCityEvent({ ...next, round });
    if (round % EVENT_EVERY === 0 && !ev) {
      const e = eventsFor(s)[(round / EVENT_EVERY - 1) % eventsFor(s).length]!;
      ev = e.kind === "padroeira" ? { ...e, text: e.text.replace(/\d+ minutos/, `${cityEventMs(next) / 60_000} minutos`), expiresAt: Date.now() + cityEventMs(next) } : { ...e, until: round + 1 };
      next = say({ ...next, round, cityEvent: ev }, ev.text, "info");
    } else next = { ...next, round, cityEvent: ev };
  }
  next = patch({ ...next, turn }, next.players[turn]!.id, { doubles: 0 });
  return next;
}

/** Who owns lands of the same color as `square` (excluding it). */
export function groupOwners(s: GameState, square: number): { id: string; count: number }[] {
  const g = boardFor(s)[square]?.group;
  const m = new Map<string, number>();
  boardFor(s).forEach((b, i) => { const o = s.owners[i]; if (b.group === g && i !== square && o) m.set(o, (m.get(o) ?? 0) + 1); });
  return [...m].map(([id, count]) => ({ id, count }));
}

/** Hall da Fama: special end-of-game honors (only awarded when someone scored). */
export function honors(s: GameState): { icon: string; title: string; player: Player; value: string }[] {
  const defs = [
    { k: "rent", icon: "👑", title: "Rei do Aluguel", fmt: (v: number) => money(v) },
    { k: "jail", icon: "🚔", title: "Infrator do Ano", fmt: (v: number) => `${v}× na Delegacia` },
    { k: "luck", icon: "🍀", title: "Pé de Coelho", fmt: (v: number) => "+" + money(v) },
    { k: "built", icon: "🏗️", title: "Barão da Construção", fmt: (v: number) => `${v} obra${v > 1 ? "s" : ""}` },
  ] as const;
  const out: { icon: string; title: string; player: Player; value: string }[] = [];
  for (const d of defs) {
    const best = [...s.players].sort((a, b) => (b.stats?.[d.k] ?? 0) - (a.stats?.[d.k] ?? 0))[0];
    const v = best?.stats?.[d.k] ?? 0;
    if (best && v > 0) out.push({ icon: d.icon, title: d.title, player: best, value: d.fmt(v) });
  }
  return out;
}

/** Seconds a player has to act on their turn before the bank acts for them. */
export const TURN_MS = 60_000;
/** Turn timeout for decisions (buy, rent Pix, debt). Rolling is done by the master with real dice. */
export function autoResolve(s: GameState): GameState {
  const pd = s.pending;
  if (s.phase !== "playing" || s.moving || !pd) return s;
  if (pd.kind === "buy") {
    const sq = boardFor(s)[pd.square]!;
    return endTurn(say({ ...s, pending: null }, `Tempo esgotado: ${nameOf(s, pd.playerId)} não comprou ${sq.name}`));
  }
  if (pd.kind === "pix") {
    if (pd.reason === "Pix") return say({ ...s, pending: null }, "Pix cancelado (tempo esgotado)");
    const p = s.players.find((x) => x.id === pd.from)!;
    if (p.balance >= pd.amount) return confirmPix(s, pd.from, pd.id);
    return endTurn(debtOrBankrupt({ ...s, pending: null }, pd.from, pd.to, pd.amount, pd.reason));
  }
  if (pd.kind === "debt") {
    const p = s.players.find((x) => x.id === pd.playerId)!;
    return p.balance >= pd.amount ? payDebt(s, pd.playerId) : giveUp(s, pd.playerId);
  }
  return s;
}
/** Host: "Passar a vez". Pending decisions time out; auctions, raspadinhas and cobranças keep their own clocks. */
export function skipTurn(s0: GameState): GameState {
  if (s0.phase !== "playing" || s0.moving) return s0;
  const s = patch(s0, current(s0).id, { doubles: 0 });
  const pd = s.pending;
  if (pd && (pd.kind === "buy" || pd.kind === "pix" || pd.kind === "debt")) {
    const n = autoResolve(s);
    return n.pending || n.turn !== s.turn ? n : endTurn(n);
  }
  if (pd) return s0;
  return endTurn(say(s, `O tabuleiro passou a vez de ${current(s).name}`));
}
/** Host: remove an absent player. In the lobby they just leave; in a game they go bankrupt to the bank. */
export function kickPlayer(s: GameState, id: string): GameState {
  const p = s.players.find((x) => x.id === id);
  if (!p || p.out) return s;
  if (s.phase === "lobby") return say({ ...s, players: s.players.filter((x) => x.id !== id) }, `${p.name} saiu da sala`);
  if (s.phase !== "playing" || s.moving) return s;
  const wasTurn = current(s).id === id;
  const pd = s.pending;
  const involved = !!pd && (("playerId" in pd && pd.playerId === id) || (pd.kind === "pix" && (pd.from === id || pd.to === id)) || (pd.kind === "debt" && pd.to === id) || (pd.kind === "collect" && pd.targetId === id));
  let next = bankrupt(s, id, BANK, !involved);
  if (next.pending?.kind === "auction") {
    const a = next.pending;
    const order = a.order.filter((x) => x !== id);
    next = { ...next, pending: !order.length ? null : { ...a, order, turn: a.turn % order.length, bidder: a.bidder === id ? null : a.bidder, bid: a.bidder === id ? 0 : a.bid } };
  }
  if (next.pending?.kind === "collect") next = closeCollect(next);
  if (next.phase === "playing" && wasTurn && !next.pending) next = endTurn(next);
  return next;
}


/** The curse is deliberately scoped: legacy rooms and other cities never enter it. */
export const horrorActive = (s: GameState) => cityOf(s) === "esquecidos" && s.curse?.stage === "awake" && s.phase === "playing";
export const ritualTarget = (s: GameState) => s.curse?.order[Object.keys(s.curse.altars).length];
export function altarNear(s: GameState, id: string, altar: number): boolean {
  const p = s.players.find((x) => x.id === id);
  if (!p || !(ALTARS as readonly number[]).includes(altar)) return false;
  const distance = Math.abs(p.pos - altar);
  return Math.min(distance, boardFor(s).length - distance) <= 6;
}

/** Master-only queue tick; random and time are supplied by the caller, persisted once. */
export function horrorTick(s: GameState, now: number, random = 0): GameState {
  if (cityOf(s) !== "esquecidos" || s.phase !== "playing" || s.moving || s.pending) return s;
  if (!s.curse) {
    const properties = boardFor(s).filter((sq) => sq.kind === "property").length;
    const bought = Object.keys(s.owners).length;
    if ((s.round ?? 0) < CURSE_ROUND && bought < Math.ceil(properties / 2)) return s;
    const rotate = Math.min(3, Math.max(0, Math.floor(random * 4)));
    const order = [...ALTARS.slice(rotate), ...ALTARS.slice(0, rotate)];
    const curse: Curse = { stage: "awake", awakenedAt: now, nextFogAt: now + FOG_MS, fogGroups: [], consumed: [], altars: {}, sanity: Object.fromEntries(s.players.filter((p) => !p.out).map((p) => [p.id, 100])), torches: Object.fromEntries(s.players.filter((p) => !p.out).map((p) => [p.id, 2])), clue: 0, order };
    return say({ ...s, curse, cityEvent: null, offer: null, card: null, transfer: null, players: s.players.map((p) => ({ ...p, jail: 0, doubles: 0 })) }, CURSE_MESSAGE, "bad");
  }
  if (!horrorActive(s) || now < s.curse.nextFogAt) return s;
  const c = s.curse;
  const groups = Array.from({ length: 8 }, (_, i) => i).filter((g) => !c.fogGroups.includes(g));
  const group = groups[Math.min(groups.length - 1, Math.max(0, Math.floor(random * groups.length)))];
  if (group === undefined) return s;
  const lost = boardFor(s).flatMap((sq, i) => sq.group === group ? [i] : []);
  const owners = { ...s.owners }, houses = { ...s.houses }, mortgaged = { ...s.mortgaged };
  for (const i of lost) { delete owners[i]; delete houses[i]; delete mortgaged[i]; }
  const curse: Curse = { ...c, consumed: [...c.consumed, ...lost], fogGroups: [...c.fogGroups, group], nextFogAt: c.nextFogAt + FOG_MS };
  const offer = s.offer && [...s.offer.giveSquares, ...s.offer.wantSquares].some((i) => lost.includes(i)) ? null : s.offer ?? null;
  const next = say({ ...s, curse, owners, houses, mortgaged, offer }, `A névoa devorou o bairro ${group + 1}. Suas propriedades desapareceram.`, "bad");
  return curse.fogGroups.length >= 8 ? horrorFinish(next, false) : next;
}
function horrorFinish(s: GameState, escaped: boolean): GameState {
  if (!s.curse) return s;
  return say({ ...s, phase: "over", winner: null, pending: null, moving: false, offer: null, curse: { ...s.curse, stage: escaped ? "escaped" : "forgotten" } }, escaped ? "Os quatro altares se acenderam. Todos escaparam! A cidade voltou a lembrar seus nomes." : "A cidade esqueceu seus nomes. A maldição venceu…", escaped ? "good" : "bad");
}
function horrorEndTurn(s: GameState): GameState {
  if (!s.curse || !s.players.length) return s;
  const alive = s.players.filter((p) => !p.out && (s.curse?.sanity[p.id] ?? 0) > 0);
  if (!alive.length) return horrorFinish(s, false);
  let turn = s.turn;
  for (let k = 0; k < s.players.length; k++) {
    turn = (turn + 1) % s.players.length;
    const p = s.players[turn];
    if (p && !p.out && (s.curse.sanity[p.id] ?? 0) > 0) break;
  }
  return { ...s, turn, round: (s.round ?? 0) + (turn <= s.turn ? 1 : 0) };
}
function horrorLand(s: GameState, random: number): GameState {
  const p = current(s), c = s.curse;
  if (!p || !c) return s;
  const sq = boardFor(s)[p.pos];
  const safe = (ALTARS as readonly number[]).includes(p.pos);
  const fog = c.consumed.includes(p.pos);
  const memory = sq?.kind === "luck";
  const change = safe ? 15 : fog ? -20 : memory ? (random < 0.5 ? 10 : -10) : -5;
  const sanity = { ...c.sanity, [p.id]: Math.max(0, Math.min(100, (c.sanity[p.id] ?? 100) + change)) };
  const torch = memory && random < 0.5;
  const torches = torch ? { ...c.torches, [p.id]: Math.min(4, (c.torches[p.id] ?? 0) + 1) } : c.torches;
  const text = sanity[p.id] === 0 ? `${p.name} se perdeu nas sombras. Uma tocha de um aliado pode resgatá-lo.` : safe ? `${p.name} encontrou abrigo no altar: +15 de sanidade.` : torch ? `${p.name} encontrou uma memória e uma tocha: +10 de sanidade.` : `${p.name}: ${fog ? "a névoa queimou 20" : memory ? "um sussurro roubou 10" : "a cidade roubou 5"} de sanidade.`;
  return horrorEndTurn(say({ ...s, moving: false, curse: { ...c, sanity, torches, clue: c.clue + (memory ? 1 : 0) } }, text, change > 0 ? "good" : "bad"));
}
/** Ritual and torch actions are voluntary and do not consume the dice turn. */
export function purifyAltar(s: GameState, id: string, altar: number, sacrifice?: number): GameState {
  const p = s.players.find((x) => x.id === id), c = s.curse;
  if (!horrorActive(s) || s.moving || s.pending || !p || p.out || !c || (c.sanity[id] ?? 0) <= 0 || ritualTarget(s) !== altar || !altarNear(s, id, altar)) return s;
  let next = s;
  if (sacrifice !== undefined) {
    if (!Number.isInteger(sacrifice) || s.owners[sacrifice] !== id) return s;
    const owners = { ...s.owners }, houses = { ...s.houses }, mortgaged = { ...s.mortgaged };
    delete owners[sacrifice]; delete houses[sacrifice]; delete mortgaged[sacrifice];
    next = { ...s, owners, houses, mortgaged, offer: null };
  } else {
    if (p.balance < RITUAL_COST) return s;
    next = move(s, id, BANK, RITUAL_COST, "Oferenda ao altar");
  }
  const altars = { ...c.altars, [altar]: id };
  next = say({ ...next, curse: { ...c, altars, sanity: { ...c.sanity, [id]: Math.min(100, (c.sanity[id] ?? 0) + 20) } } }, `${p.name} purificou ${boardFor(s)[altar]?.name}: ${Object.keys(altars).length}/4 selos quebrados!`, "good");
  return Object.keys(altars).length === 4 ? horrorFinish(next, true) : next;
}
export function useTorch(s: GameState, id: string, target = id): GameState {
  const c = s.curse, p = s.players.find((x) => x.id === id), other = s.players.find((x) => x.id === target);
  if (!horrorActive(s) || s.moving || s.pending || !c || !p || p.out || !other || other.out || (c.sanity[id] ?? 0) <= 0 || (c.torches[id] ?? 0) < 1 || (c.sanity[target] ?? 0) >= 100) return s;
  return say({ ...s, curse: { ...c, torches: { ...c.torches, [id]: (c.torches[id] ?? 0) - 1 }, sanity: { ...c.sanity, [target]: Math.min(100, (c.sanity[target] ?? 0) + 30) } } }, `${p.name} iluminou o caminho de ${other.name}: +30 de sanidade.`, "good");
}
export function travelAltar(s: GameState, id: string): GameState {
  const c = s.curse, altar = ritualTarget(s);
  if (!horrorActive(s) || s.moving || s.pending || !c || altar === undefined || current(s)?.id !== id || (c.sanity[id] ?? 0) <= 0 || (c.torches[id] ?? 0) < 1) return s;
  return say({ ...patch(s, id, { pos: altar }), curse: { ...c, torches: { ...c.torches, [id]: (c.torches[id] ?? 0) - 1 } } }, `${nameOf(s, id)} gastou uma tocha e atravessou as sombras até ${boardFor(s)[altar]?.name}.`, "info");
}
