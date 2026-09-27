/* ==========================================================================
   store.js — Store page (#/store/:id) and the seller-facing Share Analytics
   dashboard: Story shares, Reel shares, Product shares, Reel views, Story
   views, Clicks, Product visits, and Orders generated from Reels/Stories.
   ========================================================================== */
(function (CC) {
  "use strict";
  const { $, $$, esc, money, compact, S } = CC;
  const D = CC.data;

  function storeProducts(id) { return CC.products().filter((p) => (id === "you" ? p.seller === "you" || !D.SELLERS[p.seller] : p.seller === id)); }

  /* ---------- analytics: every event tagged with this seller's id ---------- */
  function analyticsFor(id) {
    const ev = S.events.filter((e) => (e.sellers || []).indexOf(id) >= 0);
    const count = (type, ch) => ev.filter((e) => e.type === type && (!ch || ch.indexOf(e.ch) >= 0)).length;
    const visits = ev.filter((e) => e.type === "visit" && e.kind === "product").length;
    const orders = S.orders.filter((o) => (o.lines || []).some((l) => { const p = CC.getProduct(l.pid); return p && CC.sellersOf([p])[0] === id; }));
    const attribOrders = orders.filter((o) => o.attribCh === "reel" || o.attribCh === "story");
    const revenue = attribOrders.reduce((s, o) => s + o.lines.reduce((ss, l) => { const p = CC.getProduct(l.pid); return CC.sellersOf([p])[0] === id ? ss + l.price * l.qty : ss; }, 0), 0);
    return {
      storyShares: count("share", ["story"]), reelShares: count("share", ["reel"]), productShares: count("share", ["link", "social", "message"]),
      reelViews: count("view", ["reel"]), storyViews: count("view", ["story"]), clicks: count("click"), productVisits: visits,
      ordersFromContent: attribOrders.length, revenueFromContent: revenue, totalOrders: orders.length,
    };
  }
  CC.analyticsFor = analyticsFor;

  function statTile(icon, label, val) { return `<div class="an-tile"><i class="fa-solid ${icon}" aria-hidden="true"></i><b>${compact(val)}</b><span>${esc(label)}</span></div>`; }
  function analyticsHTML(id) {
    const a = analyticsFor(id);
    return `<section class="analytics-panel"><div class="an-head"><h3><i class="fa-solid fa-chart-line" aria-hidden="true"></i> Share analytics</h3><p class="muted">How your Stories, Reels and product shares are performing.</p></div>
      <div class="an-grid">
        ${statTile("fa-camera-retro", "Story shares", a.storyShares)}
        ${statTile("fa-clapperboard", "Reel shares", a.reelShares)}
        ${statTile("fa-share-nodes", "Product shares", a.productShares)}
        ${statTile("fa-eye", "Reel views", a.reelViews)}
        ${statTile("fa-eye", "Story views", a.storyViews)}
        ${statTile("fa-arrow-pointer", "Clicks", a.clicks)}
        ${statTile("fa-store", "Product visits", a.productVisits)}
        ${statTile("fa-bag-shopping", "Orders from Reels/Stories", a.ordersFromContent)}
      </div>
      <p class="an-rev"><i class="fa-solid fa-sack-dollar" aria-hidden="true"></i> ${money(a.revenueFromContent)} in orders traced back to a Reel or Story share${a.totalOrders ? ` · ${a.totalOrders} order${a.totalOrders === 1 ? "" : "s"} total` : ""}.</p>
      <p class="muted small">Demo metrics: counted from Share, View and Click activity in this browser, plus orders whose last tap came from a Reel or Story.</p></section>`;
  }

  /* ---------- store page ---------- */
  function renderStore(id) {
    const host = $("#storeHost"); if (!D.SELLERS[id] && id !== "you") id = "you";
    const s = CC.seller(id), ps = storeProducts(id), mine = id === "you";
    const isFollowing = S.storeFollows.indexOf(id) >= 0;
    host.innerHTML = `<div class="store-page">
      <header class="store-head"><img src="${CC.art.avatar(s.name)}" alt="" width="88" height="88"><div class="store-who"><h1>${esc(s.name)} ${s.verified ? '<span class="verified"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Verified</span>' : ""}</h1><p class="muted">${esc(s.city)}, ${esc(s.country)}${s.rating ? ` · ★ ${s.rating} · ${s.sales} sales` : ""}${s.since ? ` · since ${s.since}` : ""}</p></div>
        <div class="store-actions">${mine ? "" : `<button type="button" class="btn-follow ${isFollowing ? "is-on" : ""}" data-act="followStore" data-id="${esc(id)}" aria-pressed="${isFollowing}">${isFollowing ? '<i class="fa-solid fa-check" aria-hidden="true"></i> Following' : '<i class="fa-solid fa-user-plus" aria-hidden="true"></i> Follow Store'}</button>`}
          <button type="button" class="icon-btn round-outline" data-act="share" data-kind="store" data-id="${esc(id)}" aria-label="Share ${esc(s.name)}"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i></button></div></header>
      <ul class="store-stats"><li><b>${ps.length}</b><span>Products</span></li><li><b>${compact(s.followers + (isFollowing ? 1 : 0))}</b><span>Followers</span></li><li><b>${s.rating || "—"}</b><span>Rating</span></li></ul>
      <div class="tabs" role="tablist"><button class="tab is-active" role="tab" aria-selected="true" data-sttab="products">Products</button><button class="tab" role="tab" aria-selected="false" data-sttab="analytics"><i class="fa-solid fa-chart-line" aria-hidden="true"></i> Analytics</button></div>
      <div id="storePanel"></div></div>`;
    const panel = $("#storePanel", host);
    const paint = (t) => {
      $$(".tab", host).forEach((b) => { const on = b.dataset.sttab === t; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on); });
      if (t === "analytics") { panel.innerHTML = analyticsHTML(id); return; }
      panel.innerHTML = ps.length ? `<div class="product-grid">${ps.map((p) => `<article class="pgrid-card"><button type="button" class="pgrid-open" data-act="product" data-id="${p.id}"><img src="${esc(CC.art.thumb(p, p.colors[0]))}" alt="${esc(p.name)}"><b>${esc(p.name)}</b><span>${money(p.price)}${p.mrp > p.price ? `<s>${money(p.mrp)}</s>` : ""}</span></button><div class="pgrid-actions"><button type="button" class="icon-btn" data-act="share" data-kind="product" data-id="${p.id}" aria-label="Share"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i></button><button type="button" class="icon-btn" data-act="createReel" data-kind="product" data-id="${p.id}" aria-label="Create Reel"><i class="fa-solid fa-clapperboard" aria-hidden="true"></i></button></div></article>`).join("")}</div>`
        : `<div class="empty-state small"><p>No products listed yet.</p></div>`;
    };
    host.addEventListener("click", (e) => { const t = e.target.closest("[data-sttab]"); if (t) paint(t.dataset.sttab); }, { once: false });
    paint("products");
  }
  CC.router.register("store", { title: "Store", nav: "store", enter: renderStore });
  CC.actions.followStore = (d) => {
    const i = S.storeFollows.indexOf(d.id);
    if (i >= 0) S.storeFollows.splice(i, 1); else S.storeFollows.push(d.id);
    CC.saveKey("storeFollows");
    if (CC.router.current() === "store") renderStore(d.id);
  };

  /* ---------- track a product-page visit for analytics ---------- */
  const _openProduct = CC.openProduct;
  CC.openProduct = function (id, o) { const p = CC.getProduct(id); if (p) CC.track("visit", { kind: "product", id, sellers: CC.sellersOf([p]) }); return _openProduct(id, o); };
})(window.CC = window.CC || {});
