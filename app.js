/* ==========================================================================
   app.js — shell: header/nav, theme, notifications, login, profile, orders,
   Explore hub, "Publish a pin" modal, keyboard handling and start-up
   ========================================================================== */
(function (CC) {
  "use strict";
  const { $, $$, esc, money, S } = CC;

  /* ---------- theme ---------- */
  const prefersDark = () => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  function applyTheme() {
    const t = S.theme || (prefersDark() ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", t);
    const dark = t === "dark", b = $("#themeBtn");
    b.setAttribute("aria-pressed", dark); b.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    $("i", b).className = dark ? "fa-solid fa-sun" : "fa-solid fa-moon";
    $$("[data-theme-label]").forEach((n) => { n.textContent = dark ? "Light mode" : "Dark mode"; });
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", dark ? "#14161f" : "#FFF6EE");
  }
  CC.actions.theme = () => { S.theme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"; CC.saveKey("theme"); applyTheme(); };

  /* ---------- feature tiles (Explore hub + home strip) ---------- */
  const TILES = [
    { id: "builder", icon: "fa-wand-magic-sparkles", title: "Outfit Builder", text: "Pick occasion, season and budget. Get a complete look.", c: "#ff5d8f" },
    { id: "budget", icon: "fa-coins", title: "Budget Finder", text: "Complete outfits under Rs. 999 to Rs. 9,999.", c: "#e8a020" },
    { id: "festival", icon: "fa-gift", title: "Festival Fashion", text: "Dashain, Tihar, Teej, Holi and more.", c: "#c9413c" },
    { id: "trending", icon: "fa-fire", title: "Nepal Trend Radar", text: "What’s trending in Kathmandu, Pokhara and beyond.", c: "#8b5cf6" },
    { id: "battle", icon: "fa-bolt", title: "Outfit Battle", text: "Vote: which look would you wear?", c: "#3e8fff" },
    { id: "size", icon: "fa-ruler", title: "Size Finder", text: "Height, weight and fit → your size.", c: "#2f9e6b" },
    { id: "creators", icon: "fa-user-group", title: "Creators", text: "Follow the people who style Nepal.", c: "#d1345b" },
    { id: "boards", icon: "fa-bookmark", title: "Fashion Boards", text: "Save looks into boards like Dashain 2026.", c: "#4a6fa5" },
    { id: "deals", icon: "fa-tags", title: "Deals", text: "Looks with 20%+ off right now.", c: "#e07a10" },
  ];
  CC.tilesHTML = (n) => `<ul class="tiles">${TILES.slice(0, n || TILES.length).map((t) => `<li><a class="tile" href="#/${t.id}" style="--tc:${t.c}"><span class="tile-icon"><i class="fa-solid ${t.icon}" aria-hidden="true"></i></span><span class="tile-text"><b>${t.title}</b><small>${t.text}</small></span><i class="fa-solid fa-arrow-right tile-go" aria-hidden="true"></i></a></li>`).join("")}</ul>`;
  CC.router.register("explore", { title: "Explore", nav: "explore", enter() {
    $("#exploreHost").innerHTML = `<div class="page-head"><div><p class="eyebrow">Explore</p><h1>Discover fashion visually. Then shop the whole look.</h1></div></div>
      <ol class="flow" aria-label="How it works"><li><i class="fa-regular fa-eye" aria-hidden="true"></i><b>Discover</b><small>Browse looks from creators</small></li><li><i class="fa-regular fa-bookmark" aria-hidden="true"></i><b>Save</b><small>Pin ideas to your boards</small></li><li><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><b>Build</b><small>Make an outfit to your budget</small></li><li><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i><b>Shop</b><small>Add the complete look</small></li></ol>
      ${CC.tilesHTML()}`;
  } });

  /* ---------- popovers (More / notifications / profile) ---------- */
  function closePopovers(except) {
    $$(".popover").forEach((p) => { if (p.id !== except) p.hidden = true; });
    $$("[data-pop]").forEach((b) => b.setAttribute("aria-expanded", "false"));
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pop]");
    if (btn) {
      const pop = $("#pop-" + btn.dataset.pop), open = pop.hidden;
      closePopovers(open ? pop.id : null);
      pop.hidden = !open; btn.setAttribute("aria-expanded", String(open));
      if (open && btn.dataset.pop === "notif") renderNotifs();
      if (open && btn.dataset.pop === "profile") renderProfileMenu();
      return;
    }
    if (!e.target.closest(".popover")) closePopovers();
    else if (e.target.closest(".popover a, .popover [data-act]")) closePopovers();
  });

  /* ---------- notifications ---------- */
  function renderNotifs() {
    const list = $("#notifList");
    list.innerHTML = S.notifs.length ? S.notifs.map((n) => `<li class="${n.read ? "" : "is-new"}"><button type="button" data-act="notif" data-id="${n.id}"><strong>${esc(n.title)}</strong><span>${esc(n.body)}</span><small>${CC.timeAgo(n.time)}</small></button></li>`).join("") : `<li class="muted pad">You’re all caught up.</li>`;
  }
  function paintNotifBadge() { const n = S.notifs.filter((x) => !x.read).length, b = $("#notifBadge"); b.hidden = n === 0; b.textContent = n > 9 ? "9+" : n; }
  CC.on("change:notifs", () => { paintNotifBadge(); if (!$("#pop-notif").hidden) renderNotifs(); });
  CC.actions.notif = (d) => { const n = S.notifs.find((x) => x.id === d.id); if (!n) return; n.read = true; CC.saveKey("notifs"); if (n.link) { closePopovers(); location.hash = n.link; } };
  CC.actions.readAll = () => { S.notifs.forEach((n) => { n.read = true; }); CC.saveKey("notifs"); return false; };

  /* ---------- profile menu + auth ---------- */
  function renderProfileMenu() {
    const u = S.user;
    $("#profileMenu").innerHTML = (u
      ? `<div class="pm-user"><img src="${CC.art.avatar(u.name)}" alt="" width="40" height="40"><div><b>${esc(u.name)}</b><small>${esc(u.email)}</small></div></div>`
      : `<div class="pm-guest"><b>Welcome to Chhota Closet</b><small>Log in to keep your boards and orders together.</small><div class="pm-btns"><button class="btn-primary btn-small" type="button" data-act="auth" data-mode="login">Log in</button><button class="btn-secondary btn-small" type="button" data-act="auth" data-mode="register">Register</button></div></div>`)
      + `<a href="#/profile"><i class="fa-regular fa-user"></i> My profile</a><a href="#/orders"><i class="fa-solid fa-box"></i> Orders</a><a href="#/boards"><i class="fa-regular fa-bookmark"></i> My boards</a><a href="#/size"><i class="fa-solid fa-ruler"></i> My size</a>` + (u ? `<button type="button" data-act="logout"><i class="fa-solid fa-arrow-right-from-bracket"></i> Log out</button>` : "");
  }
  CC.actions.auth = (d) => openAuth(d.mode || "login");
  CC.actions.logout = () => { S.user = null; CC.saveKey("user"); CC.rebuildCatalog(); CC.emit("catalog"); CC.toast("Logged out", "fa-solid fa-arrow-right-from-bracket"); if (CC.router.current() === "profile") CC.renderProfile(); };
  function openAuth(mode) {
    const md = CC.modal.open(`<div class="dlg auth"><h2 class="dlg-title">Welcome</h2><div class="seg" role="tablist"><button type="button" role="tab" class="seg-btn" data-m="login">Log in</button><button type="button" role="tab" class="seg-btn" data-m="register">Register</button></div>
      <form id="authForm" novalidate><div class="field" id="fName" hidden><label for="aName">Full name</label><input id="aName" type="text" autocomplete="name" placeholder="e.g. Anjali Shrestha"><p class="field-error" hidden></p></div>
      <div class="field"><label for="aEmail">Email</label><input id="aEmail" type="email" autocomplete="email" placeholder="you@example.com"><p class="field-error" hidden></p></div>
      <div class="field"><label for="aPass">Password</label><input id="aPass" type="password" autocomplete="current-password" placeholder="At least 6 characters"><p class="field-error" hidden></p></div>
      <button class="btn-primary btn-block" type="submit" id="authGo"></button><p class="muted small">Demo only — no account is created on a server and your password is never stored.</p></form></div>`, { size: "sm", label: "Log in or register", focus: "#aEmail", guard: () => $("#aEmail", document).value.trim().length > 0 });
    let m = mode;
    const paint = () => {
      $$(".seg-btn", md.el).forEach((b) => { const on = b.dataset.m === m; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", on); });
      $("#fName", md.el).hidden = m !== "register"; $("#authGo", md.el).textContent = m === "register" ? "Create account" : "Log in";
      $("#aPass", md.el).setAttribute("autocomplete", m === "register" ? "new-password" : "current-password");
    };
    $$(".seg-btn", md.el).forEach((b) => b.addEventListener("click", () => { m = b.dataset.m; paint(); }));
    const err = (id, msg) => { const f = $(id, md.el).closest(".field"), p = $(".field-error", f); f.classList.toggle("has-error", !!msg); p.textContent = msg || ""; p.hidden = !msg; return !msg; };
    $("#authForm", md.el).addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#aName", md.el).value.trim(), email = $("#aEmail", md.el).value.trim(), pass = $("#aPass", md.el).value;
      let ok = true;
      if (m === "register") ok = err("#aName", name.length < 2 ? "Please enter your name." : "") && ok; else err("#aName", "");
      ok = err("#aEmail", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Enter a valid email address.") && ok;
      ok = err("#aPass", pass.length >= 6 ? "" : "Password must be at least 6 characters.") && ok;
      if (!ok) { const bad = $(".has-error input", md.el); if (bad) bad.focus(); return; }
      S.user = { name: m === "register" ? name : (S.user && S.user.email === email ? S.user.name : CC.cap(email.split("@")[0].replace(/[._-]+/g, " "))), email };
      CC.saveKey("user"); CC.rebuildCatalog(); CC.emit("catalog"); md.close();
      CC.toast(m === "register" ? `Account created — welcome, ${S.user.name}!` : `Welcome back, ${S.user.name}`, "fa-solid fa-circle-check");
      if (CC.router.current() === "profile") CC.renderProfile();
    });
    paint();
  }

  /* ---------- profile + orders ---------- */
  CC.renderProfile = function () {
    const u = S.user, mine = CC.looks().filter((l) => l.custom), following = S.follows.map(CC.getCreator).filter(Boolean);
    $("#profileHost").innerHTML = `<div class="profile-card"><img src="${CC.art.avatar(u ? u.name : "Guest")}" alt="" width="88" height="88"><div class="pc-main"><h1>${u ? esc(u.name) : "Guest"}</h1><p class="muted">${u ? esc(u.email) : "You’re browsing as a guest."} · ${esc(S.location)}</p>
        ${u ? `<button class="btn-secondary btn-small" type="button" data-act="logout">Log out</button>` : `<div class="pm-btns"><button class="btn-primary btn-small" type="button" data-act="auth" data-mode="login">Log in</button><button class="btn-secondary btn-small" type="button" data-act="auth" data-mode="register">Register</button></div>`}</div>
      <ul class="cp-stats"><li><b>${following.length}</b><span>Following</span></li><li><b>${S.boards.length}</b><span>Boards</span></li><li><b>${mine.length}</b><span>Published pins</span></li><li><b>${S.likes.length}</b><span>Likes</span></li><li><b>${S.outfits.length}</b><span>Saved outfits</span></li></ul></div>
      <div class="profile-grid">
        <section class="pcard"><h2>My size</h2>${S.size ? `<p class="big-size">${S.size.size}</p><p class="muted small">${S.size.height} cm · ${S.size.weight} kg · ${esc(S.size.fit)} fit</p><a class="btn-secondary btn-small" href="#/size">Update</a>` : `<p class="muted">Not set yet.</p><a class="btn-primary btn-small" href="#/size">Find my size</a>`}</section>
        <section class="pcard"><h2>Orders</h2><p class="muted">${S.orders.length ? `${S.orders.length} order${S.orders.length === 1 ? "" : "s"} placed` : "No orders yet."}</p><a class="btn-secondary btn-small" href="#/orders">View orders</a></section>
        <section class="pcard"><h2>Deliver to</h2><div id="profileDlv"></div></section>
        <section class="pcard"><h2>Following</h2>${following.length ? `<ul class="follow-list">${following.map((c) => `<li><img src="${CC.art.avatar(c.name)}" alt="" width="32" height="32"><button type="button" class="link-plain" data-act="creator" data-id="${c.id}">${esc(c.name)}</button>${CC.followBtn(c.id)}</li>`).join("")}</ul>` : `<p class="muted">You aren’t following anyone yet.</p><a class="btn-secondary btn-small" href="#/creators">Find creators</a>`}</section>
      </div>
      <section class="pubs"><div class="pubs-head"><h2>My published pins</h2><button class="btn-primary btn-small" type="button" data-act="publish"><i class="fa-solid fa-plus" aria-hidden="true"></i> Publish a pin</button></div>${mine.length ? `<div class="gallery">${CC.pins.gridHTML(mine)}</div>` : `<p class="muted">Publish your own outfit or piece — it appears on the feed instantly.</p>`}</section>
      <p class="muted small"><button class="link-btn" type="button" data-act="resetDemo">Reset all demo data</button> — clears your likes, boards, cart and orders in this browser.</p>`;
    CC.delivery.mount($("#profileDlv"), () => 0);
  };
  CC.router.register("profile", { title: "Profile", nav: "profile", enter: CC.renderProfile });
  CC.on("catalog", () => { if (CC.router.current() === "profile") CC.renderProfile(); });
  CC.actions.resetDemo = async () => { if (await CC.confirmDialog({ title: "Reset all demo data?", text: "This clears likes, boards, cart, orders and saved outfits stored in this browser.", ok: "Reset everything", danger: true })) CC.resetAll(); };

  function renderOrders() {
    const host = $("#ordersHost");
    host.innerHTML = `<div class="page-head"><div><p class="eyebrow">Orders</p><h1>Your orders</h1><p class="lead">Pay a 50% refundable advance and settle the rest on delivery, or pay in full — cancel any time before your parcel ships for a full refund of the advance. <button type="button" class="link-btn" data-act="refundInfo">Refund policy</button></p></div></div>` + (S.orders.length ? `<ul class="order-list">${S.orders.map(CC.orderCardHTML).join("")}</ul>` : `<div class="empty-state"><i class="fa-solid fa-box-open big" aria-hidden="true"></i><p>No orders yet.</p><a class="btn-primary" href="#/">Start shopping</a></div>`);
  }
  CC.router.register("orders", { title: "Orders", nav: "orders", enter: renderOrders });
  CC.on("change:orders", () => { if (CC.router.current() === "orders") renderOrders(); });
  CC.actions.reorder = (d) => { const o = S.orders.find((x) => x.id === d.id); o.lines.forEach((l) => { if (CC.getProduct(l.pid)) CC.cart.add(l.pid, { size: l.size, color: l.color, qty: l.qty }); }); CC.toast("Items added to your cart", "fa-solid fa-bag-shopping"); CC.cart.open(); };

  /* ---------- mobile menu + create sheet ---------- */
  function openMenu() { $("#menuDrawer").classList.add("is-open"); $("#menuDrawer").setAttribute("aria-hidden", "false"); $("#scrim").hidden = false; CC.lock("menu", true); $("#closeMenu").focus(); }
  function closeMenu() { $("#menuDrawer").classList.remove("is-open"); $("#menuDrawer").setAttribute("aria-hidden", "true"); if (!CC.cart.isOpen()) $("#scrim").hidden = true; CC.lock("menu", false); }
  // Boys / Girls links in the slide-in menu: apply the feed filter, then go home
  CC.actions.menuGender = (d) => { CC.actions.gender({ v: d.v }); CC.router.go(""); };
  CC.actions.menu = openMenu; CC.actions.closeMenu = () => { closeMenu(); return false; };
  $("#menuDrawer").addEventListener("click", (e) => { if (e.target.closest("a")) closeMenu(); });
  CC.actions.create = () => {
    const md = CC.modal.open(`<div class="dlg"><h2 class="dlg-title">Create</h2><ul class="sheet-list"><li><a href="#/builder" class="sheet-row"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><span><b>Build an outfit</b><small>Get a full look for your budget</small></span></a></li><li><button type="button" class="sheet-row" data-act="publish"><i class="fa-solid fa-camera" aria-hidden="true"></i><span><b>Publish a pin</b><small>Share a piece or outfit with everyone</small></span></button></li><li><button type="button" class="sheet-row" data-act="newBoard"><i class="fa-regular fa-bookmark" aria-hidden="true"></i><span><b>New board</b><small>Organise looks like Dashain 2026</small></span></button></li></ul></div>`, { size: "sm", label: "Create" });
    md.el.addEventListener("click", (e) => { if (e.target.closest("a, [data-act]")) md.close(); });
  };

  /* ---------- Publish a pin (creator publishing) ---------- */
  CC.actions.publish = () => {
    const TITLE_MAX = 60, PRICE_MAX = 999999;
    let pending = null, previewTimer = null;
    const md = CC.modal.open(`<form id="pubForm" novalidate><h2 class="dlg-title">Publish a pin</h2><p class="dlg-text">Share a piece with the community. It appears on the feed straight away${S.user ? "" : " (log in to get credit for it)"}.</p>
      <div class="field" id="pfTitle"><label class="label-row" for="pTitle"><span>Title</span><span class="counter" id="pCount" aria-hidden="true">0/${TITLE_MAX}</span></label><input id="pTitle" type="text" maxlength="${TITLE_MAX}" autocomplete="off" placeholder="e.g. Mustard Corduroy Pinafore"><p class="field-error" hidden></p></div>
      <div class="field"><label for="pCat">Category</label><select id="pCat"><option value="girls">Girls Fashion</option><option value="boys">Boys Fashion</option></select></div>
      <div class="field" id="pfPrice"><label for="pPrice">Price (Rs.)</label><input id="pPrice" type="number" min="1" max="${PRICE_MAX}" step="1" inputmode="numeric" placeholder="1200"><p class="field-error" hidden></p></div>
      <div class="field" id="pfImg"><label for="pImg">Photo <span class="label-hint">(optional — we’ll use a placeholder if left blank)</span></label><input id="pImg" type="url" autocomplete="off" placeholder="https://images.example.com/photo.jpg">
        <div class="upload-row"><span class="or">or</span><button type="button" class="btn-secondary btn-small" id="pUp"><i class="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i> Upload from device</button><input type="file" id="pFile" accept="image/*" hidden></div><p class="field-error" hidden></p>
        <figure class="img-preview" id="pPrev" hidden><img id="pPrevImg" alt="Preview of your photo" referrerpolicy="no-referrer"><figcaption id="pPrevCap">Preview</figcaption><button type="button" class="link-btn" id="pRemove">Remove</button></figure></div>
      <div class="modal-actions"><button class="btn-secondary" type="button" data-cancel>Cancel</button><button class="btn-primary" type="submit">Publish</button></div></form>`,
      { size: "sm", label: "Publish a pin", focus: "#pTitle", guard: () => Boolean($("#pTitle", document).value.trim() || $("#pPrice", document).value || $("#pImg", document).value.trim() || pending) });
    const r = md.el, $$r = (s) => $(s, r);
    $$r("[data-cancel]").addEventListener("click", md.close);
    const setErr = (fieldSel, msg) => { const f = $$r(fieldSel), p = $(".field-error", f); f.classList.toggle("has-error", !!msg); p.textContent = msg || ""; p.hidden = !msg; };
    const isHttp = (v) => { try { const u = new URL(v); return u.protocol === "http:" || u.protocol === "https:"; } catch (e) { return false; } };
    const showPrev = (src, cap) => { if (!src) { $$r("#pPrev").hidden = true; $$r("#pPrevImg").removeAttribute("src"); return; } $$r("#pPrevCap").textContent = cap || "Preview"; $$r("#pPrevImg").src = src; $$r("#pPrev").hidden = false; };
    $$r("#pTitle").addEventListener("input", () => { const n = $$r("#pTitle").value.length; $$r("#pCount").textContent = n + "/" + TITLE_MAX; $$r("#pCount").classList.toggle("is-near", n >= TITLE_MAX - 10); if ($$r("#pTitle").value.trim().length >= 3) setErr("#pfTitle", ""); });
    $$r("#pPrice").addEventListener("input", () => setErr("#pfPrice", ""));
    $$r("#pPrevImg").addEventListener("load", () => { $$r("#pPrevCap").textContent = pending ? "Uploaded photo" : "Looks good — this is your photo"; });
    $$r("#pPrevImg").addEventListener("error", () => { if (!$$r("#pPrevImg").getAttribute("src")) return; showPrev(null); if ($$r("#pImg").value.trim()) setErr("#pfImg", "We couldn’t load an image from that link. Check it, or upload a photo instead."); });
    $$r("#pImg").addEventListener("input", () => { clearTimeout(previewTimer); setErr("#pfImg", ""); pending = null; const u = $$r("#pImg").value.trim(); if (!u) { showPrev(null); return; } previewTimer = setTimeout(() => { if (isHttp(u)) showPrev(u, "Checking link…"); else showPrev(null); }, 450); });
    const resize = (file, maxW) => new Promise((res, rej) => { const ou = URL.createObjectURL(file), im = new Image(); im.onload = () => { const s = Math.min(1, maxW / im.naturalWidth), w = Math.max(1, Math.round(im.naturalWidth * s)), h = Math.max(1, Math.round(im.naturalHeight * s)), cv = document.createElement("canvas"); cv.width = w; cv.height = h; const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, w, h); cx.drawImage(im, 0, 0, w, h); URL.revokeObjectURL(ou); res(cv.toDataURL("image/jpeg", .82)); }; im.onerror = () => { URL.revokeObjectURL(ou); rej(new Error("bad image")); }; im.src = ou; });
    $$r("#pUp").addEventListener("click", () => $$r("#pFile").click());
    $$r("#pFile").addEventListener("change", async () => {
      const f = $$r("#pFile").files && $$r("#pFile").files[0]; $$r("#pFile").value = ""; if (!f) return;
      if (!f.type.startsWith("image/")) { setErr("#pfImg", "Please choose an image file (JPG, PNG or WebP)."); return; }
      try { pending = await resize(f, 480); $$r("#pImg").value = ""; clearTimeout(previewTimer); setErr("#pfImg", ""); showPrev(pending, "Uploaded photo"); } catch (e) { setErr("#pfImg", "That image couldn’t be read. Please try a different one."); }
    });
    $$r("#pRemove").addEventListener("click", () => { pending = null; $$r("#pImg").value = ""; clearTimeout(previewTimer); setErr("#pfImg", ""); showPrev(null); $$r("#pImg").focus(); });
    $$r("#pubForm").addEventListener("submit", (e) => {
      e.preventDefault(); let bad = null;
      const title = $$r("#pTitle").value.trim(), price = Number($$r("#pPrice").value), url = $$r("#pImg").value.trim();
      if (title.length < 3) { setErr("#pfTitle", title ? "That title is a bit short — use at least 3 characters." : "Please add a title."); bad = bad || $$r("#pTitle"); } else setErr("#pfTitle", "");
      if (!$$r("#pPrice").value.trim() || !isFinite(price) || price < 1 || price > PRICE_MAX) { setErr("#pfPrice", `Enter a price between ${money(1)} and ${money(PRICE_MAX)}.`); bad = bad || $$r("#pPrice"); } else setErr("#pfPrice", "");
      if (!pending && url && !isHttp(url)) { setErr("#pfImg", "That doesn’t look like a valid link — it should start with http:// or https://"); bad = bad || $$r("#pImg"); } else if (pending || !url) setErr("#pfImg", "");
      if (bad) { bad.focus(); return; }
      const gender = $$r("#pCat").value;
      const img = pending || url || CC.art.figure([CC.outfit.asItem(CC.outfit.pool("top", gender).find((p) => !p.full) || CC.products()[0], { color: "any" })], { gender, bg: gender === "boys" ? "blue" : "pink", h: 520 }).uri;
      S.custom.unshift({ id: CC.uid("p"), title, gender, price: Math.round(price), img });
      const saved = CC.saveKey("custom");
      CC.rebuildCatalog(); md.close(); CC.emit("catalog");
      CC.notify("Your pin is live", `“${title}” was published to the feed.`, "#/profile");
      CC.toast(saved ? `“${title}” is live on the feed` : `“${title}” is live — but browser storage is full, so it won’t survive a refresh`, saved ? "fa-solid fa-circle-check" : "fa-solid fa-triangle-exclamation");
      if (CC.router.current() !== "home") CC.router.go(""); else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  /* ---------- header buttons, keyboard, start-up ---------- */
  CC.actions.openWishlist = () => CC.openWishlist();
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || e.defaultPrevented) return;
    if (CC.modal.closeTop()) return;
    if ($$(".popover:not([hidden])").length) { closePopovers(); return; }
    if ($("#menuDrawer").classList.contains("is-open")) { closeMenu(); return; }
    if (CC.cart.isOpen()) CC.cart.close();
  });
  $("#scrim").addEventListener("click", () => { if (CC.cart.isOpen()) CC.cart.close(); if ($("#menuDrawer").classList.contains("is-open")) closeMenu(); });
  $("#cartBtn").addEventListener("click", () => CC.cart.open());
  $("#closeCart").addEventListener("click", () => CC.cart.close());
  $("#closeMenu").addEventListener("click", closeMenu);
  CC.on("view", (name) => {
    $$("#bottomNav [data-bn]").forEach((b) => { const map = { home: "home", deals: "home", explore: "home", boards: "home", profile: "profile", orders: "profile", reels: "reels", messages: "messages", store: "home" }; b.classList.toggle("is-active", map[name] === b.dataset.bn); });
  });

  $("#cityList").innerHTML = CC.data.DELIVERY.cities.map((c) => `<option value="${esc(c)}"></option>`).join("");
  applyTheme();
  if (window.matchMedia) { const mq = window.matchMedia("(prefers-color-scheme: dark)"); if (mq.addEventListener) mq.addEventListener("change", () => { if (!S.theme) applyTheme(); }); }
  CC.emit("change:likes"); CC.emit("change:notifs");
  CC.router.start();
})(window.CC = window.CC || {});
