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
