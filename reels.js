/* ==========================================================================
   reels.js — Reel system
   · a Reel is an auto-generated 9:16 vertical video-style card: product media,
     product name, price, discount, seller/store name, a Shop Now button,
     caption, hashtags and music
   · Reels live in the main Reels feed (#/reels); anyone can Like, Comment,
     Save, Share and Shop straight from a Reel
   ========================================================================== */
(function (CC) {
  "use strict";
  const { $, $$, esc, money, compact, S } = CC;

  function modelOfRef(ref) { const [kind, id] = String(ref).split(":"); return CC.shareModel(kind, id); }
  function record(raw) {
    const m = modelOfRef(raw.ref); if (!m) return null;
    const liked = S.reelState.likes.indexOf(raw.id) >= 0, saved = S.reelState.saves.indexOf(raw.id) >= 0;
    const userComments = S.reelState.comments[raw.id] || [];
    return Object.assign({ mine: false, caption: "", tags: [], music: null }, raw, {
      model: m, liked, saved,
      likeCount: (raw.likes || 0) + (liked && raw.mine !== false ? 0 : liked ? 1 : 0),
      commentCount: (raw.comments || 0) + userComments.length,
      comments: userComments, viewCount: raw.views || 0,
    });
  }
  function all() { return S.reels.map(record).concat(CC.data.SEED_REELS.map(record)).filter(Boolean).sort((a, b) => b.t - a.t); }
  CC.reels = { all, record };

  /* ---------- publish ---------- */
  CC.reels.publish = function (model, opts) {
    opts = opts || {};
    const owner = { type: "you", id: "you" };   // the Reel always belongs to whoever is publishing it, not the original creator/seller
    const rec = { id: CC.uid("rl"), owner, ref: model.kind + ":" + (model.product ? model.product.id : model.look ? model.look.id : model.id), caption: opts.caption || model.caption, tags: opts.tags || model.tags || [], music: opts.music || null, likes: 0, comments: 0, views: 0, t: Date.now(), mine: true };
    S.reels.unshift(rec); CC.saveKey("reels");
    CC.track("share", { ch: "reel", kind: model.kind, id: model.id, sellers: model.sellers || [] });
    CC.notify("Your Reel is live", `${model.title} is now in the Reels feed.`, "#/reels");
    CC.toast("Reel published to the Reels feed", "fa-solid fa-clapperboard");
    CC.emit("change:reels");
    return rec;
  };
  /* ---------- Reel → Story: instant, no editor ---------- */
  CC.reels.addToStory = function (reel) {
    CC.stories.publish(reel.model, { text: "" });
  };

  /* ---------- like / save / comment ---------- */
  function toggle(arr, id) { const i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); else arr.push(id); return i < 0; }
  CC.reels.like = function (id) {
    const on = toggle(S.reelState.likes, id); CC.saveKey("reelState");
    const r = all().find((x) => x.id === id); if (r) CC.track(on ? "like" : "unlike", { ch: "reel", kind: r.model.kind, id: r.model.id, sellers: r.model.sellers || [] });
    return on;
  };
  CC.reels.save = function (id) { const on = toggle(S.reelState.saves, id); CC.saveKey("reelState"); CC.toast(on ? "Saved to your Reels" : "Removed from saved", "fa-regular fa-bookmark"); return on; };
  CC.reels.comment = function (id, text) {
    text = text.trim(); if (!text) return;
    (S.reelState.comments[id] = S.reelState.comments[id] || []).push({ id: CC.uid("cm"), text, t: Date.now(), by: (S.user && S.user.name) || "You" });
    CC.saveKey("reelState");
  };

  /* ==========================================================================
     FEED — #/reels
     ========================================================================== */
  function reelCardHTML(r) {
    const m = r.model, disc = m.discount ? `<span class="rl-disc">−${m.discount}% off</span>` : "";
    return `<article class="reel-card" data-reel-id="${esc(r.id)}">
      <img class="reel-media" src="${esc(m.images[0])}" alt="${esc(m.title)}">
      <div class="reel-scrim"></div>
      <button type="button" class="reel-owner" data-act="reelOwner" data-id="${esc(r.id)}"><img src="${r.model.owner.avatar}" alt=""><span><b>${esc(r.model.owner.name)}</b><small>${esc(r.model.owner.city || "")}${r.model.owner.country ? ", " + esc(r.model.owner.country) : ""}</small></span></button>
      <div class="reel-caption"><p>${esc(r.caption)}</p>${r.tags.length ? `<p class="reel-tags">${r.tags.map(esc).join(" ")}</p>` : ""}${r.music ? `<p class="reel-music"><i class="fa-solid fa-music" aria-hidden="true"></i> ${esc(r.music)}</p>` : ""}</div>
      <div class="reel-product"><img src="${esc(m.images[0])}" alt="" width="40" height="50"><div><b>${esc(m.title)}</b><span>${m.price ? money(m.price) : ""} ${disc}</span></div><button type="button" class="btn-primary btn-small" data-act="reelShop" data-id="${esc(r.id)}">${esc(m.cta.label)}</button></div>
      <div class="reel-rail">
        <button type="button" class="rail-btn ${r.liked ? "is-on" : ""}" data-act="reelLike" data-id="${esc(r.id)}" aria-pressed="${r.liked}" aria-label="Like"><i class="fa-${r.liked ? "solid" : "regular"} fa-heart" aria-hidden="true"></i><span>${compact(r.likeCount)}</span></button>
        <button type="button" class="rail-btn" data-act="reelComments" data-id="${esc(r.id)}" aria-label="Comments"><i class="fa-regular fa-comment" aria-hidden="true"></i><span>${compact(r.commentCount)}</span></button>
        <button type="button" class="rail-btn ${r.saved ? "is-on" : ""}" data-act="reelSave" data-id="${esc(r.id)}" aria-pressed="${r.saved}" aria-label="Save"><i class="fa-${r.saved ? "solid" : "regular"} fa-bookmark" aria-hidden="true"></i><span>Save</span></button>
        <button type="button" class="rail-btn" data-act="reelShare" data-id="${esc(r.id)}" aria-label="Share"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i><span>Share</span></button>
        <button type="button" class="rail-btn" data-act="reelToStory" data-id="${esc(r.id)}" aria-label="Add to Story"><i class="fa-solid fa-camera-retro" aria-hidden="true"></i><span>Story</span></button>
        <span class="rail-views"><i class="fa-regular fa-eye" aria-hidden="true"></i> ${compact(r.viewCount)}</span>
      </div></article>`;
  }
  const seenViews = {};
  function markView(r) { if (seenViews[r.id]) return; seenViews[r.id] = true; if (!r.mine) CC.track("view", { ch: "reel", kind: r.model.kind, id: r.model.id, sellers: r.model.sellers || [] }); }
  let io = null;
  function renderFeed() {
    const host = $("#reelsHost"); const list = all();
    host.innerHTML = `<div class="page-head reel-head"><div><p class="eyebrow">Reels</p><h1>Shoppable fashion Reels.</h1><p class="lead">Auto-made from products and looks across Chhota Closet. Like, comment, save, share, or shop straight from a Reel.</p></div></div>
      ${list.length ? `<div class="reel-feed" id="reelFeed">${list.map(reelCardHTML).join("")}</div>` : `<div class="empty-state"><i class="fa-solid fa-clapperboard big" aria-hidden="true"></i><p>No Reels yet.</p><p class="muted">Open any product and tap <b>Create Reel</b>.</p></div>`}`;
    if (io) io.disconnect();
    io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { const id = e.target.dataset.reelId, r = list.find((x) => x.id === id); if (r) markView(r); } }), { threshold: 0.6 });
    $$(".reel-card", host).forEach((el) => io.observe(el));
  }
  CC.router.register("reels", { title: "Reels", nav: "reels", enter(arg) { renderFeed(); if (arg) { const el = document.querySelector(`[data-reel-id="${CSS.escape(arg)}"]`); if (el) el.scrollIntoView(); } } });
  CC.on("change:reels", () => { if (CC.router.current() === "reels") renderFeed(); });

  /* ---------- comments drawer ---------- */
  function openComments(id) {
    const r = all().find((x) => x.id === id); if (!r) return;
    const md = CC.modal.open(`<div class="comments-dlg" id="commentsDlg"></div>`, { size: "sm", label: "Comments" });
    const root = $("#commentsDlg", md.el);
    function paint() {
      const rr = all().find((x) => x.id === id);
      root.innerHTML = `<h2 class="dlg-title">Comments</h2><ul class="comments-list">${rr.comments.length ? rr.comments.map((c) => `<li><img src="${CC.art.avatar(c.by)}" alt="" width="30" height="30"><div><b>${esc(c.by)}</b><p>${esc(c.text)}</p><small>${CC.timeAgo(c.t)}</small></div></li>`).join("") : `<li class="muted pad">Be the first to comment.</li>`}</ul>
        <form id="commentForm" class="comment-form" novalidate><label class="sr-only" for="commentInput">Add a comment</label><input id="commentInput" type="text" maxlength="240" placeholder="Add a comment…" autocomplete="off"><button class="btn-primary" type="submit" aria-label="Post"><i class="fa-regular fa-paper-plane" aria-hidden="true"></i></button></form>`;
      $("#commentForm", root).addEventListener("submit", (e) => { e.preventDefault(); const inp = $("#commentInput", root); if (!inp.value.trim()) return; CC.reels.comment(id, inp.value); paint(); const list = $(".comments-list", root); list.scrollTop = list.scrollHeight; });
      $("#commentInput", root).focus();
    }
    paint();
  }

  /* ---------- rail actions ---------- */
  Object.assign(CC.actions, {
    reelLike(d) { const btn = document.querySelector(`[data-act="reelLike"][data-id="${CSS.escape(d.id)}"]`); const on = CC.reels.like(d.id); if (btn) { btn.classList.toggle("is-on", on); btn.setAttribute("aria-pressed", on); btn.querySelector("i").className = `fa-${on ? "solid" : "regular"} fa-heart`; const n = btn.querySelector("span"); n.textContent = compact(parseInt(n.textContent.replace(/[^\d.]/g, "")) + (on ? 1 : -1) || 0); } },
    reelSave(d) { const btn = document.querySelector(`[data-act="reelSave"][data-id="${CSS.escape(d.id)}"]`); const on = CC.reels.save(d.id); if (btn) { btn.classList.toggle("is-on", on); btn.setAttribute("aria-pressed", on); btn.querySelector("i").className = `fa-${on ? "solid" : "regular"} fa-bookmark`; } },
    reelComments(d) { openComments(d.id); },
    reelShare(d) { CC.shareSheet.open({ kind: "reel", id: d.id }); },
    reelToStory(d) { const r = all().find((x) => x.id === d.id); if (r) CC.reels.addToStory(r); },
    reelShop(d) { const r = all().find((x) => x.id === d.id); if (r) { CC.track("click", { ch: "reel", kind: r.model.kind, id: r.model.id, sellers: r.model.sellers || [] }); if (r.model.cta.kind === "product") CC.openProduct(r.model.cta.id); else if (r.model.cta.kind === "look") CC.openLook(r.model.cta.id); else if (r.model.cta.kind === "creator") CC.openCreator(r.model.cta.id); else CC.router.go(r.model.cta.kind + "/" + r.model.cta.id); } },
    reelOwner(d) { const r = all().find((x) => x.id === d.id); if (r) { const o = r.model.owner; if (o.kind === "creator" || o.kind === "you") CC.openCreator(o.id); else CC.router.go("store/" + o.id); } },
  });
  resolversShareReel();
  function resolversShareReel() {
    CC.shareResolvers.reel = (id) => {
      const r = all().find((x) => x.id === id); if (!r) return null;
      const m = Object.assign({}, r.model);
      return Object.assign({}, m, { kind: "reel", id, title: m.title, caption: r.caption, tags: r.tags, url: CC.reelUrl(id) });
    };
    CC.shareResolvers.story = (id) => {
      const st = S.stories.find((x) => x.id === id) || CC.data.SEED_STORIES.find((x) => x.id === id); if (!st) return null;
      const rec = CC.stories.record(st), m = Object.assign({}, rec.model);
      return Object.assign({}, m, { kind: "story", id, url: CC.reelUrl ? m.url : m.url });
    };
  }
  CC.reelUrl = (id) => location.href.split("#")[0] + "#/reels/" + id;
})(window.CC = window.CC || {});
