/* ==========================================================================
   builder.js — AI-style Outfit Builder + Budget Outfit Finder
   One scoring engine (CC.outfit.rank) powers both. It's rule-based: it scores
   every product against your preferences and searches combinations that fit
   the budget. No server needed.
   ========================================================================== */
(function (CC) {
  "use strict";
  const { $, $$, esc, money, S } = CC;
  const SLOTS = ["top", "bottom", "shoes", "accessory"];
  const SLOT_LABEL = { top: "Top", bottom: "Bottom", shoes: "Shoes", accessory: "Accessory" };

  /* ---------- engine ---------- */
  const pool = (slot, gender) => CC.products().filter((p) => p.type === slot && (p.gender === gender || p.gender === "unisex"));
  function itemScore(p, pr) {
    let s = (p.rating - 4) * 2;
    if (pr.occasion !== "any") s += p.occ.indexOf(pr.occasion) >= 0 ? 4 : -1;
    if (pr.season !== "any") s += p.season.indexOf("all") >= 0 || p.season.indexOf(pr.season) >= 0 ? 2 : -3;
    if (pr.style !== "any") s += p.style.indexOf(pr.style) >= 0 ? 3 : 0;
    if (pr.color !== "any" && p.colors.indexOf(pr.color) >= 0) s += 3;
    return s;
  }
  const colorFor = (p, pr) => (pr.color !== "any" && p.colors.indexOf(pr.color) >= 0 ? pr.color : p.colors[0]);
  const asItem = (p, pr) => { const c = colorFor(p, pr); return { p, color: c, hex: CC.art.hexOf(c) }; };
  function narrow(arr, pr) {
    const byScore = arr.slice().sort((a, b) => itemScore(b, pr) - itemScore(a, pr)).slice(0, 6);
    const cheap = arr.slice().sort((a, b) => a.price - b.price).slice(0, 3);
    return byScore.concat(cheap.filter((c) => byScore.indexOf(c) < 0));
  }
  // two pieces can only be worn together if their seasons overlap ("all" fits anything) — no wool beanie with sandals
  const seasonsClash = (p, q) => p.season.indexOf("all") < 0 && q.season.indexOf("all") < 0 && !p.season.some((x) => q.season.indexOf(x) >= 0);
  function coherence(ps) {
    let s = 0;
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) if (seasonsClash(ps[i], ps[j])) s -= 8;
    ["style", "occ"].forEach((k) => { const cnt = {}; ps.forEach((p) => p[k].forEach((t) => { cnt[t] = (cnt[t] || 0) + 1; })); Object.keys(cnt).forEach((t) => { if (cnt[t] > 1) s += (cnt[t] - 1) * 1.2; }); });
    return s;
  }
  /* returns outfits (best first). level = how complete: 4 (all slots) → 3 (no accessory) → 2 (no shoes) */
  function rank(pr) {
    const tops = narrow(pool("top", pr.gender), pr), bots = narrow(pool("bottom", pr.gender), pr).filter((b) => !b.full);
    const shoes = narrow(pool("shoes", pr.gender), pr), accs = narrow(pool("accessory", pr.gender), pr);
    const results = { 4: [], 3: [], 2: [] };
    const push = (t, b, sh, ac) => {
      const parts = [t, b, sh, ac].filter(Boolean), total = parts.reduce((s, p) => s + p.price, 0);
      if (pr.budget && total > pr.budget) return;
      const level = sh ? (ac ? 4 : 3) : 2;
      const score = parts.reduce((s, p) => s + itemScore(p, pr) + 3, 0) + (t.full ? 3 : 0) + coherence(parts) + (pr.budget ? (total / pr.budget) * 2 : 0);
      results[level].push({ top: t, bottom: b, shoes: sh, accessory: ac, total, score });
    };
    tops.forEach((t) => {
      (t.full ? [null] : bots).forEach((b) => {
        shoes.concat([null]).forEach((sh) => accs.concat([null]).forEach((ac) => { if (!sh && ac) return; push(t, b, sh, ac); }));
      });
    });
    const best = results[4].length + results[3].length ? results[4].concat(results[3]) : results[2];   // accessory is optional; only fall back to "no shoes" if nothing else fits
    best.sort((a, b) => b.score - a.score || a.total - b.total);
    const picked = [];
    for (let i = 0; i < best.length && picked.length < 8; i++) {
      const c = best[i], ids = [c.top, c.bottom, c.shoes, c.accessory].filter(Boolean).map((p) => p.id);
      if (picked.every((q) => [q.top, q.bottom, q.shoes, q.accessory].filter(Boolean).filter((p) => ids.indexOf(p.id) >= 0).length <= 2)) picked.push(c);
    }
    return picked.map((c) => ({ pr, total: c.total, score: c.score, items: [c.top, c.bottom, c.shoes, c.accessory].filter(Boolean).map((p) => asItem(p, pr)) }));
  }
  const cheapestStart = (gender) => Math.min.apply(null, pool("top", gender).map((p) => p.price)) + Math.min.apply(null, pool("bottom", gender).filter((b) => !b.full).map((p) => p.price));
  CC.outfit = { rank, pool, itemScore, asItem, cheapestStart };
  const slotItem = (items, slot) => items.find((i) => (slot === "top" ? i.p.type === "top" : i.p.type === slot));

  /* ==========================================================================
     OUTFIT BUILDER VIEW
     ========================================================================== */
  const OCC = [["any", "Any"], ["casual", "Casual"], ["college", "College"], ["party", "Party"], ["wedding", "Wedding"], ["festival", "Festival"]];
  const SEASON = [["any", "Any"], ["spring", "Spring"], ["summer", "Summer"], ["monsoon", "Monsoon"], ["autumn", "Autumn"], ["winter", "Winter"]];
  const STYLE = [["any", "Any"], ["casual", "Casual"], ["streetwear", "Streetwear"], ["traditional", "Traditional"], ["formal", "Formal"], ["sporty", "Sporty"], ["minimal", "Minimal"]];
  const COLORS = ["any", "black", "white", "navy", "blue", "red", "pink", "green", "beige", "olive", "maroon"];
  const B = { gender: "boys", occasion: "college", season: "any", style: "casual", budget: 2500, color: "any", list: [], idx: 0, items: [], manual: false, altSlot: null };
  const prefs = () => ({ gender: B.gender, occasion: B.occasion, season: B.season, style: B.style, color: B.color, budget: B.budget });
  const chips = (name, opts, cur) => `<div class="chip-row" role="radiogroup" aria-label="${name}">${opts.map((o) => `<button type="button" role="radio" class="filter-pill sm ${cur === o[0] ? "is-active" : ""}" aria-checked="${cur === o[0]}" data-act="bset" data-k="${name}" data-v="${o[0]}">${o[1]}</button>`).join("")}</div>`;

  function summary() {
    const lab = (arr, v) => (arr.find((o) => o[0] === v) || [])[1];
    const bits = [B.gender === "boys" ? "Boy" : "Girl"];
    if (B.occasion !== "any") bits.push(lab(OCC, B.occasion));
    if (B.season !== "any") bits.push(lab(SEASON, B.season));
    if (B.style !== "any") bits.push(lab(STYLE, B.style));
    bits.push("Under " + money(B.budget));
    if (B.color !== "any") bits.push(CC.cap(B.color));
    return bits.join(" + ");
  }
  function renderForm() {
    $("#bForm").innerHTML = `
      <div class="fgroup"><span class="flabel">I'm styling a</span><div class="seg" role="radiogroup" aria-label="Gender">${[["boys", "Boy"], ["girls", "Girl"]].map((g) => `<button type="button" role="radio" class="seg-btn ${B.gender === g[0] ? "is-on " + g[0] : ""}" aria-checked="${B.gender === g[0]}" data-act="bset" data-k="gender" data-v="${g[0]}">${g[1]}</button>`).join("")}</div></div>
      <div class="fgroup"><span class="flabel">Occasion</span>${chips("occasion", OCC, B.occasion)}</div>
      <div class="fgroup"><span class="flabel">Season</span>${chips("season", SEASON, B.season)}</div>
      <div class="fgroup"><span class="flabel">Style</span>${chips("style", STYLE, B.style)}</div>
      <div class="fgroup"><label class="flabel" for="bBudget">Budget <output id="bBudgetOut">${money(B.budget)}</output></label>
        <input id="bBudget" type="range" min="500" max="10000" step="100" value="${B.budget}" aria-valuetext="${money(B.budget)}">
        <div class="chip-row">${[1000, 2500, 5000, 10000].map((v) => `<button type="button" class="filter-pill sm ${B.budget === v ? "is-active" : ""}" data-act="bbudget" data-v="${v}">${money(v)}</button>`).join("")}</div></div>
      <div class="fgroup"><span class="flabel">Colour preference</span><div class="color-row" role="radiogroup" aria-label="Colour preference">${COLORS.map((c) => c === "any" ? `<button type="button" role="radio" class="swatch any ${B.color === "any" ? "is-on" : ""}" aria-checked="${B.color === "any"}" data-act="bset" data-k="color" data-v="any" aria-label="Any colour" title="Any colour">Any</button>` : `<button type="button" role="radio" class="swatch ${B.color === c ? "is-on" : ""}" aria-checked="${B.color === c}" data-act="bset" data-k="color" data-v="${c}" aria-label="${CC.cap(c)}" title="${CC.cap(c)}" style="--sw:${CC.art.hexOf(c)}"></button>`).join("")}</div></div>
      <p class="recipe" id="bRecipe"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> ${esc(summary())}</p>
      <div class="form-actions"><button class="btn-primary" type="button" data-act="bbuild"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Build my outfit</button><button class="btn-secondary" type="button" data-act="bshuffle"><i class="fa-solid fa-shuffle" aria-hidden="true"></i> Try another</button></div>
      <button class="builder-jump" type="button" data-act="bjump"><span id="bJumpText"></span><i class="fa-solid fa-arrow-down" aria-hidden="true"></i></button>`;
    const r = $("#bBudget");
    r.addEventListener("input", () => { B.budget = +r.value; $("#bBudgetOut").textContent = money(B.budget); r.setAttribute("aria-valuetext", money(B.budget)); $("#bRecipe").lastChild.textContent = " " + summary(); generate(false); });
  }
  function generate(keepIdx) {
    B.list = rank(prefs()); if (!keepIdx) B.idx = 0;
    B.items = B.list.length ? B.list[B.idx % B.list.length].items : [];
    B.manual = false; B.altSlot = null;
    renderResult();
  }
  const total = () => B.items.reduce((s, i) => s + i.p.price, 0);
  function figureFor(items) { return CC.art.figure(items, { gender: B.gender, bg: B.gender === "boys" ? "blue" : "pink", skin: B.gender === "boys" ? 1 : 0, h: 640 }); }

  function altsFor(slot) {
    const cur = slotItem(B.items, slot), pr = prefs();
    const hasFull = cur && cur.p.full;
    const cand = pool(slot, B.gender).filter((p) => (!cur || p.id !== cur.p.id) && (slot !== "top" || !B.items.length || !slotItem(B.items, "bottom") || !p.full) && (slot !== "top" || !hasFull || p.full))
      .sort((a, b) => itemScore(b, pr) - itemScore(a, pr)).slice(0, 8);
    return { cur, cand };
  }
  function renderResult() {
    const host = $("#bResult"), t = total(), gap = B.budget - t;
    const jump = $("#bJumpText"); if (jump) jump.textContent = B.items.length ? `Complete Look: ${money(t)} — see outfit` : "No outfit for this budget — see why";
    if (!B.items.length) {
      host.innerHTML = `<div class="empty-state"><i class="fa-solid fa-face-frown big" aria-hidden="true"></i><p>We couldn’t build a full outfit under ${money(B.budget)}.</p><p class="muted">The lowest we can do for a top and bottom is about ${money(cheapestStart(B.gender))}. Try raising the budget.</p><button class="btn-primary" type="button" data-act="bbudget" data-v="${Math.ceil(cheapestStart(B.gender) / 500) * 500}">Set budget to ${money(Math.ceil(cheapestStart(B.gender) / 500) * 500)}</button></div>`;
      return;
    }
    const fig = figureFor(B.items), missing = SLOTS.filter((s) => s !== "accessory" && !(s === "bottom" && slotItem(B.items, "top") && slotItem(B.items, "top").p.full) && !slotItem(B.items, s));
    const complete = missing.length === 0;      // accessories are a bonus, not required
    host.innerHTML = `
      <div class="result-fig"><img src="${fig.uri}" alt="Your outfit: ${esc(B.items.map((i) => i.p.name).join(", "))}" width="400" height="640"></div>
      <div class="result-info">
        <p class="eyebrow">${B.manual ? "Your custom look" : `Look ${B.list.length ? (B.idx % B.list.length) + 1 : 1} of ${Math.max(B.list.length, 1)}`}</p>
        <h2 class="result-total">Complete Look: <b>${money(t)}</b></h2>
        <p class="budget-note ${gap < 0 ? "over" : ""}">${gap >= 0 ? `<i class="fa-solid fa-circle-check" aria-hidden="true"></i> ${money(gap)} under your ${money(B.budget)} budget` : `<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> ${money(-gap)} over your ${money(B.budget)} budget`}</p>
        ${complete ? "" : `<p class="budget-note info"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> Not enough budget for ${missing.map((m) => SLOT_LABEL[m].toLowerCase()).join(" & ")} — raise it a little for a complete look.</p>`}
        <ul class="slot-list">${SLOTS.map((slot) => {
          const it = slotItem(B.items, slot), isFullBottom = slot === "bottom" && slotItem(B.items, "top") && slotItem(B.items, "top").p.full;
          if (isFullBottom) return `<li class="slot-row is-empty"><span class="slot-name">Bottom</span><span class="slot-none">Included in the set</span></li>`;
          if (!it) return `<li class="slot-row is-empty"><span class="slot-name">${SLOT_LABEL[slot]}</span><span class="slot-none">Not included</span><button type="button" class="btn-secondary btn-small" data-act="balt" data-slot="${slot}" aria-expanded="${B.altSlot === slot}">Add</button>${B.altSlot === slot ? altPanel(slot) : ""}</li>`;
          return `<li class="slot-row ${B.altSlot === slot ? "is-open" : ""}"><span class="slot-name">${it.p.full ? "Top + Bottom" : SLOT_LABEL[slot]}</span><img src="${CC.productImage(it.p, it.color)}" alt="" width="52" height="52"><div class="slot-body"><button type="button" class="li-name" data-act="product" data-id="${it.p.id}" data-color="${it.color}">${esc(it.p.name)}</button><small>${esc(CC.cap(it.color))}</small></div><b class="slot-price">${money(it.p.price)}</b><button type="button" class="btn-secondary btn-small" data-act="balt" data-slot="${slot}" aria-expanded="${B.altSlot === slot}"><i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i> Replace</button>${B.altSlot === slot ? altPanel(slot) : ""}</li>`;
        }).join("")}</ul>
        <div class="result-actions"><button class="btn-primary" type="button" data-act="baddall"><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i> Add all to cart</button><button class="btn-secondary" type="button" data-act="bsave"><i class="fa-regular fa-bookmark" aria-hidden="true"></i> Save outfit</button><button class="btn-secondary" type="button" data-act="bshare"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i> Share outfit</button></div>
      </div>`;
  }
  function altPanel(slot) {
    const a = altsFor(slot), pr = prefs(), curPrice = a.cur ? a.cur.p.price : 0, base = total() - curPrice;
    return `<div class="alts" role="group" aria-label="Alternatives for ${SLOT_LABEL[slot]}">${a.cand.map((p) => { const nt = base + p.price, over = nt > B.budget, d = p.price - curPrice; const c = colorFor(p, pr);
      return `<button type="button" class="alt" data-act="bpick" data-slot="${slot}" data-id="${p.id}"><img src="${CC.productImage(p, c)}" alt="" width="56" height="56"><span class="alt-name">${esc(p.name)}</span><span class="alt-price">${money(p.price)}</span><span class="alt-d ${over ? "over" : d <= 0 ? "less" : ""}">${over ? "Over budget" : a.cur ? (d === 0 ? "Same price" : (d > 0 ? "+" : "−") + money(Math.abs(d))) : "Add"}</span></button>`; }).join("") || '<p class="muted">No alternatives.</p>'}</div>`;
  }
  function renderSaved() {
    const host = $("#savedOutfits");
    host.innerHTML = S.outfits.length ? `<h2>Your saved outfits</h2><ul class="saved-grid">${S.outfits.map((o) => { const items = o.items.map(CC.resolve).filter(Boolean), fig = CC.art.figure(items, { gender: o.gender, bg: o.gender === "boys" ? "blue" : "pink", h: 560 });
      return `<li class="saved-card"><img src="${fig.uri}" alt="" loading="lazy" width="400" height="560"><div class="sc-info"><b>${esc(o.name)}</b><small>${money(items.reduce((s, i) => s + i.p.price, 0))} · ${items.length} pieces</small><div class="sc-actions"><button class="btn-secondary btn-small" type="button" data-act="bload" data-id="${o.id}">Open</button><button class="btn-secondary btn-small" type="button" data-act="bcartsaved" data-id="${o.id}" aria-label="Add ${esc(o.name)} to cart"><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i></button><button class="icon-btn" type="button" data-act="bdelsaved" data-id="${o.id}" aria-label="Delete ${esc(o.name)}"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button></div></div></li>`; }).join("")}</ul>` : "";
  }
  const refs = () => B.items.map((i) => i.p.id + ":" + i.color);

  CC.router.register("builder", {
    title: "Outfit Builder", nav: "builder",
    enter(arg) {
      if (arg) {                                   // shared link / "Customise" from a look:  #/builder/girls/gt3,gb2:pink,gs3
        const parts = arg.split("/"), items = (parts[1] || "").split(",").map(CC.resolve).filter(Boolean);
        if ((parts[0] === "boys" || parts[0] === "girls") && items.length) { B.gender = parts[0]; B.items = items; B.manual = true; B.list = []; B.altSlot = null; B.budget = Math.min(10000, Math.max(500, Math.ceil(total() / 500) * 500)); }
      }
      renderForm();
      if (B.manual) renderResult(); else generate(false);
      renderSaved();
    },
  });
  CC.actions.bset = (d) => { B[d.k] = d.v; if (d.k === "gender") B.color = B.color; renderForm(); generate(false); };
  CC.actions.bbudget = (d) => { B.budget = +d.v; renderForm(); generate(false); };
  CC.actions.bjump = () => $("#bResult").scrollIntoView({ behavior: "smooth", block: "start" });
  CC.actions.bbuild = () => { generate(false); if (window.innerWidth < 900) $("#bResult").scrollIntoView({ behavior: "smooth", block: "start" }); };
  CC.actions.bshuffle = () => { if (B.list.length < 2) { CC.toast("That’s the best match we have for these choices", "fa-solid fa-circle-info"); return; } B.idx++; generate(true); };
  CC.actions.balt = (d) => { B.altSlot = B.altSlot === d.slot ? null : d.slot; renderResult(); };
  CC.actions.bpick = (d) => {
    const p = CC.getProduct(d.id), it = CC.outfit.asItem(p, prefs());
    B.items = B.items.filter((x) => !(x.p.type === p.type)).concat([it]);
    if (p.type === "top" && p.full) B.items = B.items.filter((x) => x.p.type !== "bottom");
    B.items.sort((a, b) => SLOTS.indexOf(a.p.type) - SLOTS.indexOf(b.p.type));
    B.manual = true; B.altSlot = null; renderResult();
    CC.toast(`${p.name} added to your look`, "fa-solid fa-shirt");
  };
  CC.actions.baddall = () => CC.cart.addLook(B.items, { label: "Outfit" });
  CC.actions.bsave = () => {
    if (!B.items.length) return;
    const n = S.outfits.length + 1;
    S.outfits.unshift({ id: CC.uid("of"), name: "Outfit #" + n, gender: B.gender, items: refs() }); CC.saveKey("outfits");
    renderSaved(); CC.toast("Outfit saved — find it below", "fa-solid fa-bookmark");
    CC.notify("Outfit saved", `Outfit #${n} · ${money(total())}`, "#/builder");
  };
  CC.actions.bshare = () => {
    const url = location.href.split("#")[0] + "#/builder/" + B.gender + "/" + refs().join(",");
    CC.share({ title: "My Chhota Closet outfit", text: `Complete Look: ${money(total())} — ${B.items.map((i) => i.p.name).join(", ")}`, url });
  };
  CC.actions.bload = (d) => { const o = S.outfits.find((x) => x.id === d.id); CC.router.go("builder/" + o.gender + "/" + o.items.join(",")); };
  CC.actions.bcartsaved = (d) => { const o = S.outfits.find((x) => x.id === d.id); CC.cart.addLook(o.items.map(CC.resolve).filter(Boolean), { label: o.name }); };
  CC.actions.bdelsaved = async (d) => { const o = S.outfits.find((x) => x.id === d.id); if (await CC.confirmDialog({ title: `Delete “${o.name}”?`, text: "This removes the saved outfit.", ok: "Delete", danger: true })) { S.outfits = S.outfits.filter((x) => x.id !== d.id); CC.saveKey("outfits"); renderSaved(); } };

  /* ==========================================================================
     BUDGET OUTFIT FINDER
     ========================================================================== */
  const BUDGETS = [999, 1999, 2999, 4999, 9999];
  const BF = { budget: 1999, gender: "boys" };
  const VIBES = [
    { label: "Everyday casual", pr: { occasion: "casual", style: "casual" } },
    { label: "Street style", pr: { occasion: "any", style: "streetwear" } },
    { label: "Party ready", pr: { occasion: "party", style: "any" } },
    { label: "Festive & traditional", pr: { occasion: "festival", style: "traditional" } },
  ];
  function budgetResults() {
    const used = [], out = [];
    VIBES.forEach((v) => {
      const list = rank(Object.assign({ gender: BF.gender, season: "any", color: "any", budget: BF.budget }, v.pr));
      const pick = list.find((o) => used.indexOf(o.items.map((i) => i.p.id).join()) < 0);
      if (pick) { used.push(pick.items.map((i) => i.p.id).join()); out.push({ vibe: v.label, outfit: pick }); }
    });
    return out;
  }
  function renderBudget() {
    const host = $("#budgetHost"), res = budgetResults();
    host.innerHTML = `<div class="page-head"><div><p class="eyebrow">Budget outfit finder</p><h1>Pick a budget. Get complete outfits.</h1><p class="lead">Every combination below is priced in NPR and stays within your limit.</p></div></div>
      <div class="budget-controls"><div class="seg" role="radiogroup" aria-label="Gender">${[["boys", "Boys"], ["girls", "Girls"]].map((g) => `<button type="button" role="radio" class="seg-btn ${BF.gender === g[0] ? "is-on " + g[0] : ""}" aria-checked="${BF.gender === g[0]}" data-act="bfset" data-k="gender" data-v="${g[0]}">${g[1]}</button>`).join("")}</div>
        <div class="chip-row" role="radiogroup" aria-label="Budget">${BUDGETS.map((b) => `<button type="button" role="radio" class="filter-pill ${BF.budget === b ? "is-active" : ""}" aria-checked="${BF.budget === b}" data-act="bfset" data-k="budget" data-v="${b}">Under ${money(b)}</button>`).join("")}</div></div>
      ${res.length ? `<div class="budget-grid">${res.map((r, i) => { const fig = CC.art.figure(r.outfit.items, { gender: BF.gender, bg: ["sand", "mint", "lilac", "peach"][i % 4], skin: i % 4, h: 600 }), complete = r.outfit.items.some((i) => i.p.type === "shoes");
        return `<article class="budget-card"><div class="bc-fig"><img src="${fig.uri}" alt="${esc(r.vibe)} outfit" loading="lazy" width="400" height="600"><span class="bc-vibe">${esc(r.vibe)}</span></div><div class="bc-body"><h3>${money(r.outfit.total)}</h3><p class="muted small">${complete ? "Complete look · " + r.outfit.items.length + " pieces" : r.outfit.items.length + " pieces — add shoes with a slightly bigger budget"} · ${money(BF.budget - r.outfit.total)} to spare</p><ul class="bc-items">${r.outfit.items.map((it) => `<li><button type="button" class="li-name" data-act="product" data-id="${it.p.id}" data-color="${it.color}">${esc(it.p.name)}</button><span>${money(it.p.price)}</span></li>`).join("")}</ul><div class="bc-actions"><button class="btn-primary btn-small" type="button" data-act="bfadd" data-i="${i}"><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i> Add all</button><button class="btn-secondary btn-small" type="button" data-act="bfopen" data-i="${i}">Customise</button></div></div></article>`; }).join("")}</div>` : `<div class="empty-state"><i class="fa-solid fa-face-frown big" aria-hidden="true"></i><p>Nothing fits under ${money(BF.budget)} yet.</p></div>`}
      <p class="muted small center">Outfits are chosen from real catalogue prices. Delivery is charged separately at checkout.</p>`;
    host._res = res;
  }
  CC.router.register("budget", { title: "Budget Outfit Finder", nav: "more", enter: renderBudget });
  CC.actions.bfset = (d) => { BF[d.k] = d.k === "budget" ? +d.v : d.v; renderBudget(); };
  CC.actions.bfadd = (d) => { const r = $("#budgetHost")._res[+d.i]; CC.cart.addLook(r.outfit.items, { label: r.vibe + " outfit" }); };
  CC.actions.bfopen = (d) => { const r = $("#budgetHost")._res[+d.i]; CC.router.go("builder/" + BF.gender + "/" + r.outfit.items.map((i) => i.p.id + ":" + i.color).join(",")); };
  CC.on("change:cart", () => {});
})(window.CC = window.CC || {});
