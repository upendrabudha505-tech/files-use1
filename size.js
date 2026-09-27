/* ==========================================================================
   size.js — Smart Size Finder + size guide
   Rule-based estimate (height, weight, fit, body type). Sizing always varies
   by brand, so we show that clearly and let people override it.
   ========================================================================== */
(function (CC) {
  "use strict";
  const { $, $$, esc, S } = CC;
  const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
  const DISCLAIMER = "Sizing varies by brand and fabric. Treat this as a starting point — check each product’s size guide, and size up if you’re between sizes or prefer a looser fit.";

  const CHART = {
    boys:  { label: "Boys / men", metric: "Chest", rows: [["XS", '34"', '28"', "150–160"], ["S", '36"', '30"', "160–168"], ["M", '38"', '32"', "168–174"], ["L", '40"', '34"', "174–180"], ["XL", '42"', '36"', "180–186"], ["XXL", '44"', '38"', "186+"]] },
    girls: { label: "Girls / women", metric: "Bust", rows: [["XS", '32"', '26"', "148–155"], ["S", '34"', '28"', "155–160"], ["M", '36"', '30"', "160–165"], ["L", '38"', '32"', "165–170"], ["XL", '40"', '34"', "170–175"], ["XXL", '42"', '36"', "175+"]] },
  };
  const SHOES = [["UK 3", "36", "22.0"], ["UK 4", "37", "22.8"], ["UK 5", "38", "23.7"], ["UK 6", "39", "24.5"], ["UK 7", "40", "25.4"], ["UK 8", "42", "26.2"], ["UK 9", "43", "27.1"], ["UK 10", "44", "27.9"]];

  function recommend(a) {
    const th = a.gender === "boys" ? [45, 55, 65, 75, 88] : [42, 50, 58, 68, 80];
    let base = th.findIndex((t) => a.weight < t); if (base < 0) base = 5;
    const tall = a.gender === "boys" ? 178 : 166, short = a.gender === "boys" ? 162 : 152;
    let adj = 0;
    if (a.height >= tall + 8) adj += 1; else if (a.height >= tall) adj += .5; else if (a.height < short - 6) adj -= 1; else if (a.height < short) adj -= .5;
    const bmi = a.weight / Math.pow(a.height / 100, 2);
    if (bmi > 27) adj += .5; else if (bmi < 18) adj -= .5;
    adj += { lean: -.25, average: 0, athletic: .5, broad: .75 }[a.body];
    adj += { slim: -.25, regular: 0, relaxed: .5, oversized: 1 }[a.fit];
    const raw = Math.max(0, Math.min(5, base + adj)), idx = Math.round(raw), frac = raw - Math.floor(raw);
    const between = frac >= .3 && frac <= .7 && raw > 0 && raw < 5;
    return { size: SIZES[idx], idx, between, other: between ? SIZES[Math.min(5, Math.floor(raw) + (idx === Math.floor(raw) ? 1 : 0))] : null, bmi };
  }

  const ST = { unit: "cm", gender: "girls", fit: "regular", body: "average" };
  function renderSize() {
    const saved = S.size, host = $("#sizeHost");
    if (saved && !host.dataset.init) { ST.gender = saved.gender; ST.fit = saved.fit; ST.body = saved.body; }
    host.dataset.init = "1";
    const cm = ST.hcm != null ? ST.hcm : (saved ? saved.height : ""), kg = ST.wkg != null ? ST.wkg : (saved ? saved.weight : "");
    host.innerHTML = `<div class="page-head"><div><p class="eyebrow">Smart size finder</p><h1>Find the size that actually fits.</h1><p class="lead">Tell us a little about yourself and we’ll suggest a size from XS to XXL.</p></div><button class="btn-secondary" type="button" data-act="sizeGuide" data-g="${ST.gender}"><i class="fa-solid fa-table" aria-hidden="true"></i> Size chart</button></div>
    <div class="size-layout">
      <form class="size-form" id="sizeForm" novalidate>
        <div class="fgroup"><span class="flabel">Gender</span><div class="seg" role="radiogroup" aria-label="Gender">${[["boys", "Boy"], ["girls", "Girl"]].map((g) => `<button type="button" role="radio" class="seg-btn ${ST.gender === g[0] ? "is-on " + g[0] : ""}" aria-checked="${ST.gender === g[0]}" data-act="sset" data-k="gender" data-v="${g[0]}">${g[1]}</button>`).join("")}</div></div>
        <div class="fgroup"><div class="flabel-row"><label class="flabel" for="sHeight">Height</label><div class="seg mini" role="radiogroup" aria-label="Height unit">${[["cm", "cm"], ["ftin", "ft / in"]].map((u) => `<button type="button" role="radio" class="seg-btn ${ST.unit === u[0] ? "is-on" : ""}" aria-checked="${ST.unit === u[0]}" data-act="sset" data-k="unit" data-v="${u[0]}">${u[1]}</button>`).join("")}</div></div>
          ${ST.unit === "cm" ? `<div class="input-unit"><input id="sHeight" type="number" inputmode="decimal" min="100" max="220" placeholder="e.g. 165" value="${cm}"><span>cm</span></div>` : `<div class="two-in"><div class="input-unit"><input id="sFt" type="number" inputmode="numeric" min="3" max="7" placeholder="5" value="${cm ? Math.floor(cm / 30.48) : ""}" aria-label="Feet"><span>ft</span></div><div class="input-unit"><input id="sIn" type="number" inputmode="decimal" min="0" max="11" placeholder="5" value="${cm ? Math.round((cm / 2.54) % 12) : ""}" aria-label="Inches"><span>in</span></div></div>`}
          <p class="field-error" id="errH" role="alert" hidden></p></div>
        <div class="fgroup"><label class="flabel" for="sWeight">Weight</label><div class="input-unit"><input id="sWeight" type="number" inputmode="decimal" min="25" max="160" placeholder="e.g. 58" value="${kg}"><span>kg</span></div><p class="field-error" id="errW" role="alert" hidden></p></div>
        <div class="fgroup"><span class="flabel">Preferred fit</span><div class="chip-row" role="radiogroup" aria-label="Preferred fit">${[["slim", "Slim"], ["regular", "Regular"], ["relaxed", "Relaxed"], ["oversized", "Oversized"]].map((o) => `<button type="button" role="radio" class="filter-pill sm ${ST.fit === o[0] ? "is-active" : ""}" aria-checked="${ST.fit === o[0]}" data-act="sset" data-k="fit" data-v="${o[0]}">${o[1]}</button>`).join("")}</div></div>
        <div class="fgroup"><span class="flabel">Body type</span><div class="chip-row" role="radiogroup" aria-label="Body type">${[["lean", "Lean"], ["average", "Average"], ["athletic", "Athletic"], ["broad", "Broad / heavier"]].map((o) => `<button type="button" role="radio" class="filter-pill sm ${ST.body === o[0] ? "is-active" : ""}" aria-checked="${ST.body === o[0]}" data-act="sset" data-k="body" data-v="${o[0]}">${o[1]}</button>`).join("")}</div></div>
        <button class="btn-primary btn-block" type="submit"><i class="fa-solid fa-ruler" aria-hidden="true"></i> Find my size</button>
      </form>
      <div class="size-result" id="sizeResult" aria-live="polite">${saved ? resultHTML(saved) : placeholder()}</div>
    </div>`;
    $("#sizeForm").addEventListener("submit", (e) => { e.preventDefault(); calc(); });
  }
  const placeholder = () => `<div class="size-empty"><i class="fa-solid fa-ruler-vertical big" aria-hidden="true"></i><p>Your recommended size will appear here.</p><p class="muted">${DISCLAIMER}</p></div>`;
  function resultHTML(r) {
    const chart = CHART[r.gender].rows.find((x) => x[0] === r.size), m = CHART[r.gender].metric;
    return `<div class="size-badge" aria-hidden="true">${r.size}</div>
      <h2>Recommended size: <b>${r.size}</b></h2>
      ${r.between && r.other ? `<p class="between"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> You’re between <b>${SIZES[Math.min(SIZES.indexOf(r.size), SIZES.indexOf(r.other))]}</b> and <b>${SIZES[Math.max(SIZES.indexOf(r.size), SIZES.indexOf(r.other))]}</b>. Pick the larger for comfort, the smaller for a snug fit.</p>` : `<p class="lead">Based on ${r.height} cm, ${r.weight} kg, ${esc(r.fit)} fit, ${esc(r.body)} build.</p>`}
      <dl class="size-dims"><div><dt>${m}</dt><dd>${chart[1]}</dd></div><div><dt>Waist</dt><dd>${chart[2]}</dd></div><div><dt>Typical height</dt><dd>${chart[3]} cm</dd></div></dl>
      <div class="result-actions"><a class="btn-primary" href="#/" data-act="shopSize"><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i> Shop in ${r.size}</a><button class="btn-secondary" type="button" data-act="sizeGuide" data-g="${r.gender}">View size chart</button></div>
      <p class="saved-note"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Saved — we’ll pre-select ${r.size} on tops and bottoms.</p>
      <p class="disclaimer"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> ${DISCLAIMER}</p>`;
  }
  function calc() {
    let h;
    if (ST.unit === "cm") h = parseFloat($("#sHeight").value);
    else { const ft = parseFloat($("#sFt").value), inch = parseFloat($("#sIn").value || "0"); h = isNaN(ft) ? NaN : (ft * 12 + (isNaN(inch) ? 0 : inch)) * 2.54; }
    const w = parseFloat($("#sWeight").value);
    const eH = $("#errH"), eW = $("#errW"); let bad = null;
    if (isNaN(h) || h < 100 || h > 220) { eH.textContent = "Enter a height between 100 and 220 cm (about 3'3\" to 7'2\")."; eH.hidden = false; bad = bad || (ST.unit === "cm" ? $("#sHeight") : $("#sFt")); } else eH.hidden = true;
    if (isNaN(w) || w < 25 || w > 160) { eW.textContent = "Enter a weight between 25 and 160 kg."; eW.hidden = false; bad = bad || $("#sWeight"); } else eW.hidden = true;
    if (bad) { bad.focus(); return; }
    const rec = recommend({ gender: ST.gender, height: h, weight: w, fit: ST.fit, body: ST.body });
    S.size = { size: rec.size, between: rec.between, other: rec.other, gender: ST.gender, height: Math.round(h), weight: Math.round(w * 10) / 10, fit: ST.fit, body: ST.body };
    CC.saveKey("size");
    $("#sizeResult").innerHTML = resultHTML(S.size);
    if (window.innerWidth < 900) $("#sizeResult").scrollIntoView({ behavior: "smooth", block: "start" });
    CC.toast(`Recommended size: ${rec.size}`, "fa-solid fa-ruler");
  }
  CC.router.register("size", { title: "Size Finder", nav: "more", enter: renderSize });
  CC.actions.sset = (d) => {
    // remember what was typed (converted to cm / kg) so toggling options or units never wipes the form
    let h = NaN;
    if ($("#sHeight")) h = parseFloat($("#sHeight").value);
    else if ($("#sFt")) { const ft = parseFloat($("#sFt").value), inch = parseFloat($("#sIn").value || "0"); if (!isNaN(ft)) h = (ft * 12 + (isNaN(inch) ? 0 : inch)) * 2.54; }
    ST.hcm = isNaN(h) ? null : Math.round(h); ST.wkg = $("#sWeight") ? $("#sWeight").value : null;
    ST[d.k] = d.v;
    renderSize();
    const b = $(`[data-k="${d.k}"][data-v="${d.v}"]`); if (b) b.focus();
  };
  CC.actions.shopSize = () => { CC.toast(`Showing everything — ${S.size ? S.size.size : ""} is pre-selected on tops & bottoms`, "fa-solid fa-ruler"); };

  /* ---------- size guide modal ---------- */
  CC.openSizeGuide = (gender) => {
    let g = gender === "girls" ? "girls" : "boys";
    const md = CC.modal.open(`<div class="dlg guide"><h2 class="dlg-title">Size guide</h2><div class="seg" role="tablist" aria-label="Chart"><button type="button" role="tab" class="seg-btn" data-g="boys">Boys / men</button><button type="button" role="tab" class="seg-btn" data-g="girls">Girls / women</button></div><div id="guideBody"></div><p class="disclaimer"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> ${DISCLAIMER}</p><div class="modal-actions"><a class="btn-secondary" href="#/size" data-act="goSize">Use the Size Finder</a></div></div>`, { size: "md", label: "Size guide" });
    const body = $("#guideBody", md.el);
    const paint = () => {
      $$(".seg-btn", md.el).forEach((b) => { const on = b.dataset.g === g; b.classList.toggle("is-on", on); if (on) b.classList.add(g); else b.classList.remove("boys", "girls"); b.setAttribute("aria-selected", on); });
      const c = CHART[g];
      body.innerHTML = `<div class="table-wrap"><table class="guide-table"><caption class="sr-only">${c.label} clothing sizes</caption><thead><tr><th scope="col">Size</th><th scope="col">${c.metric}</th><th scope="col">Waist</th><th scope="col">Height (cm)</th></tr></thead><tbody>${c.rows.map((r) => `<tr class="${S.size && S.size.size === r[0] && S.size.gender === g ? "is-you" : ""}"><th scope="row">${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join("")}</tbody></table></div>
        <h3 class="wish-h">Shoes</h3><div class="table-wrap"><table class="guide-table"><thead><tr><th scope="col">UK</th><th scope="col">EU</th><th scope="col">Foot length (cm)</th></tr></thead><tbody>${SHOES.map((r) => `<tr><th scope="row">${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</tbody></table></div>`;
    };
    md.el.addEventListener("click", (e) => { const b = e.target.closest("[data-g]"); if (b) { g = b.dataset.g; paint(); } });
    paint();
  };
})(window.CC = window.CC || {});
