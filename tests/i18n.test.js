const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const I18n = require("../js/i18n.js");

test("Bangladesh maps to Bengali, and other countries stay English", () => {
  assert.equal(I18n.localeForCountry("BD"), "bn");
  assert.equal(I18n.localeForCountry("bd"), "bn");
  assert.equal(I18n.localeForCountry("IN"), "en");
  assert.equal(I18n.localeForCountry("PK"), "en");
  assert.equal(I18n.localeForCountry("NP"), "en");
  assert.equal(I18n.localeForCountry("LK"), "en");
  assert.equal(I18n.localeForCountry(""), "en");
});

test("the Bengali copy file is the text the app shows", () => {
  const text = fs.readFileSync("copy/bengali.md", "utf8");
  const pack = I18n.parseCopy(text);
  assert.equal(pack["app.name"], "29 শিখ শালা!");
  assert.equal(pack["seat.S"], pack["seat.you"]);
  assert.equal(pack["seat.E"], pack["seat.right"]);
  assert.equal(pack["seat.N"], pack["seat.partner"]);
  assert.equal(pack["seat.W"], pack["seat.left"]);
  const slots = (line) => (String(line).match(/\{[a-z]+\}/g) || []).sort().join(" ");
  let id = "";
  let en = "";
  text.split(/\r?\n/).forEach((line) => {
    if (line.startsWith("id:")) id = line.slice(3).trim();
    else if (line.startsWith("en:")) en = line.slice(3).trim();
    else if (line.startsWith("bn:")) {
      assert.equal(slots(line.slice(3).trim()), slots(en), id);
      id = "";
      en = "";
    }
  });
  I18n.register("bn", pack);
  I18n.setLang("bn");
  assert.equal(I18n.t("app.name", "29 শিখ শালা!"), "29 শিখ শালা!");
  assert.equal(I18n.t("tag.bid", "bid {n}", { n: 16 }), "বিড ১৬");
  assert.equal(I18n.t("lesson.kicker", "Lesson {n} of {total}", { n: 1, total: 8 }), "লেসন ১ / ৮");
  I18n.setLang("en");
  assert.equal(I18n.t("tag.bid", "bid 16", { n: 16 }), "bid 16");
});

test("a blank Bengali line stays in English", () => {
  const pack = I18n.parseCopy("id: app.name\nen: Twenty-nine\nbn:\n");
  assert.equal(pack["app.name"], undefined);
});

test("Bengali text fills seats, suits, and cards", () => {
  I18n.register("bn", {
    "seat.S": "আপনি",
    "suit.H": "হার্ট",
    "rank.J": "জ্যাক",
    "log.play": "{seat} {card} খেলেন।",
  });
  I18n.setLang("bn");
  assert.equal(I18n.t("log.play", "You play the jack of hearts.", { seat: "S", card: "JH" }), "আপনি হার্টের জ্যাক খেলেন।");
  I18n.setLang("en");
  assert.equal(I18n.t("log.play", "You play the jack of hearts.", { seat: "S", card: "JH" }), "You play the jack of hearts.");
});
