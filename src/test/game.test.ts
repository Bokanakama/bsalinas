import { describe, expect, it } from "vitest";
import * as G from "@/lib/game";

function twoPlayers() {
  let s = G.newState();
  s = G.join(s, "a", "Ana");
  s = G.join(s, "b", "Beto");
  return G.start(s);
}

describe("Cidade Boró rules", () => {
  it("toll is taken automatically by the bank", () => {
    let s = G.roll(twoPlayers(), "a", 1, 1); // lands on square 2 (toll 30)
    s = G.land(s, "x");
    expect(s.players[0]!.balance).toBe(G.START_BALANCE - 30);
    expect(s.turn).toBe(0); // doubles: plays again
  });
  it("landing on someone else's property creates a Pix for the rent", () => {
    let s = twoPlayers();
    s = { ...s, owners: { 3: "b" } };
    s = G.land(G.roll(s, "a", 1, 2), "pix1");
    expect(s.pending).toMatchObject({ kind: "pix", from: "a", to: "b", amount: 16 });
    s = G.confirmPix(s, "a", "pix1");
    expect(s.players[0]!.balance).toBe(G.START_BALANCE - 16);
    expect(s.players[1]!.balance).toBe(G.START_BALANCE + 16);
  });
  it("passing the start pays the bonus", () => {
    let s = twoPlayers();
    s = { ...s, players: s.players.map((p) => (p.id === "a" ? { ...p, pos: G.BOARD.length - 2 } : p)) };
    s = G.roll(s, "a", 1, 2);
    expect(s.players[0]!.balance).toBe(G.START_BALANCE + G.START_BONUS);
  });
});

describe("animals and transfers", () => {
  it("an animal already chosen cannot be taken by another player", () => {
    let s = G.join(G.newState(), "a", "Ana", "gato");
    s = G.join(s, "b", "Beto", "gato");
    expect(s.players).toHaveLength(1);
  });
  it("paying rent records a transfer from payer to owner", () => {
    let s = G.join(G.join(G.newState(), "a", "Ana"), "b", "Beto");
    s = { ...G.start(s), owners: { 3: "b" } };
    s = G.confirmPix(G.land(G.roll(s, "a", 1, 2), "p"), "a", "p");
    expect(s.transfer).toMatchObject({ from: "a", to: "b", amount: 16 });
  });
});

describe("Sorte ou Revés", () => {
  it("a luck card moves money between bank and player", () => {
    let s = G.join(G.join(G.newState(), "a", "Ana"), "b", "Beto");
    s = G.start(s);
    s = G.land(G.roll(s, "a", 3, 4), "p", 0); // square 7, first card -120 (maré pegou o carro)
    expect(s.pending).toMatchObject({ kind: "scratch", playerId: "a" });
    expect(G.roll(s, "b", 1, 2)).toBe(s); // next player waits for the raspadinha
    s = G.revealCard(s, "a");
    expect(s.players[0]!.balance).toBe(G.START_BALANCE - 120);
  });
});

describe("classic rules", () => {
  const at = (s: G.GameState, id: string, f: Partial<G.Player>) => ({ ...s, players: s.players.map((p) => (p.id === id ? { ...p, ...f } : p)) });
  it("non-double roll passes the turn", () => {
    const s = G.land(G.roll(twoPlayers(), "a", 1, 3), "x"); // square 4 fine
    expect(s.turn).toBe(1);
  });
  it("three doubles in a row sends the player to the Delegacia", () => {
    const s = G.roll(at(twoPlayers(), "a", { doubles: 2 }), "a", 2, 2);
    expect(s.players[0]).toMatchObject({ pos: G.JAIL, jail: G.JAIL_TURNS });
    expect(s.turn).toBe(1);
  });
  it("landing on Vá para a Delegacia jails the player", () => {
    const s = G.land(G.roll(at(twoPlayers(), "a", { pos: G.GOJAIL - 4 }), "a", 1, 3), "x");
    expect(s.players[0]).toMatchObject({ pos: G.JAIL, jail: 3 });
  });
  it("paying bail costs B$ 50 and frees the player", () => {
    const s = G.payBail(at(twoPlayers(), "a", { jail: 3, pos: G.JAIL }), "a");
    expect(s.players[0]).toMatchObject({ jail: 0, balance: G.START_BALANCE - 50 });
  });
  it("station rent doubles per station owned: 1=25, 2=50, 4=200", () => {
    const s = twoPlayers();
    expect(G.rentFor({ ...s, owners: { 5: "b" } }, 5)).toBe(25);
    expect(G.rentFor({ ...s, owners: { 5: "b", 18: "b" } }, 5)).toBe(50);
    expect(G.rentFor({ ...s, owners: { 5: "b", 18: "b", 34: "b", 46: "b" } }, 5)).toBe(200);
  });
  it("utility rent is dice ×4 with one, ×10 with both", () => {
    const s = { ...twoPlayers(), dice: [3, 4] as [number, number] };
    expect(G.rentFor({ ...s, owners: { 13: "b" } }, 13)).toBe(28);
    expect(G.rentFor({ ...s, owners: { 13: "b", 37: "b" } }, 13)).toBe(70);
  });
  it("barraquinhas need the full color and multiply rent", () => {
    let s: G.GameState = { ...twoPlayers(), owners: { 1: "a" } };
    expect(G.build(s, "a", 1)).toBe(s);
    s = { ...s, owners: { 1: "a", 3: "a", 10: "a" } };
    s = G.build(s, "a", 1);
    expect(G.housesAt(s, 1)).toBe(1);
    expect(s.players[0]!.balance).toBe(G.START_BALANCE - 50);
    expect(G.rentFor(s, 1)).toBe(50);
  });
  it("a player who cannot pay rent goes bankrupt and the other wins", () => {
    let s = at({ ...twoPlayers(), owners: { 3: "b" } }, "a", { balance: 5 });
    s = G.land(G.roll(s, "a", 1, 2), "p");
    expect(s.players[0]!.out).toBe(true);
    expect(s.phase).toBe("over");
    expect(s.winner).toBe("b");
  });
});

describe("auction, mortgage, trade, city events", () => {
  it("before the 1st lap, declining a purchase does not open an auction", () => {
    let s = G.land(G.roll(twoPlayers(), "a", 1, 2), "x", 0, 0);
    s = G.buy(s, "a", false, 0);
    expect(s.pending).toBeNull();
    expect(s.owners[3]).toBeUndefined();
  });
  it("auction goes one player at a time; passing or timing out hands it over", () => {
    let s = twoPlayers();
    s = { ...s, players: s.players.map((p) => ({ ...p, laps: 1 })) };
    s = G.buy(G.land(G.roll(s, "a", 1, 2), "x", 0, 0), "a", false, 0);
    expect(s.pending).toMatchObject({ kind: "auction", square: 3, order: ["a", "b"], turn: 0, endsAt: G.AUCTION_MS });
    expect(G.bid(s, "b", 40, 10)).toBe(s); // not b's turn
    s = G.bid(s, "a", 20, 10);
    expect(G.auctionTurn(s)).toBe("b");
    s = G.bid(s, "b", 40, 20);
    expect(G.auctionTurn(s)).toBe("a");
    s = G.closeAuction(s, 20 + G.AUCTION_MS); // a times out -> b wins
    expect(s.pending).toBeNull();
    expect(s.owners[3]).toBe("b");
    expect(s.players[1]!.balance).toBe(G.START_BALANCE - 40);
  });
  it("mortgage pays half the price and stops rent; resgate costs +10%", () => {
    let s: G.GameState = { ...twoPlayers(), owners: { 3: "a" } };
    s = G.mortgage(s, "a", 3);
    expect(s.players[0]!.balance).toBe(G.START_BALANCE + 40);
    expect(G.rentFor(s, 3)).toBe(0);
    s = G.unmortgage(s, "a", 3);
    expect(s.players[0]!.balance).toBe(G.START_BALANCE + 40 - 44);
  });
  it("accepted trade moves land and money between players", () => {
    let s: G.GameState = { ...twoPlayers(), owners: { 3: "a" } };
    s = G.answerTrade(G.proposeTrade(s, "a", "b", [3], [], 0, 120, "o1"), "b", "o1", true);
    expect(s.owners[3]).toBe("b");
    expect(s.players[0]!.balance).toBe(G.START_BALANCE + 120);
    expect(s.players[1]!.balance).toBe(G.START_BALANCE - 120);
  });
  it("Feriadão triples station rent", () => {
    const s: G.GameState = { ...twoPlayers(), owners: { 5: "b" }, cityEvent: { kind: "feriado", text: "", until: 9 } };
    expect(G.rentFor(s, 5)).toBe(75);
  });
});

describe("bigger board and new cards", () => {
  it("board has 56 squares with the Delegacia at 17", () => {
    expect(G.BOARD).toHaveLength(56);
    expect(G.BOARD[G.JAIL]!.name).toBe("Delegacia de Salinas (visita)");
    expect(G.BOARD[G.GOJAIL]!.kind).toBe("gojail");
  });
  it("Saia Livre card is kept and used instead of going to jail", () => {
    let s = twoPlayers();
    const idx = G.LUCK_CARDS.findIndex((c) => c.freeJail);
    s = G.revealCard(G.land(G.roll(s, "a", 3, 4), "p", (idx + 0.5) / G.LUCK_CARDS.length), "a");
    expect(s.players[0]!.freeJail).toBe(1);
    s = { ...s, turn: 0, players: s.players.map((p) => (p.id === "a" ? { ...p, pos: G.GOJAIL - 4 } : p)) };
    s = G.land(G.roll(s, "a", 1, 3), "x");
    expect(s.players[0]).toMatchObject({ freeJail: 0, pos: G.GOJAIL });
  });
  it("Roda de Samba pays B$ 20 to each other player", () => {
    const i = G.BOARD.findIndex((b) => b.kind === "samba");
    let s = twoPlayers();
    s = { ...s, players: s.players.map((p) => (p.id === "a" ? { ...p, pos: i - 3 } : p)) };
    s = G.land(G.roll(s, "a", 1, 2), "x");
    expect(s.players[0]!.balance).toBe(G.START_BALANCE - 20);
    expect(s.players[1]!.balance).toBe(G.START_BALANCE + 20);
  });
});

import { honors as _honors } from "@/lib/game";
describe("Hall da Fama", () => {
  it("awards Rei do Aluguel to the top rent earner", () => {
    const s = { players: [
      { id: "a", name: "A", stats: { rent: 300, jail: 0, luck: 0, built: 0 } },
      { id: "b", name: "B", stats: { rent: 100, jail: 2, luck: 0, built: 0 } },
    ] } as unknown as Parameters<typeof _honors>[0];
    const h = _honors(s);
    expect(h.find((x) => x.title === "Rei do Aluguel")?.player.id).toBe("a");
    expect(h.find((x) => x.title === "Infrator do Ano")?.player.id).toBe("b");
    expect(h.some((x) => x.title === "Pé de Coelho")).toBe(false);
  });
});

describe("negociação e falência", () => {
  const setup = () => {
    let s = G.start(G.join(G.join(G.newState(), "a", "A"), "b", "B"));
    s = { ...s, owners: { 1: "a", 3: "b" } };
    return s;
  };
  const bal = (s: G.GameState, id: string) => s.players.find((p) => p.id === id)!.balance;
  it("permuta direta troca os donos", () => {
    const s = G.answerTrade(G.proposeTrade(setup(), "a", "b", [1], [3], 0, 0, "o"), "b", "o", true);
    expect(s.owners[1]).toBe("b"); expect(s.owners[3]).toBe("a");
  });
  it("volta paga por quem propõe vai para o outro", () => {
    const s0 = setup();
    const s = G.answerTrade(G.proposeTrade(s0, "a", "b", [1], [3], 100, 0, "o"), "b", "o", true);
    expect(bal(s, "a")).toBe(bal(s0, "a") - 100); expect(bal(s, "b")).toBe(bal(s0, "b") + 100);
  });
  it("volta paga por quem recebe a proposta", () => {
    const s0 = setup();
    const s = G.answerTrade(G.proposeTrade(s0, "a", "b", [1], [3], 0, 50, "o"), "b", "o", true);
    expect(bal(s, "b")).toBe(bal(s0, "b") - 50);
  });
  it("recusa e cancelamento não mudam donos", () => {
    const s0 = G.proposeTrade(setup(), "a", "b", [1], [3], 0, 0, "o");
    expect(G.answerTrade(s0, "b", "o", false).owners[1]).toBe("a");
    expect(G.answerTrade(s0, "a", "o", false).offer).toBeNull();
  });
  it("raspadinhas seguidas ganham ids novos", () => {
    let s = setup();
    const luck = G.BOARD.findIndex((b) => b.kind === "luck");
    s = { ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, pos: luck } : p)) };
    const a = G.land(s, "x", 0.5);
    const b = G.land({ ...G.revealCard(a), turn: 0, card: null, pending: null, players: s.players }, "y", 0.5);
    expect(b.card!.id).toBe(a.card!.id + 1);
  });
  it("aluguel maior que saldo com terrenos abre risco de falência", () => {
    let s = setup();
    s = { ...s, owners: { 1: "a", 3: "b", 6: "a" }, players: s.players.map((p) => (p.id === "a" ? { ...p, balance: 0, pos: 3 } : p)) };
    const n = G.land(s, "x");
    if (G.rentFor(s, 3) > 0) { expect(n.pending?.kind).toBe("debt"); expect(n.players[0]!.out).toBeFalsy(); }
  });
});

describe("mesa de negociação multi-imóveis", () => {
  const setup = () => ({ ...G.start(G.join(G.join(G.newState(), "a", "A"), "b", "B")), owners: { 1: "a", 3: "a", 6: "b" } as Record<string, string> });
  const bal = (s: G.GameState, id: string) => s.players.find((p) => p.id === id)!.balance;
  it("compra direta: A paga B$ 300 por um terreno de B", () => {
    const s0 = setup();
    const s = G.answerTrade(G.proposeTrade(s0, "a", "b", [], [6], 300, 0, "o"), "b", "o", true);
    expect(s.owners[6]).toBe("a"); expect(bal(s, "a")).toBe(bal(s0, "a") - 300); expect(bal(s, "b")).toBe(bal(s0, "b") + 300);
  });
  it("venda direta: A entrega um terreno por B$ 250", () => {
    const s0 = setup();
    const s = G.answerTrade(G.proposeTrade(s0, "a", "b", [1], [], 0, 250, "o"), "b", "o", true);
    expect(s.owners[1]).toBe("b"); expect(bal(s, "a")).toBe(bal(s0, "a") + 250);
  });
  it("permuta múltipla: A entrega 2 e recebe 1 + B$ 80", () => {
    const s0 = setup();
    const s = G.answerTrade(G.proposeTrade(s0, "a", "b", [1, 3], [6], 0, 80, "o"), "b", "o", true);
    expect([s.owners[1], s.owners[3], s.owners[6]]).toEqual(["b", "b", "a"]); expect(bal(s, "b")).toBe(bal(s0, "b") - 80);
  });
  it("recusa ou cancelamento não muda nada", () => {
    const s0 = G.proposeTrade(setup(), "a", "b", [1, 3], [6], 100, 0, "o");
    for (const s of [G.answerTrade(s0, "b", "o", false), G.answerTrade(s0, "a", "o", false)]) {
      expect(s.offer).toBeNull(); expect(s.owners[1]).toBe("a"); expect(s.owners[6]).toBe("b"); expect(bal(s, "a")).toBe(bal(s0, "a"));
    }
  });
  it("bloqueia terreno com barraca e dinheiro acima do saldo", () => {
    const s0 = setup();
    expect(G.proposeTrade({ ...s0, houses: { 1: 1 } }, "a", "b", [1], [6], 0, 0, "o").offer ?? null).toBeNull();
    expect(G.proposeTrade(s0, "a", "b", [], [6], bal(s0, "a") + 1, 0, "o").offer ?? null).toBeNull();
  });
});

describe("auction dismiss and reactions", () => {
  it("there are 12 animals to pick, including the duck", async () => {
    const G = await import("@/lib/game");
    expect(G.ANIMALS).toHaveLength(12);
    expect(G.ANIMALS.some((a) => a.id === "pato")).toBe(true);
  });
  it("only listed emojis are valid reactions", async () => {
    const G = await import("@/lib/game");
    expect(G.isReaction("😂")).toBe(true);
    expect(G.isReaction("💩")).toBe(false);
  });
  it("dismissing an auction with no bids leaves the square unowned and clears pending", async () => {
    const G = await import("@/lib/game");
    const s0 = { ...G.newState("salinas"), phase: "playing" as const } as G.GameState;
    const s = { ...s0, players: [{ id: "a", name: "A", color: "#000", balance: 1000, pos: 1, animal: "pato" } as G.Player], pending: { kind: "auction" as const, square: 1, bid: 0, bidder: null, endsAt: 0, order: ["a"], turn: 0 } };
    const n = G.dismissAuction(s);
    expect(n.pending).toBeNull();
    expect(n.owners[1]).toBeUndefined();
  });
});
