(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TwentyNineUI = api;
})(typeof self !== "undefined" ? self : this, function () {
  const SUITS = {
    S: { symbol: "♠", name: "spades", red: false, file: "s" },
    H: { symbol: "♥", name: "hearts", red: true, file: "h" },
    D: { symbol: "♦", name: "diamonds", red: true, file: "d" },
    C: { symbol: "♣", name: "clubs", red: false, file: "c" },
  };
  const RANKS = { J: "jack", 9: "nine", A: "ace", 10: "ten", K: "king", Q: "queen", 8: "eight", 7: "seven" };
  const RANK_FILE = { A: "01", 7: "07", 8: "08", 9: "09", 10: "10", J: "11", Q: "12", K: "13" };

  function tx(key, fallback, vars) {
    const i18n = typeof self !== "undefined" ? self.UnotrishI18n : null;
    if (!i18n) return fallback;
    return i18n.t(key, fallback, vars);
  }

  function seatLabel(text) {
    const key = { You: "seat.you", Right: "seat.right", Partner: "seat.partner", Left: "seat.left", Them: "seat.them" }[text];
    return key ? tx(key, text) : text;
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"]/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    })[ch]);
  }

  function cardHTML(card, opts) {
    opts = opts || {};
    if (!card || !card.face) {
      return '<div class="card back" aria-hidden="true"><img alt="" src="assets/cards/back111.gif"></div>';
    }
    const suit = SUITS[card.suit];
    const classes = ["card"];
    if (opts.trump) classes.push("trump");
    if (opts.playable) classes.push("playable");
    if (opts.dim) classes.push("dim");
    const label = tx("suit." + card.suit, suit.name) === suit.name && tx("rank." + card.rank, RANKS[card.rank]) === RANKS[card.rank]
      ? RANKS[card.rank] + " of " + suit.name
      : tx("suit." + card.suit, suit.name) + "ের " + tx("rank." + card.rank, RANKS[card.rank]);
    const file = "assets/cards/" + RANK_FILE[card.rank] + suit.file + ".gif";
    return (
      '<button type="button" class="' +
      classes.join(" ") +
      '" data-act="card" data-card="' +
      esc(card.id) +
      '" aria-label="' +
      esc(label) +
      '">' +
      '<img alt="" src="' +
      file +
      '">' +
      "</button>"
    );
  }

  function fan(cards, opts) {
    if (!cards.length) return '<div class="fan empty"></div>';
    return '<div class="fan">' + cards.map((card) => cardHTML(card, opts.forCard ? opts.forCard(card) : {})).join("") + "</div>";
  }

  function seatHTML(seat, view, opts) {
    const hot = view.turn === seat.id ? " hot" : "";
    const tags = [];
    if (view.dealer === seat.id) tags.push(tx("tag.dealer", "dealer"));
    if (view.declarer === seat.id && view.bid) tags.push(tx("tag.bid", "bid " + view.bid, { n: view.bid }));
    return (
      '<section class="seat ' +
      seatName(seat.id) +
      hot +
      '">' +
      fan(seat.cards, {
        forCard: (card) => ({
          trump: !!(view.trumpKnown && view.trump && card.face && card.suit === view.trump),
          playable: !!(opts.playable && opts.playable.has(card.id)),
          dim: !!(opts.dim && card.face && opts.playable && !opts.playable.has(card.id)),
        }),
      }) +
      '<p class="seat-name"><span>' +
      esc(seatLabel(seat.label)) +
      "</span>" +
      (tags.length ? "<em>" + esc(tags.join(" · ")) + "</em>" : "") +
      "</p></section>"
    );
  }

  function seatName(id) {
    return { S: "south", E: "east", N: "north", W: "west" }[id];
  }

  function trickHTML(view) {
    const bySeat = {};
    (view.trick || []).forEach((play) => {
      bySeat[play.seat] = play.card;
    });
    return (
      '<div class="trick">' +
      ["N", "E", "S", "W"]
        .map((seat) => {
          const card = bySeat[seat];
          return (
            '<div class="trick-slot ' +
            seatName(seat) +
            '">' +
            (card ? cardHTML(card, { trump: view.trumpKnown && card.suit === view.trump }) : "") +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function buriedHTML(view) {
    if (!view.buried) return "";
    const seat = view.buried.seat || "S";
    return (
      '<div class="buried for-' +
      seat +
      '">' +
      cardHTML(view.buried.face ? view.buried : { face: false }, {}) +
      "<em>" +
      tx(view.buried.face ? "buried.yours" : "buried.hidden", view.buried.face ? "your hidden card" : "hidden trump") +
      "</em></div>"
    );
  }

  function pips(score, label) {
    const n = Math.max(-6, Math.min(6, score || 0));
    const kind = n > 0 ? "red" : n < 0 ? "black" : "idle";
    const mag = Math.abs(n);
    const dots = [0, 1, 2, 3, 4, 5].map((i) => '<i class="' + (i < mag ? kind : "") + '"></i>').join("");
    return (
      '<div class="chaka ' +
      kind +
      '" aria-label="' +
      esc(seatLabel(label)) +
      " " +
      (typeof self !== "undefined" && self.UnotrishI18n && self.UnotrishI18n.digits ? self.UnotrishI18n.digits(n) : n) +
      '"><span>' +
      esc(seatLabel(label)) +
      '</span><b class="dots">' +
      dots +
      "</b></div>"
    );
  }

  function feltHTML(view, opts) {
    opts = opts || {};
    const order = ["N", "W", "E", "S"];
    return (
      '<div class="baize">' +
      '<div class="rail-felt">' +
      pips(view.ourScore, "You") +
      '<p class="ribbon">' +
      esc(view.ribbon || "") +
      "</p>" +
      pips(view.theirScore, "Them") +
      "</div>" +
      order.map((id) => seatHTML(view.seats[id], view, opts)).join("") +
      trickHTML(view) +
      buriedHTML(view) +
      (view.trumpKnown && view.trump
        ? '<p class="trump-mark" aria-hidden="true">' + SUITS[view.trump].symbol + "</p>"
        : "") +
      "</div>"
    );
  }

  return { esc, cardHTML, feltHTML, pips, SUITS };
});
