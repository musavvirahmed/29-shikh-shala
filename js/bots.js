(function (root, factory) {
  const TN = typeof module === "object" && module.exports ? require("./engine.js") : root.TwentyNine;
  const api = factory(TN);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TwentyNineBots = api;
})(typeof self !== "undefined" ? self : this, function (TN) {
  function botAction(match) {
    const hand = match.hand;
    const seat = hand.turnSeat;
    if (hand.phase === "bid") return bidAction(hand, seat);
    if (hand.phase === "trump") return { type: "trump", suit: chooseTrump(hand.hands[seat]) };
    if (hand.phase === "double") {
      return { type: TN.cardPoints(hand.hands[seat]) >= 8 ? "double" : "decline" };
    }
    if (hand.phase === "redouble") {
      return { type: TN.cardPoints(hand.hands[seat]) >= 7 ? "redouble" : "decline" };
    }
    if (hand.phase === "bury") return { type: "bury", card: lowestTrump(hand).id };
    if (hand.phase === "marriage") {
      const dropped = TN.targetOf({ bid: hand.bid, marriage: true }) < hand.bid;
      return { type: dropped ? "marriage" : "decline" };
    }
    if (hand.phase === "play") {
      if (TN.canAsk(hand, seat) && shouldAsk(hand, seat)) return { type: "reveal" };
      const plays = TN.legalPlays(hand, seat);
      if (!plays.length) {
        throw new Error("No legal card for " + seat + " on trick " + hand.trickNo);
      }
      return { type: "play", card: choosePlay(hand, seat, plays).card.id };
    }
    throw new Error("No bot action for " + hand.phase);
  }

  function bidAction(hand, seat) {
    const want = wantedBid(hand.hands[seat]);
    if (want > hand.bid) return { type: "bid", value: want };
    return { type: "pass" };
  }

  function wantedBid(cards) {
    const pts = TN.cardPoints(cards);
    const lengths = TN.SUITS.map((suit) => cards.filter((card) => card.suit === suit).length);
    const longest = Math.max(...lengths);
    const strength = pts + (longest >= 3 ? 2 : 0);
    if (strength >= 10) return 21;
    if (strength >= 8) return 19;
    if (strength >= 6) return 18;
    if (strength >= 5) return 17;
    if (strength >= 4) return 16;
    if (pts >= 3 && longest >= 2) return 16;
    return 0;
  }

  function chooseTrump(cards) {
    const suits = TN.SUITS.map((suit) => {
      const held = cards.filter((card) => card.suit === suit);
      return { suit, n: held.length, pts: TN.cardPoints(held) };
    }).sort((a, b) => b.pts - a.pts || b.n - a.n);
    if (suits[0].n === 1 && suits[0].pts <= 3) return "7th";
    return suits[0].suit;
  }

  function lowestTrump(hand) {
    return hand.hands[hand.declarer]
      .filter((card) => card.suit === hand.trump)
      .sort((a, b) => TN.POWER[a.rank] - TN.POWER[b.rank])[0];
  }

  function shouldAsk(hand, seat) {
    const winner = TN.currentWinner(hand);
    const partnerWinning = winner === TN.partner(seat);
    const pts = TN.cardPoints(hand.trick.map((play) => play.card));
    if (partnerWinning && pts < 3) return false;
    if (seat === hand.declarer) {
      const trumps = hand.hands[seat].filter((card) => card.suit === hand.trump);
      if (hand.buried && hand.buried.suit === hand.trump) trumps.push(hand.buried);
      return trumps.length > 0 && !partnerWinning && pts >= 1;
    }
    return !partnerWinning && pts >= 2;
  }

  function choosePlay(hand, seat, plays) {
    if (!hand.trick.length) return chooseLead(hand, seat, plays);
    if (TN.currentWinner(hand) === TN.partner(seat)) return cheapest(plays);
    const winners = plays.filter((play) => wouldWin(hand, seat, play.card));
    if (winners.length) return cheapest(winners);
    return cheapest(plays);
  }

  function chooseLead(hand, seat, plays) {
    const bidding = TN.teamOf(seat) === TN.teamOf(hand.declarer);
    if (hand.trumpRevealed && bidding) {
      const boss = plays.find((play) => play.card.suit === hand.trump && (play.card.rank === "J" || play.card.rank === "9"));
      if (boss) return boss;
    }
    const plain = plays.filter((play) => !hand.trump || play.card.suit !== hand.trump);
    const pool = plain.length ? plain : plays;
    return pool.slice().sort((a, b) => leadRank(a.card) - leadRank(b.card))[0];
  }

  function leadRank(card) {
    return TN.POINTS[card.rank] * 10 + TN.POWER[card.rank];
  }

  function cheapest(plays) {
    return plays.slice().sort((a, b) => {
      const pointDiff = TN.POINTS[a.card.rank] - TN.POINTS[b.card.rank];
      if (pointDiff) return pointDiff;
      return TN.POWER[a.card.rank] - TN.POWER[b.card.rank];
    })[0];
  }

  function wouldWin(hand, seat, card) {
    const plays = hand.trick.concat([{ seat, card }]);
    const winner = TN.winningPlay(plays, plays[0].card.suit, hand.trump, hand.trumpRevealed);
    return winner.seat === seat;
  }

  return { botAction, wantedBid, chooseTrump };
});
