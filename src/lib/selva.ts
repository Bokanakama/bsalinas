import type { Square, LuckCard, CityEventKind } from "./game";
import { BORO_BOARD } from "./boro";

/** Selva dos Tambores: same 56-square geometry as Boró (corners 0/17/28/45), jungle names, 3 relic squares. */
const NAMES = [
  "Clareira Inicial", "Trilha do Sapo-Boi", "Ponte de Cipó", "Aldeia dos Micos", "Picada de Formiga-de-Fogo", "Cipó do Norte",
  "Bosque das Bromélias", "Tambor Misterioso", "Lagoa dos Sapos", "Toca do Tatu", "Ninho do Tucano", "Areia Movediça",
  "Cachoeira Escondida", "Vagalumes Elétricos", "Gruta dos Morcegos", "Ruínas do Macaco", "Relíquia: Olho do Tigre", "Jaula de Bambu",
  "Canoa do Leste", "Margem dos Jacarés", "Tambor Misterioso", "Ilha das Piranhas", "Cais das Vitórias-Régias", "Tambor Misterioso",
  "Ponte Suspensa", "Pedágio do Macaco-Prego", "Picada de Mosquito", "Tambor Misterioso", "Rede na Copa da Árvore", "Templo da Lua",
  "Tambor Misterioso", "Altar das Serpentes", "Escadaria de Pedra", "Câmara dos Ecos", "Balão do Sul", "Vale dos Rinocerontes",
  "Planície da Manada", "Fonte Borbulhante", "Mirante dos Gaviões", "Roda dos Tambores", "Desfiladeiro do Vento", "Maldição do Feiticeiro",
  "Vulcão Adormecido", "Rio de Lava", "Caldeirão Fervente", "Armadilha do Caçador", "Trilha Secreta do Oeste", "Relíquia: Lágrima da Sucuri",
  "Cidade Perdida", "Tambor Misterioso", "Tributo ao Rei Macaco", "Trono de Jade", "Relíquia: Coração da Selva", "Tambor Misterioso",
  "Pedágio da Cobra Grande", "Pico do Trovão",
];
export const RELIC_SQUARES = [16, 47, 52] as const;
export const RELIC_NAMES = ["Olho do Tigre", "Lágrima da Sucuri", "Coração da Selva"] as const;
export const RELIC_STEAL = 100;
export const BEAST_START = 28;
export const BEAST_BITE = 50;

export const SELVA_BOARD: Square[] = BORO_BOARD.map((sq, i) => {
  const relic = RELIC_SQUARES.indexOf(i as (typeof RELIC_SQUARES)[number]);
  return relic >= 0 ? { name: NAMES[i]!, kind: "bonus", amount: 0, relic } : { ...sq, name: NAMES[i]! };
});

export const SELVA_CARDS: LuckCard[] = [
  { text: "O tambor tocou, um baú você achou", amount: 150 },
  { text: "Trocou bananas com os micos e lucrou", amount: 80 },
  { text: "Um tucano deixou moedas no seu ninho", amount: 50 },
  { text: "O xamã gostou de você: presente da tribo", amount: 100 },
  { text: "Cipó arrebentou, seu cantil quebrou", amount: -60 },
  { text: "Macaco roubou seu chapéu e o mapa", amount: -100 },
  { text: "Picada de aranha: chá do curandeiro", amount: -80 },
  { text: "Tesouro de explorador perdido", amount: 200 },
  { text: "Um cipó mágico te leva à Clareira", amount: 0, goto: 0, passStart: true },
  { text: "Caiu na rede do caçador: vá para a Jaula", amount: 0, jail: true },
  { text: "Batuque na fogueira! Cada jogador envia Borós", amount: 0, each: 30 },
  { text: "Cupins nas cabanas: pague por cabana", amount: 0, perHouse: 25 },
  { text: "Achou ovos de ouro da arara", amount: 120 },
  { text: "Vendeu açaí para os exploradores", amount: 70 },
  { text: "Moeda antiga no casco do jabuti", amount: 30 },
  { text: "Venceu a corrida de canoas", amount: 90 },
  { text: "Formigas comeram seu lanche", amount: -50 },
  { text: "Chuva derrubou sua barraca", amount: -90 },
  { text: "Jacaré mordeu sua mochila", amount: -120 },
  { text: "Pagou o guia para sair da névoa", amount: -70 },
  { text: "Pegou carona no Cipó do Norte", amount: 0, goto: 5 },
  { text: "Tempestade de folhas: pague por cabana", amount: 0, perHouse: 15 },
  { text: "Dança da chuva! Cada jogador envia Borós", amount: 0, each: 20 },
  { text: "Amuleto da Fuga! Guarde para sair da Jaula", amount: 0, freeJail: true },
];

export const SELVA_EVENTS: { kind: CityEventKind; text: string }[] = [
  { kind: "feriado", text: "Estouro da Manada: cipós, canoas, balões e trilhas cobram o triplo por 1 rodada!" },
  { kind: "temporal", text: "Chuva de Monção: Vulcão, Rio de Lava e Caldeirão não cobram aluguel por 1 rodada" },
  { kind: "padroeira", text: "O Chamado dos Tambores: passar pela Clareira paga B$ 400 por 2 minutos!" },
];
