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
    selected: null,
    missing: false,
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

  function renderRules() {
    felt.classList.add("paper");
    pad.innerHTML = "";
    felt.innerHTML = rulesHTML();
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
        UI.esc(tx("play.sitCoach", "You sit at the bottom. Partner sits across. Left deals the first hand, so you bid first. Four cards, then a promise, then four more.")) +
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
    const coachFull = tx(spec.key, spec.en, spec.vars);
    const coach = state.quiet ? firstSentence(coachFull) : coachFull;
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
      '<div class="govuk-checkboxes govuk-checkboxes--small" data-module="govuk-checkboxes">' +
      '<div class="govuk-checkboxes__item">' +
      '<input class="govuk-checkboxes__input" id="quiet" type="checkbox" data-act="quiet"' +
      (state.quiet ? " checked" : "") +
      ">" +
      '<label class="govuk-label govuk-checkboxes__label" for="quiet">' +
      UI.esc(tx("play.quiet", "Short notes")) +
      "</label></div></div>" +
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

  function firstSentence(text) {
    const match = text.match(/^[\s\S]*?[।.!?]/);
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
    }, state.auto || state.quiet ? 240 : 620);
  }

  function act(name, node) {
    if (name === "lang") {
      window.UnotrishI18n.choose(node.dataset.lang);
      feltScene = "";
      render();
      return;
    }
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
      state.mode = "play";
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
    if (!node || node.dataset.act === "quiet" || node.dataset.act === "choose") return;
    if (node.tagName === "A") event.preventDefault();
    act(node.dataset.act, node);
  });

  document.body.addEventListener("change", (event) => {
    const node = event.target.closest("[data-act]");
    if (!node) return;
    if (node.dataset.act === "quiet") act("quiet", node);
    else if (node.dataset.act === "choose") act("choose", node);
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

  window.UnotrishI18n.loadCopy("copy/bengali.md")
    .catch(() => {})
    .then(() => {
      render();
      return window.UnotrishI18n.start();
    })
    .then(() => render());

  function P(key, en) {
    return '<p class="govuk-body">' + UI.esc(tx(key, en)) + "</p>";
  }

  function Li(key, en) {
    return "<li>" + UI.esc(tx(key, en)) + "</li>";
  }

  function rulesHTML() {
    return (
      '<article class="rules">' +
      '<h1 class="govuk-heading-l">' + UI.esc(tx("rules.title", "How this table plays 29")) + "</h1>" +
      P("rules.lead", "Four players play in two pairs. Your partner sits across from you. The pack has 32 cards. The jack and the nine rank above the ace. Play moves to your right.") +
      P("rules.note", "The lessons and the bots use these rules. If another table uses a different rule, this page names that rule.") +
      section("rules.pack.h", "The pack",
        P("rules.pack.1", "The rank, from high to low, is jack, nine, ace, ten, king, queen, eight, seven.") +
        '<ul class="govuk-list govuk-list--bullet">' + Li("rules.pack.j", "Jack: 3 points") + Li("rules.pack.9", "Nine: 2 points") + Li("rules.pack.a", "Ace: 1 point") + Li("rules.pack.10", "Ten: 1 point") + Li("rules.pack.0", "King, queen, eight, and seven: 0 points") + "</ul>" +
        P("rules.pack.2", "Four suits give 28 points. The last trick adds no point. The name of the game is still 29.")
      ) +
      section("rules.deal.h", "The deal",
        P("rules.deal.1", "Left deals the first hand. The next dealer is the player on the right. Each player receives four cards.") +
        P("rules.deal.2", "Stop the deal if either of these hands has no points:") +
        '<ul class="govuk-list govuk-list--bullet">' + Li("rules.deal.3", "The player to the right of the dealer") + Li("rules.deal.4", "The partner of the dealer") + "</ul>" +
        P("rules.deal.5", "The other two players may hold no points. The deal still continues.")
      ) +
      section("rules.auction.h", "The auction",
        P("rules.auction.1", "A bid is a whole number from 16 to 28. Each player speaks once. The player to the right of the dealer speaks first. A new bid must be higher than the current bid. The highest bidder chooses trump.") +
        P("rules.auction.2", "If all four players pass, the hand ends. The dealer does not have to bid 16.") +
        P("rules.auction.3", "Some tables in Bangladesh use a different auction. After a pass, the partner of that player may bid. A player may match the bid and say “ditto”. The auction ends when one side stops. This table does not use that auction.") +
        P("rules.auction.4", "One bid for each player is also a Bangladesh rule. This table uses that rule.")
      ) +
      section("rules.trump.h", "Trump",
        P("rules.trump.1", "The bidder may name a suit from the first four cards. Or the bidder may call the seventh card.") +
        P("rules.trump.2", "The seventh card is the third of the next four cards. The bidder does not see it yet. That card becomes trump. It stays face down, outside the hand.") +
        P("rules.trump.3", "If the bidder names a suit, each player receives four more cards. The bidder then puts one trump face down. That card stays out of the hand until a player asks.") +
        P("rules.trump.4", "Before a player asks, trump has no power. The bidder cannot lead trump. A trump on another suit is only a card of its own suit.") +
        P("rules.trump.5", "Stop a seventh-card deal in either case:") +
        '<ul class="govuk-list govuk-list--bullet">' + Li("rules.trump.6", "The bidder has no other trump that scores points.") + Li("rules.trump.7", "The other side has no trump, or only the seven.") + "</ul>"
      ) +
      section("rules.double.h", "Double",
        P("rules.double.1", "An opponent may double after the bidder chooses trump, and before the next four cards. A double makes the hand worth 2 pips. The bidding side may then redouble. A redouble makes the hand worth 4 pips. Both sides decide from the first four cards only. With no double, the hand is worth 1 pip.")
      ) +
      section("rules.ask.h", "Asking",
        P("rules.ask.1", "Follow the led suit if you have a card of that suit.") +
        P("rules.ask.2", "If you have no card of the led suit, choose one:") +
        '<ul class="govuk-list govuk-list--bullet">' + Li("rules.ask.3", "Discard a card from another suit.") + Li("rules.ask.4", "Ask for trump.") + "</ul>" +
        P("rules.ask.5", "If you ask, the bidder shows the face-down card. That suit is trump for this trick and for the rest of the hand. You must play a trump if you have one. A card of that suit already in the trick can win.") +
        P("rules.ask.6", "At some tables, the first player who cannot follow must ask. That player may then discard. At this table, you choose whether to ask.") +
        P("rules.ask.7", "After trump is known, follow the led suit if you can. If you cannot follow, you may play a trump or a discard. If you play a trump and can beat the trump in the trick, you must beat it.") +
        P("rules.ask.8", "If no player asks before the last trick, the hand ends. Neither side scores.")
      ) +
      section("rules.marriage.h", "Marriage",
        P("rules.marriage.1", "A marriage is the king and queen of trump in one hand. Only the bidding side may show it, after trump is face up.") +
        '<ul class="govuk-list govuk-list--bullet">' + Li("rules.marriage.16", "Bid 16, 17, or 18: the target does not change.") + Li("rules.marriage.19", "Bid 19 or 20: the target becomes 16.") + Li("rules.marriage.21", "Bid 21: the target becomes 17.") + Li("rules.marriage.22", "Bid 22 or higher: subtract 4. The target does not go below 16.") + "</ul>" +
        P("rules.marriage.2", "The Bangladesh note gives the rule for 19, 20, and 21. It does not give a rule for 22 or higher. The rule for 22 or higher is the rule of this table.") +
        P("rules.marriage.3", "The king and queen of the other side do not change the target.")
      ) +
      section("rules.pips.h", "Pips",
        P("rules.pips.1", "A pip is one point on the match score. Only the score of the bidding side changes.") +
        '<ul class="govuk-list govuk-list--bullet">' + Li("rules.pips.red", "A made contract shows 1 red pip.") + Li("rules.pips.black", "A missed contract shows 1 black pip.") + Li("rules.pips.double", "A double is worth 2 pips.") + Li("rules.pips.redouble", "A redouble is worth 4 pips.") + "</ul>" +
        P("rules.pips.2", "Six red pips win the match. Six black pips lose the match.")
      ) +
      '<p class="colophon">' + UI.esc(tx("rules.colophon", "The card points and the marriage numbers follow John McLeod’s notes at pagat.com. Asif Al Hye reported the Bangladesh rules on that page. Shishir Sharif reported the one-bid auction on that page. The card faces are the Standard cardset from PySolFC. John Fitzgibbon and Jochen Tuchbreiter drew that cardset. The table cloth is the Felt Green tile from PySolFC.")) + "</p>" +
      "</article>"
    );
  }

  function section(titleKey, title, body) {
    return '<section><h2 class="govuk-heading-m">' + UI.esc(tx(titleKey, title)) + "</h2>" + body + "</section>";
  }
})();
