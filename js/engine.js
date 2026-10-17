/* Twenty-nine, this table.
   Bangladesh, counter-clockwise, one bid each (Sharif), minimum 16.
   Hidden trump. Asking is a choice; if you ask, you must trump when you can.
   No point for the last trick. Marriage helps only the bidding side,
   and only a bid above 18. A bid of 22 or higher comes down by 4, never
   below 16 — Pagat's note stops at 21, and that extension is this table's call.
   Must overtrump when you trump and you can. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TwentyNine = api;
})(typeof self !== "undefined" ? self : this, function () {
  const SEATS = ["S", "E", "N", "W"];
  const SUITS = ["S", "H", "D", "C"];
  const RANKS = ["J", "9", "A", "10", "K", "Q", "8", "7"];
  const POWER = { J: 7, 9: 6, A: 5, 10: 4, K: 3, Q: 2, 8: 1, 7: 0 };
  const POINTS = { J: 3, 9: 2, A: 1, 10: 1, K: 0, Q: 0, 8: 0, 7: 0 };
  const SUIT_INFO = {
    S: { symbol: "♠", name: "spades", red: false },
    H: { symbol: "♥", name: "hearts", red: true },
    D: { symbol: "♦", name: "diamonds", red: true },
    C: { symbol: "♣", name: "clubs", red: false },
  };
  const RANK_NAME = {
    J: "jack",
    9: "nine",
    A: "ace",
    10: "ten",
    K: "king",
    Q: "queen",
    8: "eight",
    7: "seven",
  };
  const SEAT_NAME = { S: "You", E: "Right", N: "Partner", W: "Left" };

  function nextSeat(seat) {
    return SEATS[(SEATS.indexOf(seat) + 1) % 4];
  }

  function partner(seat) {
    return { S: "N", N: "S", E: "W", W: "E" }[seat];
  }

  function teamOf(seat) {
    return seat === "S" || seat === "N" ? "SN" : "EW";
  }

  function otherTeam(team) {
    return team === "SN" ? "EW" : "SN";
  }

  function parseCard(id) {
    if (id && typeof id === "object") return id;
    return { id, rank: id.slice(0, -1), suit: id.slice(-1) };
  }

  function cardPoints(cards) {
    return cards.reduce((sum, card) => sum + POINTS[parseCard(card).rank], 0);
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function rng() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) deck.push({ id: rank + suit, rank, suit });
    }
    return deck;
  }

  function shuffle(deck, rng) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function seatOrder(start) {
    const order = [];
    let seat = start;
    for (let i = 0; i < 4; i++) {
      order.push(seat);
      seat = nextSeat(seat);
    }
    return order;
  }

  function newMatch(seed) {
    const numeric = seed == null ? (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0 : seed >>> 0;
    return {
      seed: numeric,
      rng: mulberry32(numeric),
      scores: { SN: 0, EW: 0 },
      dealer: "W",
      hand: null,
      over: null,
      handsPlayed: 0,
    };
  }

  function blankHand(dealer) {
    return {
      dealer,
      hands: { S: [], E: [], N: [], W: [] },
      phase: "bid",
      bids: [],
      bid: 0,
      declarer: null,
      trump: null,
      trumpMode: null,
      trumpRevealed: false,
      buried: null,
      revealedCard: null,
      stake: 1,
      marriage: false,
      marriageSeat: null,
      trick: [],
      tricks: { SN: [], EW: [] },
      trickNo: 1,
      leader: null,
      turnSeat: null,
      mustTrump: null,
      doubleQueue: [],
      redoubleQueue: [],
      annulReason: null,
      result: null,
      log: [],
      notes: [],
      annul: null,
    };
  }

  function speaks(seat, base) {
    const third = {
      pass: "passes",
      bid: "bids",
      name: "names",
      call: "calls",
      let: "lets",
      double: "doubles",
      redouble: "redoubles",
      lead: "leads",
      play: "plays",
      take: "takes",
      keep: "keeps",
    };
    return SEAT_NAME[seat] + " " + (seat === "S" ? base : third[base]);
  }

  function say(hand, key, line, vars) {
    hand.log.push(line);
    if (hand.log.length > 12) hand.log.shift();
    hand.notes.push({ key: key, en: line, vars: vars || {} });
    if (hand.notes.length > 12) hand.notes.shift();
  }

  function noDoubleLine(seat) {
    return seat === "S" ? "You do not double." : SEAT_NAME[seat] + " does not double.";
  }

  function noRedoubleLine(seat) {
    return seat === "S" ? "You do not redouble." : SEAT_NAME[seat] + " does not redouble.";
  }

  function dealCards(hand, deck, start, countEach) {
    let seat = start;
    const total = countEach * 4;
    for (let i = 0; i < total; i++) {
      hand.hands[seat].push(deck.pop());
      seat = nextSeat(seat);
    }
  }

  function startHand(match) {
    const dealer = match.dealer;
    const first = nextSeat(dealer);
    const deck = shuffle(makeDeck(), match.rng);
    const hand = blankHand(dealer);
    hand.deck = deck;
    dealCards(hand, deck, first, 4);
    const second = partner(dealer);
    const blank =
      cardPoints(hand.hands[first]) === 0 || cardPoints(hand.hands[second]) === 0;
    if (blank) {
      hand.phase = "annulled";
      const whoSeat = cardPoints(hand.hands[first]) === 0 ? first : second;
      hand.annul = {
        key: "coach.annulBlank",
        en:
          SEAT_NAME[whoSeat] +
          " receives four cards with no points. The deal stops. The next player deals.",
        vars: { seat: whoSeat },
      };
      hand.annulReason = hand.annul.en;
      say(hand, "log.annulBlank", "The deal stops. The first four cards have no points.");
    } else {
      hand.bidOrder = seatOrder(first);
      hand.bidIndex = 0;
      hand.turnSeat = first;
      hand.phase = "bid";
      const bidVerb = first === "S" ? "bid" : "bids";
      say(hand, "log.toBid", SEAT_NAME[first] + " " + bidVerb + " next. The smallest bid is 16.", { seat: first });
    }
    match.hand = hand;
    return hand;
  }

  function removeCard(hand, seat, id) {
    const list = hand.hands[seat];
    const index = list.findIndex((card) => card.id === id);
    if (index < 0) return null;
    return list.splice(index, 1)[0];
  }

  function winningPlay(plays, ledSuit, trump, trumpActive) {
    let best = plays[0];
    for (let i = 1; i < plays.length; i++) {
      if (beats(plays[i].card, best.card, ledSuit, trump, trumpActive)) best = plays[i];
    }
    return best;
  }

  function beats(card, other, ledSuit, trump, trumpActive) {
    if (trumpActive && card.suit === trump) {
      if (other.suit !== trump) return true;
      return POWER[card.rank] > POWER[other.rank];
    }
    if (trumpActive && other.suit === trump) return false;
    if (card.suit !== ledSuit) return false;
    if (other.suit !== ledSuit) return true;
    return POWER[card.rank] > POWER[other.rank];
  }

  function highestTrumpInTrick(trick, trump) {
    let best = null;
    for (const play of trick) {
      if (play.card.suit !== trump) continue;
      if (!best || POWER[play.card.rank] > POWER[best.rank]) best = play.card;
    }
    return best;
  }

  function legalPlays(hand, seat) {
    const cards = hand.hands[seat];
    const asPlay = (list) => list.map((card) => ({ card }));
    if (!hand.trick.length) {
      if (!hand.trumpRevealed && seat === hand.declarer && hand.trump) {
        const plain = cards.filter((card) => card.suit !== hand.trump);
        if (plain.length) return asPlay(plain);
      }
      return asPlay(cards);
    }
    const led = hand.trick[0].card.suit;
    const followers = cards.filter((card) => card.suit === led);
    if (followers.length) return asPlay(followers);

    const discards = cards.filter((card) => !hand.trump || card.suit !== hand.trump);
    const trumps = hand.trump ? cards.filter((card) => card.suit === hand.trump) : [];

    if (hand.mustTrump === seat && trumps.length) {
      return asPlay(overtrumpFilter(trumps, hand));
    }
    if (!hand.trumpRevealed) return asPlay(cards);
    if (!trumps.length) return asPlay(cards);
    return asPlay(overtrumpFilter(trumps, hand).concat(discards));
  }

  function overtrumpFilter(trumps, hand) {
    const best = highestTrumpInTrick(hand.trick, hand.trump);
    if (!best) return trumps;
    const higher = trumps.filter((card) => POWER[card.rank] > POWER[best.rank]);
    return higher.length ? higher : trumps;
  }

  function canAsk(hand, seat) {
    if (hand.phase !== "play" || hand.turnSeat !== seat) return false;
    if (hand.trumpRevealed || !hand.trick.length || hand.mustTrump) return false;
    const led = hand.trick[0].card.suit;
    return !hand.hands[seat].some((card) => card.suit === led);
  }

  function marriageHolder(hand) {
    if (!hand.trumpRevealed || hand.marriage || !hand.trump) return null;
    if (hand.trick.length) return null;
    const need = ["K" + hand.trump, "Q" + hand.trump];
    for (const seat of [hand.declarer, partner(hand.declarer)]) {
      const ids = new Set(hand.hands[seat].map((card) => card.id));
      if (need.every((id) => ids.has(id))) return seat;
    }
    return null;
  }

  function targetOf(hand) {
    const bid = hand.bid;
    if (!hand.marriage) return bid;
    if (bid <= 18) return bid;
    if (bid <= 20) return 16;
    if (bid === 21) return 17;
    return Math.max(16, bid - 4);
  }

  function fail(key, en, vars) {
    return { ok: false, key: key, vars: vars || {}, reason: en };
  }

  function apply(match, action) {
    const hand = match.hand;
    if (!hand) return fail("fail.noHand", "No hand is dealt.");
    if (hand.phase === "annulled" || hand.phase === "handEnd" || hand.phase === "matchEnd") {
      if (action.type === "continue") return continueMatch(match);
      return fail("fail.over", "This hand is over.");
    }
    if (action.seat && action.seat !== hand.turnSeat) {
      return fail("fail.turn", "It is not that seat's turn.");
    }
    const seat = hand.turnSeat;
    if (hand.phase === "bid") return applyBid(hand, seat, action);
    if (hand.phase === "trump") return applyTrump(hand, seat, action);
    if (hand.phase === "double") return applyDouble(hand, seat, action);
    if (hand.phase === "redouble") return applyRedouble(hand, seat, action);
    if (hand.phase === "bury") return applyBury(hand, seat, action);
    if (hand.phase === "marriage") return applyMarriage(match, hand, seat, action);
    if (hand.phase === "play") {
      if (action.type === "reveal") return applyReveal(hand, seat);
      if (action.type === "play") return applyPlay(match, hand, seat, action);
    }
    return fail("fail.moment", "That action does not fit this moment.");
  }

  function applyBid(hand, seat, action) {
    if (action.type === "pass") {
      hand.bids.push({ seat, value: null });
      say(hand, "log.pass", speaks(seat, "pass") + ".", { seat: seat });
    } else if (action.type === "bid") {
      const value = action.value;
      if (!Number.isInteger(value) || value < 16 || value > 28) {
        return fail("fail.bidRange", "A bid is a whole number from 16 to 28.");
      }
      if (value <= hand.bid) return fail("fail.bidRise", "The bid has to rise.");
      hand.bid = value;
      hand.declarer = seat;
      hand.bids.push({ seat, value });
      say(hand, "log.bid", speaks(seat, "bid") + " " + value + ".", { seat: seat, n: value });
    } else {
      return fail("fail.bidOrPass", "Bid, or pass.");
    }
    hand.bidIndex += 1;
    if (hand.bidIndex >= 4) return closeAuction(hand);
    hand.turnSeat = hand.bidOrder[hand.bidIndex];
    return { ok: true };
  }

  function closeAuction(hand) {
    if (!hand.declarer) {
      hand.phase = "annulled";
      hand.turnSeat = null;
      hand.annul = {
        key: "coach.annulPass",
        en: "Every player passes. This table does not force the dealer to bid. The deal stops.",
        vars: {},
      };
      hand.annulReason = hand.annul.en;
      say(hand, "log.annulPass", "The deal stops. Nobody bids.");
      return { ok: true };
    }
    hand.phase = "trump";
    hand.turnSeat = hand.declarer;
    say(
      hand,
      "log.nameOrSeventh",
      speaks(hand.declarer, "name") + " trump, or " + (hand.declarer === "S" ? "call" : "calls") + " the seventh card.",
      { seat: hand.declarer }
    );
    return { ok: true };
  }

  function applyTrump(hand, seat, action) {
    if (action.type !== "trump") return fail("fail.nameOrSeventh", "Name a suit, or call the seventh card.");
    if (action.suit === "7th") {
      hand.trumpMode = "seventh";
      hand.trump = null;
      say(hand, "log.callSeventh", speaks(seat, "call") + " the seventh card.", { seat: seat });
    } else if (SUITS.includes(action.suit)) {
      if (!hand.hands[seat].some((card) => card.suit === action.suit)) {
        return fail("fail.needSuit", "You need a card of that suit in these four cards to name it.");
      }
      hand.trumpMode = "chosen";
      hand.trump = action.suit;
      say(hand, "log.nameSuit", speaks(seat, "name") + " " + SUIT_INFO[action.suit].name + ". The suit stays face down.", {
        seat: seat,
        suit: action.suit,
      });
    } else {
      return fail("fail.notSuit", "That is not a suit.");
    }
    openDoubles(hand);
    return { ok: true };
  }

  function openDoubles(hand) {
    const opponents = SEATS.filter((seat) => teamOf(seat) !== teamOf(hand.declarer));
    const start = opponents.includes(nextSeat(hand.declarer))
      ? nextSeat(hand.declarer)
      : opponents[0];
    hand.doubleQueue = seatOrder(start).filter((seat) => opponents.includes(seat));
    hand.phase = "double";
    hand.turnSeat = hand.doubleQueue.shift();
    say(hand, "log.mayDouble", SEAT_NAME[hand.turnSeat] + " may double, before the deal of the other four cards.", {
      seat: hand.turnSeat,
    });
  }

  function applyDouble(hand, seat, action) {
    if (action.type === "double") {
      hand.stake = 2;
      say(hand, "log.double", speaks(seat, "double") + ". The hand is worth two pips.", { seat: seat });
      const side = [hand.declarer, partner(hand.declarer)];
      hand.redoubleQueue = side;
      hand.phase = "redouble";
      hand.turnSeat = hand.declarer;
      say(hand, "log.mayRedouble", SEAT_NAME[hand.declarer] + " may redouble.", { seat: hand.declarer });
      return { ok: true };
    }
    if (action.type !== "decline") return fail("fail.doubleOrNot", "Double, or do not double.");
    say(hand, "log.noDouble", noDoubleLine(seat), { seat: seat });
    if (hand.doubleQueue.length) {
      hand.turnSeat = hand.doubleQueue.shift();
      say(hand, "log.mayDoubleAgain", SEAT_NAME[hand.turnSeat] + " may double.", { seat: hand.turnSeat });
      return { ok: true };
    }
    return completeDeal(hand);
  }

  function applyRedouble(hand, seat, action) {
    if (action.type === "redouble") {
      hand.stake = 4;
      say(hand, "log.redouble", speaks(seat, "redouble") + ". The hand is worth four pips.", { seat: seat });
      return completeDeal(hand);
    }
    if (action.type !== "decline") return fail("fail.redoubleOrNot", "Redouble, or do not redouble.");
    say(hand, "log.noRedouble", noRedoubleLine(seat), { seat: seat });
    const next = hand.redoubleQueue.find((s) => s !== seat);
    hand.redoubleQueue = [];
    if (next && seat === hand.declarer) {
      hand.turnSeat = next;
      say(hand, "log.mayRedouble", SEAT_NAME[next] + " may redouble.", { seat: next });
      return { ok: true };
    }
    return completeDeal(hand);
  }

  function completeDeal(hand) {
    const start = nextSeat(hand.dealer);
    if (hand.trumpMode === "seventh") {
      const given = { S: 0, E: 0, N: 0, W: 0 };
      let seat = start;
      for (let i = 0; i < 16; i++) {
        const card = hand.deck.pop();
        given[seat] += 1;
        if (seat === hand.declarer && given[seat] === 3) {
          hand.buried = card;
          hand.trump = card.suit;
        } else {
          hand.hands[seat].push(card);
        }
        seat = nextSeat(seat);
      }
      const own = hand.hands[hand.declarer].filter((card) => card.suit === hand.trump);
      const ownPoints = own.some((card) => POINTS[card.rank] > 0);
      if (!ownPoints) {
        return annul(hand, {
          key: "coach.annulSeventhOwn",
          en: "The seventh card is trump. The bidder has no other trump that scores points. The deal stops.",
          vars: {},
        });
      }
      const oppTrumps = SEATS.filter((s) => teamOf(s) !== teamOf(hand.declarer)).flatMap((s) =>
        hand.hands[s].filter((card) => card.suit === hand.trump)
      );
      if (oppTrumps.length === 0 || oppTrumps.every((card) => card.rank === "7")) {
        return annul(hand, {
          key: "coach.annulSeventhOpp",
          en: "The other side has no trump, or only the seven. The deal stops.",
          vars: {},
        });
      }
      say(hand, "log.seventhAside", "The seventh card stays out of the hand. Only " + SEAT_NAME[hand.declarer] + " saw it.", {
        seat: hand.declarer,
      });
      return beginPlay(hand, start);
    }

    let seat = start;
    for (let i = 0; i < 16; i++) {
      hand.hands[seat].push(hand.deck.pop());
      seat = nextSeat(seat);
    }
    hand.phase = "bury";
    hand.turnSeat = hand.declarer;
    say(
      hand,
      "log.slide",
      SEAT_NAME[hand.declarer] +
        (hand.declarer === "S" ? " place " : " places ") +
        "one " +
        SUIT_INFO[hand.trump].name.replace(/s$/, "") +
        " face down.",
      { seat: hand.declarer, suit: hand.trump }
    );
    return { ok: true };
  }

  function annul(hand, spec) {
    hand.phase = "annulled";
    hand.turnSeat = null;
    hand.annul = spec;
    hand.annulReason = spec.en;
    say(hand, "log.stopped", "The deal stops.");
    return { ok: true };
  }

  function beginPlay(hand, leader) {
    hand.phase = "play";
    hand.leader = leader;
    hand.turnSeat = leader;
    hand.trick = [];
    hand.trickNo = 1;
    say(hand, "log.lead", speaks(leader, "lead") + ".", { seat: leader });
    return { ok: true };
  }

  function applyBury(hand, seat, action) {
    if (action.type !== "bury") return fail("fail.bury", "Place a trump face down.");
    const card = hand.hands[seat].find((c) => c.id === action.card);
    if (!card) return fail("fail.missing", "That card is not in the hand.");
    if (card.suit !== hand.trump) return fail("fail.buryTrump", "The face-down card has to be a trump.");
    hand.buried = removeCard(hand, seat, card.id);
    say(hand, "log.buried", "A trump is face down. It stays out of the hand until a player asks.");
    return beginPlay(hand, nextSeat(hand.dealer));
  }

  function applyReveal(hand, seat) {
    if (!canAsk(hand, seat)) return fail("fail.askWhen", "You can ask only when you cannot follow the led suit.");
    revealTrump(hand, seat);
    return { ok: true };
  }

  function revealTrump(hand, seat) {
    hand.trumpRevealed = true;
    if (hand.buried) {
      hand.revealedCard = hand.buried;
      hand.hands[hand.declarer].push(hand.buried);
      hand.buried = null;
    }
    const hasTrump = hand.hands[seat].some((card) => card.suit === hand.trump);
    hand.mustTrump = hasTrump ? seat : null;
    say(
      hand,
      hand.mustTrump ? "log.askMust" : "log.askNone",
      SEAT_NAME[seat] +
        " asks. Trump is " +
        SUIT_INFO[hand.trump].name +
        (hand.mustTrump ? ". A trump has to be played." : ". There is no trump to play."),
      { seat: seat, suit: hand.trump }
    );
  }

  function applyPlay(match, hand, seat, action) {
    const card = hand.hands[seat].find((c) => c.id === action.card);
    if (!card) return fail("fail.missing", "That card is not in the hand.");
    const legal = legalPlays(hand, seat);
    if (!legal.some((play) => play.card.id === card.id)) {
      const spec = illegalReason(hand, seat, card);
      return fail(spec.key, spec.en, spec.vars);
    }
    removeCard(hand, seat, card.id);
    hand.mustTrump = null;
    hand.trick.push({ seat, card });
    say(hand, "log.play", speaks(seat, "play") + " the " + cardLabel(card) + ".", { seat: seat, card: card.id });
    if (hand.trick.length < 4) {
      hand.turnSeat = nextSeat(seat);
      return { ok: true };
    }
    return resolveTrick(match, hand);
  }

  function illegalReason(hand, seat, card) {
    if (hand.trick.length) {
      const led = hand.trick[0].card.suit;
      if (hand.hands[seat].some((c) => c.suit === led) && card.suit !== led) {
        const suitName = SUIT_INFO[led].name[0].toUpperCase() + SUIT_INFO[led].name.slice(1);
        return { key: "fail.mustFollow", en: suitName + " led. You still hold one of that suit.", vars: { suit: led } };
      }
    } else if (!hand.trumpRevealed && seat === hand.declarer && card.suit === hand.trump) {
      return { key: "fail.noLeadTrump", en: "Trump is still hidden. You cannot lead a trump.", vars: {} };
    }
    if (hand.mustTrump === seat && card.suit !== hand.trump) {
      return { key: "fail.mustTrump", en: "You asked for trump. You have to play a trump.", vars: {} };
    }
    if (hand.trumpRevealed && hand.trick.length && card.suit === hand.trump) {
      const best = highestTrumpInTrick(hand.trick, hand.trump);
      if (best && POWER[card.rank] < POWER[best.rank]) {
        const higher = hand.hands[seat].some(
          (c) => c.suit === hand.trump && POWER[c.rank] > POWER[best.rank]
        );
        if (higher) return { key: "fail.beatTrump", en: "You play a trump, so you have to beat the trump in the trick.", vars: {} };
      }
    }
    return { key: "fail.illegal", en: "You cannot play that card on this trick.", vars: {} };
  }

  function resolveTrick(match, hand) {
    const led = hand.trick[0].card.suit;
    const winner = winningPlay(hand.trick, led, hand.trump, hand.trumpRevealed);
    const pile = hand.trick.map((play) => play.card);
    hand.tricks[teamOf(winner.seat)].push(...pile);
    const pts = cardPoints(pile);
    say(hand, "log.take", speaks(winner.seat, "take") + " the trick. Card points: " + pts + ".", {
      seat: winner.seat,
      n: pts,
    });
    hand.lastTrick = hand.trick.slice();
    hand.trick = [];
    hand.trickNo += 1;
    hand.leader = winner.seat;
    hand.turnSeat = winner.seat;
    if (hand.trickNo === 8 && !hand.trumpRevealed) {
      return annul(hand, {
        key: "coach.annulNoAsk",
        en: "Nobody asked for trump before the last trick. The deal stops. Neither side scores.",
        vars: {},
      });
    }
    const holder = marriageHolder(hand);
    if (holder) {
      hand.phase = "marriage";
      hand.turnSeat = holder;
      say(hand, "log.mayMarriage", SEAT_NAME[holder] + " may show the king and queen of trump.", { seat: holder });
      return { ok: true };
    }
    if (hand.trickNo > 8) return scoreHand(match, hand);
    return { ok: true };
  }

  function applyMarriage(match, hand, seat, action) {
    if (seat !== marriageHolder(hand)) return fail("fail.marriageWho", "Only the player who holds both cards can show them.");
    if (action.type === "marriage") {
      hand.marriage = true;
      hand.marriageSeat = seat;
      const target = targetOf(hand);
      const same = target === hand.bid;
      say(
        hand,
        same ? "log.marriageSame" : "log.marriageDown",
        "Marriage. The target is " + target + (same ? ". This bid does not change." : ". The old bid was " + hand.bid + "."),
        { target: target, bid: hand.bid }
      );
    } else if (action.type === "decline") {
      const line = (seat === "S" ? "You keep" : SEAT_NAME[seat] + " keeps") + " the king and queen hidden.";
      say(hand, "log.keepMarriage", line, { seat: seat });
    } else {
      return fail("fail.marriageChoice", "Show the marriage, or keep it.");
    }
    if (hand.trickNo > 8) return scoreHand(match, hand);
    hand.phase = "play";
    hand.turnSeat = hand.leader;
    return { ok: true };
  }

  function scoreHand(match, hand) {
    const side = teamOf(hand.declarer);
    const got = cardPoints(hand.tricks[side]);
    const target = targetOf(hand);
    const made = got >= target;
    const delta = hand.stake * (made ? 1 : -1);
    match.scores[side] += delta;
    match.handsPlayed += 1;
    hand.result = { side, got, target, made, delta, defend: cardPoints(hand.tricks[otherTeam(side)]) };
    const us = side === "SN";
    const name = us ? "You and Partner" : "Left and Right";
    const deltaText = (delta > 0 ? "+" : "") + delta;
    say(
      hand,
      "log.score." + (us ? "us" : "them") + "." + (made ? "made" : "miss"),
      name +
        " took " +
        got +
        " card points. The target was " +
        target +
        ". " +
        (made ? "The contract stands." : "The contract fails.") +
        " Pips: " +
        deltaText +
        ".",
      { got: got, target: target, delta: deltaText }
    );
    hand.phase = "handEnd";
    hand.turnSeat = null;
    if (match.scores[side] >= 6) {
      match.over = { winner: side, reason: "six red pips" };
      hand.phase = "matchEnd";
    } else if (match.scores[side] <= -6) {
      match.over = { winner: otherTeam(side), reason: "six black pips" };
      hand.phase = "matchEnd";
    }
    return { ok: true };
  }

  function continueMatch(match) {
    if (match.over) return { ok: true };
    match.dealer = nextSeat(match.dealer);
    startHand(match);
    return { ok: true };
  }

  function cardLabel(card) {
    return RANK_NAME[card.rank] + " of " + SUIT_INFO[card.suit].name;
  }

  function sortCards(cards, trump) {
    const suitOrder = trump ? [trump, ...SUITS.filter((suit) => suit !== trump)] : SUITS.slice();
    return cards.slice().sort((a, b) => {
      const suitDiff = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
      if (suitDiff) return suitDiff;
      return POWER[b.rank] - POWER[a.rank];
    });
  }

  function publicCard(card, face) {
    if (!face) return { face: false };
    return { face: true, id: card.id, rank: card.rank, suit: card.suit, points: POINTS[card.rank] };
  }

  function present(match, viewer) {
    const hand = match.hand;
    const showAll = !hand || hand.phase === "annulled" || hand.phase === "handEnd" || hand.phase === "matchEnd";
    const seats = {};
    for (const seat of SEATS) {
      const mine = seat === viewer;
      const groupTrump = hand && hand.trump && (hand.trumpRevealed || seat === viewer && seat === hand.declarer);
      const cards = hand ? sortCards(hand.hands[seat], groupTrump ? hand.trump : null) : [];
      seats[seat] = {
        id: seat,
        label: SEAT_NAME[seat],
        cards: cards.map((card) => publicCard(card, mine || showAll)),
        count: cards.length,
      };
    }
    let buried = null;
    if (hand && hand.buried) {
      const face = viewer === hand.declarer || showAll;
      buried = { seat: hand.declarer, ...publicCard(hand.buried, face), hidden: true };
    }
    const ourTeam = teamOf(viewer);
    const declarerSees = hand && viewer === hand.declarer && hand.trump;
    return {
      seats,
      trick: hand
        ? (hand.trick.length
            ? hand.trick
            : hand.phase === "handEnd" || hand.phase === "matchEnd"
              ? hand.lastTrick || []
              : []
          ).map((play) => ({ seat: play.seat, card: publicCard(play.card, true) }))
        : [],
      buried,
      dealer: hand ? hand.dealer : match.dealer,
      turn: hand ? hand.turnSeat : null,
      phase: hand ? hand.phase : "idle",
      trump: hand && (hand.trumpRevealed || declarerSees) ? hand.trump : null,
      trumpKnown: !!(hand && hand.trumpRevealed),
      trumpMode: hand ? hand.trumpMode : null,
      declarer: hand ? hand.declarer : null,
      bid: hand ? hand.bid : 0,
      target: hand && hand.declarer ? targetOf(hand) : null,
      stake: hand ? hand.stake : 1,
      marriage: hand ? hand.marriage : false,
      scores: match.scores,
      ourScore: match.scores[ourTeam],
      theirScore: match.scores[otherTeam(ourTeam)],
      ourPoints: hand && hand.declarer ? cardPoints(hand.tricks[ourTeam]) : 0,
      theirPoints: hand && hand.declarer ? cardPoints(hand.tricks[otherTeam(ourTeam)]) : 0,
      contractPoints: hand && hand.declarer ? cardPoints(hand.tricks[teamOf(hand.declarer)]) : 0,
      trickNo: hand ? hand.trickNo : 0,
      annulReason: hand ? hand.annulReason : null,
      result: hand ? hand.result : null,
      log: hand ? hand.log.slice() : [],
      over: match.over,
      viewer,
    };
  }

  function coachSpec(match, viewer) {
    const hand = match.hand;
    if (!hand) {
      return {
        key: "coach.welcome",
        en: "Deal a hand. You sit at the bottom. Partner sits across. Play runs to your right.",
        vars: {},
      };
    }
    if (hand.phase === "annulled") {
      return hand.annul || { key: "coach.stopped", en: hand.annulReason || "The deal stops.", vars: {} };
    }
    if (hand.phase === "matchEnd") {
      const won = match.over.winner === teamOf(viewer);
      return won
        ? { key: "coach.matchWin", en: "Six pips. You and Partner take the match.", vars: {} }
        : { key: "coach.matchLoss", en: "The other side has six pips. The match is theirs.", vars: {} };
    }
    if (hand.phase === "handEnd") {
      const r = hand.result;
      const biddingUs = teamOf(hand.declarer) === teamOf(viewer);
      return {
        key: "coach.handEnd." + (biddingUs ? "us" : "them") + "." + (r.made ? "made" : "miss"),
        en:
          (biddingUs ? "Your side" : "The other side") +
          " took " +
          r.got +
          " card points. The target was " +
          r.target +
          ". " +
          (r.made ? "The contract stands." : "The contract fails.") +
          " Only the pips of the bidding side move.",
        vars: { got: r.got, target: r.target },
      };
    }
    if (hand.turnSeat !== viewer) {
      return { key: "coach.thinking", en: SEAT_NAME[hand.turnSeat] + " is thinking.", vars: { seat: hand.turnSeat } };
    }
    if (hand.phase === "bid") {
      const pts = cardPoints(hand.hands[viewer]);
      const high = hand.bid ? "The bid is " + hand.bid + ". " : "";
      return {
        key: hand.bid ? "coach.bidHigh" : "coach.bidOpen",
        en:
          high +
          "Your four cards have " +
          pts +
          " card points. A bid promises that your side will take at least that many of the 28.",
        vars: { bid: hand.bid || 0, pts: pts },
      };
    }
    if (hand.phase === "trump") {
      return {
        key: "coach.trump",
        en: "Name a trump suit from these four cards. Or call the seventh card if you do not want one of these suits. You do not show the suit yet.",
        vars: {},
      };
    }
    if (hand.phase === "double") {
      return {
        key: "coach.double",
        en: "You may double before the deal of the other four cards. A double makes the hand worth two pips. You win two pips, or you lose two pips. You know only these four cards.",
        vars: {},
      };
    }
    if (hand.phase === "redouble") {
      return {
        key: "coach.redouble",
        en: "The other side doubled. A redouble makes the hand worth four pips. You do not see your other four cards yet.",
        vars: {},
      };
    }
    if (hand.phase === "bury") {
      const suitName = SUIT_INFO[hand.trump].name.replace(/s$/, "");
      return {
        key: "coach.bury",
        en: "Place one " + suitName + " face down. It leaves your hand until a player asks. A low trump is the usual choice. Keep the jack.",
        vars: { suit: hand.trump },
      };
    }
    if (hand.phase === "marriage") {
      const next = targetOf({ bid: hand.bid, marriage: true });
      if (next === hand.bid) {
        return {
          key: "coach.marriageSame",
          en: "You hold the king and queen of trump. The bid is " + hand.bid + ". A show does not lower the target. Bids of 16, 17, and 18 get no help.",
          vars: { bid: hand.bid },
        };
      }
      return {
        key: "coach.marriageDown",
        en: "You hold the king and queen of trump. Show them and the target falls from " + hand.bid + " to " + next + ".",
        vars: { bid: hand.bid, target: next },
      };
    }
    if (canAsk(hand, viewer)) {
      const partnerWinning = currentWinner(hand) === partner(viewer);
      if (partnerWinning) {
        return {
          key: "coach.askNo",
          en: "You cannot follow the led suit. Partner is winning this trick. An ask names trump. You then play a trump if you hold one. A discard leaves the trick with Partner.",
          vars: {},
        };
      }
      return {
        key: "coach.askYes",
        en: "You cannot follow the led suit. Partner is not winning. Ask if you will name the suit and play a trump. Or discard, and leave the suit hidden.",
        vars: {},
      };
    }
    if (hand.mustTrump === viewer) {
      return {
        key: "coach.mustTrump",
        en: "Trump is " + SUIT_INFO[hand.trump].name + ". You asked, so you play a trump. If a trump is already winning, you beat it when you can.",
        vars: { suit: hand.trump },
      };
    }
    if (!hand.trick.length && !hand.trumpRevealed && viewer === hand.declarer) {
      return {
        key: "coach.leadHiddenDeclarer",
        en: "You lead. Trump is still hidden, so you cannot start with a trump. A low card in another suit is the ordinary opening.",
        vars: {},
      };
    }
    if (!hand.trick.length) {
      return hand.trumpRevealed
        ? { key: "coach.leadOpen", en: "You lead. Trump is " + SUIT_INFO[hand.trump].name + ".", vars: { suit: hand.trump } }
        : {
            key: "coach.leadHidden",
            en: "You lead. Trump is still hidden. The highest card of the suit you start wins, unless a player asks on this trick.",
            vars: {},
          };
    }
    const led = hand.trick[0].card.suit;
    if (hand.hands[viewer].some((card) => card.suit === led)) {
      const suitName = SUIT_INFO[led].name[0].toUpperCase() + SUIT_INFO[led].name.slice(1);
      return {
        key: "coach.follow",
        en: suitName + " led. You follow that suit. The higher card of that suit wins, unless trump is face up and a player plays one.",
        vars: { suit: led },
      };
    }
    return { key: "coach.yourTurn", en: "Your turn.", vars: {} };
  }

  function coachLine(match, viewer) {
    return coachSpec(match, viewer).en;
  }

  function currentWinner(hand) {
    if (!hand.trick.length) return null;
    const led = hand.trick[0].card.suit;
    return winningPlay(hand.trick, led, hand.trump, hand.trumpRevealed).seat;
  }

  function loadPosition(spec) {
    const match = newMatch(spec.seed || 1);
    if (spec.scores) match.scores = { SN: spec.scores.SN || 0, EW: spec.scores.EW || 0 };
    match.dealer = spec.dealer || "W";
    const hand = blankHand(match.dealer);
    hand.deck = [];
    for (const seat of SEATS) {
      hand.hands[seat] = (spec.hands[seat] || []).map(parseCard);
    }
    hand.phase = spec.phase || "play";
    hand.trump = spec.trump || null;
    hand.trumpMode = spec.trumpMode || (spec.trump ? "chosen" : null);
    hand.trumpRevealed = !!spec.trumpRevealed;
    hand.buried = spec.buried ? parseCard(spec.buried) : null;
    hand.declarer = spec.declarer || null;
    hand.bid = spec.bid || 16;
    hand.stake = spec.stake || 1;
    hand.marriage = !!spec.marriage;
    hand.trick = (spec.trick || []).map((play) => ({ seat: play.seat, card: parseCard(play.card) }));
    hand.tricks = {
      SN: (spec.tricks && spec.tricks.SN ? spec.tricks.SN : []).map(parseCard),
      EW: (spec.tricks && spec.tricks.EW ? spec.tricks.EW : []).map(parseCard),
    };
    hand.trickNo = spec.trickNo || 1;
    hand.turnSeat = spec.turn || null;
    hand.leader = spec.leader || spec.turn || null;
    hand.mustTrump = spec.mustTrump || null;
    if (spec.log) hand.log = spec.log.slice();
    match.hand = hand;
    return match;
  }

  return {
    SEATS,
    SUITS,
    RANKS,
    POWER,
    POINTS,
    SUIT_INFO,
    RANK_NAME,
    SEAT_NAME,
    nextSeat,
    partner,
    teamOf,
    otherTeam,
    parseCard,
    cardPoints,
    cardLabel,
    sortCards,
    newMatch,
    startHand,
    apply,
    legalPlays,
    canAsk,
    marriageHolder,
    targetOf,
    present,
    coachLine,
    coachSpec,
    currentWinner,
    loadPosition,
    winningPlay,
  };
});
