const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const UI = require("../js/ui.js");

test("cards render an alpha-identical shadow image behind the face", () => {
  const html = UI.cardHTML({ face: true, id: "9S", rank: "9", suit: "S" }, {});

  assert.match(html, /class="card-shadow"/);
  assert.match(html, /class="card-face"/);
  assert.equal((html.match(/assets\/cards\/09s\.gif/g) || []).length, 2);
  assert.ok(html.indexOf('class="card-shadow"') < html.indexOf('class="card-face"'));
});

test("card backs use the same alpha-identical shadow structure", () => {
  const html = UI.cardHTML({ face: false }, {});

  assert.match(html, /class="card-shadow"/);
  assert.match(html, /class="card-face"/);
  assert.equal((html.match(/assets\/cards\/back111\.gif/g) || []).length, 2);
});

test("cards contain their dimming layer so it cannot wash out adjacent cards", () => {
  const css = fs.readFileSync(path.join(__dirname, "../css/table.css"), "utf8");
  const cardRule = css.match(/button\.card,\s*\.card\s*\{([^}]*)\}/);

  assert.ok(cardRule, "expected the shared card rule");
  assert.match(cardRule[1], /isolation:\s*isolate/);
});

test("the point lookup legend stays visible on mobile", () => {
  const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "../css/table.css"), "utf8");

  assert.match(html, /class="govuk-body-s legend"/);
  assert.match(html, /Jack 3, nine 2, ace 1, ten 1, others 0/);

  const mobile = css.match(/@media\s*\(max-width:\s*40\.0525em\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(mobile, "expected the mobile header media query");
  assert.doesNotMatch(mobile[1], /\.legend\s*\{[^}]*display:\s*none/);
  assert.doesNotMatch(mobile[1], /\.legend\s*\{[^}]*flex:\s*1\s+0\s+100%/);
  assert.match(mobile[1], /\.legend\s*\{[^}]*white-space:\s*nowrap/);
});

test("mobile chrome keeps language as a single switch beside Menu", () => {
  const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "../css/table.css"), "utf8");

  assert.match(html, /id="navigation"[\s\S]*id="report"/);
  assert.doesNotMatch(html, /<\/nav>\s*<a id="report"/);

  const mobile = css.match(/@media\s*\(max-width:\s*40\.0525em\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(mobile, "expected the mobile header media query");
  assert.match(mobile[1], /language-navigation__list-item:has\(\.govuk-language-navigation__text\)/);
  assert.match(mobile[1], /service-navigation__inlining-container[\s\S]*flex-wrap:\s*nowrap/);
});

test("a fan records its card count so a phone can spread the hand", () => {
  const face = { face: true, id: "AS", rank: "A", suit: "S" };
  const back = { face: false };
  const seat = (id, label, cards) => ({ id, label, cards });
  const html = UI.feltHTML({
    seats: {
      N: seat("N", "Partner", [back, back, back, back]),
      E: seat("E", "Right", [back, back, back, back]),
      W: seat("W", "Left", [back, back, back, back]),
      S: seat("S", "You", [face, { ...face, id: "KS" }, { ...face, id: "QS" }, { ...face, id: "JS" }]),
    },
    trick: [],
    buried: null,
    dealer: "W",
    turn: "S",
    declarer: null,
    bid: 0,
    trump: null,
    trumpKnown: false,
    ourScore: 0,
    theirScore: 0,
    ribbon: "",
  });

  assert.match(html, /class="fan" style="--hand-count:4"/);
});

test("mobile hands spread across the seat instead of a fixed overlap", () => {
  const css = fs.readFileSync(path.join(__dirname, "../css/table.css"), "utf8");
  const mobile = css.match(/@media\s*\(max-width:\s*900px\)\s*\{([\s\S]*)\}\s*@media\s*\(prefers-reduced-motion/);

  assert.ok(mobile, "expected the narrow-table media query");
  assert.match(mobile[1], /--hand-count/);
  assert.doesNotMatch(mobile[1], /margin-left:\s*-24px/);
});
