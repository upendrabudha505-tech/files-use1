/* ==========================================================================
   share.js — the Universal Share system
   · who owns what (stores, creators, "you")           · analytics events (CC.track)
   · "share models": one shape for every shareable thing (product, photo, video, store,
     seller profile, outfit, fashion post, board, Reel, Story)
   · the Share sheet:  Story / Reel / Link / Message / Social
   · messages inbox (#/messages) for "Send to Message"
   Stories and Reels register their own resolvers (see stories.js / reels.js).
   ========================================================================== */
(function (CC) {
  "use strict";
  const { $, $$, esc, money, compact, S } = CC;
  const D = CC.data;

  /* ---------- stores, creators and "you" ---------- */
  const ymd = () => new Date().getFullYear();
  CC.seller = function (id) {
    const s = D.SELLERS[id];
    if (s) return Object.assign({ id, route: "store/" + id, verified: true, followers: 900 + (CC.art.hashStr(id) % 9000) }, s);
    return { id: "you", name: S.user ? S.user.name + "’s Store" : "My Store", city: S.location || "Kathmandu", country: "Nepal", rating: 0, sales: "0", since: ymd(), reply: "within a day", route: "store/you", verified: false, mine: true, followers: 0 };
  };
  const ownerName = () => (S.user && S.user.name) || "You";
  /* owner = whoever publishes a Story/Reel: { type: "seller"|"creator"|"you", id } → display info */
  CC.owner = function (type, id) {
    if (type === "seller") { const s = CC.seller(id); return { type, id, name: s.name, sub: `${s.city}, ${s.country}`, city: s.city, country: s.country, avatar: CC.art.avatar(s.name), route: "store/" + id, kind: "store" }; }
    if (type === "you") { const c = { name: ownerName(), city: S.location || "Kathmandu", country: "Nepal" }; return { type, id: "you", name: c.name, sub: `${c.city}, ${c.country}`, city: c.city, country: c.country, avatar: CC.art.avatar(c.name), route: "profile", kind: "you", handle: "your.profile" }; }
    const c = CC.getCreator(id) || CC.getCreator("c1");
    return { type: "creator", id: c.id, name: c.name, sub: `${c.city || "Nepal"}, ${c.country || "Nepal"}`, city: c.city, country: c.country || "Nepal", avatar: CC.art.avatar(c.name), route: "creator/" + c.id, kind: "creator", handle: c.handle };
  };
  const sellersOfProducts = (ps) => Array.from(new Set(ps.filter(Boolean).map((p) => (p.seller === "you" || !D.SELLERS[p.seller] ? "you" : p.seller))));
  CC.sellersOf = sellersOfProducts;
  CC.sellersOfLook = (look) => sellersOfProducts(CC.lookInfo(look).items.map((i) => i.p));

  /* ---------- analytics: every share, view, click, visit and order is one small event ---------- */
  CC.track = function (type, meta) {
    S.events.push(Object.assign({ t: Date.now(), type }, meta));
    if (S.events.length > 4000) S.events = S.events.slice(-4000);
    CC.saveKey("events");
    if (type === "click" && meta && meta.ch && (meta.ch === "reel" || meta.ch === "story" || meta.ch === "link")) {
      S.attrib = { ch: meta.ch, kind: meta.kind, id: meta.id, sellers: meta.sellers || [], t: Date.now() };
      CC.saveKey("attrib");
    }
  };

  /* ---------- product media (worn photo + flat photos) ---------- */
  CC.productMedia = function (p, color) {
    if (p.photo) return [{ label: "Photo", src: p.photo }];
    color = color || p.colors[0];
    const hex = CC.art.hexOf(color), look = CC.looks().find((l) => !l.custom && l.items.some((r) => r.split(":")[0] === p.id));
    const items = look ? look.items.map(CC.resolve).map((it) => (it.p.id === p.id ? { p: it.p, hex } : it)) : [{ p, hex }];
    const fig = CC.art.figure(items, { gender: look ? look.gender : (p.gender === "girls" ? "girls" : "boys"), bg: look ? look.bg : "sand", skin: look ? look.skin : 1, h: 711, ghost: !look });
    const out = [{ label: "Worn", src: fig.uri }, { label: "Product", src: CC.art.thumb(p, color) }];
    p.colors.filter((c) => c !== color).slice(0, 2).forEach((c) => out.push({ label: CC.cap(c), src: CC.art.thumb(p, c) }));
    return out;
  };

  /* ==========================================================================
     Share models — one shape for everything that can be shared
     model = { kind, id, title, blurb, images[], price, mrp, discount, priceLabel, owner, sellers[],
               cta:{ label, kind, id }, url, tags[], caption }
     ========================================================================== */
  const base = () => location.href.split("#")[0];
  const tagify = (arr) => Array.from(new Set(arr.filter(Boolean).map((t) => "#" + String(t).replace(/[^a-z0-9]/gi, "").toLowerCase()))).filter((t) => t.length > 1);
  const resolvers = {};
  const FALLBACK_TAGS = ["#chhotacloset", "#nepalfashion"];

  resolvers.product = (id, o) => {
    const p = CC.getProduct(id); if (!p) return null;
    const media = CC.productMedia(p, o && o.color), sid = sellersOfProducts([p])[0], disc = CC.discountPct(p.price, p.mrp);
    return {
      kind: "product", id, title: p.name, blurb: `${CC.cap(p.gender)} · ${p.type === "top" && p.full ? "Complete set" : CC.cap(p.type)}`, images: media.map((m) => m.src), labels: media.map((m) => m.label),
      price: p.price, mrp: p.mrp, discount: disc, owner: CC.owner("seller", sid), sellers: [sid], cta: { label: "Shop Now", kind: "product", id }, url: CC.productUrl(id),
      tags: tagify([p.cat, p.gender === "unisex" ? "" : p.gender + "fashion"].concat(p.style).concat(p.occ.slice(0, 2)).concat(FALLBACK_TAGS)).slice(0, 6),
      caption: `${p.name} — ${money(p.price)}${disc ? ` (${disc}% off)` : ""}. Shop now on Chhota Closet!`, product: p,
    };
  };
  resolvers.photo = (id, o) => {
    const m = resolvers.product(id, o); if (!m) return null;
    if (o && o.src) { m.images = [o.src]; m.labels = [o.label || "Photo"]; }
    m.kind = "photo"; return m;
  };
  resolvers.video = (id, o) => { const m = resolvers.product(id, o); if (m) m.kind = "video"; return m; };
  resolvers.look = (id) => {
    const l = CC.getLook(id); if (!l) return null;
    const info = CC.lookInfo(l), img = CC.lookImage(l, 711), sellers = CC.sellersOfLook(l), cr = CC.getCreator(l.creator);
    const thumbs = info.items.map((i) => CC.productImage(i.p, i.color));
    return {
      kind: "look", id, title: l.title, blurb: `${info.items.length} pieces · ${l.tags.slice(0, 2).map(CC.cap).join(", ")}`, images: [img.uri].concat(l.photo ? [] : thumbs.slice(0, 3)), price: info.total, mrp: info.mrp, discount: info.discount,
      owner: CC.owner(l.creator === "you" ? "you" : "creator", l.creator), sellers, cta: { label: "Shop Now", kind: "look", id }, url: CC.lookUrl(id),
      tags: tagify(l.tags.concat(l.fest).concat([l.gender + "fashion"]).concat(FALLBACK_TAGS)).slice(0, 6), caption: `${l.title} — the complete look for ${money(info.total)}. Shop every piece in one tap!`, look: l, creator: cr,
    };
  };
  resolvers.outfit = (id) => {                     // id = "girls/gt3,gb2:pink,gs3"
    const parts = String(id).split("/"), gender = parts[0] === "boys" ? "boys" : "girls", items = (parts[1] || "").split(",").map(CC.resolve).filter(Boolean);
    if (!items.length) return null;
    const total = items.reduce((s, i) => s + i.p.price, 0), mrp = items.reduce((s, i) => s + i.p.mrp, 0);
    const fig = CC.art.figure(items, { gender, bg: gender === "boys" ? "blue" : "pink", skin: gender === "boys" ? 1 : 0, h: 711 });
    return {
      kind: "outfit", id, title: "My Chhota Closet outfit", blurb: items.map((i) => i.p.name).join(" · "), images: [fig.uri].concat(items.slice(0, 3).map((i) => CC.productImage(i.p, i.color))), price: total, mrp, discount: CC.discountPct(total, mrp),
      owner: CC.owner("you"), sellers: sellersOfProducts(items.map((i) => i.p)), cta: { label: "Shop Now", kind: "outfit", id }, url: base() + "#/builder/" + id,
      tags: tagify(["outfit", "ootd", gender + "fashion"].concat(FALLBACK_TAGS)), caption: `My outfit: ${items.map((i) => i.p.name).join(", ")} — ${money(total)} in total.`,
    };
  };
  resolvers.store = (id) => {
    const s = CC.seller(id), ps = CC.products().filter((p) => (id === "you" ? p.seller === "you" || !D.SELLERS[p.seller] : p.seller === id));
    const own = id === "you" ? CC.looks().filter((l) => l.custom) : [];
    if (!ps.length && !own.length && id !== "you") return null;
    const imgs = ps.slice(0, 4).map((p) => CC.productMedia(p)[0].src).concat(own.map((l) => CC.lookImage(l, 711).uri)).slice(0, 4);
    const from = ps.length ? Math.min.apply(null, ps.map((p) => p.price)) : null;
    return {
      kind: "store", id, title: s.name, blurb: `${ps.length} product${ps.length === 1 ? "" : "s"} · ${s.city}, ${s.country}`, images: imgs.length ? imgs : [CC.art.avatar(s.name)], price: from, mrp: null, discount: 0, priceLabel: from ? `From ${money(from)}` : "",
      owner: CC.owner("seller", id), sellers: [id], cta: { label: "Visit Store", kind: "store", id }, url: base() + "#/store/" + id, tags: tagify([s.name.split(" ")[0], "store", "nepalfashion", "chhotacloset"]),
      caption: `Visit ${s.name} on Chhota Closet — ${s.city}, ${s.country}.`,
    };
  };
  resolvers.creator = (id) => {
    const c = CC.getCreator(id); if (!c) return null;
    const ls = CC.looks().filter((l) => l.creator === id).sort((a, b) => b.likes - a.likes).slice(0, 4);
    return {
      kind: "creator", id, title: c.name, blurb: `@${c.handle}${c.city ? " · " + c.city : ""}`, images: ls.map((l) => CC.lookImage(l, 711).uri).concat([CC.art.avatar(c.name)]).slice(0, 4), price: null, mrp: null, discount: 0, priceLabel: "",
      owner: CC.owner(id === "you" ? "you" : "creator", id), sellers: Array.from(new Set([].concat.apply([], ls.map(CC.sellersOfLook)))), cta: { label: "View Profile", kind: "creator", id }, url: base() + "#/creators",
      tags: tagify([c.handle.split(".")[0], "creator", "nepalfashion", "chhotacloset"]), caption: `Follow ${c.name} (@${c.handle}) for Nepal fashion looks you can shop in one tap.`,
    };
  };
  resolvers.board = (id) => {
    const b = CC.boards.get(id); if (!b) return null;
    const ls = b.pins.map(CC.getLook).filter(Boolean), total = ls.reduce((s, l) => s + CC.lookInfo(l).total, 0);
    return {
      kind: "board", id, title: b.name, blurb: `${ls.length} look${ls.length === 1 ? "" : "s"}`, images: ls.slice(0, 4).map((l) => CC.lookImage(l, 711).uri), price: null, mrp: null, discount: 0, priceLabel: ls.length ? `${ls.length} looks` : "",
      owner: CC.owner("you"), sellers: Array.from(new Set([].concat.apply([], ls.map(CC.sellersOfLook)))), cta: { label: "Shop Now", kind: "board", id }, url: base() + "#/boards", tags: tagify(["fashionboard", "inspo"].concat(FALLBACK_TAGS)), caption: CC.boards.shareText(b),
    };
  };

  CC.share = Object.assign(CC.share, {});                    // keep the original native-share function callable as CC.share(data)
  const nativeShare = CC.share;
  CC.shareModel = function (kind, id, o) { const r = resolvers[kind]; return r ? r(id, o || {}) : null; };
  CC.shareResolvers = resolvers;

  /* ---------- links (with a ?ref= tag so visits from a shared link are counted) ---------- */
  const refTag = (m, ch) => "lk-" + m.kind + "-" + ch;
  CC.shareLink = function (m, ch) {
    const u = m.url, sep = u.indexOf("?") >= 0 ? "&" : "?", hashAt = u.indexOf("#");
    if (hashAt < 0) return u;
    return u + sep + "ref=" + refTag(m, ch || "link");
  };
  CC.on("route:ref", (r) => {
    if (r.name === "product") { const p = CC.getProduct(r.arg); if (p) { CC.track("click", { ch: "link", kind: "product", id: r.arg, sellers: sellersOfProducts([p]) }); CC.via = "link"; } }
    else if (r.name === "look") { const l = CC.getLook(r.arg); if (l) { CC.track("click", { ch: "link", kind: "look", id: r.arg, sellers: CC.sellersOfLook(l) }); CC.via = "link"; } }
    else if (r.name === "store") CC.track("click", { ch: "link", kind: "store", id: r.arg, sellers: [r.arg] });
  });

  /* ==========================================================================
     THE SHARE SHEET  —  CC.shareSheet.open({ kind, id, … })
     ========================================================================== */
  const SOCIAL = [
    { id: "whatsapp", name: "WhatsApp", icon: "fa-brands fa-whatsapp", c: "#25D366", href: (t, u) => "https://wa.me/?text=" + encodeURIComponent(t + " " + u) },
    { id: "facebook", name: "Facebook", icon: "fa-brands fa-facebook-f", c: "#1877F2", href: (t, u) => "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(u) + "&quote=" + encodeURIComponent(t) },
    { id: "messenger", name: "Messenger", icon: "fa-brands fa-facebook-messenger", c: "#0084FF", href: (t, u) => "https://www.facebook.com/dialog/send?link=" + encodeURIComponent(u) + "&app_id=966242223397117&redirect_uri=" + encodeURIComponent(u) },
    { id: "viber", name: "Viber", icon: "fa-brands fa-viber", c: "#7360F2", href: (t, u) => "viber://forward?text=" + encodeURIComponent(t + " " + u) },
    { id: "telegram", name: "Telegram", icon: "fa-brands fa-telegram", c: "#26A5E4", href: (t, u) => "https://t.me/share/url?url=" + encodeURIComponent(u) + "&text=" + encodeURIComponent(t) },
    { id: "x", name: "X", icon: "fa-brands fa-x-twitter", c: "#111", href: (t, u) => "https://twitter.com/intent/tweet?text=" + encodeURIComponent(t) + "&url=" + encodeURIComponent(u) },
    { id: "email", name: "Email", icon: "fa-solid fa-envelope", c: "#8a5cf6", href: (t, u, m) => "mailto:?subject=" + encodeURIComponent(m.title) + "&body=" + encodeURIComponent(t + "\n" + u) },
  ];
  const logShare = (m, ch) => { CC.track("share", { ch, kind: m.kind, id: m.id, sellers: m.sellers || [] }); };
  CC.logShare = logShare;
  const kindLabel = { product: "product", photo: "photo", video: "video", look: "look", outfit: "outfit", store: "store", creator: "profile", board: "board", reel: "Reel", story: "Story" };
  const priceText = (m) => m.priceLabel || (m.price ? money(m.price) : "");

  function open(target) {
    const m = CC.shareModel(target.kind, target.id, target);
    if (!m) { CC.toast("That can’t be shared right now", "fa-solid fa-triangle-exclamation"); return; }
    const noun = kindLabel[m.kind] || "item", isStory = m.kind === "story", isReel = m.kind === "reel";
    const md = CC.modal.open(`<div class="share-sheet" id="shareSheet">
      <h2 class="dlg-title">Share ${esc(noun)}</h2>
      <div class="share-preview"><img src="${esc(m.images[0])}" alt="" width="52" height="64"><div><b>${esc(m.title)}</b><small>${esc([priceText(m), m.owner.name].filter(Boolean).join(" · "))}</small></div></div>
      <div id="sharePanel"></div></div>`, { size: "sm", label: "Share " + noun, focus: "[data-share-opt]" });
    const panel = $("#sharePanel", md.el), host = $("#shareSheet", md.el);
    const menu = () => {
      panel.innerHTML = `<p class="share-as">Share as</p><ul class="sheet-list share-opts">
        <li><button type="button" class="sheet-row" data-share-opt="story"><i class="fa-solid fa-camera-retro" aria-hidden="true"></i><span><b>Story</b><small>${isStory ? "Add it to your Story" : "Auto-made 9:16 story · disappears in 24 hours"}</small></span></button></li>
        <li><button type="button" class="sheet-row" data-share-opt="reel"><i class="fa-solid fa-clapperboard" aria-hidden="true"></i><span><b>Reel</b><small>${isReel ? "Remix it into your own Reel" : isStory ? "Save it as a Reel" : "Auto-made 9:16 Reel · goes to the Reels feed"}</small></span></button></li>
        <li><button type="button" class="sheet-row" data-share-opt="link"><i class="fa-solid fa-link" aria-hidden="true"></i><span><b>Share link</b><small>Copy a link that opens this ${esc(noun)}</small></span></button></li>
        <li><button type="button" class="sheet-row" data-share-opt="message"><i class="fa-regular fa-comment-dots" aria-hidden="true"></i><span><b>Send to Message</b><small>Send it to a store or creator</small></span></button></li>
        <li><button type="button" class="sheet-row" data-share-opt="social"><i class="fa-solid fa-mobile-screen-button" aria-hidden="true"></i><span><b>Share to social media</b><small>WhatsApp, Facebook, Viber and more</small></span></button></li></ul>`;
      const f = $("[data-share-opt]", panel); if (f) f.focus();
    };
    const back = `<button type="button" class="link-btn share-back" data-share-opt="menu"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> All options</button>`;

    const linkPanel = () => {
      const url = CC.shareLink(m, "link");
      const local = location.protocol === "file:" || /^(localhost|127\.|192\.168\.)/.test(location.hostname);
      panel.innerHTML = `${back}<h3 class="share-h">Share link</h3><div class="link-box"><label class="sr-only" for="shareUrl">Link</label><input id="shareUrl" type="text" readonly value="${esc(url)}"><button type="button" class="btn-primary btn-small" id="copyLink"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy</button></div>
        <p class="muted small">Visits from this link show up in the store’s analytics.</p>
        ${local ? `<p class="share-warn"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> This link points to a page on your own device, so other people can’t open it. Put the site online (for example on Netlify or GitHub Pages) and shared links will work for everyone.</p>` : ""}`;
      const inp = $("#shareUrl", panel); inp.focus(); inp.select();
      $("#copyLink", panel).addEventListener("click", async () => {
        const ok = await CC.copyText(url);
        if (ok) { logShare(m, "link"); CC.toast("Link copied — paste it anywhere", "fa-solid fa-link"); const b = $("#copyLink", panel); b.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Copied'; }
        else { inp.select(); CC.toast("Press Ctrl/⌘ + C to copy the selected link", "fa-solid fa-link"); }
      });
    };

    const socialPanel = () => {
      const url = CC.shareLink(m, "social"), text = m.caption;
      const canNative = !!navigator.share;
      panel.innerHTML = `${back}<h3 class="share-h">Share to social media</h3><ul class="social-grid">${SOCIAL.map((s) => `<li><a class="social-btn" href="${esc(s.href(text, url, m))}" target="_blank" rel="noopener noreferrer" data-social="${s.id}" style="--sc:${s.c}"><i class="${s.icon}" aria-hidden="true"></i><span>${s.name}</span></a></li>`).join("")}
        ${canNative ? `<li><button type="button" class="social-btn" data-social-native style="--sc:#5B6178"><i class="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i><span>More…</span></button></li>` : ""}</ul>
        <button type="button" class="btn-secondary btn-block" data-share-opt="link"><i class="fa-solid fa-link" aria-hidden="true"></i> Copy link instead</button>`;
      panel.addEventListener("click", function h(e) {
        const a = e.target.closest("[data-social]");
        if (a) { logShare(m, "social"); return; }
        if (e.target.closest("[data-social-native]")) { logShare(m, "social"); nativeShare({ title: m.title, text, url }); }
      });
    };

    const messagePanel = () => {
      const peers = CC.messages.peers();
      panel.innerHTML = `${back}<h3 class="share-h">Send to Message</h3>
        <label class="sr-only" for="peerSearch">Search people and stores</label><input id="peerSearch" class="peer-search" type="search" placeholder="Search a store or creator" autocomplete="off">
        <ul class="peer-list" id="peerList" role="listbox" aria-label="Choose who to message"></ul>
        <label class="sr-only" for="shareNote">Add a note</label><textarea id="shareNote" rows="2" maxlength="200" placeholder="Add a note (optional)"></textarea>
        <button type="button" class="btn-primary btn-block" id="sendMsg" disabled><i class="fa-regular fa-paper-plane" aria-hidden="true"></i> <span>Choose someone</span></button>`;
      let pick = null; const list = $("#peerList", panel);
      const paint = () => {
        const q = $("#peerSearch", panel).value.trim().toLowerCase();
        const rows = peers.filter((p) => !q || p.name.toLowerCase().includes(q) || (p.sub || "").toLowerCase().includes(q));
        list.innerHTML = rows.length ? rows.map((p) => `<li><button type="button" role="option" aria-selected="${pick === p.key}" class="peer-row ${pick === p.key ? "is-on" : ""}" data-peer="${esc(p.key)}"><img src="${p.avatar}" alt="" width="34" height="34"><span><b>${esc(p.name)}</b><small>${esc(p.sub)}</small></span><i class="fa-solid ${pick === p.key ? "fa-circle-check" : "fa-circle-plus"}" aria-hidden="true"></i></button></li>`).join("") : `<li class="muted pad">No one matches “${esc(q)}”.</li>`;
      };
      const btn = $("#sendMsg", panel);
      list.addEventListener("click", (e) => { const b = e.target.closest("[data-peer]"); if (!b) return; pick = b.dataset.peer; paint(); btn.disabled = false; $("span", btn).textContent = "Send to " + peers.find((p) => p.key === pick).name; });
      $("#peerSearch", panel).addEventListener("input", paint);
      btn.addEventListener("click", () => {
        const peer = peers.find((p) => p.key === pick); if (!peer) return;
        CC.messages.send(peer, { text: $("#shareNote", panel).value.trim(), card: CC.messages.cardOf(m) });
        logShare(m, "message"); md.close();
        CC.toast(`Sent to ${peer.name}`, "fa-regular fa-paper-plane");
      });
      paint(); $("#peerSearch", panel).focus();
    };

    host.addEventListener("click", (e) => {
      const b = e.target.closest("[data-share-opt]"); if (!b) return;
      const v = b.dataset.shareOpt;
      if (v === "menu") menu();
      else if (v === "link") linkPanel();
      else if (v === "social") socialPanel();
      else if (v === "message") messagePanel();
      else if (v === "story" || v === "reel") { md.close(); CC.studio.open({ mode: v, model: m, target }); }
    });
    menu();
  }
  CC.shareSheet = { open };
  CC.actions.share = (d) => open({ kind: d.kind || "look", id: d.id, color: d.color, src: d.src, label: d.label });

  /* ==========================================================================
     MESSAGES — "Send to Message" inbox (#/messages, #/messages/PEER)
     ========================================================================== */
  const M = CC.messages = {};
  M.peers = () => [{ key: "me", name: "Saved messages", sub: "Notes to yourself", avatar: CC.art.avatar("Me Notes") }]
    .concat(D.CREATORS.map((c) => ({ key: "creator:" + c.id, name: c.name, sub: `@${c.handle} · creator`, avatar: CC.art.avatar(c.name) })))
    .concat(Object.keys(D.SELLERS).map((id) => ({ key: "seller:" + id, name: D.SELLERS[id].name, sub: `${D.SELLERS[id].city} · store`, avatar: CC.art.avatar(D.SELLERS[id].name) })));
  M.cardOf = (m) => ({ kind: m.kind, id: m.id, title: m.title, img: m.images[0], price: m.price, priceLabel: m.priceLabel || "", mrp: m.mrp, target: m.cta.kind, url: m.url });
  M.send = (peer, msg) => {
    let th = S.messages.find((t) => t.key === peer.key);
    if (!th) { th = { key: peer.key, name: peer.name, sub: peer.sub, msgs: [], unread: 0 }; S.messages.unshift(th); }
    th.msgs.push({ id: CC.uid("m"), from: "me", t: Date.now(), text: msg.text || "", card: msg.card || null });
    S.messages = [th].concat(S.messages.filter((t) => t !== th));
    CC.saveKey("messages");
  };
  const threadHTML = (th) => `<div class="thread-head"><a class="back-link" href="#/messages"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Inbox</a><div class="thread-who"><img src="${th.key === "me" ? CC.art.avatar("Me Notes") : CC.art.avatar(th.name)}" alt="" width="40" height="40"><div><h2>${esc(th.name)}</h2><small>${esc(th.sub || "")}</small></div></div></div>
    <ol class="thread-msgs" id="threadMsgs">${th.msgs.map((m) => `<li class="msg ${m.from === "me" ? "is-me" : ""}">${m.card ? cardBubble(m.card) : ""}${m.text ? `<p class="msg-text">${esc(m.text)}</p>` : ""}<small>${CC.timeAgo(m.t)}</small></li>`).join("")}</ol>
    <form class="thread-form" id="threadForm" data-key="${esc(th.key)}" novalidate><label class="sr-only" for="threadText">Message</label><input id="threadText" type="text" maxlength="300" placeholder="Write a message…" autocomplete="off"><button class="btn-primary" type="submit" aria-label="Send"><i class="fa-regular fa-paper-plane" aria-hidden="true"></i></button></form>
    <p class="muted small thread-note">Demo inbox: messages are saved in this browser. Replies from stores need a real backend.</p>`;
  function cardBubble(c) {
    const act = c.target === "look" ? `data-act="look" data-id="${esc(c.id)}"` : c.kind === "product" || c.kind === "photo" || c.kind === "video" ? `data-act="product" data-id="${esc(c.id)}"` : c.target === "store" ? `data-act="goto" data-to="store/${esc(c.id)}"` : c.target === "creator" ? `data-act="creator" data-id="${esc(c.id)}"` : c.target === "outfit" ? `data-act="goto" data-to="builder/${esc(c.id)}"` : c.kind === "reel" ? `data-act="goto" data-to="reels/${esc(c.id)}"` : `data-act="goto" data-to=""`;
    return `<button type="button" class="msg-card" ${act}><img src="${esc(c.img)}" alt="" width="64" height="80"><span><b>${esc(c.title)}</b><small>${esc(c.priceLabel || (c.price ? money(c.price) : ""))}</small><em>${c.kind === "reel" ? "Watch Reel" : c.target === "store" ? "Visit Store" : c.target === "creator" ? "View Profile" : "Shop Now"}</em></span></button>`;
  }
  CC.actions.goto = (d) => { CC.modal.closeAll(); CC.router.go(d.to || ""); };
  function renderMessages(arg) {
    const host = $("#messagesHost"), th = arg && S.messages.find((t) => t.key === arg);
    if (th) {
      host.innerHTML = `<div class="thread">${threadHTML(th)}</div>`;
      const ol = $("#threadMsgs", host); ol.scrollTop = ol.scrollHeight;
      $("#threadForm", host).addEventListener("submit", (e) => {
        e.preventDefault(); const inp = $("#threadText", host), v = inp.value.trim(); if (!v) return;
        M.send({ key: th.key, name: th.name, sub: th.sub }, { text: v }); renderMessages(th.key); $("#threadText", host).focus();
      });
      return;
    }
    host.innerHTML = `<div class="page-head"><div><p class="eyebrow">Messages</p><h1>Everything you’ve sent.</h1><p class="lead">Products, looks and stores you send through <em>Share → Send to Message</em> live here, next to the people you sent them to.</p></div></div>
      ${S.messages.length ? `<ul class="inbox">${S.messages.map((t) => { const last = t.msgs[t.msgs.length - 1]; return `<li><a class="inbox-row" href="#/messages/${encodeURIComponent(t.key)}"><img src="${t.key === "me" ? CC.art.avatar("Me Notes") : CC.art.avatar(t.name)}" alt="" width="46" height="46"><span><b>${esc(t.name)}</b><small>${last ? (last.card ? "Shared: " + esc(last.card.title) : esc(last.text)) : ""}</small></span><time>${last ? CC.timeAgo(last.t) : ""}</time></a></li>`; }).join("")}</ul>`
        : `<div class="empty-state"><i class="fa-regular fa-comment-dots big" aria-hidden="true"></i><p>No messages yet.</p><p class="muted">Tap Share on any product, look or store, then choose <b>Send to Message</b>.</p><a class="btn-primary" href="#/">Browse looks</a></div>`}`;
  }
  CC.router.register("messages", { title: "Messages", nav: "messages", enter: renderMessages });
  CC.on("change:messages", () => { if (CC.router.current() === "messages") renderMessages(decodeURIComponent((location.hash.split("/")[2] || "").split("?")[0])); });
})(window.CC = window.CC || {});
