(function () {
  const TN = window.TwentyNine;
  const Bots = window.TwentyNineBots;
  const Lessons = window.TwentyNineLessons;
  const UI = window.TwentyNineUI;
  const Rules = window.TwentyNineRules;

  const LESSON_RULE = {
    seats: "deal",
    rank: "rank",
    points: "rank",
    bid: "auction",
    hidden: "ask",
    marriage: "marriage",
    pips: "pips",
  };

  const state = {
    mode: "learn",
    section: null,
    lesson: 0,
    step: 0,
    picked: null,
    selected: null,
    missing: false,
    match: null,
    auto: false,
    moreBids: false,
    flash: "",
    install: null,
    botToken: 0,
  };

  const felt = document.querySelector("#felt");
  const pad = document.querySelector("#pad");
  const nav = document.querySelector("#nav");
  let feltScene = "";

  function tx(key, fallback, vars) {
    return window.UnotrishI18n.t(key, fallback, vars);
  }

  function paintChrome() {
    const name = tx("app.name", "29 শিখ শালা!");
    document.title = name;
    const mark = document.querySelector(".govuk-generic-header__homepage-link img");
    if (mark) mark.alt = name;
    const skip = document.querySelector(".govuk-skip-link");
    if (skip) skip.textContent = tx("chrome.skip", "Skip to main content");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", tx("app.description", "A table that teaches the Bangladeshi card game 29."));
    nav.querySelectorAll("[data-mode]").forEach((link) => {
      const key = "nav." + link.dataset.mode;
      const fallback = { learn: "Learn", play: "Play", rules: "Rules" }[link.dataset.mode];
      link.dataset.label = tx(key, fallback);
    });
    document.querySelector("#install").textContent = tx("action.install", "Install");
    const menu = document.querySelector(".govuk-service-navigation__toggle");
    if (menu) menu.textContent = tx("chrome.menu", "Menu");
    const legend = document.querySelector(".govuk-generic-header .legend");
    if (legend) legend.textContent = tx("legend.line", "Jack 3, nine 2, ace 1, ten 1, others 0");
    paintLangNav();
  }

  function paintLangNav() {
    const current = window.UnotrishI18n.getLang();
    document.querySelectorAll(".govuk-language-navigation__list-item").forEach((item) => {
      const el = item.querySelector("[data-lang]");
      if (!el) return;
      const lang = el.dataset.lang;
      const label = el.textContent;
      const on = lang === current;
      if (on && el.tagName === "A") {
        const span = document.createElement("span");
        span.className = "govuk-language-navigation__text";
        span.setAttribute("aria-current", "true");
        span.setAttribute("lang", lang);
        span.dataset.lang = lang;
        span.textContent = label;
        el.replaceWith(span);
      } else if (!on && el.tagName === "SPAN") {
        const a = document.createElement("a");
        a.className = "govuk-language-navigation__link";
        a.href = "?lang=" + lang;
        a.rel = "alternate";
        a.lang = lang;
        a.hreflang = lang;
        a.dataset.act = "lang";
        a.dataset.lang = lang;
        a.textContent = label;
        el.replaceWith(a);
      }
    });
  }

  function applyRoute(route, syncHash) {
    if (!route) return;
    state.mode = route.mode;
    state.section = route.mode === "rules" ? route.section : null;
    if (syncHash) {
      const next = Rules.hashFor(state.mode, state.section);
      if (location.hash !== next) history.replaceState(null, "", next);
    }
  }

  function render() {
    paintChrome();
    document.querySelector(".layout").classList.toggle("rules-mode", state.mode === "rules");
    paintNav();
    if (state.mode === "learn") renderLesson();
    else {
      feltScene = "";
      if (state.mode === "rules") renderRules();
      else renderPlay();
    }
  }

  function paintLessonFelt(view) {
    const scene = state.lesson + ":" + state.step;
    if (feltScene === scene) return;
    felt.innerHTML = UI.feltHTML(view);
    felt.classList.remove("paper");
    feltScene = scene;
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
    const lessonKey = "lesson." + lesson.id + "." + state.step;
    view.ribbon = tx(lessonKey + ".ribbon", step.ribbon || view.ribbon);
    paintLessonFelt(view);
    const revealed = state.picked && state.picked.index === state.selected;
    const answeredRight = revealed && state.picked.correct;
    const answeredWrong = revealed && !state.picked.correct;
    const radios = step.choices
      .map((choice, index) => {
        const id = "answer-" + state.lesson + "-" + state.step + "-" + index;
        const checked = state.selected === index ? " checked" : "";
        return (
          '<div class="govuk-radios__item">' +
          '<input class="govuk-radios__input" id="' +
          id +
          '" name="lesson-answer" type="radio" value="' +
          index +
          '" data-act="choose" data-index="' +
          index +
          '"' +
          checked +
          ">" +
          '<label class="govuk-label govuk-radios__label" for="' +
          id +
          '">' +
          UI.esc(tx(lessonKey + ".c" + index, choice.label)) +
          "</label></div>"
        );
      })
      .join("");
    const why = revealed ? UI.esc(tx(lessonKey + ".w" + state.picked.index, step.choices[state.picked.index].why)) : "";
    const select = tx("lesson.select", "Select an answer");
    // Missing selection uses the error summary; a wrong pick uses the inline error.
    const error = state.missing
      ? '<p id="answer-error" class="govuk-error-message"><span class="govuk-visually-hidden">' + UI.esc(tx("lesson.error", "Error")) + ": </span>" + UI.esc(select) + "</p>"
      : answeredWrong
        ? '<p id="answer-error" class="govuk-error-message"><span class="govuk-visually-hidden">' + UI.esc(tx("lesson.error", "Error")) + ": </span>" + why + "</p>"
        : "";
    const summary = state.missing
      ? '<div class="govuk-error-summary" role="alert" aria-labelledby="error-summary-title" tabindex="-1">' +
        '<h2 class="govuk-error-summary__title" id="error-summary-title">' +
        UI.esc(tx("lesson.problem", "There is a problem")) +
        "</h2>" +
        '<div class="govuk-error-summary__body"><ul class="govuk-list govuk-error-summary__list">' +
        '<li><a href="#lesson-answer">' +
        UI.esc(select) +
        "</a></li></ul></div></div>"
      : "";
    const inset = answeredRight ? '<div class="govuk-inset-text" id="answer-why">' + why + "</div>" : "";
    const last = state.step === lesson.steps.length - 1 && state.lesson === Lessons.lessons.length - 1;
    const buttonLabel = answeredRight
      ? last
        ? tx("lesson.deal", "Deal a hand")
        : tx("lesson.next", "Next")
      : tx("lesson.continue", "Check");
    const ask = step.ask ? tx(lessonKey + ".ask", step.ask) : "";
    const heading = ask || tx("lesson." + lesson.id + ".title", lesson.title);
    const back =
      state.step > 0 || state.lesson > 0
        ? '<a class="govuk-back-link" href="#back" data-act="prev-step">' + UI.esc(tx("lesson.back", "Back")) + "</a>"
        : "";
    const describedBy =
      "answer-hint" + (error ? " answer-error" : "") + (inset ? " answer-why" : "");
    pad.innerHTML =
      back +
      summary +
      '<div class="govuk-form-group' +
      (state.missing || answeredWrong ? " govuk-form-group--error" : "") +
      '">' +
      '<fieldset class="govuk-fieldset" id="lesson-answer" aria-describedby="' +
      describedBy +
      '">' +
      '<legend class="govuk-fieldset__legend govuk-fieldset__legend--l">' +
      '<span class="govuk-caption-l">' +
      UI.esc(tx("lesson.kicker", "Lesson " + (state.lesson + 1) + " of " + Lessons.lessons.length, { n: state.lesson + 1, total: Lessons.lessons.length })) +
      "</span>" +
      '<h1 class="govuk-fieldset__heading">' +
      UI.esc(heading) +
      "</h1></legend>" +
      '<div id="answer-hint" class="govuk-hint">' +
      UI.esc(tx(lessonKey + ".coach", step.coach)) +
      "</div>" +
      rulesMoreHTML(lesson.id) +
      error +
      '<div class="govuk-radios" data-module="govuk-radios">' +
      radios +
      "</div></fieldset></div>" +
      inset +
      '<button type="button" class="govuk-button" data-act="check">' +
      UI.esc(buttonLabel) +
      "</button>";
    const problem = pad.querySelector(".govuk-error-summary");
    if (problem) problem.focus();
  }

  function rulesMoreHTML(lessonId) {
    const section = LESSON_RULE[lessonId];
    if (!section) return "";
    return (
      '<p class="govuk-body-s rules-more">' +
      Rules.rulesLink(section, tx("rules.more", "More in Rules"), UI.esc) +
      "</p>"
    );
  }

  function renderRules() {
    felt.classList.add("paper");
    pad.innerHTML = "";
    felt.innerHTML = Rules.rulesHTML(tx, UI.esc, state.section);
    if (!state.section) return;
    const target = felt.querySelector("#rules-" + state.section);
    if (target) {
      if (typeof target.scrollIntoView === "function") target.scrollIntoView({ block: "start" });
    }
  }

  function renderPlay() {
    felt.classList.remove("paper");
    if (!state.match) {
      const empty = emptyTable();
      empty.ribbon = tx("ribbon.empty", "Thirty-two cards. Twenty-eight card points.");
      felt.innerHTML = UI.feltHTML(empty);
      pad.innerHTML =
        '<p class="govuk-caption-m">' +
        UI.esc(tx("play.kicker", "A hand")) +
        '</p><h1 class="govuk-heading-l">' +
        UI.esc(tx("play.sit", "Sit down")) +
        '</h1><p class="govuk-body">' +
        UI.esc(
          tx(
            "play.sitCoach",
            "You sit at the bottom. Partner sits across. The seat called Left deals the first hand, so you bid first. Four cards, then a promise, then four more."
          )
        ) +
        '</p><p class="govuk-body-s rules-more">' +
        Rules.rulesLink("deal", tx("rules.more", "More in Rules"), UI.esc) +
        '</p><button type="button" class="govuk-button" data-act="deal">' +
        UI.esc(tx("play.deal", "Deal")) +
        "</button>";
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
    const spec = TN.coachSpec(match, "S");
    const coach = tx(spec.key, spec.en, spec.vars);
    const flashText = state.flash ? tx(state.flashKey, state.flash, state.flashVars) : "";
    const flash = flashText
      ? '<p class="govuk-error-message"><span class="govuk-visually-hidden">' + UI.esc(tx("lesson.error", "Error")) + ": </span>" + UI.esc(flashText) + "</p>"
      : "";
    const notes = hand.notes && hand.notes.length ? hand.notes : hand.log.map((line) => ({ key: "", en: line, vars: {} }));
    const log = notes
      .slice(-6)
      .map((note) => "<li>" + UI.esc(tx(note.key, note.en, note.vars)) + "</li>")
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
      (log ? '<h2 class="govuk-heading-s">' + UI.esc(tx("play.log", "This hand")) + '</h2><ul class="govuk-list govuk-list--bullet log">' + log + "</ul>" : "");
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
      ribbon: "Thirty-two cards. Twenty-eight card points.",
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
    if (hand.phase === "annulled") return tx("ribbon.stopped", "The deal stops");
    if (hand.phase === "bid") return tx("ribbon.bid", "First four cards. The smallest bid is 16.");
    if (hand.phase === "trump") return tx("ribbon.trump", "Name the suit, or call the seventh card");
    if (hand.phase === "double" || hand.phase === "redouble") return tx("ribbon.before", "Before the other four cards");
    if (!hand.declarer) return tx("ribbon.noBid", "29 শিখ শালা!");
    const target = TN.targetOf(hand);
    const stakeEn = hand.stake === 1 ? "1 pip" : hand.stake + " pips";
    const stake = tx(hand.stake === 1 ? "stake.one" : "stake.many", stakeEn, { n: hand.stake });
    let trumpKey = "ribbon.trumpHidden";
    let trumpEn = "Trump is hidden";
    let trumpVars = {};
    if (hand.trumpRevealed) {
      trumpKey = "ribbon.trumpNamed";
      trumpEn = TN.SUIT_INFO[hand.trump].name + " trump";
      trumpVars = { suit: hand.trump };
    } else if (hand.declarer === "S" && hand.trump) {
      trumpKey = "ribbon.trumpDown";
      trumpEn = TN.SUIT_INFO[hand.trump].name + ", face down";
      trumpVars = { suit: hand.trump };
    } else if (hand.trumpMode === "seventh" && !hand.trump) {
      trumpKey = "ribbon.seventh";
      trumpEn = "Seventh card";
    }
    const trumpText = tx(trumpKey, trumpEn, trumpVars);
    const statusEn = "Bid " + hand.bid + ". Target " + target + ". " + stakeEn + ". " + trumpEn + ".";
    let text = tx("ribbon.status", statusEn, { bid: hand.bid, target: target, stake: stake, trump: trumpText });
    if (hand.phase === "play" || hand.phase === "marriage" || hand.phase === "handEnd" || hand.phase === "matchEnd") {
      const us = TN.cardPoints(hand.tricks.SN);
      const them = TN.cardPoints(hand.tricks.EW);
      text += " " + tx("ribbon.points", "You " + us + ". The other side " + them + ".", { us: us, them: them });
    }
    return text;
  }

  function kicker(hand) {
    const map = {
      bid: ["phase.bid", "The auction"],
      trump: ["phase.trump", "Trump"],
      double: ["phase.double", "Double"],
      redouble: ["phase.redouble", "Redouble"],
      bury: ["phase.bury", "The face-down card"],
      play: ["phase.play", "Trick " + hand.trickNo],
      marriage: ["phase.marriage", "Marriage"],
      annulled: ["phase.annulled", "The deal stops"],
      handEnd: ["phase.handEnd", "The hand"],
      matchEnd: ["phase.matchEnd", "The match"],
    };
    const pair = map[hand.phase] || ["phase.table", "The table"];
    return tx(pair[0], pair[1], { n: hand.trickNo });
  }

  function title(hand) {
    if (hand.phase === "matchEnd") {
      return state.match.over.winner === "SN" ? tx("title.matchUs", "Your match") : tx("title.matchThem", "Their match");
    }
    if (hand.phase === "handEnd") return hand.result.made ? tx("title.made", "Made") : tx("title.miss", "Missed");
    if (hand.phase === "annulled") return tx("title.gather", "Gather the cards");
    if (hand.turnSeat === "S" && !state.auto) return tx("title.turn", "Your turn");
    const seat = hand.turnSeat;
    if (TN.SEAT_NAME[seat]) return tx("seat." + seat, TN.SEAT_NAME[seat]);
    return tx("phase.table", "The table");
  }

  function controls(hand) {
    if (hand.phase === "annulled" || hand.phase === "handEnd") {
      return '<button type="button" class="govuk-button" data-act="continue">' + UI.esc(tx("play.continue", "Deal the next hand")) + "</button>";
    }
    if (hand.phase === "matchEnd") {
      return '<button type="button" class="govuk-button" data-act="newmatch">' + UI.esc(tx("play.newMatch", "New match")) + "</button>";
    }
    if (state.auto) return '<button type="button" class="govuk-button govuk-button--secondary" data-act="takeover">' + UI.esc(tx("play.takeover", "I will play")) + "</button>";
    if (hand.turnSeat !== "S") {
      return '<button type="button" class="govuk-button govuk-button--secondary" data-act="auto">' + UI.esc(tx("play.auto", "Let them finish the hand")) + "</button>";
    }
    if (hand.phase === "bid") return bidControls(hand);
    if (hand.phase === "trump") return trumpControls(hand);
    if (hand.phase === "double") {
      return (
        '<button type="button" class="govuk-button" data-act="double">' +
        UI.esc(tx("play.double", "Double")) +
        '</button><button type="button" class="govuk-button govuk-button--secondary" data-act="decline">' +
        UI.esc(tx("play.letStand", "Do not double")) +
        "</button>"
      );
    }
    if (hand.phase === "redouble") {
      return (
        '<button type="button" class="govuk-button" data-act="redouble">' +
        UI.esc(tx("play.redouble", "Redouble")) +
        '</button><button type="button" class="govuk-button govuk-button--secondary" data-act="decline">' +
        UI.esc(tx("play.letDouble", "Do not redouble")) +
        "</button>"
      );
    }
    if (hand.phase === "bury") return '<p class="govuk-body">' + UI.esc(tx("play.buryHint", "Click a trump in your hand. A low trump is the usual choice.")) + "</p>";
    if (hand.phase === "marriage") {
      return (
        '<button type="button" class="govuk-button" data-act="marriage">' +
        UI.esc(tx("play.showMarriage", "Show the king and queen")) +
        '</button><button type="button" class="govuk-button govuk-button--secondary" data-act="decline">' +
        UI.esc(tx("play.keepMarriage", "Keep them")) +
        "</button>"
      );
    }
    let html = "";
    if (TN.canAsk(hand, "S")) {
      html +=
        '<button type="button" class="govuk-button" data-act="reveal">' +
        UI.esc(tx("play.ask", "Ask for trump")) +
        '</button><p class="govuk-body">' +
        UI.esc(tx("play.askHint", "Or play a card, and leave the suit hidden.")) +
        "</p>";
    } else {
      html += '<p class="govuk-body">' + UI.esc(tx("play.playHint", "Play a card. A pale card is not a legal play.")) + "</p>";
    }
    html += '<button type="button" class="govuk-button govuk-button--secondary" data-act="auto">' + UI.esc(tx("play.auto", "Let them finish the hand")) + "</button>";
    return html;
  }

  function bidControls(hand) {
    const floor = Math.max(16, (hand.bid || 0) + 1);
    let html = '<button type="button" class="govuk-button govuk-button--secondary" data-act="pass">' + UI.esc(tx("play.pass", "Pass")) + "</button>";
    if (floor > 28) return html;
    const top = state.moreBids ? 28 : Math.min(28, floor + 4);
    for (let n = floor; n <= top; n++) {
      const cls = n === floor ? "govuk-button" : "govuk-button govuk-button--secondary";
      html += '<button type="button" class="' + cls + '" data-act="bid" data-value="' + n + '">' + window.UnotrishI18n.digits(n) + "</button>";
    }
    if (!state.moreBids && top < 28) html += '<button type="button" class="govuk-button govuk-button--secondary" data-act="morebids">' + UI.esc(tx("play.higher", "Higher")) + "</button>";
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
        tx("suit." + suit, info.name) +
        "</button>";
    });
    html += '<button type="button" class="govuk-button govuk-button--secondary" data-act="trump" data-suit="7th">' + UI.esc(tx("play.seventh", "Seventh card")) + "</button>";
    return html;
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
        state.flashKey = "";
        state.flashVars = {};
        render();
        return;
      }
      const result = TN.apply(match, action);
      if (!result.ok) {
        state.auto = false;
        state.flash = result.reason;
        state.flashKey = result.key || "";
        state.flashVars = result.vars || {};
        render();
        return;
      }
      render();
    }, state.auto ? 240 : 620);
  }

  function act(name, node) {
    if (name === "lang") {
      window.UnotrishI18n.choose(node.dataset.lang);
      feltScene = "";
      render();
      return;
    }
    if (name === "nav") {
      applyRoute({ mode: node.dataset.mode, section: null }, true);
      state.botToken++;
      render();
      return;
    }
    if (name === "install" && state.install) {
      state.install.prompt();
      return;
    }
    if (name === "goto-lesson") {
      state.lesson = Number(node.dataset.lesson);
      state.step = 0;
      state.picked = null;
      state.selected = null;
      state.missing = false;
      render();
      return;
    }
    if (name === "choose") {
      const index = Number(node.dataset.index);
      const needsPad = state.missing || (state.picked && state.picked.index !== index);
      state.selected = index;
      state.missing = false;
      if (state.picked && state.picked.index !== state.selected) state.picked = null;
      // Browser already checked the radio; only rebuild the pad when feedback must clear.
      if (needsPad) render();
      return;
    }
    if (name === "check") {
      const lesson = Lessons.lessons[state.lesson];
      const step = lesson.steps[state.step];
      if (state.selected == null) {
        state.missing = true;
        state.picked = null;
        render();
        return;
      }
      state.missing = false;
      if (!state.picked || state.picked.index !== state.selected) {
        const choice = step.choices[state.selected];
        state.picked = { index: state.selected, correct: choice.correct };
        render();
        return;
      }
      if (!state.picked.correct) {
        render();
        return;
      }
      const last = state.step === lesson.steps.length - 1 && state.lesson === Lessons.lessons.length - 1;
      if (last) {
        act("deal", node);
        return;
      }
      advance();
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
      applyRoute({ mode: "play", section: null }, true);
      state.match = TN.newMatch();
      state.auto = false;
      state.moreBids = false;
      state.flash = "";
      state.flashKey = "";
      state.flashVars = {};
      TN.startHand(state.match);
      render();
      return;
    }
    if (name === "continue") {
      state.flash = "";
      state.flashKey = "";
      state.flashVars = {};
      state.auto = false;
      TN.apply(state.match, { type: "continue" });
      render();
      return;
    }
    if (name === "auto") {
      state.auto = true;
      state.flash = "";
      state.flashKey = "";
      state.flashVars = {};
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
    state.flashKey = "";
    state.flashVars = {};
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
    if (result && !result.ok) {
      state.flash = result.reason;
      state.flashKey = result.key || "";
      state.flashVars = result.vars || {};
    }
    state.moreBids = false;
    render();
  }

  function playCard(id) {
    const hand = state.match.hand;
    if (hand.turnSeat !== "S" || state.auto) return { ok: true };
    if (hand.phase === "bury") return TN.apply(state.match, { type: "bury", card: id });
    if (hand.phase === "play") return TN.apply(state.match, { type: "play", card: id });
    return { ok: false, key: "fail.notYet", reason: "That card is not asked for yet.", vars: {} };
  }

  function advance() {
    const lesson = Lessons.lessons[state.lesson];
    state.picked = null;
    state.selected = null;
    state.missing = false;
    if (state.step < lesson.steps.length - 1) state.step += 1;
    else if (state.lesson < Lessons.lessons.length - 1) {
      state.lesson += 1;
      state.step = 0;
    }
    render();
  }

  function retreat() {
    state.picked = null;
    state.selected = null;
    state.missing = false;
    if (state.step > 0) state.step -= 1;
    else if (state.lesson > 0) {
      state.lesson -= 1;
      state.step = Lessons.lessons[state.lesson].steps.length - 1;
    }
    render();
  }

  document.body.addEventListener("click", (event) => {
    const node = event.target.closest("[data-act]");
    if (!node || node.dataset.act === "choose") return;
    if (node.tagName === "A") event.preventDefault();
    act(node.dataset.act, node);
  });

  document.body.addEventListener("change", (event) => {
    const node = event.target.closest("[data-act]");
    if (!node) return;
    if (node.dataset.act === "choose") act("choose", node);
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.install = event;
    paintNav();
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  function initServiceNavigation() {
    const root = document.querySelector('[data-module="govuk-service-navigation"]');
    const button = root && root.querySelector(".govuk-js-service-navigation-toggle");
    if (!button) return;
    const menuId = button.getAttribute("aria-controls");
    const menu = menuId && document.getElementById(menuId);
    if (!menu) return;

    let open = false;
    const rootStyles = getComputedStyle(document.documentElement);
    const tablet = rootStyles.getPropertyValue("--govuk-breakpoint-tablet").trim() || "40.0625rem";
    const mql = window.matchMedia("(min-width: " + tablet + ")");

    function sync() {
      if (mql.matches) {
        menu.removeAttribute("hidden");
        button.setAttribute("hidden", "");
        button.setAttribute("aria-hidden", "true");
        button.removeAttribute("aria-expanded");
        return;
      }
      button.removeAttribute("hidden");
      button.removeAttribute("aria-hidden");
      button.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) menu.removeAttribute("hidden");
      else menu.setAttribute("hidden", "");
    }

    button.addEventListener("click", () => {
      open = !open;
      sync();
    });
    if (mql.addEventListener) mql.addEventListener("change", sync);
    else mql.addListener(sync);
    sync();
  }

  initServiceNavigation();

  applyRoute(Rules.parseHash(location.hash) || { mode: "learn", section: null }, true);

  window.addEventListener("hashchange", () => {
    const route = Rules.parseHash(location.hash);
    if (!route) return;
    applyRoute(route, false);
    state.botToken++;
    render();
  });

  window.UnotrishI18n.loadCopy("copy/bengali.md")
    .catch(() => {})
    .then(() => {
      render();
      return window.UnotrishI18n.start();
    })
    .then(() => render());
})();
