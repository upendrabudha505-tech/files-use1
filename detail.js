/* ==========================================================================
   detail.js — "Shop This Look" (hotspots), product page, wishlist
   ========================================================================== */
(function (CC) {
  "use strict";
  const { $, $$, esc, money, compact, S } = CC;
  const NEUTRAL = ["black", "white", "grey", "beige", "cream", "denim", "navy", "khaki"];
  const slotLabel = { top: "Top", bottom: "Bottom", shoes: "Shoes", accessory: "Accessory" };
  const catLabel = (p) => (p.full ? "Complete set" : slotLabel[p.type]);

  /* ---------- "Style with this": matching products ---------- */
  function affinity(base, cand) {
    let s = 0;
    base.occ.forEach((o) => { if (cand.occ.indexOf(o) >= 0) s += 2; });
    base.style.forEach((o) => { if (cand.style.indexOf(o) >= 0) s += 2; });
    if (base.season.indexOf("all") >= 0 || cand.season.indexOf("all") >= 0 || base.season.some((x) => cand.season.indexOf(x) >= 0)) s += 1;
    if (NEUTRAL.indexOf(cand.colors[0]) >= 0 || cand.colors.some((c) => base.colors.indexOf(c) >= 0)) s += 1;
    return s + cand.rating / 10;
  }
  CC.styleWith = (p, n) => {
    const pool = CC.products().filter((c) => c.id !== p.id && (c.gender === p.gender || c.gender === "unisex" || p.gender === "unisex") && !(p.gender !== "unisex" && c.gender !== "unisex" && c.gender !== p.gender));
    const wanted = p.full ? ["shoes", "accessory", "accessory", "shoes"] : p.type === "top" ? ["bottom", "shoes", "accessory", "bottom"] : p.type === "bottom" ? ["top", "shoes", "accessory", "top"] : p.type === "shoes" ? ["top", "bottom", "accessory", "top"] : ["top", "bottom", "shoes", "top"];
    const out = [];
    wanted.forEach((slot) => {
      const best = pool.filter((c) => (slot === "top" ? c.type === "top" && (!p.full || false) : c.type === slot) && out.indexOf(c) < 0 && !(slot === "bottom" && c.full))
        .sort((a, b) => affinity(p, b) - affinity(p, a))[0];
      if (best) out.push(best);
    });
    return out.slice(0, n || 4);
  };

  /* ==========================================================================
     SHOP THIS LOOK
     ========================================================================== */
  CC.openLook = function (id) {
    const look = CC.getLook(id); if (!look) return;
    const info = CC.lookInfo(look), img = CC.lookImage(look), cr = CC.getCreator(look.creator);
    const g = look.gender === "girls" ? "girls" : "boys";
    const md = CC.modal.open(`<div class="look-modal">
      <div class="look-stage-wrap"><div class="look-stage" style="--ratio:${img.ratio}">
        <img src="${esc(img.uri)}" alt="${esc(look.title)} outfit" width="400" height="${Math.round(400 * img.ratio)}">
        ${info.items.map((it) => { const s = img.spots[it.p.id] || { x: 50, y: 50 }; return `<button type="button" class="hotspot" style="left:${s.x.toFixed(1)}%;top:${s.y.toFixed(1)}%" data-hot="${it.p.id}" aria-label="${esc(it.p.name)}, ${money(it.p.price)}"><span class="hs-dot"></span><span class="hs-tip">${esc(it.p.name)} — ${money(it.p.price)}</span></button>`; }).join("")}
        <span class="tag ${g}">${g === "girls" ? "Girls" : "Boys"}</span>
      </div></div>
      <div class="look-side">
        <p class="eyebrow">${look.tags.map(CC.cap).join(" · ")}</p>
        <h2 class="look-title">${esc(look.title)}</h2>
        <div class="creator-row"><img class="mini-avatar lg" src="${CC.art.avatar(cr.name)}" alt="" width="34" height="34"><div><a href="#" data-act="creator" data-id="${cr.id}" class="creator-link">${esc(cr.name)}</a><small>@${esc(cr.handle)}${cr.city ? " · " + esc(cr.city) : ""}</small></div>${cr.id !== "you" ? CC.followBtn(cr.id) : ""}</div>
        <p class="hint"><i class="fa-solid fa-hand-pointer" aria-hidden="true"></i> Tap the glowing dots on the picture to see each piece.</p>
        <ul class="look-items" id="lookItems">${info.items.map((it) => `
          <li class="look-item" data-pid="${it.p.id}">
            <label class="chk"><input type="checkbox" checked aria-label="Include ${esc(it.p.name)}"><span></span></label>
            <img src="${CC.productImage(it.p, it.color)}" alt="" width="56" height="56">
            <div class="li-body"><button type="button" class="li-name" data-act="product" data-id="${it.p.id}" data-color="${it.color}">${esc(it.p.name)}</button>
              <small>${slotLabel[it.p.type] && !it.p.full ? slotLabel[it.p.type] : "Complete set"} · ${esc(CC.cap(it.color))}</small>
              ${it.p.sizes.length > 1 ? `<select class="li-size" aria-label="Size for ${esc(it.p.name)}">${it.p.sizes.map((s) => `<option ${s === CC.userSizeFor(it.p) ? "selected" : ""}>${esc(s)}</option>`).join("")}</select>` : `<small class="muted">Free size</small>`}</div>
            <div class="li-price"><b>${money(it.p.price)}</b>${it.p.mrp > it.p.price ? `<s>${money(it.p.mrp)}</s>` : ""}</div>
          </li>`).join("")}</ul>
        <div class="look-total"><div><span>Complete look</span><b id="lookTotal"></b></div><small id="lookSave"></small></div>
        <button class="btn-primary btn-block btn-add-look" type="button" id="addLookBtn"><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i> <span></span></button>
        <div class="look-actions">
          <button class="btn-secondary btn-small" type="button" data-act="like" data-id="${look.id}" aria-pressed="${CC.pins.isLiked(look.id)}"><i class="fa-${CC.pins.isLiked(look.id) ? "solid" : "regular"} fa-heart" aria-hidden="true"></i> Like</button>
          <button class="btn-secondary btn-small" type="button" data-act="save" data-id="${look.id}"><i class="fa-regular fa-bookmark" aria-hidden="true"></i> Save</button>
          <button class="btn-secondary btn-small" type="button" data-act="share" data-kind="look" data-id="${look.id}"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i> Share</button>
          <button class="btn-secondary btn-small" type="button" data-act="createReel" data-kind="look" data-id="${look.id}"><i class="fa-solid fa-clapperboard" aria-hidden="true"></i> Create Reel</button>
          <button class="btn-secondary btn-small" type="button" data-act="customize" data-id="${look.id}"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Customise</button>
        </div>
      </div></div>`, { size: "xl", flush: true, label: look.title });
    const root = md.el, items = $("#lookItems", root);
    const chosen = () => $$(".look-item", items).filter((li) => $("input", li).checked);
    const paint = () => {
      const ch = chosen(), total = ch.reduce((s, li) => s + CC.getProduct(li.dataset.pid).price, 0), mrp = ch.reduce((s, li) => s + CC.getProduct(li.dataset.pid).mrp, 0);
      $("#lookTotal", root).textContent = money(total);
      $("#lookSave", root).textContent = mrp > total ? `You save ${money(mrp - total)} (${CC.discountPct(total, mrp)}% off)` : "";
      const btn = $("#addLookBtn", root); btn.disabled = !ch.length;
      $("span", btn).textContent = ch.length ? `ADD COMPLETE LOOK TO CART · ${money(total)}` : "SELECT AT LEAST ONE ITEM";
    };
    const setHot = (pid, scroll) => {
      $$(".hotspot", root).forEach((h) => h.classList.toggle("is-active", h.dataset.hot === pid));
      $$(".look-item", items).forEach((li) => li.classList.toggle("is-hot", li.dataset.pid === pid));
      if (scroll) { const li = $(`.look-item[data-pid="${pid}"]`, items); if (li) li.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
    };
    root.addEventListener("click", (e) => { const h = e.target.closest("[data-hot]"); if (h) setHot(h.dataset.hot, true); });
    items.addEventListener("click", (e) => { const li = e.target.closest(".look-item"); if (li && !e.target.closest("button, select, label")) setHot(li.dataset.pid); });
    items.addEventListener("change", paint);
    $("#addLookBtn", root).addEventListener("click", () => {
      const sizes = {}, refs = chosen().map((li) => { const it = info.items.find((x) => x.p.id === li.dataset.pid); const sel = $(".li-size", li); if (sel) sizes[it.p.id] = sel.value; return it; });
      CC.cart.addLook(refs, { sizes, label: refs.length === info.items.length ? "Complete look" : "Selected items" });
    });
    paint();
  };
  CC.actions.customize = (d) => { const l = CC.getLook(d.id); CC.modal.closeAll(); CC.router.go("builder/" + l.gender + "/" + l.items.join(",")); };
  CC.actions.hotspot = () => {};

  /* ==========================================================================
     PRODUCT PAGE
     ========================================================================== */
  const NAMES = ["Sunita K.", "Rohan T.", "Anjali S.", "Bishal G.", "Kritika M.", "Sandesh R.", "Pratima L.", "Aakash D.", "Manisha P.", "Suraj B."];
  const REV = {
    5: ["Fabric quality is great for the price, and it reached {city} quicker than I expected.", "True to size and the colour matches the photos. Very happy!", "Bought it for a festival and got so many compliments.", "Stitching is neat and it survived the first wash perfectly."],
    4: ["Good overall, just slightly longer than I expected.", "Nice product. Delivery took a day more than the estimate.", "Colour is a little lighter in real life but still lovely."],
    3: ["Okay for the price — the fabric could be a bit thicker."],
  };
  const WHEN = ["2 days ago", "5 days ago", "1 week ago", "2 weeks ago", "3 weeks ago", "1 month ago"];
  function sampleReviews(p) {
    const h = CC.art.hashStr(p.id), r = CC.art.rnd(h), out = [];
    for (let i = 0; i < 4; i++) {
      const stars = r() < Math.max(.2, (p.rating - 3.6) / 1.4) ? 5 : r() < .75 ? 4 : 3, pool = REV[stars];
      out.push({ name: NAMES[Math.floor(r() * NAMES.length)], stars, text: pool[Math.floor(r() * pool.length)].replace("{city}", "Kathmandu"), when: WHEN[Math.floor(r() * WHEN.length)], size: p.sizes[Math.floor(r() * p.sizes.length)] });
    }
    return out;
  }
  function distribution(p) {
    const r = p.rating, w5 = Math.min(.8, .35 + (r - 4) * .5), w4 = Math.max(.1, .28 - (r - 4) * .2), w3 = .07, w2 = .03, w1 = Math.max(.01, 1 - w5 - w4 - w3 - w2);
    const sum = w5 + w4 + w3 + w2 + w1; return [w5, w4, w3, w2, w1].map((w) => Math.round((w / sum) * 100));
  }
  const SAMPLE_QA = [
    { q: "Does it run true to size?", a: "Yes, most buyers say it fits true to size. Check the size guide or use our Size Finder if you are between sizes." },
    { q: "Do you deliver outside Kathmandu?", a: "Yes — we deliver across Nepal. Use the delivery estimator above to see the expected time and fee for your location." },
    { q: "Is Cash on Delivery available?", a: "Cash on Delivery is available for most locations, along with eSewa, Khalti, bank payment and QR." },
  ];

  CC.openProduct = function (id, o) {
    const p = CC.getProduct(id); if (!p) return;
    o = o || {};
    const st = { color: o.color && p.colors.indexOf(o.color) >= 0 ? o.color : p.colors[0], size: o.size && p.sizes.indexOf(o.size) >= 0 ? o.size : CC.userSizeFor(p), slide: 0 };
    const disc = CC.discountPct(p.price, p.mrp), seller = CC.data.SELLERS[p.seller];
    const guideGender = p.gender === "unisex" ? "boys" : p.gender;
    const md = CC.modal.open(`<div class="pdp">
      <div class="pdp-gallery"><div class="pdp-main" id="pdpMain"><img alt="" id="pdpImg"></div><div class="pdp-thumbs" id="pdpThumbs" role="tablist" aria-label="Product images"></div></div>
      <div class="pdp-info">
        <p class="eyebrow">${esc(catLabel(p))} · ${esc(CC.cap(p.gender))}${p.isNew ? ' · <span class="new-pill">New</span>' : ""}</p>
        <h2 class="pdp-title">${esc(p.name)}</h2>
        <div class="pdp-rating">${p.reviews ? `${CC.starHTML(p.rating)} <b>${p.rating.toFixed(1)}</b> <a href="#" data-act="pdpTab" data-tab="reviews">${p.reviews} reviews</a>` : `<span class="muted">New listing — no reviews yet</span>`}</div>
        <div class="pdp-price"><b>${money(p.price)}</b>${disc ? `<s>${money(p.mrp)}</s><span class="disc">${disc}% off</span>` : ""}<small>Inclusive of all taxes</small></div>
        <div class="opt" ${p.colors.length < 2 ? "hidden" : ""}><span class="opt-label">Colour: <b id="colName"></b></span><div class="swatches" role="radiogroup" aria-label="Colour">${p.colors.map((c) => `<button type="button" role="radio" class="swatch" data-color="${c}" aria-label="${esc(CC.cap(c))}" title="${esc(CC.cap(c))}" style="--sw:${CC.art.hexOf(c)}"></button>`).join("")}</div></div>
        <div class="opt" ${p.sizes.length < 2 ? "hidden" : ""}><span class="opt-label">Size: <b id="sizeName"></b>${S.size && p.type !== "shoes" && p.type !== "accessory" ? `<span class="your-size"><i class="fa-solid fa-ruler" aria-hidden="true"></i> Your size: ${esc(S.size.size)}</span>` : ""}
          <span class="opt-links"><button type="button" class="link-btn" data-act="sizeGuide" data-g="${guideGender}">Size guide</button>${p.type === "top" || p.type === "bottom" ? ` · <a href="#/size" class="link-btn" data-act="goSize">Find my size</a>` : ""}</span></span>
          <div class="size-chips" role="radiogroup" aria-label="Size">${p.sizes.map((s) => `<button type="button" role="radio" class="size-chip" data-size="${esc(s)}">${esc(s)}</button>`).join("")}</div></div>
        <div id="pdpDlv" class="dlv-host"></div>
        <div class="pdp-cta">
          <button class="btn-primary" type="button" id="pdpAdd"><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i> Add to cart</button>
          <button class="btn-buy" type="button" id="pdpBuy"><i class="fa-solid fa-bolt" aria-hidden="true"></i> Buy now</button>
          <button class="icon-btn round-outline" type="button" data-act="like" data-id="${p.id}" aria-pressed="${CC.pins.isLiked(p.id)}" aria-label="Wishlist"><i class="fa-${CC.pins.isLiked(p.id) ? "solid" : "regular"} fa-heart" aria-hidden="true"></i></button>
          <button class="icon-btn round-outline" type="button" data-act="share" data-kind="product" data-id="${p.id}" aria-label="Share product"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i></button>
          <button class="icon-btn round-outline" type="button" data-act="createReel" data-kind="product" data-id="${p.id}" aria-label="Create Reel from this product" title="Create Reel"><i class="fa-solid fa-clapperboard" aria-hidden="true"></i></button>
        </div>
        <ul class="pay-badges" aria-label="Payment options">${CC.data.PAYMENTS.map((m) => `<li>${esc(m.label.replace("Cash on Delivery", "COD").replace(" Payment", ""))}</li>`).join("")}</ul>
        <button type="button" class="seller-card" data-act="goto" data-to="store/${esc(p.seller && CC.data.SELLERS[p.seller] ? p.seller : "you")}"><div class="seller-avatar"><img src="${CC.art.avatar(seller ? seller.name : "You")}" alt="" width="44" height="44"></div><div><b>${esc(seller ? seller.name : p.brand)}</b> ${seller ? '<span class="verified"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Verified seller</span>' : ""}<small>${esc(p.city)}${seller ? ` · ★ ${seller.rating} · ${seller.sales} sales · since ${seller.since}` : ""}</small>${seller ? `<small>Usually replies ${esc(seller.reply)}</small>` : ""}</div><i class="fa-solid fa-chevron-right seller-chevron" aria-hidden="true"></i></button>
      </div>
      <div class="pdp-below">
        <div class="tabs" role="tablist"><button role="tab" class="tab is-active" data-tab="style" aria-selected="true">Style with this</button><button role="tab" class="tab" data-tab="reviews" aria-selected="false">Reviews${p.reviews ? ` (${p.reviews})` : ""}</button><button role="tab" class="tab" data-tab="qa" aria-selected="false">Questions &amp; answers</button></div>
        <div class="tab-panel" id="tabPanel"></div>
      </div></div>`, { size: "xl", flush: true, label: p.name });
    const root = md.el;

    /* gallery */
    const slides = () => {
      if (p.photo) return [{ label: "Photo", src: p.photo }];
      const hex = CC.art.hexOf(st.color), look = CC.looks().find((l) => !l.custom && l.items.some((r) => r.split(":")[0] === p.id));
      const items = look ? look.items.map(CC.resolve).map((it) => (it.p.id === p.id ? { p: it.p, hex } : it)) : [{ p, hex }];
      const fig = CC.art.figure(items, { gender: look ? look.gender : (p.gender === "girls" ? "girls" : "boys"), bg: look ? look.bg : "sand", skin: look ? look.skin : 1, h: 560, ghost: !look });
      const out = [{ label: "Worn", src: fig.uri }, { label: "Product", src: CC.art.thumb(p, st.color) }, { label: "Detail", src: CC.art.thumb(p, st.color), zoom: true }];
      p.colors.filter((c) => c !== st.color).slice(0, 2).forEach((c) => out.push({ label: CC.cap(c), src: CC.art.thumb(p, c), color: c }));
      return out;
    };
    const paintGallery = () => {
      const sl = slides(); st.slide = Math.min(st.slide, sl.length - 1);
      const cur = sl[st.slide];
      $("#pdpImg", root).src = cur.src; $("#pdpImg", root).alt = `${p.name} — ${cur.label}`;
      $("#pdpMain", root).classList.toggle("is-zoom", !!cur.zoom);
      $("#pdpThumbs", root).innerHTML = sl.length < 2 ? "" : sl.map((s, i) => `<button type="button" role="tab" class="pdp-thumb ${i === st.slide ? "is-active" : ""}" data-slide="${i}" aria-selected="${i === st.slide}" aria-label="View ${esc(s.label)}"><img src="${s.src}" alt="" width="60" height="60"></button>`).join("");
    };
    const paintOptions = () => {
      $("#colName", root).textContent = CC.cap(st.color);
      $$(".swatch", root).forEach((b) => { const on = b.dataset.color === st.color; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", on); });
      $("#sizeName", root).textContent = st.size;
      $$(".size-chip", root).forEach((b) => { const on = b.dataset.size === st.size; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", on); });
    };
    root.addEventListener("click", (e) => {
      const sw = e.target.closest(".swatch"); if (sw) { st.color = sw.dataset.color; paintOptions(); paintGallery(); return; }
      const sc = e.target.closest(".size-chip"); if (sc) { st.size = sc.dataset.size; paintOptions(); return; }
      const th = e.target.closest("[data-slide]"); if (th) { st.slide = +th.dataset.slide; const sl = slides(); if (sl[st.slide].color) { st.color = sl[st.slide].color; paintOptions(); } paintGallery(); }
    });
    $("#pdpAdd", root).addEventListener("click", () => CC.cart.add(p.id, { size: st.size, color: st.color }));
    $("#pdpBuy", root).addEventListener("click", () => CC.cart.buyNow(p.id, { size: st.size, color: st.color }));
    CC.delivery.mount($("#pdpDlv", root), () => p.price);

    /* tabs */
    const panel = $("#tabPanel", root);
    const paintTab = (tab) => {
      $$(".tab", root).forEach((t) => { const on = t.dataset.tab === tab; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", on); });
      if (tab === "style") paintStyle(); else if (tab === "reviews") paintReviews(); else paintQA();
    };
    root.addEventListener("click", (e) => { const t = e.target.closest("[data-tab]"); if (t && t.classList.contains("tab")) paintTab(t.dataset.tab); });
    CC.actions.pdpTab = (d) => { paintTab(d.tab); panel.scrollIntoView({ behavior: "smooth", block: "start" }); };

    function paintStyle() {
      const rec = CC.styleWith(p, 4), total = rec.reduce((s, r) => s + r.price, 0) + p.price;
      panel.innerHTML = rec.length ? `<div class="style-head"><div><h3>Style with this</h3><p class="muted">Matching pieces picked to go with the ${esc(p.name)}.</p></div><button class="btn-primary" type="button" id="styleAll"><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i> Add this + ${rec.length} matches · ${money(total)}</button></div>
        <div class="style-grid">${rec.map((r) => `<div class="style-card"><button type="button" class="style-thumb" data-act="product" data-id="${r.id}" aria-label="View ${esc(r.name)}"><img src="${CC.productImage(r)}" alt="" loading="lazy" width="160" height="160"></button><b>${esc(r.name)}</b><span>${money(r.price)}</span><button type="button" class="btn-secondary btn-small" data-act="addToCart" data-id="${r.id}">Add</button></div>`).join("")}</div>` : `<p class="muted">No matches yet.</p>`;
      const all = $("#styleAll", panel);
      if (all) all.addEventListener("click", () => CC.cart.addLook([{ p, color: st.color, hex: CC.art.hexOf(st.color) }].concat(rec.map((r) => ({ p: r, color: r.colors[0], hex: CC.art.hexOf(r.colors[0]) }))), { sizes: { [p.id]: st.size }, label: "This look" }));
    }
    function paintReviews() {
      const mine = S.reviews[p.id] || [], all = mine.concat(sampleReviews(p)), dist = distribution(p);
      panel.innerHTML = `<div class="rev-top"><div class="rev-score"><b>${p.reviews ? p.rating.toFixed(1) : "–"}</b>${p.reviews ? CC.starHTML(p.rating) : ""}<small>${p.reviews + mine.length} ratings</small></div>
        <div class="rev-bars">${dist.map((v, i) => `<div><span>${5 - i}★</span><div class="bar"><i style="width:${v}%"></i></div><span>${v}%</span></div>`).join("")}</div>
        <form class="rev-form" id="revForm" novalidate><h3>Write a review</h3><div class="star-input" role="radiogroup" aria-label="Your rating">${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" aria-checked="false" data-star="${n}" aria-label="${n} star${n > 1 ? "s" : ""}"><i class="fa-regular fa-star" aria-hidden="true"></i></button>`).join("")}</div><label class="sr-only" for="revText">Your review</label><textarea id="revText" rows="2" maxlength="300" placeholder="How was the fit and quality?"></textarea><p class="field-error" id="revErr" role="alert" hidden></p><button class="btn-secondary btn-small" type="submit">Post review</button></form></div>
        <ul class="rev-list">${all.map((r) => `<li><div class="rev-head"><b>${esc(r.name)}</b>${CC.starHTML(r.stars)}<small>${esc(r.when)}${r.size ? " · Size " + esc(r.size) : ""}</small></div><p>${esc(r.text)}</p></li>`).join("")}</ul>`;
      let stars = 0; const sIn = $(".star-input", panel);
      sIn.addEventListener("click", (e) => { const b = e.target.closest("[data-star]"); if (!b) return; stars = +b.dataset.star; $$("button", sIn).forEach((x) => { const on = +x.dataset.star <= stars; x.setAttribute("aria-checked", +x.dataset.star === stars); $("i", x).className = (on ? "fa-solid" : "fa-regular") + " fa-star"; }); });
      $("#revForm", panel).addEventListener("submit", (e) => {
        e.preventDefault(); const t = $("#revText", panel).value.trim(), er = $("#revErr", panel);
        if (!stars || t.length < 5) { er.textContent = !stars ? "Please pick a star rating." : "Please write at least a few words."; er.hidden = false; return; }
        (S.reviews[p.id] = S.reviews[p.id] || []).unshift({ name: (S.user && S.user.name) || "You", stars, text: t, when: "just now", size: st.size }); CC.saveKey("reviews");
        CC.toast("Thanks — your review is posted", "fa-solid fa-star"); paintReviews();
      });
    }
    function paintQA() {
      const mine = S.qa[p.id] || [];
      panel.innerHTML = `<form class="qa-form" id="qaForm" novalidate><label class="sr-only" for="qaText">Ask a question</label><input id="qaText" type="text" maxlength="140" placeholder="Ask the seller a question…" autocomplete="off"><button class="btn-secondary btn-small" type="submit">Ask</button></form><p class="field-error" id="qaErr" role="alert" hidden>Please type your question first.</p>
        <ul class="qa-list">${mine.map((q) => `<li><p class="q"><b>Q:</b> ${esc(q.q)}</p><p class="a muted"><b>A:</b> Waiting for the seller to reply — you’ll get a notification.</p></li>`).join("")}${SAMPLE_QA.map((q) => `<li><p class="q"><b>Q:</b> ${esc(q.q)}</p><p class="a"><b>A:</b> ${esc(q.a)}</p></li>`).join("")}</ul>`;
      $("#qaForm", panel).addEventListener("submit", (e) => {
        e.preventDefault(); const inp = $("#qaText", panel), v = inp.value.trim();
        if (!v) { $("#qaErr", panel).hidden = false; inp.focus(); return; }
        (S.qa[p.id] = S.qa[p.id] || []).unshift({ q: v }); CC.saveKey("qa"); CC.toast("Question sent to the seller", "fa-solid fa-comment-dots"); paintQA();
      });
    }
    paintOptions(); paintGallery(); paintTab("style");
  };
  CC.actions.goSize = () => { CC.modal.closeAll(); CC.router.go("size"); return false; };
  CC.actions.creator = (d) => { if (CC.openCreator) CC.openCreator(d.id); };

  /* ==========================================================================
     WISHLIST (header heart)
     ========================================================================== */
  CC.openWishlist = function () {
    const looks = S.likes.map(CC.getLook).filter(Boolean), prods = S.likes.map(CC.getProduct).filter(Boolean);
    const md = CC.modal.open(`<div class="dlg wish"><h2 class="dlg-title">Your wishlist</h2>${looks.length + prods.length === 0 ? `<div class="empty-state small"><i class="fa-regular fa-heart big" aria-hidden="true"></i><p>Nothing liked yet.</p><p class="muted">Tap the heart on any look or product to keep it here.</p></div>` : ""}
      ${looks.length ? `<h3 class="wish-h">Looks</h3><ul class="wish-list">${looks.map((l) => `<li><img src="${esc(CC.lookImage(l).uri)}" alt="" width="52" height="64"><div><b>${esc(l.title)}</b><small>${money(CC.lookInfo(l).total)} · ${CC.lookInfo(l).items.length} pieces</small></div><button class="btn-secondary btn-small" type="button" data-act="look" data-id="${l.id}">Shop</button><button class="icon-btn" type="button" data-act="like" data-id="${l.id}" aria-label="Remove ${esc(l.title)} from wishlist"><i class="fa-solid fa-heart" aria-hidden="true"></i></button></li>`).join("")}</ul>` : ""}
      ${prods.length ? `<h3 class="wish-h">Products</h3><ul class="wish-list">${prods.map((p) => `<li><img src="${CC.productImage(p)}" alt="" width="52" height="52"><div><b>${esc(p.name)}</b><small>${money(p.price)}</small></div><button class="btn-secondary btn-small" type="button" data-act="addToCart" data-id="${p.id}">Add to cart</button><button class="icon-btn" type="button" data-act="like" data-id="${p.id}" aria-label="Remove ${esc(p.name)} from wishlist"><i class="fa-solid fa-heart" aria-hidden="true"></i></button></li>`).join("")}</ul>` : ""}</div>`, { size: "md", label: "Wishlist" });
    // liking again inside the list removes the row; close-and-reopen is confusing, so just refresh contents
    md.el.addEventListener("click", (e) => { const b = e.target.closest('[data-act="like"]'); if (b) setTimeout(() => { md.close(); CC.openWishlist(); }, 0); });
  };
  CC.on("change:likes", () => { const n = S.likes.length, b = $("#likeBadge"); if (b) { b.textContent = n; b.hidden = n === 0; } });

  CC.actions.sizeGuide = (d) => CC.openSizeGuide(d.g);
})(window.CC = window.CC || {});
