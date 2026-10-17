(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.UnotrishI18n = api;
})(typeof self !== "undefined" ? self : this, function () {
  // Discardable demo. English is the source text.
  // The visitor country comes from an IP lookup.
  // This demo maps Bangladesh (BD) to Bengali.
  // Later, still empty:
  // India is more than one language, so it stays English until a person chooses.
  // Pakistan: Urdu. Nepal: Nepali. Sri Lanka: Sinhala and Tamil.
  // Bhutan: Dzongkha. Maldives: Dhivehi. Afghanistan: Dari and Pashto.
  const COUNTRY_LANG = { BD: "bn" };
  const STORE = "unotrish-lang";

  let lang = "en";
  let bn = {};
  let country = "";

  function register(code, pack) {
    if (code === "bn") bn = pack || {};
  }

  function getLang() {
    return lang;
  }

  function countryCode() {
    return country;
  }

  function localeForCountry(code) {
    return COUNTRY_LANG[String(code || "").toUpperCase()] || "en";
  }

  function setLang(code) {
    lang = code === "bn" ? "bn" : "en";
    if (typeof document !== "undefined") document.documentElement.lang = lang === "bn" ? "bn" : "en";
  }

  function choose(code) {
    setLang(code);
    try {
      localStorage.setItem(STORE, lang);
    } catch (error) {}
  }

  function applyCountry(code) {
    country = String(code || "").toUpperCase();
    setLang(localeForCountry(country));
    return lang;
  }

  function token(name, value) {
    if (name === "seat" || name === "who") return bn["seat." + value] || "";
    if (name === "suit") return bn["suit." + value] || "";
    if (name === "card") return cardBn(value);
    if (value == null) return "";
    return String(value);
  }

  function cardBn(id) {
    const text = String(id || "");
    const rank = text.slice(0, -1);
    const suit = text.slice(-1);
    const suitName = bn["suit." + suit] || suit;
    const rankName = bn["rank." + rank] || rank;
    return suitName + "ের " + rankName;
  }

  const SEAT_ALIAS = {
    "seat.S": "seat.you",
    "seat.E": "seat.right",
    "seat.N": "seat.partner",
    "seat.W": "seat.left",
  };

  function parseCopy(text) {
    const pack = {};
    let id = "";
    let bnLine = "";
    let hasBn = false;
    function flush() {
      if (id && hasBn && bnLine) pack[id] = bnLine;
      id = "";
      bnLine = "";
      hasBn = false;
    }
    String(text || "")
      .split(/\r?\n/)
      .forEach((line) => {
        if (line.startsWith("#") || line.startsWith("note:")) return;
        if (line.startsWith("id:")) {
          flush();
          id = line.slice(3).trim();
          return;
        }
        if (line.startsWith("bn:")) {
          hasBn = true;
          bnLine = line.slice(3).trim();
        }
      });
    flush();
    Object.keys(SEAT_ALIAS).forEach((alias) => {
      const source = SEAT_ALIAS[alias];
      if (pack[source] && !pack[alias]) pack[alias] = pack[source];
    });
    return pack;
  }

  function loadCopy(url) {
    return fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("The Bengali copy file did not load.");
        return res.text();
      })
      .then((text) => {
        register("bn", parseCopy(text));
      });
  }

  const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

  function digits(value) {
    const text = String(value);
    if (lang !== "bn") return text;
    return text.replace(/[0-9]/g, (d) => BN_DIGITS[d]);
  }

  function t(key, fallback, vars) {
    const base = fallback == null ? key : fallback;
    const text = lang !== "bn" || !bn[key] ? base : bn[key].replace(/\{(\w+)\}/g, (_, name) => token(name, vars && vars[name]));
    if (lang === "bn" && key !== "app.name" && key !== "ribbon.noBid") return digits(text);
    return text;
  }

  function lookupCountry() {
    if (typeof fetch !== "function") return Promise.resolve("");
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = setTimeout(() => {
      if (ctrl) ctrl.abort();
    }, 2000);
    return fetch("https://get.geojs.io/v1/ip/country.json", ctrl ? { signal: ctrl.signal } : {})
      .then((res) => res.json())
      .then((data) => String((data && data.country) || "").toUpperCase())
      .catch(() => "")
      .finally(() => clearTimeout(timer));
  }

  function start() {
    let query = "";
    let stored = "";
    if (typeof location !== "undefined") query = new URLSearchParams(location.search).get("lang") || "";
    if (query === "en" || query === "bn") {
      setLang(query);
      return lookupCountry().then((code) => {
        country = code;
        return lang;
      });
    }
    try {
      stored = localStorage.getItem(STORE) || "";
    } catch (error) {}
    if (stored === "en" || stored === "bn") {
      setLang(stored);
      return lookupCountry().then((code) => {
        country = code;
        return lang;
      });
    }
    return lookupCountry().then((code) => applyCountry(code));
  }

  return {
    COUNTRY_LANG,
    register,
    getLang,
    country: countryCode,
    localeForCountry,
    setLang,
    choose,
    applyCountry,
    t,
    digits,
    parseCopy,
    loadCopy,
    start,
  };
});
