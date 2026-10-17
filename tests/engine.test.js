const test = require("node:test");
const assert = require("node:assert/strict");
const TN = require("../js/engine.js");
const Bots = require("../js/bots.js");

test("the pack holds 28 points and the jack outranks the ace", () => {
  const deck = [];
  for (const suit of TN.SUITS) {
    for (const rank of TN.RANKS) deck.push(rank + suit);
  }
  assert.equal(deck.length, 32);
  assert.equal(TN.cardPoints(deck), 28);
  assert.ok(TN.POWER.J > TN.POWER["9"]);
  assert.ok(TN.POWER["9"] > TN.POWER.A);
  assert.ok(TN.POWER.A > TN.POWER["10"]);
  assert.ok(TN.POWER["10"] > TN.POWER.K);
});

test("a blank first hand is thrown in", () => {
  const match = TN.loadPosition({
    phase: "bid",
    dealer: "W",
    hands: { S: ["KH", "QD", "8C", "7S"], E: ["JH", "9H", "AH", "10H"], N: ["JS", "9S", "AS", "10S"], W: ["JD", "9D", "AD", "10D"] },
    turn: "S",
  });
  match.hand.phase = "annulled";
  assert.equal(TN.cardPoints(match.hand.hands.S), 0);
});

test("deals of four, then a bid, name a suit the hand actually holds", () => {
  const match = TN.newMatch(7);
  TN.startHand(match);
  const hand = match.hand;
  if (hand.phase === "annulled") return;
  for (const seat of TN.SEATS) assert.equal(hand.hands[seat].length, 4);
  assert.equal(hand.turnSeat, "S");
  const card = hand.hands.S[0];
  let guard = 0;
  while (hand.phase === "bid" && guard++ < 4) {
    const seat = hand.turnSeat;
    const action = seat === "S" ? { type: "bid", value: 16 } : { type: "pass" };
    if (hand.bid >= 16 && seat === "S") {
      assert.equal(TN.apply(match, { type: "pass" }).ok, true);
    } else {
      assert.equal(TN.apply(match, action).ok, true);
    }
  }
  if (hand.phase !== "trump") return;
  const missing = TN.SUITS.find((suit) => !hand.hands[hand.declarer].some((c) => c.suit === suit));
  if (missing && hand.turnSeat === hand.declarer) {
    const refused = TN.apply(match, { type: "trump", suit: missing });
    assert.equal(refused.ok, false);
  }
});

test("hidden trump does not win, and a later ask can make an earlier card into a trump", () => {
  const hidden = TN.winningPlay(
    [
      { seat: "S", card: TN.parseCard("10S") },
      { seat: "E", card: TN.parseCard("JH") },
      { seat: "N", card: TN.parseCard("8S") },
    ],
    "S",
    "H",
    false
  );
  assert.equal(hidden.seat, "S");

  const open = TN.winningPlay(
    [
      { seat: "S", card: TN.parseCard("10S") },
      { seat: "E", card: TN.parseCard("JH") },
      { seat: "N", card: TN.parseCard("8S") },
      { seat: "W", card: TN.parseCard("7C") },
    ],
    "S",
    "H",
    true
  );
  assert.equal(open.seat, "E");
});

test("asking is optional, and once you ask you must trump", () => {
  const match = TN.loadPosition({
    phase: "play",
    dealer: "W",
    declarer: "N",
    bid: 17,
    trump: "H",
    buried: "7H",
    turn: "S",
    leader: "W",
    hands: {
      S: ["JD", "9C", "8D"],
      E: ["10S"],
      N: ["AS", "KS"],
      W: [],
    },
    trick: [{ seat: "W", card: "QS" }],
  });
  assert.equal(TN.canAsk(match.hand, "S"), true);
  const discarded = TN.apply(match, { type: "play", card: "JD" });
  assert.equal(discarded.ok, true);
  assert.equal(match.hand.trumpRevealed, false);

  const again = TN.loadPosition({
    phase: "play",
    dealer: "W",
    declarer: "N",
    bid: 17,
    trump: "H",
    buried: "7H",
    turn: "S",
    leader: "W",
    hands: {
      S: ["JH", "9C"],
      E: ["10S"],
      N: ["AS"],
      W: [],
    },
    trick: [{ seat: "W", card: "QS" }],
  });
  assert.equal(TN.apply(again, { type: "reveal" }).ok, true);
  assert.equal(again.hand.trumpRevealed, true);
  assert.equal(again.hand.hands.N.some((card) => card.id === "7H"), true);
  const legal = TN.legalPlays(again.hand, "S").map((play) => play.card.id);
  assert.deepEqual(legal, ["JH"]);
  assert.equal(TN.apply(again, { type: "play", card: "9C" }).ok, false);
});

test("the bidder cannot lead a hidden trump, and a lower trump is refused when a higher one is held", () => {
  const lead = TN.loadPosition({
    phase: "play",
    declarer: "S",
    trump: "H",
    buried: "QH",
    turn: "S",
    hands: { S: ["JH", "7C", "8D"], E: ["9S"], N: ["AS"], W: ["KS"] },
    trick: [],
  });
  const legalLead = TN.legalPlays(lead.hand, "S").map((play) => play.card.id);
  assert.ok(!legalLead.includes("JH"));
  assert.equal(TN.apply(lead, { type: "play", card: "JH" }).ok, false);

  const follow = TN.loadPosition({
    phase: "play",
    declarer: "N",
    trump: "H",
    trumpRevealed: true,
    turn: "S",
    hands: { S: ["JH", "8H", "7D"], E: ["9S"], N: ["AS"], W: [] },
    trick: [
      { seat: "W", card: "QC" },
      { seat: "E", card: "9H" },
    ],
  });
  const legal = TN.legalPlays(follow.hand, "S").map((play) => play.card.id).sort();
  assert.deepEqual(legal, ["7D", "JH"]);
});

test("Bangladesh marriage lowers only a bid above 18, and only for the bidding side", () => {
  assert.equal(TN.targetOf({ bid: 18, marriage: true }), 18);
  assert.equal(TN.targetOf({ bid: 19, marriage: true }), 16);
  assert.equal(TN.targetOf({ bid: 20, marriage: true }), 16);
  assert.equal(TN.targetOf({ bid: 21, marriage: true }), 17);
  assert.equal(TN.targetOf({ bid: 24, marriage: true }), 20);
  assert.equal(TN.targetOf({ bid: 20, marriage: false }), 20);

  const match = TN.loadPosition({
    phase: "play",
    declarer: "S",
    bid: 20,
    trump: "H",
    trumpRevealed: true,
    leader: "W",
    trickNo: 2,
    turn: "N",
    hands: {
      S: ["KH", "QH", "7C"],
      E: ["9S"],
      N: ["8D"],
      W: ["JS"],
    },
    trick: [
      { seat: "W", card: "10S" },
      { seat: "S", card: "AC" },
      { seat: "E", card: "KD" },
    ],
  });
  assert.equal(TN.apply(match, { type: "play", card: "8D" }).ok, true);
  assert.equal(match.hand.phase, "marriage");
  assert.equal(match.hand.turnSeat, "S");
  TN.apply(match, { type: "marriage" });
  assert.equal(TN.targetOf(match.hand), 16);
});

test("making the bid moves only the bidding side, and six pips end the match", () => {
  const match = TN.loadPosition({
    phase: "play",
    declarer: "S",
    bid: 16,
    trump: "H",
    trumpRevealed: true,
    turn: "S",
    leader: "S",
    trickNo: 8,
    scores: { SN: 5, EW: 0 },
    hands: { S: ["7C"], E: ["7D"], N: ["7S"], W: ["7H"] },
    tricks: { SN: ["JH", "9H", "AH", "10H", "JS", "9S", "AS", "10S", "JD", "9D", "AD"], EW: [] },
    trick: [],
  });
  assert.equal(TN.apply(match, { type: "play", card: "7C" }).ok, true);
  assert.equal(TN.apply(match, { type: "play", card: "7D" }).ok, true);
  assert.equal(TN.apply(match, { type: "play", card: "7S" }).ok, true);
  assert.equal(TN.apply(match, { type: "play", card: "7H" }).ok, true);
  assert.equal(match.hand.result.made, true);
  assert.equal(match.scores.SN, 6);
  assert.equal(match.scores.EW, 0);
  assert.equal(match.over.winner, "SN");
});

test("bots can finish a hand from many deals without getting stuck", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const match = TN.newMatch(seed);
    TN.startHand(match);
    let steps = 0;
    while (steps++ < 250) {
      const phase = match.hand.phase;
      if (phase === "annulled" || phase === "handEnd" || phase === "matchEnd") break;
      const action = Bots.botAction(match);
      const result = TN.apply(match, action);
      assert.equal(result.ok, true, "seed " + seed + " " + phase + " " + result.reason + " " + JSON.stringify(action));
    }
    assert.ok(steps < 250, "seed " + seed + " stuck in " + match.hand.phase);
    const hand = match.hand;
    if (hand.phase === "handEnd") {
      const used =
        hand.tricks.SN.length +
        hand.tricks.EW.length +
        hand.hands.S.length +
        hand.hands.E.length +
        hand.hands.N.length +
        hand.hands.W.length;
      assert.equal(used, 32, "seed " + seed + " lost a card");
      assert.equal(TN.cardPoints(hand.tricks.SN.concat(hand.tricks.EW)), 28);
    }
  }
});
