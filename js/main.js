(function () {
  const TN = window.TwentyNine;
  const Bots = window.TwentyNineBots;
  const Lessons = window.TwentyNineLessons;
  const UI = window.TwentyNineUI;

  const state = {
    mode: "learn",
    lesson: 0,
    step: 0,
    picked: null,
    match: null,
    auto: false,
    quiet: false,
    moreBids: false,
    flash: "",
    install: null,
    botToken: 0,
  };

  const felt = document.querySelector("#felt");
  const pad = document.querySelector("#pad");
  const nav = document.querySelector("#nav");

  function render() {
    document.querySelector(".layout").classList.toggle("rules-mode", state.mode === "rules");
    paintNav();
    if (state.mode === "learn") renderLesson();
    else if (state.mode === "rules") renderRules();
    else renderPlay();
  }

  function paintNav() {
    nav.querySelectorAll("[data-mode]").forEach((link) => {
      const on = link.dataset.mode === state.mode;
      const item = link.closest("li");
      if (item) item.classList.toggle("govuk-service-navigation__item--active", on);
      if (on) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
      const label = link.dataset.label || link.textContent;
      link.innerHTML = on ? '<strong class="govuk-service-navigation__active-fallback">' + label + "</strong>" : label;
    });
    const install = document.querySelector("#install");
    install.hidden = !state.install;
  }

  function renderLesson() {
    const lesson = Lessons.lessons[state.lesson];
    const step = lesson.steps[state.step];
    const view = step.view;
    view.ribbon = step.ribbon || view.ribbon;
    felt.innerHTML = UI.feltHTML(view);
    felt.classList.remove("paper");
    const choices = step.choices
      .map((choice, index) => {
        let mark = "";
        if (state.picked) mark = choice.correct ? " right" : state.picked.index === index ? " wrong" : "";
        return (
          '<button type="button" class="govuk-button govuk-button--secondary choice' +
          mark +
          '" data-act="choose" data-index="' +
          index +
          '">' +
          UI.esc(choice.label) +
          "</button>"
        );
      })
      .join("");
    let why = "";
    if (state.picked) {
      const text = UI.esc(step.choices[state.picked.index].why);
      why = state.picked.correct
        ? '<div class="govuk-inset-text">' + text + "</div>"
        : '<p class="govuk-error-message"><span class="govuk-visually-hidden">Error: </span>' + text + "</p>";
    }
    const last = state.step === lesson.steps.length - 1 && state.lesson === Lessons.lessons.length - 1;
    const nextLabel = last ? "Deal a hand" : "Next";
    const nextAct = last ? "deal" : "next-step";
    const back =
      state.step > 0 || state.lesson > 0
        ? '<a class="govuk-back-link" href="#back" data-act="prev-step">Back</a>'
        : "";
    pad.innerHTML =
      back +
      '<p class="govuk-caption-m">Lesson ' +
      (state.lesson + 1) +
      " of " +
      Lessons.lessons.length +
      "</p>" +
      '<h1 class="govuk-heading-l">' +
      UI.esc(lesson.title) +
      "</h1>" +
      '<ol class="lesson-index">' +
      Lessons.lessons
        .map((_, index) => {
          const current = index === state.lesson ? ' aria-current="page"' : "";
          const text = index === state.lesson ? "<strong>" + (index + 1) + "</strong>" : String(index + 1);
          return (
            '<li><a class="govuk-link" href="#lesson-' +
            (index + 1) +
            '" data-act="goto-lesson" data-lesson="' +
            index +
            '"' +
            current +
            ">" +
            text +
            "</a></li>"
          );
        })
        .join("") +
      "</ol>" +
      '<p class="govuk-body">' +
      UI.esc(step.coach) +
      "</p>" +
      '<div class="choices">' +
      choices +
      "</div>" +
      why +
      (state.picked ? '<button type="button" class="govuk-button" data-act="' + nextAct + '">' + nextLabel + "</button>" : "");
  }

  function renderRules() {
    felt.classList.add("paper");
    pad.innerHTML = "";
    felt.innerHTML = rulesHTML();
  }

  function renderPlay() {
    felt.classList.remove("paper");
    if (!state.match) {
      felt.innerHTML = UI.feltHTML(emptyTable());
      pad.innerHTML =
        '<p class="govuk-caption-m">A hand</p><h1 class="govuk-heading-l">Sit down</h1><p class="govuk-body">You are at the bottom. Partner is across. Left deals the first hand, so you bid first. Four cards, then a promise, then four more.</p><button type="button" class="govuk-button" data-act="deal">Deal</button>';
      return;
    }
    const match = state.match;
    const hand = match.hand;
    const view = TN.present(match, "S");
    view.ribbon = ribbon(match);
    const playable = playableSet(hand);
    felt.innerHTML = UI.feltHTML(view, {
      playable: playable,
      dim: !!(playable && hand.turnSeat === "S" && !state.auto),
    });
    const coach = state.quiet ? firstSentence(TN.coachLine(match, "S")) : TN.coachLine(match, "S");
    const flash = state.flash
      ? '<p class="govuk-error-message"><span class="govuk-visually-hidden">Error: </span>' + UI.esc(state.flash) + "</p>"
      : "";
    const log = hand.log
      .slice(-6)
      .map((line) => "<li>" + UI.esc(line) + "</li>")
      .join("");
    pad.innerHTML =
      '<p class="govuk-caption-m">' +
      UI.esc(kicker(hand)) +
      '</p><h1 class="govuk-heading-l">' +
      UI.esc(title(hand)) +
      "</h1>" +
      flash +
      '<p class="govuk-body">' +
      UI.esc(coach) +
      "</p>" +
      '<div class="choices">' +
      controls(hand) +
      "</div>" +
      '<div class="govuk-checkboxes govuk-checkboxes--small" data-module="govuk-checkboxes">' +
      '<div class="govuk-checkboxes__item">' +
      '<input class="govuk-checkboxes__input" id="quiet" type="checkbox" data-act="quiet"' +
      (state.quiet ? " checked" : "") +
      ">" +
      '<label class="govuk-label govuk-checkboxes__label" for="quiet">Shorter notes</label>' +
      "</div></div>" +
      (log ? '<h2 class="govuk-heading-s">This hand</h2><ul class="govuk-list govuk-list--bullet log">' + log + "</ul>" : "");
    scheduleBots();
  }

  function emptyTable() {
    const backs = (n) => Array.from({ length: n }, () => ({ face: false }));
    const seat = (id, label, n) => ({ id, label, cards: n ? backs(n) : [], count: n });
    return {
      seats: {
        S: seat("S", "You", 0),
        E: seat("E", "Right", 0),
        N: seat("N", "Partner", 0),
        W: seat("W", "Left", 0),
      },
      trick: [],
      buried: null,
      dealer: "W",
      ourScore: 0,
      theirScore: 0,
      ribbon: "Thirty-two cards · twenty-eight points",
      trumpKnown: false,
    };
  }

  function playableSet(hand) {
    if (!hand || state.auto || hand.turnSeat !== "S") return null;
    if (hand.phase === "play") return new Set(TN.legalPlays(hand, "S").map((play) => play.card.id));
    if (hand.phase === "bury") {
      return new Set(hand.hands.S.filter((card) => card.suit === hand.trump).map((card) => card.id));
    }
    return null;
  }

  function ribbon(match) {
    const hand = match.hand;
    if (hand.phase === "annulled") return "Thrown in";
    if (hand.phase === "bid") return "First four · floor 16";
    if (hand.phase === "trump") return "Name the suit, or call the seventh card";
    if (hand.phase === "double" || hand.phase === "redouble") return "Before the other four cards";
    if (!hand.declarer) return "Twenty-nine";
    const target = TN.targetOf(hand);
    const stake = hand.stake === 1 ? "1 pip" : hand.stake + " pips";
    let trump = "Trump hidden";
    if (hand.trumpRevealed) trump = TN.SUIT_INFO[hand.trump].name + " trump";
    else if (hand.declarer === "S" && hand.trump) trump = TN.SUIT_INFO[hand.trump].name + ", face down";
    else if (hand.trumpMode === "seventh" && !hand.trump) trump = "Seventh card";
    const points =
      hand.phase === "play" || hand.phase === "marriage" || hand.phase === "handEnd" || hand.phase === "matchEnd"
        ? " · Us " + TN.cardPoints(hand.tricks.SN) + " / Them " + TN.cardPoints(hand.tricks.EW)
        : "";
    return "Bid " + hand.bid + " · target " + target + " · " + stake + " · " + trump + points;
  }

  function kicker(hand) {
    const map = {
      bid: "The auction",
      trump: "Trump",
      double: "Double",
      redouble: "Redouble",
      bury: "The face-down card",
      play: "Trick " + hand.trickNo,
      marriage: "Marriage",
      annulled: "Thrown in",
      handEnd: "The hand",
      matchEnd: "The match",
    };
    return map[hand.phase] || "The table";
  }

  function title(hand) {
    if (hand.phase === "matchEnd") return state.match.over.winner === "SN" ? "Your match" : "Their match";
    if (hand.phase === "handEnd") return hand.result.made ? "Made" : "Missed";
    if (hand.phase === "annulled") return "Gather the cards";
    if (hand.turnSeat === "S" && !state.auto) return "Your turn";
    return TN.SEAT_NAME[hand.turnSeat] || "The table";
  }

  function controls(hand) {
    if (hand.phase === "annulled" || hand.phase === "handEnd") {
      return '<button type="button" class="govuk-button" data-act="continue">Deal the next hand</button>';
    }
    if (hand.phase === "matchEnd") {
      return '<button type="button" class="govuk-button" data-act="newmatch">New match</button>';
    }
    if (state.auto) return '<button type="button" class="govuk-button govuk-button--secondary" data-act="takeover">I\'ll play</button>';
    if (hand.turnSeat !== "S") {
      return '<button type="button" class="govuk-button govuk-button--secondary" data-act="auto">Let them finish the hand</button>';
    }
    if (hand.phase === "bid") return bidControls(hand);
    if (hand.phase === "trump") return trumpControls(hand);
    if (hand.phase === "double") {
      return '<button type="button" class="govuk-button" data-act="double">Double</button><button type="button" class="govuk-button govuk-button--secondary" data-act="decline">Let it stand</button>';
    }
    if (hand.phase === "redouble") {
      return '<button type="button" class="govuk-button" data-act="redouble">Redouble</button><button type="button" class="govuk-button govuk-button--secondary" data-act="decline">Let the double stand</button>';
    }
    if (hand.phase === "bury") return '<p class="govuk-body">Click a trump in your hand. A low one is the usual choice.</p>';
    if (hand.phase === "marriage") {
      return '<button type="button" class="govuk-button" data-act="marriage">Show the king and queen</button><button type="button" class="govuk-button govuk-button--secondary" data-act="decline">Keep them</button>';
    }
    let html = "";
    if (TN.canAsk(hand, "S")) {
      html += '<button type="button" class="govuk-button" data-act="reveal">Ask for trump</button><p class="govuk-body">Or play a card, and leave the suit hidden.</p>';
    } else {
      html += '<p class="govuk-body">Play a card. Dim cards would be refused.</p>';
    }
    html += '<button type="button" class="govuk-button govuk-button--secondary" data-act="auto">Let them finish the hand</button>';
    return html;
  }

  function bidControls(hand) {
    const floor = Math.max(16, (hand.bid || 0) + 1);
    let html = '<button type="button" class="govuk-button govuk-button--secondary" data-act="pass">Pass</button>';
    if (floor > 28) return html;
    const top = state.moreBids ? 28 : Math.min(28, floor + 4);
    for (let n = floor; n <= top; n++) {
      const cls = n === floor ? "govuk-button" : "govuk-button govuk-button--secondary";
      html += '<button type="button" class="' + cls + '" data-act="bid" data-value="' + n + '">' + n + "</button>";
    }
    if (!state.moreBids && top < 28) html += '<button type="button" class="govuk-button govuk-button--secondary" data-act="morebids">Higher</button>';
    return html;
  }

  function trumpControls(hand) {
    const held = new Set(hand.hands.S.map((card) => card.suit));
    let html = "";
    TN.SUITS.forEach((suit) => {
      if (!held.has(suit)) return;
      const info = TN.SUIT_INFO[suit];
      html +=
        '<button type="button" class="govuk-button" data-act="trump" data-suit="' +
        suit +
        '">' +
        info.symbol +
        " " +
        info.name +
        "</button>";
    });
    html += '<button type="button" class="govuk-button govuk-button--secondary" data-act="trump" data-suit="7th">Seventh card</button>';
    return html;
  }

  function firstSentence(text) {
    const match = text.match(/^[\s\S]*?[.!?](\s|$)/);
    return match ? match[0].trim() : text;
  }

  function scheduleBots() {
    const token = ++state.botToken;
    const match = state.match;
    if (!match || !match.hand) return;
    const phase = match.hand.phase;
    if (phase === "annulled" || phase === "handEnd" || phase === "matchEnd") return;
    if (match.hand.turnSeat === "S" && !state.auto) return;
    window.setTimeout(() => {
      if (token !== state.botToken || state.mode !== "play") return;
      let action;
      try {
        action = Bots.botAction(match);
      } catch (error) {
        state.auto = false;
        state.flash = error.message;
        render();
        return;
      }
      const result = TN.apply(match, action);
      if (!result.ok) {
        state.auto = false;
        state.flash = result.reason;
        render();
        return;
      }
      render();
    }, state.auto || state.quiet ? 240 : 620);
  }

  function act(name, node) {
    if (name === "nav") {
      state.mode = node.dataset.mode;
      state.botToken++;
      render();
      return;
    }
    if (name === "install" && state.install) {
      state.install.prompt();
      return;
    }
    if (name === "quiet") {
      state.quiet = node.checked;
      if (state.mode === "play") render();
      return;
    }
    if (name === "goto-lesson") {
      state.lesson = Number(node.dataset.lesson);
      state.step = 0;
      state.picked = null;
      render();
      return;
    }
    if (name === "choose") {
      const lesson = Lessons.lessons[state.lesson];
      const index = Number(node.dataset.index);
      state.picked = { index, correct: lesson.steps[state.step].choices[index].correct };
      render();
      return;
    }
    if (name === "next-step") {
      advance();
      return;
    }
    if (name === "prev-step") {
      retreat();
      return;
    }
    if (name === "deal" || name === "newmatch") {
      state.mode = "play";
      state.match = TN.newMatch();
      state.auto = false;
      state.moreBids = false;
      state.flash = "";
      TN.startHand(state.match);
      render();
      return;
    }
    if (name === "continue") {
      state.flash = "";
      state.auto = false;
      TN.apply(state.match, { type: "continue" });
      render();
      return;
    }
    if (name === "auto") {
      state.auto = true;
      state.flash = "";
      render();
      return;
    }
    if (name === "takeover") {
      state.auto = false;
      render();
      return;
    }
    if (name === "morebids") {
      state.moreBids = true;
      render();
      return;
    }
    if (state.mode !== "play" || !state.match) return;
    state.flash = "";
    let result = { ok: true };
    if (name === "pass" || name === "decline") result = TN.apply(state.match, { type: name === "pass" ? "pass" : "decline" });
    else if (name === "bid") result = TN.apply(state.match, { type: "bid", value: Number(node.dataset.value) });
    else if (name === "trump") result = TN.apply(state.match, { type: "trump", suit: node.dataset.suit });
    else if (name === "double") result = TN.apply(state.match, { type: "double" });
    else if (name === "redouble") result = TN.apply(state.match, { type: "redouble" });
    else if (name === "marriage") result = TN.apply(state.match, { type: "marriage" });
    else if (name === "reveal") result = TN.apply(state.match, { type: "reveal" });
    else if (name === "card") result = playCard(node.dataset.card);
    else return;
    if (result && !result.ok) state.flash = result.reason;
    state.moreBids = false;
    render();
  }

  function playCard(id) {
    const hand = state.match.hand;
    if (hand.turnSeat !== "S" || state.auto) return { ok: true };
    if (hand.phase === "bury") return TN.apply(state.match, { type: "bury", card: id });
    if (hand.phase === "play") return TN.apply(state.match, { type: "play", card: id });
    return { ok: false, reason: "That card is not asked for yet." };
  }

  function advance() {
    const lesson = Lessons.lessons[state.lesson];
    state.picked = null;
    if (state.step < lesson.steps.length - 1) state.step += 1;
    else if (state.lesson < Lessons.lessons.length - 1) {
      state.lesson += 1;
      state.step = 0;
    }
    render();
  }

  function retreat() {
    state.picked = null;
    if (state.step > 0) state.step -= 1;
    else if (state.lesson > 0) {
      state.lesson -= 1;
      state.step = Lessons.lessons[state.lesson].steps.length - 1;
    }
    render();
  }

  document.body.addEventListener("click", (event) => {
    const node = event.target.closest("[data-act]");
    if (!node || node.dataset.act === "quiet") return;
    if (node.tagName === "A") event.preventDefault();
    act(node.dataset.act, node);
  });

  document.body.addEventListener("change", (event) => {
    const node = event.target.closest("[data-act]");
    if (node && node.dataset.act === "quiet") act("quiet", node);
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.install = event;
    paintNav();
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  render();

  function rulesHTML() {
    return (
      '<article class="rules">' +
      '<h1 class="govuk-heading-l">How this table plays 29</h1>' +
      "<p>Four players play in two pairs. Your partner sits across from you. The pack has 32 cards. The jack and the nine rank above the ace. Play moves to your right.</p>" +
      "<p>The lessons and the bots use these rules. If another table uses a different rule, this page names that rule.</p>" +
      section(
        "The pack",
        "<p>The rank, from high to low, is jack, nine, ace, ten, king, queen, eight, seven.</p>" +
          "<ul><li>Jack: 3 points</li><li>Nine: 2 points</li><li>Ace: 1 point</li><li>Ten: 1 point</li><li>King, queen, eight, and seven: 0 points</li></ul>" +
          "<p>Four suits give 28 points. The last trick adds no point. The name of the game is still 29.</p>"
      ) +
      section(
        "The deal",
        "<p>Left deals the first hand. The next dealer is the player on the right. Each player receives four cards.</p>" +
          "<p>Stop the deal if either of these hands has no points:</p>" +
          "<ul><li>The player to the right of the dealer</li><li>The dealer’s partner</li></ul>" +
          "<p>The other two players may hold no points. The deal still continues.</p>"
      ) +
      section(
        "The auction",
        "<p>A bid is a whole number from 16 to 28. Each player speaks once. The player to the right of the dealer speaks first. A new bid must be higher than the current bid. The highest bidder chooses trump.</p>" +
          "<p>If all four players pass, the hand ends. The dealer does not have to bid 16.</p>" +
          "<p>Some tables in Bangladesh use a different auction. After a pass, that player’s partner may bid. A player may match the bid and say “ditto”. The auction ends when one side stops. This table does not use that auction.</p>" +
          "<p>One bid for each player is also a Bangladesh rule. This table uses that rule.</p>"
      ) +
      section(
        "Trump",
        "<p>The bidder may name a suit from the first four cards. Or the bidder may call the seventh card.</p>" +
          "<p>The seventh card is the third of the next four cards. The bidder has not seen it. That card becomes trump. It stays face down, outside the hand.</p>" +
          "<p>If the bidder names a suit, each player receives four more cards. The bidder then puts one trump face down. That card stays out of the hand until a player asks.</p>" +
          "<p>Before a player asks, trump has no power. The bidder cannot lead trump. A trump on another suit is only a card of its own suit.</p>" +
          "<p>Stop a seventh-card deal in either case:</p>" +
          "<ul><li>The bidder has no other trump that scores points.</li><li>The other side has no trump, or only the seven.</li></ul>"
      ) +
      section(
        "Double",
        "<p>An opponent may double after the bidder chooses trump, and before the next four cards. A double makes the hand worth 2 pips. The bidding side may then redouble. A redouble makes the hand worth 4 pips. Both sides decide from the first four cards only. With no double, the hand is worth 1 pip.</p>"
      ) +
      section(
        "Asking",
        "<p>Follow the led suit if you have a card of that suit.</p>" +
          "<p>If you have no card of the led suit, choose one:</p>" +
          "<ul><li>Discard a card from another suit.</li><li>Ask for trump.</li></ul>" +
          "<p>If you ask, the bidder shows the face-down card. That suit is trump for this trick and for the rest of the hand. You must play a trump if you have one. A card of that suit already in the trick can win.</p>" +
          "<p>At some tables, the first player who cannot follow must ask. That player may then discard. At this table, you choose whether to ask.</p>" +
          "<p>After trump is known, follow the led suit if you can. If you cannot follow, you may play a trump or a discard. If you play a trump and can beat the trump in the trick, you must beat it.</p>" +
          "<p>If no player asks before the last trick, the hand ends. Neither side scores.</p>"
      ) +
      section(
        "Marriage",
        "<p>A marriage is the king and queen of trump in one hand. Only the bidding side may show it, after trump is face up.</p>" +
          "<ul><li>Bid 16, 17, or 18: the target does not change.</li><li>Bid 19 or 20: the target becomes 16.</li><li>Bid 21: the target becomes 17.</li><li>Bid 22 or higher: subtract 4. The target does not go below 16.</li></ul>" +
          "<p>The Bangladesh note gives the rule for 19, 20, and 21. It does not give a rule for 22 or higher. The rule for 22 or higher is the rule of this table.</p>" +
          "<p>The other side’s king and queen do not change the target.</p>"
      ) +
      section(
        "Pips",
        "<p>A pip is one point on the match score. Only the bidding side’s score changes.</p>" +
          "<ul><li>A made contract shows 1 red pip.</li><li>A missed contract shows 1 black pip.</li><li>A double is worth 2 pips.</li><li>A redouble is worth 4 pips.</li></ul>" +
          "<p>Six red pips win the match. Six black pips lose the match.</p>"
      ) +
      '<p class="govuk-body-s colophon">The card points and the marriage numbers follow John McLeod’s notes at pagat.com. Asif Al Hye reported the Bangladesh rules on that page. Shishir Sharif reported the one-bid auction on that page. The card faces are the Standard cardset from PySolFC. John Fitzgibbon and Jochen Tuchbreiter drew that cardset. The table cloth is the Felt Green tile from PySolFC.</p>' +
      "</article>"
    )
      .replaceAll("<p>", '<p class="govuk-body">')
      .replaceAll("<ul>", '<ul class="govuk-list govuk-list--bullet">');
  }

  function section(title, body) {
    return '<section><h2 class="govuk-heading-m">' + title + "</h2>" + body + "</section>";
  }
})();
