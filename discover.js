/* ==========================================================================
   discover.js — Nepal Trend Radar · Festival Fashion · Outfit Battle · Creators
   ========================================================================== */
(function (CC) {
  "use strict";
  const { $, $$, esc, money, compact, S } = CC;
  const D = CC.data;

  /* ==========================================================================
     NEPAL TREND RADAR
     ========================================================================== */
  const CITIES = Object.keys(D.TRENDS);
  let city = "Kathmandu";
  function trendSeries(cityName, style, pct) {
    const r = CC.art.rnd(CC.art.hashStr(cityName + style)), pts = [], n = 8;
    for (let i = 0; i < n; i++) pts.push(10 + (pct * (i / (n - 1))) + r() * 8);
    pts[n - 1] = 10 + pct + 4; return pts;
  }
  function renderTrending() {
    const host = $("#trendHost"), list = D.TRENDS[city], top = list[0];
    const saves = list.reduce((s, t) => s + t.saves, 0), likes = list.reduce((s, t) => s + t.likes, 0);
    host.innerHTML = `<div class="page-head"><div><p class="eyebrow">Nepal Trend Radar</p><h1>What Nepal is wearing right now.</h1><p class="lead">Live-style snapshot of the most saved and liked fashion, city by city. <span class="pill-note">Demo data</span></p></div></div>
      <div class="tabs city-tabs" role="tablist" aria-label="City">${CITIES.map((c) => `<button type="button" role="tab" class="tab ${c === city ? "is-active" : ""}" aria-selected="${c === city}" data-act="city" data-c="${c}"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${c}</button>`).join("")}</div>
      <div class="trend-summary"><div><small>Top style in ${city}</small><b>${esc(top.style)}</b></div><div><small>Trending</small><b class="up">▲ ${top.pct}%</b></div><div><small>Saves this week</small><b>${compact(saves)}</b></div><div><small>Likes this week</small><b>${compact(likes)}</b></div></div>
      <ol class="trend-list">${list.map((t, i) => `<li class="trend-card">
        <div class="trend-rank">${i + 1}</div>
        <div class="trend-main"><div class="trend-title"><h3>${esc(t.style)}</h3>${t.pct >= 35 ? '<span class="hot-badge"><i class="fa-solid fa-fire" aria-hidden="true"></i> Trending</span>' : ""}</div>
          <div class="trend-bar" role="img" aria-label="${t.pct}% increase"><i style="width:${Math.min(100, t.pct * 1.6)}%"></i></div>
          <div class="trend-stats"><span class="up">▲ ${t.pct}%</span><span><i class="fa-solid fa-bookmark" aria-hidden="true"></i> ${t.saves.toLocaleString("en-IN")} saves</span><span><i class="fa-solid fa-heart" aria-hidden="true"></i> ${t.likes.toLocaleString("en-IN")} likes</span><span class="spark">${CC.art.spark(trendSeries(city, t.style, t.pct), "#ff5d8f")}</span></div></div>
        <div class="trend-products"><small>Popular products</small><div class="tp-row">${t.products.map(CC.getProduct).filter(Boolean).map((p) => `<button type="button" class="tp" data-act="product" data-id="${p.id}" aria-label="${esc(p.name)}, ${money(p.price)}"><img src="${CC.productImage(p)}" alt="" width="64" height="64" loading="lazy"><span>${money(p.price)}</span></button>`).join("")}</div></div>
      </li>`).join("")}</ol>`;
  }
  CC.router.register("trending", { title: "Trending in Nepal", nav: "trending", enter: renderTrending });
  CC.actions.city = (d) => { city = d.c; renderTrending(); const t = $(`[data-c="${d.c}"]`); if (t) t.focus(); };

  /* ==========================================================================
     FESTIVAL FASHION
     ========================================================================== */
  let fest = "dashain", festGender = "all";
  function renderFestival(arg) {
    if (arg && D.FESTIVALS.some((f) => f.id === arg)) fest = arg;
    const host = $("#festivalHost"), f = D.FESTIVALS.find((x) => x.id === fest);
    const all = CC.looks().filter((l) => l.fest.indexOf(fest) >= 0), looks = all.filter((l) => festGender === "all" || l.gender === festGender);
    host.innerHTML = `<div class="page-head"><div><p class="eyebrow">Festival fashion</p><h1>Dress for every occasion in the Nepali calendar.</h1></div></div>
      <div class="fest-tabs" role="tablist" aria-label="Collections">${D.FESTIVALS.map((x) => `<button type="button" role="tab" class="fest-tab ${x.id === fest ? "is-active" : ""}" aria-selected="${x.id === fest}" data-act="fest" data-f="${x.id}" style="--fc:${x.color}"><span class="fest-emoji" aria-hidden="true">${x.emoji}</span><span>${esc(x.name)}</span></button>`).join("")}</div>
      <section class="fest-hero" style="--fc:${f.color}"><div><span class="fest-big" aria-hidden="true">${f.emoji}</span><h2>${esc(f.name)} collection</h2><p>${esc(f.blurb)}</p><small>${esc(f.when)}</small></div><div class="fest-count"><b>${all.length}</b><span>curated outfits</span></div></section>
      <div class="chip-row fest-filter" role="group" aria-label="Filter by gender">${[["all", "All"], ["girls", "Girls"], ["boys", "Boys"]].map((g) => `<button type="button" class="filter-pill sm ${festGender === g[0] ? "is-active" : ""}" aria-pressed="${festGender === g[0]}" data-act="festGender" data-g="${g[0]}">${g[1]}</button>`).join("")}</div>
      ${looks.length ? `<div class="gallery">${CC.pins.gridHTML(looks)}</div>` : `<div class="empty-state"><p>No ${festGender} outfits in this collection yet.</p></div>`}`;
  }
  CC.router.register("festival", { title: "Festival Fashion", nav: "festival", enter: renderFestival });
  CC.actions.fest = (d) => { fest = d.f; history.replaceState(null, "", "#/festival/" + fest); renderFestival(); const t = $(`[data-f="${fest}"]`); if (t) t.focus(); };
  CC.actions.festGender = (d) => { festGender = d.g; renderFestival(); };

  /* ==========================================================================
     OUTFIT BATTLE
     ========================================================================== */
  let bi = 0;
  function counts(b) {
    const v = S.votes[b.id];
    return [b.votes[0] + (v === "A" ? 1 : 0), b.votes[1] + (v === "B" ? 1 : 0)];
  }
  function renderBattle() {
    const host = $("#battleHost"), b = D.BATTLES[bi], v = S.votes[b.id], [ca, cb] = counts(b), tot = ca + cb;
    const pa = Math.round((ca / tot) * 100), pb = 100 - pa, hot = tot >= 2500, close = Math.abs(pa - pb) < 10;
    const side = (key, lookId, pct, cnt, label, icon) => {
      const l = CC.getLook(lookId), info = CC.lookInfo(l), img = CC.lookImage(l), win = v && pct > 50, mine = v === key;
      return `<article class="battle-side ${mine ? "is-mine" : ""} ${win ? "is-lead" : ""}">
        <button type="button" class="battle-img" data-act="look" data-id="${l.id}" aria-label="Open ${esc(l.title)}"><img src="${esc(img.uri)}" alt="${esc(l.title)}" width="400" height="${Math.round(400 * img.ratio)}" loading="lazy"><span class="battle-letter">${key}</span></button>
        <h3>${esc(l.title)}</h3><p class="muted small">${money(info.total)} · ${info.items.length} pieces</p>
        ${v ? `<div class="vote-result"><div class="vbar" role="img" aria-label="${pct}% of votes"><i style="width:${pct}%"></i></div><div class="vnum"><b>${pct}%</b><span>${cnt.toLocaleString("en-IN")} votes</span></div></div>` : ""}
        <button type="button" class="vote-btn ${mine ? "is-mine" : ""}" data-act="vote" data-side="${key}" aria-pressed="${mine}">${icon} ${mine ? "Your pick" : label}</button>
        <button type="button" class="link-btn" data-act="look" data-id="${l.id}">Shop this look</button></article>`;
    };
    host.innerHTML = `<div class="page-head"><div><p class="eyebrow">Outfit Battle</p><h1>Which look would you wear?</h1><p class="lead">Vote, see how everyone else voted, and shop the winner.</p></div></div>
      <div class="battle-meta"><span class="battle-tag">${esc(b.tag)}</span>${hot ? '<span class="hot-badge"><i class="fa-solid fa-fire" aria-hidden="true"></i> Trending</span>' : ""}${v && close ? '<span class="close-badge">Too close to call</span>' : ""}<span class="muted">${tot.toLocaleString("en-IN")} total votes</span></div>
      <div class="battle-grid">${side("A", b.a, pa, ca, "Look A", "❤️")}<div class="vs" aria-hidden="true">VS</div>${side("B", b.b, pb, cb, "Look B", "🔥")}</div>
      <div class="battle-nav"><button class="btn-secondary" type="button" data-act="bprev" aria-label="Previous battle"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Previous</button><div class="dots" role="group" aria-label="Battles">${D.BATTLES.map((x, i) => `<button type="button" class="dot ${i === bi ? "is-on" : ""} ${S.votes[x.id] ? "is-done" : ""}" data-act="bgo" data-i="${i}" aria-label="Battle ${i + 1}${S.votes[x.id] ? " (voted)" : ""}" ${i === bi ? 'aria-current="true"' : ""}></button>`).join("")}</div><button class="btn-primary" type="button" data-act="bnext">Next battle <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button></div>
      <p class="muted small center">You’ve voted in ${Object.keys(S.votes).length} of ${D.BATTLES.length} battles.</p>`;
  }
  CC.router.register("battle", { title: "Outfit Battle", nav: "battle", enter: renderBattle });
  CC.actions.vote = (d) => {
    const b = D.BATTLES[bi], had = S.votes[b.id];
    if (had === d.side) { delete S.votes[b.id]; CC.toast("Vote removed", "fa-solid fa-rotate-left"); }
    else { S.votes[b.id] = d.side; CC.toast(had ? "Vote changed" : "Vote counted — thanks!", d.side === "A" ? "fa-solid fa-heart" : "fa-solid fa-fire"); if (!had) CC.notify("Thanks for voting", `You picked Look ${d.side} in “${b.tag}”.`, "#/battle"); }
    CC.saveKey("votes"); renderBattle(); const nb = $(`.vote-btn[data-side="${d.side}"]`); if (nb) nb.focus();
  };
  CC.actions.bnext = () => { bi = (bi + 1) % D.BATTLES.length; renderBattle(); };
  CC.actions.bprev = () => { bi = (bi - 1 + D.BATTLES.length) % D.BATTLES.length; renderBattle(); };
  CC.actions.bgo = (d) => { bi = +d.i; renderBattle(); };

  /* ==========================================================================
     CREATORS
     ========================================================================== */
  const isFollowing = (id) => S.follows.indexOf(id) >= 0;
  const followers = (c) => c.followers + (isFollowing(c.id) ? 1 : 0);
  CC.followBtn = (id) => { const on = isFollowing(id); return `<button type="button" class="btn-follow ${on ? "is-on" : ""}" data-act="follow" data-id="${id}" aria-pressed="${on}">${on ? '<i class="fa-solid fa-check" aria-hidden="true"></i> Following' : '<i class="fa-solid fa-user-plus" aria-hidden="true"></i> Follow Creator'}</button>`; };
  const creatorLooks = (id) => CC.looks().filter((l) => l.creator === id);
  function creatorBoards(c) {
    const ls = creatorLooks(c.id).sort((a, b) => b.likes - a.likes), out = [{ name: "Top looks", looks: ls.slice(0, 4) }];
    const cnt = {}; ls.forEach((l) => l.fest.forEach((f) => { cnt[f] = (cnt[f] || 0) + 1; }));
    const best = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
    if (best) { const f = D.FESTIVALS.find((x) => x.id === best); out.push({ name: f.name + " picks", looks: ls.filter((l) => l.fest.indexOf(best) >= 0).slice(0, 4) }); }
    const g = ls.filter((l) => l.gender === "girls").length > ls.length / 2 ? "girls" : "boys";
    out.push({ name: (g === "girls" ? "Girls" : "Boys") + " daily wear", looks: ls.filter((l) => l.gender === g).slice(0, 4) });
    return out.filter((b) => b.looks.length);
  }
  function renderCreators() {
    $("#creatorsHost").innerHTML = `<div class="page-head"><div><p class="eyebrow">Creator fashion</p><h1>Follow the people who style Nepal.</h1><p class="lead">Fashion creators publish looks you can shop in one tap. Want to be one?</p></div><button class="btn-primary" type="button" data-act="publish"><i class="fa-solid fa-plus" aria-hidden="true"></i> Publish a pin</button></div>
      <div class="creator-grid">${D.CREATORS.map((c) => `<article class="creator-card"><button type="button" class="creator-open" data-act="creator" data-id="${c.id}" aria-label="Open ${esc(c.name)}'s profile"><img src="${CC.art.avatar(c.name)}" alt="" width="84" height="84"><h3>${esc(c.name)}</h3><small>@${esc(c.handle)} · ${esc(c.city)}</small></button><p class="cc-bio">${esc(c.bio)}</p><div class="cc-stats"><span><b data-followers="${c.id}">${compact(followers(c))}</b> followers</span><span><b>${creatorLooks(c.id).length}</b> pins</span></div>${CC.followBtn(c.id)}</article>`).join("")}</div>`;
  }
  CC.router.register("creators", { title: "Creators", nav: "more", enter: renderCreators });

  CC.openCreator = (id) => {
    const c = CC.getCreator(id); if (!c) return;
    const looks = creatorLooks(id), bds = id === "you" ? [] : creatorBoards(c), likes = id === "you" ? looks.reduce((s, l) => s + S.likes.filter((x) => x === l.id).length, 0) : c.likes;
    const md = CC.modal.open(`<div class="creator-profile">
      <header class="cp-head"><img src="${CC.art.avatar(c.name)}" alt="" width="96" height="96"><div><h2>${esc(c.name)}</h2><p class="muted">@${esc(c.handle)}${c.city ? " · " + esc(c.city) : ""}</p><p>${esc(c.bio)}</p></div><div class="cp-head-actions">${id === "you" ? "" : CC.followBtn(id)}<button type="button" class="icon-btn round-outline" data-act="share" data-kind="creator" data-id="${id}" aria-label="Share ${esc(c.name)}'s profile"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i></button></div></header>
      <ul class="cp-stats"><li><b data-followers="${id}">${compact(id === "you" ? 0 : followers(c))}</b><span>Followers</span></li><li><b>${id === "you" ? S.follows.length : c.following}</b><span>Following</span></li><li><b>${bds.length || (id === "you" ? S.boards.length : 0)}</b><span>Fashion boards</span></li><li><b>${looks.length}</b><span>Published pins</span></li><li><b>${compact(likes)}</b><span>Likes</span></li></ul>
      <div class="tabs" role="tablist"><button class="tab is-active" role="tab" aria-selected="true" data-cptab="pins">Pins</button>${bds.length ? '<button class="tab" role="tab" aria-selected="false" data-cptab="boards">Boards</button>' : ""}</div>
      <div id="cpPanel"></div></div>`, { size: "xl", label: c.name + "'s profile" });
    const panel = $("#cpPanel", md.el);
    const paint = (t) => {
      $$(".tab", md.el).forEach((b) => { const on = b.dataset.cptab === t; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on); });
      panel.innerHTML = t === "pins" ? (looks.length ? `<div class="gallery cols-3">${CC.pins.gridHTML(looks)}</div>` : `<div class="empty-state small"><p>No pins yet.</p><button class="btn-primary" type="button" data-act="publish">Publish your first pin</button></div>`)
        : `<div class="board-grid">${bds.map((b) => `<div class="board-card static"><div class="board-cover n${b.looks.length}">${b.looks.map((l) => `<img src="${esc(CC.lookImage(l).uri)}" alt="" loading="lazy">`).join("")}</div><div class="board-info"><h3>${esc(b.name)}</h3><p>${b.looks.length} pins</p></div></div>`).join("")}</div>`;
    };
    md.el.addEventListener("click", (e) => { const t = e.target.closest("[data-cptab]"); if (t) paint(t.dataset.cptab); });
    paint("pins");
  };
  CC.actions.follow = (d) => {
    const c = CC.getCreator(d.id), i = S.follows.indexOf(d.id);
    if (i >= 0) S.follows.splice(i, 1); else { S.follows.push(d.id); CC.notify(`You’re following ${c.name}`, "New pins from them will appear in your notifications.", ""); }
    CC.saveKey("follows");
    const on = isFollowing(d.id);
    $$(`[data-act="follow"][data-id="${d.id}"]`).forEach((b) => { b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on); b.innerHTML = on ? '<i class="fa-solid fa-check" aria-hidden="true"></i> Following' : '<i class="fa-solid fa-user-plus" aria-hidden="true"></i> Follow Creator'; });
    $$(`[data-followers="${d.id}"]`).forEach((n) => { n.textContent = compact(followers(c)); });
    CC.toast(on ? `Following ${c.name}` : `Unfollowed ${c.name}`, on ? "fa-solid fa-user-check" : "fa-solid fa-user-minus");
  };
  CC.on("change:follows", () => { if (CC.router.current() === "profile" && CC.renderProfile) CC.renderProfile(); });
})(window.CC = window.CC || {});
