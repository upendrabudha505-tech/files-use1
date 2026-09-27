/* ==========================================================================
   feed.js — Pinterest-style home feed, filters, sorting and smart search
   ========================================================================== */
(function (CC) {
  "use strict";
  const { $, $$, esc, money, S } = CC;
  const F = { gender: "all", occ: "all", sort: "trending", q: "", deals: false };
  const OCCASIONS = ["casual", "streetwear", "college", "party", "wedding", "winter", "traditional", "festival"];

  /* ---------- smart query parsing ---------- */
  const COLOR_NAMES = Object.keys(CC.data.COLORS);
  const TAG_WORDS = { college: "college", fresher: "college", party: "party", wedding: "wedding", casual: "casual", street: "streetwear", streetwear: "streetwear", winter: "winter", traditional: "traditional", festival: "festival", festive: "festival" };
  const FEST_WORDS = { dashain: "dashain", tihar: "tihar", teej: "teej", holi: "holi", baisakh: "newyear", newyear: "newyear" };
  const GENDER_WORDS = { boy: "boys", boys: "boys", men: "boys", mens: "boys", male: "boys", girl: "girls", girls: "girls", women: "girls", womens: "girls", female: "girls", ladies: "girls" };
  const STOP = ["outfit", "outfits", "look", "looks", "under", "below", "rs", "npr", "for", "and", "the", "a", "wear", "fashion", "clothes", "clothing", "with", "in", "of", "new", "year", "set"];
  const SYN = { "t-shirt": "tee", tshirt: "tee", tshirts: "tee", "t-shirts": "tee", shirts: "shirt", pants: "pant", trousers: "trouser", shoes: "shoe", sneakers: "sneaker", dresses: "dress", jackets: "jacket", hoodies: "hoodie", jeans: "jean", shorts: "short", sandals: "sandal", kurtis: "kurti", kurtas: "kurta", boots: "boot" };

  function parseQuery(raw) {
    let q = String(raw || "").toLowerCase().trim();
    const out = { price: null, gender: null, tags: [], fests: [], colors: [], words: [] };
    let m = q.match(/(?:under|below|less than|within|max|upto|up to|<)\s*(?:rs\.?|npr)?\s*([\d,]+)\s*(k)?/) || q.match(/(?:rs\.?|npr)\s*([\d,]+)\s*(k)?/);
    if (m) { out.price = parseInt(m[1].replace(/,/g, ""), 10) * (m[2] ? 1000 : 1); q = q.replace(m[0], " "); }
    q.replace(/[^a-z0-9\-\s]/g, " ").split(/\s+/).filter(Boolean).forEach((w) => {
      if (GENDER_WORDS[w]) out.gender = GENDER_WORDS[w];
      else if (TAG_WORDS[w]) out.tags.push(TAG_WORDS[w]);
      else if (FEST_WORDS[w]) out.fests.push(FEST_WORDS[w]);
      else if (COLOR_NAMES.indexOf(w) >= 0) out.colors.push(w);
      else if (STOP.indexOf(w) < 0 && !/^\d+$/.test(w)) out.words.push(SYN[w] || w.replace(/s$/, ""));
    });
    return out;
  }
  const hayCache = {};
  function hayOf(look) {
    const info = CC.lookInfo(look), key = look.id + info.total;
    if (hayCache[key]) return hayCache[key];
    return (hayCache[key] = [look.title, look.gender, look.tags.join(" "), look.fest.join(" "), info.items.map((i) => i.p.name + " " + i.p.cat + " " + i.p.brand + " " + i.color).join(" ")].join(" ").toLowerCase());
  }
  function matches(look, pq) {
    const info = CC.lookInfo(look);
    if (pq.gender && look.gender !== pq.gender) return false;
    if (pq.price && info.total > pq.price) return false;
    if (pq.tags.length && !pq.tags.every((t) => look.tags.indexOf(t) >= 0)) return false;
    if (pq.fests.length && !pq.fests.every((f) => look.fest.indexOf(f) >= 0)) return false;
    if (pq.colors.length && !pq.colors.every((c) => info.colors.indexOf(c) >= 0)) return false;
    const hay = hayOf(look);
    return pq.words.every((w) => hay.indexOf(w) >= 0);
  }
  CC.searchLooks = (q) => { const pq = parseQuery(q); return CC.looks().filter((l) => matches(l, pq)); };

  /* ---------- feed rendering ---------- */
  function visibleLooks() {
    const pq = parseQuery(F.q);
    let list = CC.looks().filter((l) => {
      if (F.gender !== "all" && l.gender !== F.gender) return false;
      if (F.occ !== "all" && l.tags.indexOf(F.occ) < 0) return false;
      if (F.deals && CC.lookInfo(l).discount < 20) return false;
      return matches(l, pq);
    });
    const sorters = {
      trending: (a, b) => (b.custom ? 1 : 0) - (a.custom ? 1 : 0) || (b.likes + b.saves * 2) - (a.likes + a.saves * 2),
      "price-asc": (a, b) => CC.lookInfo(a).total - CC.lookInfo(b).total,
      "price-desc": (a, b) => CC.lookInfo(b).total - CC.lookInfo(a).total,
      discount: (a, b) => CC.lookInfo(b).discount - CC.lookInfo(a).discount,
    };
    return list.sort(sorters[F.deals && F.sort === "trending" ? "discount" : F.sort]);
  }
  function render() {
    const list = visibleLooks(), g = $("#gallery");
    $("#filterCount").textContent = `${list.length} look${list.length === 1 ? "" : "s"}`;
    if (!list.length) {
      const tips = CC.data.SEARCH_SUGGESTIONS.slice(0, 4).map((s) => `<button class="filter-pill" type="button" data-act="suggest" data-q="${esc(s)}">${esc(s)}</button>`).join("");
      g.innerHTML = `<div class="empty-state wide"><i class="fa-solid fa-magnifying-glass big" aria-hidden="true"></i><p>No looks match${F.q ? ` “${esc(F.q)}”` : ""} yet.</p><p class="muted">Try a broader search, or clear the filters.</p><div class="chip-row center">${tips}</div><button class="btn-secondary" type="button" data-act="clearFilters">Clear filters</button></div>`;
      return;
    }
    g.innerHTML = CC.pins.gridHTML(list);
  }
  function syncUI() {
    $$("#filterBar [data-act=gender]").forEach((b) => { const on = b.dataset.v === F.gender; b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", on); });
    $$("#filterBar [data-act=occ]").forEach((b) => { const on = b.dataset.v === F.occ; b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", on); });
    $("#sortSelect").value = F.sort;
    $("#homeIntro").hidden = F.deals || !!F.q;
    $("#dealsHead").hidden = !F.deals;
    const qh = $("#queryHead"); qh.hidden = !F.q || F.deals;
    if (F.q) { const pq = parseQuery(F.q); const bits = []; if (pq.price) bits.push("under " + money(pq.price)); if (pq.gender) bits.push(pq.gender); $("#queryHeadText").innerHTML = `Results for <b>“${esc(F.q)}”</b>` + (bits.length ? ` <span class="muted">· understood as ${esc(bits.join(", "))}</span>` : ""); }
  }
  function refresh() { syncUI(); render(); }

  CC.router.register("home", { title: "", nav: "home", enter() { F.deals = false; $("#tilesHome").innerHTML = CC.tilesHTML(); refresh(); } });
  CC.router.register("deals", { el: "home", title: "Deals", nav: "deals", enter() { F.deals = true; F.q = ""; $("#searchInput").value = ""; $("#tilesHome").innerHTML = ""; refresh(); } });
  CC.on("catalog", () => { if (["home", "deals"].indexOf(CC.router.current()) >= 0) refresh(); });

  CC.actions.gender = (d) => { F.gender = d.v; refresh(); };
  CC.actions.occ = (d) => { F.occ = F.occ === d.v ? "all" : d.v; refresh(); };
  CC.actions.clearFilters = () => { F.gender = "all"; F.occ = "all"; F.q = ""; $("#searchInput").value = ""; refresh(); };
  CC.actions.clearQuery = () => { F.q = ""; $("#searchInput").value = ""; closeSuggest(); refresh(); };
  CC.actions.suggest = (d) => { runSearch(d.q); };
  CC.setFeedFilter = (o) => { Object.assign(F, o); };
  $("#sortSelect").addEventListener("change", (e) => { F.sort = e.target.value; render(); });

  /* ---------- search box + suggestions ---------- */
  const input = $("#searchInput"), box = $("#suggest");
  let active = -1, timer = null, items = [];
  function suggestions(q) {
    const t = q.trim().toLowerCase();
    if (!t) return CC.data.SEARCH_SUGGESTIONS.slice(0, 7).map((s) => ({ label: s, q: s, icon: "fa-fire" }));
    const out = [], seen = {};
    const push = (label, qq, icon) => { if (!seen[qq]) { seen[qq] = 1; out.push({ label, q: qq, icon }); } };
    CC.data.SEARCH_SUGGESTIONS.filter((s) => s.toLowerCase().indexOf(t) >= 0).forEach((s) => push(s, s, "fa-magnifying-glass"));
    CC.looks().filter((l) => l.title.toLowerCase().indexOf(t) >= 0).slice(0, 3).forEach((l) => push(l.title, l.title, "fa-shirt"));
    CC.products().filter((p) => p.name.toLowerCase().indexOf(t) >= 0).slice(0, 4).forEach((p) => push(p.name, p.name, "fa-tag"));
    if (!out.length) push(`Search for “${q.trim()}”`, q.trim(), "fa-magnifying-glass");
    return out.slice(0, 7);
  }
  function openSuggest() {
    items = suggestions(input.value); active = -1;
    box.innerHTML = items.map((s, i) => `<li role="option" id="sg${i}" data-i="${i}" aria-selected="false"><i class="fa-solid ${s.icon}" aria-hidden="true"></i><span>${esc(s.label)}</span></li>`).join("");
    box.hidden = false; input.setAttribute("aria-expanded", "true");
  }
  function closeSuggest() { box.hidden = true; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); active = -1; }
  function move(d) {
    if (box.hidden) openSuggest();
    active = (active + d + items.length) % items.length;
    $$("li", box).forEach((li, i) => { li.classList.toggle("is-active", i === active); li.setAttribute("aria-selected", i === active); });
    input.setAttribute("aria-activedescendant", "sg" + active);
  }
  function runSearch(q) {
    F.q = q.trim(); input.value = q; F.occ = "all"; F.gender = $("#searchCat").value; closeSuggest();
    if (CC.router.current() === "home") refresh(); else CC.router.go("");
    if (F.q) window.scrollTo({ top: 0, behavior: "smooth" });
  }
  input.addEventListener("focus", openSuggest);
  input.addEventListener("input", () => { openSuggest(); clearTimeout(timer); timer = setTimeout(() => { F.q = input.value.trim(); if (CC.router.current() === "home") refresh(); }, 220); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Escape") { if (!box.hidden) { closeSuggest(); e.stopPropagation(); } }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); runSearch(items[active].q); }
  });
  box.addEventListener("mousedown", (e) => { const li = e.target.closest("li"); if (li) { e.preventDefault(); runSearch(items[+li.dataset.i].q); } });
  $("#searchForm").addEventListener("submit", (e) => { e.preventDefault(); runSearch(input.value); });
  document.addEventListener("click", (e) => { if (!e.target.closest("#searchForm")) closeSuggest(); });
  CC.closeSuggest = closeSuggest;
})(window.CC = window.CC || {});
