(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TwentyNineRules = api;
})(typeof self !== "undefined" ? self : this, function () {
  const SECTIONS = ["rank", "deal", "auction", "trump", "double", "ask", "marriage", "pips"];
  const MODES = { learn: true, play: true, rules: true };

  function parseHash(hash) {
    const raw = String(hash || "").replace(/^#/, "");
    if (!raw) return { mode: "learn", section: null };
    if (MODES[raw]) return { mode: raw, section: null };
    const match = /^rules-([a-z]+)$/.exec(raw);
    if (match && SECTIONS.indexOf(match[1]) !== -1) return { mode: "rules", section: match[1] };
    return null;
  }

  function hashFor(mode, section) {
    if (mode === "rules" && section) return "#rules-" + section;
    return "#" + mode;
  }

  function P(t, esc, key, en) {
    return '<p class="govuk-body">' + esc(t(key, en)) + "</p>";
  }

  function Li(t, esc, key, en) {
    return "<li>" + esc(t(key, en)) + "</li>";
  }

  function cite(n) {
    return '<sup class="rules-cite"><a class="govuk-link" href="#cite-' + n + '">[' + n + "]</a></sup>";
  }

  function fold(t, esc, slug, titleKey, title, body, openSlug) {
    const open = openSlug === slug ? " open" : "";
    return (
      '<details class="rules-fold" id="rules-' +
      slug +
      '"' +
      open +
      ">" +
      "<summary><h2 class=\"govuk-heading-m\">" +
      esc(t(titleKey, title)) +
      "</h2></summary>" +
      '<div class="rules-fold__body">' +
      body +
      "</div></details>"
    );
  }

  function rulesHTML(t, esc, openSlug) {
    return (
      '<article class="rules">' +
      '<h1 class="govuk-heading-l">' +
      esc(t("rules.title", "How to play 29")) +
      "</h1>" +
      P(
        t,
        esc,
        "rules.lead",
        "Four players play in two pairs. Your partner sits across from you. The pack keeps only seven through ace in each suit — 32 cards, with 2 through 6 left out — so the jack and nine can rank above the ace. Play moves to your right: you, then Right, then Partner, then Left."
      ) +
      fold(
        t,
        esc,
        "rank",
        "rules.rank.h",
        "Rank and points",
        P(t, esc, "rules.rank.1", "The rank, from high to low, is jack, nine, ace, ten, king, queen, eight, seven.") +
          '<ul class="govuk-list govuk-list--bullet">' +
          Li(t, esc, "rules.rank.j", "Jack: 3 points") +
          Li(t, esc, "rules.rank.9", "Nine: 2 points") +
          Li(t, esc, "rules.rank.a", "Ace: 1 point") +
          Li(t, esc, "rules.rank.10", "Ten: 1 point") +
          Li(t, esc, "rules.rank.0", "King, queen, eight, and seven: 0 points") +
          "</ul>" +
          P(
            t,
            esc,
            "rules.rank.2",
            "Four suits give 28 card points. The last trick adds no point. The name of the game is still 29."
          ) +
          cite(1),
        openSlug
      ) +
      fold(
        t,
        esc,
        "deal",
        "rules.deal.h",
        "The deal",
        P(
          t,
          esc,
          "rules.deal.1",
          "The seat called Left deals the first hand. The next dealer is the player on your right (Right). Each player receives four cards."
        ) +
          P(t, esc, "rules.deal.2", "Stop the deal if either of these hands has no points:") +
          '<ul class="govuk-list govuk-list--bullet">' +
          Li(t, esc, "rules.deal.3", "The player to the right of the dealer") +
          Li(t, esc, "rules.deal.4", "The partner of the dealer") +
          "</ul>" +
          P(t, esc, "rules.deal.5", "The other two players may hold no points. The deal still continues."),
        openSlug
      ) +
      fold(
        t,
        esc,
        "auction",
        "rules.auction.h",
        "The auction",
        P(
          t,
          esc,
          "rules.auction.1",
          "A bid is a whole number from 16 to 28. Each player speaks once. The player to the right of the dealer speaks first. A new bid must be higher than the current bid. The highest bidder chooses trump."
        ) +
          P(t, esc, "rules.auction.2", "If all four players pass, the hand ends. The dealer does not have to bid 16.") +
          P(
            t,
            esc,
            "rules.auction.3",
            "Some tables in Bangladesh use a different auction. After a pass, the partner of that player may bid. A player may match the bid and say “ditto”. The auction ends when one side stops. This table does not use that auction."
          ) +
          P(t, esc, "rules.auction.4", "One bid for each player is also a Bangladesh rule. This table uses that rule.") +
          cite(1),
        openSlug
      ) +
      fold(
        t,
        esc,
        "trump",
        "rules.trump.h",
        "Trump",
        P(
          t,
          esc,
          "rules.trump.1",
          "The bidder may name a suit from the first four cards. Or the bidder may call the seventh card."
        ) +
          P(
            t,
            esc,
            "rules.trump.2",
            "The seventh card is the third of the next four cards. The bidder does not see it yet. That card becomes trump. It stays face down, outside the hand."
          ) +
          P(
            t,
            esc,
            "rules.trump.3",
            "If the bidder names a suit, each player receives four more cards. The bidder then puts one trump face down. That card stays out of the hand until a player asks."
          ) +
          P(
            t,
            esc,
            "rules.trump.4",
            "Before a player asks, trump has no power. The bidder cannot lead trump. A trump on another suit is only a card of its own suit."
          ) +
          P(t, esc, "rules.trump.5", "Stop a seventh-card deal in either case:") +
          '<ul class="govuk-list govuk-list--bullet">' +
          Li(t, esc, "rules.trump.6", "The bidder has no other trump that scores points.") +
          Li(t, esc, "rules.trump.7", "The other side has no trump, or only the seven.") +
          "</ul>",
        openSlug
      ) +
      fold(
        t,
        esc,
        "double",
        "rules.double.h",
        "Double",
        P(
          t,
          esc,
          "rules.double.1",
          "An opponent may double after the bidder chooses trump, and before the next four cards. A double makes the hand worth 2 pips. The bidding side may then redouble. A redouble makes the hand worth 4 pips. Both sides decide from the first four cards only. With no double, the hand is worth 1 pip."
        ),
        openSlug
      ) +
      fold(
        t,
        esc,
        "ask",
        "rules.ask.h",
        "Asking",
        P(t, esc, "rules.ask.1", "Follow the led suit if you have a card of that suit.") +
          P(t, esc, "rules.ask.2", "If you have no card of the led suit, choose one:") +
          '<ul class="govuk-list govuk-list--bullet">' +
          Li(t, esc, "rules.ask.3", "Discard a card from another suit.") +
          Li(t, esc, "rules.ask.4", "Ask for trump.") +
          "</ul>" +
          P(
            t,
            esc,
            "rules.ask.5",
            "If you ask, the bidder shows the face-down card. That suit is trump for this trick and for the rest of the hand. You must play a trump if you have one. A card of that suit already in the trick can win."
          ) +
          P(
            t,
            esc,
            "rules.ask.6",
            "At some tables, the first player who cannot follow must ask. That player may then discard. At this table, you choose whether to ask."
          ) +
          P(
            t,
            esc,
            "rules.ask.7",
            "After trump is known, follow the led suit if you can. If you cannot follow, you may play a trump or a discard. If you play a trump and can beat the trump in the trick, you must beat it."
          ) +
          P(t, esc, "rules.ask.8", "If no player asks before the last trick, the hand ends. Neither side scores."),
        openSlug
      ) +
      fold(
        t,
        esc,
        "marriage",
        "rules.marriage.h",
        "Marriage",
        P(
          t,
          esc,
          "rules.marriage.1",
          "A marriage is the king and queen of trump in one hand. Only the bidding side may show it, after trump is face up."
        ) +
          '<ul class="govuk-list govuk-list--bullet">' +
          Li(t, esc, "rules.marriage.16", "Bid 16, 17, or 18: the target does not change.") +
          Li(t, esc, "rules.marriage.19", "Bid 19 or 20: the target becomes 16.") +
          Li(t, esc, "rules.marriage.21", "Bid 21: the target becomes 17.") +
          Li(t, esc, "rules.marriage.22", "Bid 22 or higher: subtract 4. The target does not go below 16.") +
          "</ul>" +
          cite(1) +
          P(
            t,
            esc,
            "rules.marriage.2",
            "The Bangladesh note gives the rule for 19, 20, and 21. It does not give a rule for 22 or higher. The rule for 22 or higher is the rule of this table."
          ) +
          P(t, esc, "rules.marriage.3", "The king and queen of the other side do not change the target."),
        openSlug
      ) +
      fold(
        t,
        esc,
        "pips",
        "rules.pips.h",
        "Pips",
        P(t, esc, "rules.pips.1", "A pip is one point on the match score. Only the score of the bidding side changes.") +
          '<ul class="govuk-list govuk-list--bullet">' +
          Li(t, esc, "rules.pips.red", "A made contract shows 1 red pip.") +
          Li(t, esc, "rules.pips.black", "A missed contract shows 1 black pip.") +
          Li(t, esc, "rules.pips.double", "A double is worth 2 pips.") +
          Li(t, esc, "rules.pips.redouble", "A redouble is worth 4 pips.") +
          "</ul>" +
          P(t, esc, "rules.pips.2", "Six red pips win the match. Six black pips lose the match."),
        openSlug
      ) +
      '<h2 class="govuk-heading-s rules-refs__title">' +
      esc(t("rules.refs.h", "Notes")) +
      "</h2>" +
      '<ol class="rules-refs govuk-list--number">' +
      '<li id="cite-1">' +
      esc(
        t(
          "rules.refs.1",
          "Card points, marriage numbers, Bangladesh house rules, and the one-bid auction: John McLeod’s Twenty-Nine page at pagat.com (Asif Al Hye; Shishir Sharif)."
        )
      ) +
      ' <a class="govuk-link" href="https://www.pagat.com/jass/29.html" rel="noopener noreferrer" target="_blank">pagat.com/jass/29.html</a></li>' +
      '<li id="cite-2">' +
      esc(
        t(
          "rules.refs.2",
          "Card faces: Standard cardset from PySolFC (John Fitzgibbon and Jochen Tuchbreiter). Table cloth: Felt Green tile from PySolFC."
        )
      ) +
      "</li>" +
      "</ol>" +
      "</article>"
    );
  }

  function rulesLink(section, label, esc) {
    return (
      '<a class="govuk-link" href="' +
      hashFor("rules", section) +
      '" target="_blank" rel="noopener">' +
      esc(label) +
      "</a>"
    );
  }

  function linkWord(text, section, term, esc) {
    const plain = String(text == null ? "" : text);
    const needle = String(term || "");
    if (!needle) return esc(plain);
    const at = plain.indexOf(needle);
    if (at === -1) return esc(plain);
    return esc(plain.slice(0, at)) + rulesLink(section, needle, esc) + esc(plain.slice(at + needle.length));
  }

  return {
    SECTIONS: SECTIONS,
    parseHash: parseHash,
    hashFor: hashFor,
    rulesHTML: rulesHTML,
    rulesLink: rulesLink,
    linkWord: linkWord,
  };
});
