const test = require("node:test");
const assert = require("node:assert/strict");
const Rules = require("../js/rules.js");

function t(key, fallback) {
  return fallback;
}

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"]/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]
  );
}

test("parseHash reads mode and rules section", () => {
  assert.deepEqual(Rules.parseHash(""), { mode: "learn", section: null });
  assert.deepEqual(Rules.parseHash("#learn"), { mode: "learn", section: null });
  assert.deepEqual(Rules.parseHash("#play"), { mode: "play", section: null });
  assert.deepEqual(Rules.parseHash("#rules"), { mode: "rules", section: null });
  assert.deepEqual(Rules.parseHash("#rules-rank"), { mode: "rules", section: "rank" });
  assert.deepEqual(Rules.parseHash("#rules-deal"), { mode: "rules", section: "deal" });
  assert.deepEqual(Rules.parseHash("#rules-auction"), { mode: "rules", section: "auction" });
  assert.equal(Rules.parseHash("#bogus"), null);
  assert.equal(Rules.parseHash("#cite-1"), null);
});

test("hashFor builds shareable deep links", () => {
  assert.equal(Rules.hashFor("learn"), "#learn");
  assert.equal(Rules.hashFor("play"), "#play");
  assert.equal(Rules.hashFor("rules"), "#rules");
  assert.equal(Rules.hashFor("rules", "marriage"), "#rules-marriage");
});

test("rules page title teaches how to play", () => {
  const html = Rules.rulesHTML(t, esc);
  assert.match(html, /How to play 29/);
  assert.doesNotMatch(html, /How this table plays 29/);
});

test("lead explains the 32-card pack and play to the right", () => {
  const html = Rules.rulesHTML(t, esc);
  assert.match(html, /2 through 6/);
  assert.match(html, /to your right/);
  assert.doesNotMatch(html, /The lessons and the bots use these rules/);
});

test("sections are anchorable details with stable ids", () => {
  const html = Rules.rulesHTML(t, esc, "auction");
  for (const id of ["rank", "deal", "auction", "trump", "double", "ask", "marriage", "pips"]) {
    assert.match(html, new RegExp('id="rules-' + id + '"'));
  }
  assert.match(html, /<details class="rules-fold"[^>]*id="rules-auction"[^>]* open/);
  assert.match(html, /Rank and points/);
  assert.doesNotMatch(html, />The pack</);
});

test("deal names the Left seat instead of bare Left", () => {
  const html = Rules.rulesHTML(t, esc);
  assert.match(html, /seat called Left deals the first hand/);
  assert.doesNotMatch(html, />Left deals the first hand/);
});

test("sources use footnote markers and a references list", () => {
  const html = Rules.rulesHTML(t, esc);
  assert.match(html, /href="#cite-1"/);
  assert.match(html, /id="cite-1"/);
  assert.match(html, /pagat\.com/);
  assert.doesNotMatch(html, /class="colophon"/);
});

test("rulesLink opens a section in a new tab", () => {
  const html = Rules.rulesLink("ask", "Asking", esc);
  assert.match(html, /href="#rules-ask"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener"/);
  assert.match(html, />Asking</);
});

test("linkWord wraps the first matching term in a rules deep link", () => {
  const text = "The contract stands. Only the pips of the bidding side move.";
  const html = Rules.linkWord(text, "pips", "pips", esc);
  assert.match(html, /Only the <a class="govuk-link" href="#rules-pips" target="_blank" rel="noopener">pips<\/a> of the bidding side/);
  assert.equal((html.match(/#rules-pips/g) || []).length, 1);
  assert.equal(Rules.linkWord("No jargon here.", "pips", "pips", esc), "No jargon here.");
});
