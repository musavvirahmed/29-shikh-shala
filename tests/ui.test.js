const test = require("node:test");
const assert = require("node:assert/strict");
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
