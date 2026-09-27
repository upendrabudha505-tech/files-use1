/* ==========================================================================
   stories.js — Story system
   · a Story is an auto-generated 9:16 card from any shareable thing (product,
     look, outfit, store...) with product image, name, price, discount,
     seller/store name, country and a "Shop Now" button
   · disappears 24 hours after it's posted, unless saved to a Highlight
   · tapping the Story opens the product page directly
   ========================================================================== */
(function (CC) {
  "use strict";
  const { $, $$, esc, money, S } = CC;
  const DAY = 24 * 3600e3;

  /* ---------- normalise seed + user stories into one shape ---------- */
  function ownerKeyOf(o) { return o.type + ":" + o.id; }
  function modelOfRef(ref) { const [kind, id] = String(ref).split(":"); return CC.shareModel(kind, id); }
  function record(raw) {
    const m = modelOfRef(raw.ref); if (!m) return null;
    const expiresAt = raw.expiresAt || raw.t + DAY;
    return Object.assign({ mine: false, highlighted: false, stickers: [], music: null, text: "" }, raw, { model: m, expiresAt, ownerKey: ownerKeyOf(raw.owner) });
  }
  function allStories() {
    const seed = CC.data.SEED_STORIES.map(record).filter(Boolean);
    const mine = S.stories.map(record).filter(Boolean);
    return mine.concat(seed);
  }
  function live() { const now = Date.now(); return allStories().filter((s) => s.highlighted || s.expiresAt > now); }

  /* ---------- rings: one bubble per owner, most-recent story first ---------- */
  function rings() {
    const byOwner = {};
    live().sort((a, b) => b.t - a.t).forEach((s) => { (byOwner[s.ownerKey] = byOwner[s.ownerKey] || []).push(s); });
    const yourKey = "you:you", yourRing = { key: yourKey, owner: CC.owner("you"), stories: byOwner[yourKey] || [], mine: true };
    delete byOwner[yourKey];
    const rest = Object.keys(byOwner).map((k) => { const s = byOwner[k]; return { key: k, owner: s[0].model.owner, stories: s, mine: false }; })
      .sort((a, b) => b.stories[0].t - a.stories[0].t);
    return [yourRing].concat(rest);
  }
  CC.stories = { rings, live, record, allStories };

  /* ---------- tray (rendered into any host, e.g. the home feed) ---------- */
  function unseen(ring) { return ring.stories.some((s) => !S.viewedStories[s.id]); }
  function trayHTML() {
    return `<div class="story-tray" id="storyTray" role="list" aria-label="Stories">${rings().map((r) => `
      <button type="button" class="story-ring ${r.mine ? "is-mine" : ""} ${!r.mine && unseen(r) ? "has-new" : ""}" role="listitem" data-act="storyRing" data-ring="${esc(r.key)}" aria-label="${r.mine ? "Your story" : esc(r.owner.name) + "'s story"}">
        <span class="story-avatar"><img src="${r.owner.avatar}" alt=""></span>
        ${r.mine && !r.stories.length ? `<span class="story-add"><i class="fa-solid fa-plus" aria-hidden="true"></i></span>` : ""}
        <small>${r.mine ? "Your story" : esc(r.owner.name.split(" ")[0])}</small>
      </button>`).join("")}</div>`;
  }
  CC.stories.trayHTML = trayHTML;
  CC.stories.mountTray = (host) => { host.innerHTML = trayHTML(); };

  /* ---------- publish ---------- */
  CC.stories.publish = function (model, opts) {
    opts = opts || {};
    const owner = { type: "you", id: "you" };   // the Story always belongs to whoever is sharing it, not the original creator/seller
    const rec = { id: CC.uid("st"), owner, ref: model.kind + ":" + (model.product ? model.product.id : model.look ? model.look.id : model.id), text: opts.text || "", stickers: opts.stickers || [], music: opts.music || null, t: Date.now(), expiresAt: Date.now() + DAY, highlighted: false, mine: true };
    S.stories.unshift(rec); CC.saveKey("stories");
    CC.track("share", { ch: "story", kind: model.kind, id: model.id, sellers: model.sellers || [] });
    CC.notify("Your Story is live", `${model.title} — visible for 24 hours.`, "");
    CC.toast("Story posted — visible for 24 hours", "fa-solid fa-camera-retro");
    CC.emit("change:stories");
    return rec;
  };

  /* ---------- highlights ---------- */
  CC.stories.saveHighlight = function (storyId, name) {
    let h = S.highlights.find((x) => x.name === name);
    if (!h) { h = { id: CC.uid("hl"), name, storyIds: [] }; S.highlights.push(h); }
    if (h.storyIds.indexOf(storyId) < 0) h.storyIds.push(storyId);
    const st = S.stories.find((x) => x.id === storyId); if (st) st.highlighted = true;
    CC.saveKey("highlights"); CC.saveKey("stories");
    CC.toast(`Saved to “${name}” highlight — it won't expire`, "fa-solid fa-star");
  };

  /* ==========================================================================
     VIEWER
     ========================================================================== */
  let timer = null;
  function stop() { clearTimeout(timer); timer = null; }
  CC.stories.open = function (ringKey, storyId) {
    const list = rings(), startRing = Math.max(0, list.findIndex((r) => r.key === ringKey));
    if (!list.length || !list[startRing] || !list[startRing].stories.length) {
      if (list[startRing] && list[startRing].mine) { CC.modal.closeAll(); openCreatePicker(); }
      return;
    }
    let ri = startRing, si = Math.max(0, storyId ? list[ri].stories.findIndex((s) => s.id === storyId) : 0);
    const md = CC.modal.open(`<div class="story-viewer" id="storyViewer"></div>`, { size: "sm", flush: true, label: "Story", onClose: stop });
    const root = $("#storyViewer", md.el);

    function paint() {
      stop();
      const ring = list[ri], story = ring.stories[si];
      S.viewedStories[story.id] = true; CC.saveKey("viewedStories");
      if (!story.mine) CC.track("view", { ch: "story", kind: story.model.kind, id: story.model.id, sellers: story.model.sellers || [] });
      const m = story.model, disc = m.discount ? `<span class="st-disc">−${m.discount}%</span>` : "";
      root.innerHTML = `
        <div class="st-bars">${ring.stories.map((s, i) => `<span class="st-bar ${i < si ? "is-done" : ""}"><i class="${i === si ? "is-run" : ""}"></i></span>`).join("")}</div>
        <div class="st-head"><button type="button" class="st-head-who" data-st-act="owner"><img src="${ring.owner.avatar}" alt=""><span><b>${esc(ring.owner.name)}</b><small>${esc(ring.owner.city || "")}${ring.owner.country ? ", " + esc(ring.owner.country) : ""} · ${CC.timeAgo(story.t)}</small></span></button>
          <div class="st-head-actions">${story.mine ? `<button type="button" class="icon-btn" data-st-act="reel" aria-label="Save as Reel" title="Save as Reel"><i class="fa-solid fa-clapperboard" aria-hidden="true"></i></button><button type="button" class="icon-btn" data-st-act="highlight" aria-label="Save to highlight" title="Save to highlight"><i class="fa-regular fa-star" aria-hidden="true"></i></button>` : `<button type="button" class="icon-btn" data-st-act="share" aria-label="Share this story" title="Share"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i></button>`}<button type="button" class="icon-btn" data-st-act="close" aria-label="Close"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div></div>
        <div class="st-stage"><img class="st-media" src="${esc(m.images[0])}" alt="${esc(m.title)}">
          ${story.stickers.length ? `<div class="st-stickers">${story.stickers.map((e, i) => `<span class="st-sticker" style="--i:${i}">${e}</span>`).join("")}</div>` : ""}
          ${story.text ? `<p class="st-text">${esc(story.text)}</p>` : ""}
          ${story.music ? `<p class="st-music"><i class="fa-solid fa-music" aria-hidden="true"></i> ${esc(story.music)}</p>` : ""}
          <div class="st-tapzone st-tap-l" data-st-nav="prev"></div><div class="st-tapzone st-tap-r" data-st-nav="next"></div>
        </div>
        <div class="st-card"><img src="${esc(m.images[0])}" alt="" width="46" height="56"><div class="st-card-body"><b>${esc(m.title)}</b><span>${m.price ? money(m.price) : ""} ${m.mrp > m.price ? `<s>${money(m.mrp)}</s>` : ""} ${disc}</span></div><button type="button" class="btn-primary btn-small" data-st-act="shop">${esc(m.cta.label)}</button></div>`;
      const bar = $(".st-bar.is-done ~ .st-bar i.is-run, .st-bar i.is-run", root);
      if (bar) { bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = "storyRun 5s linear forwards"; }
      timer = setTimeout(next, 5000);
    }
    function next() { stop(); if (si < list[ri].stories.length - 1) { si++; paint(); } else if (ri < list.length - 1) { ri++; si = 0; if (list[ri].stories.length) paint(); else { ri++; if (list[ri]) { si = 0; paint(); } else md.close(); } } else md.close(); }
    function prev() { stop(); if (si > 0) { si--; paint(); } else if (ri > 0) { ri--; si = list[ri].stories.length - 1; paint(); } else paint(); }
    root.addEventListener("click", (e) => {
      const nav = e.target.closest("[data-st-nav]"); if (nav) { nav.dataset.stNav === "next" ? next() : prev(); return; }
      const act = e.target.closest("[data-st-act]"); if (!act) return;
      const story = list[ri].stories[si], m = story.model;
      if (act.dataset.stAct === "close") md.close();
      else if (act.dataset.stAct === "owner") { const o = story.model.owner; md.close(); if (o.kind === "creator" || o.kind === "you") CC.openCreator(o.id); else CC.router.go("store/" + o.id); }
      else if (act.dataset.stAct === "shop") { md.close(); openTarget(m); }
      else if (act.dataset.stAct === "share") { md.close(); CC.shareSheet.open({ kind: "story", id: story.id }); }
      else if (act.dataset.stAct === "reel") { stop(); CC.studio.open({ mode: "reel", model: m, prefillCaption: story.text }); }
      else if (act.dataset.stAct === "highlight") CC.promptDialog({ title: "Save to highlight", label: "Highlight name", placeholder: "e.g. Festival Picks", ok: "Save" }).then((name) => { if (name) CC.stories.saveHighlight(story.id, name); });
    });
    paint();
  };
  function openTarget(m) {
    if (m.cta.kind === "product") CC.openProduct(m.cta.id);
    else if (m.cta.kind === "look" || m.cta.kind === "outfit") { if (m.cta.kind === "look") CC.openLook(m.cta.id); else CC.router.go("builder/" + m.cta.id); }
    else if (m.cta.kind === "store") CC.router.go("store/" + m.cta.id);
    else if (m.cta.kind === "creator") CC.openCreator(m.cta.id);
    else if (m.cta.kind === "board") CC.router.go("boards/" + m.cta.id);
    CC.track("click", { ch: "story", kind: m.kind, id: m.id, sellers: m.sellers || [] });
  }
  function openCreatePicker() {
    const own = CC.products().filter((p) => p.seller === "you" || !CC.data.SELLERS[p.seller]).slice(0, 6).concat(CC.products().slice(0, 6));
    const looks = CC.looks().slice(0, 6);
    CC.modal.open(`<div class="dlg"><h2 class="dlg-title">Add to your story</h2><p class="dlg-text">Pick something to turn into a Story — or share any product or look and choose “Story” from the sheet.</p>
      <div class="pick-grid">${looks.slice(0, 6).map((l) => `<button type="button" class="pick-tile" data-pick-look="${l.id}"><img src="${esc(CC.lookImage(l, 200).uri)}" alt=""><span>${esc(l.title)}</span></button>`).join("")}</div></div>`, { size: "md", label: "Add to your story" })
      .el.addEventListener("click", (e) => { const b = e.target.closest("[data-pick-look]"); if (b) { CC.modal.closeAll(); const m = CC.shareModel("look", b.dataset.pickLook); CC.studio.open({ mode: "story", model: m }); } });
  }
  CC.actions.storyRing = (d) => CC.stories.open(d.ring);
  CC.actions.addStory = () => openCreatePicker();
  CC.stories.openCreatePicker = openCreatePicker;

  CC.on("change:stories", () => { const t = $("#storyTray"); if (t) t.outerHTML = trayHTML(); });
})(window.CC = window.CC || {});
