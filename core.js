/* ==========================================================================
   core.js — shared helpers, persistent state, modal manager, router, toast
   Everything else plugs into the global `CC` object.
   ========================================================================== */
(function (CC) {
  "use strict";
  const D = CC.data;

  /* ---------- tiny helpers ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const money = (n) => "Rs. " + Math.round(n).toLocaleString("en-IN");
  const compact = (n) => n >= 10000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "") + "k" : n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  CC.$ = $; CC.$$ = $$; CC.esc = esc; CC.money = money; CC.compact = compact; CC.cap = cap; CC.uid = uid;

  /* ---------- events ---------- */
  const handlers = {};
  CC.on = (evt, fn) => { (handlers[evt] = handlers[evt] || []).push(fn); };
  CC.emit = (evt, data) => { (handlers[evt] || []).forEach((fn) => fn(data)); };

  /* ---------- persistent state (localStorage, all keys prefixed cc2_) ---------- */
  const store = {
    load(key, fallback) { try { const v = localStorage.getItem("cc2_" + key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    save(key, value) { try { localStorage.setItem("cc2_" + key, JSON.stringify(value)); return true; } catch (e) { return false; } },
  };
  const now = Date.now();
  const DEFAULTS = {
    likes: [], cart: [], outfits: [], votes: {}, follows: [], size: null, user: null, theme: null,
    location: "Kathmandu", orders: [], qa: {}, reviews: {}, custom: [], payment: "cod", payPlan: "advance",
    boards: [
      { id: "bd1", name: "My College Looks", pins: ["l21", "l9"] },
      { id: "bd2", name: "Dashain 2026", pins: ["l24", "l4"] },
      { id: "bd3", name: "Future Purchases", pins: [] },
    ],
    notifs: [
      { id: "n1", title: "Dashain looks are trending", body: "Gunyu cholo and daura suruwal saves are up this week.", time: now - 3600e3 * 3, read: false, link: "#/festival/dashain" },
      { id: "n2", title: "Welcome to Chhota Closet", body: "Discover looks, build an outfit, then shop the complete look.", time: now - 3600e3 * 26, read: false, link: "#/explore" },
    ],
    votesBase: {},
    /* Share → Story / Reel system */
    stories: [], highlights: [], reels: [], viewedStories: {},
    reelState: { likes: [], saves: [], comments: {} },
    events: [], messages: [], attrib: {}, storeFollows: [], shareLog: [],
  };
  const S = {};
  Object.keys(DEFAULTS).forEach((k) => { S[k] = store.load(k, DEFAULTS[k]); });
  CC.S = S;
  CC.saveKey = (key) => { const ok = store.save(key, S[key]); CC.emit("change:" + key); CC.emit("change", key); return ok; };
  CC.resetAll = () => { Object.keys(DEFAULTS).forEach((k) => { try { localStorage.removeItem("cc2_" + k); } catch (e) { /* ignore */ } }); location.hash = "#/"; location.reload(); };

  /* ---------- catalog access (seed data + pins the user publishes) ---------- */
  const productMap = {}, lookMap = {}, creatorMap = {};
  D.PRODUCTS.forEach((p) => { productMap[p.id] = p; });
  D.CREATORS.forEach((c) => { creatorMap[c.id] = c; });
  const YOU = { id: "you", name: "You", handle: "your.profile", country: "Nepal", city: "", followers: 0, following: 0, likes: 0, bio: "Your published pins live here." };
  creatorMap.you = YOU;
  let allLooks = [];
  const infoCache = {};

  function rebuildCatalog() {
    Object.keys(infoCache).forEach((k) => delete infoCache[k]);
    Object.keys(productMap).forEach((k) => { if (productMap[k].custom) delete productMap[k]; });
    const customLooks = (S.custom || []).map((c, i) => {
      const pid = "cp-" + c.id;
      productMap[pid] = {
        id: pid, name: c.title, gender: c.gender, type: "top", cat: "tee", price: c.price, mrp: c.price, colors: ["white"], sizes: ["Free size"],
        seller: "you", brand: (S.user && S.user.name) || "You", city: S.location, rating: 0, reviews: 0, occ: ["casual"], season: ["all"], style: ["casual"],
        full: false, print: false, isNew: true, custom: true, photo: c.img,
      };
      return { id: "lc-" + c.id, title: c.title, gender: c.gender, items: [pid], tags: ["casual"], season: ["all"], fest: [], likes: 0, saves: 0, aspect: 1.3, creator: "you", bg: "sand", skin: 0, custom: true, photo: c.img };
    });
    allLooks = customLooks.reverse().concat(D.LOOKS);
    allLooks.forEach((l) => { lookMap[l.id] = l; });
  }
  CC.getProduct = (id) => productMap[id];
  CC.getLook = (id) => lookMap[id];
  CC.getCreator = (id) => creatorMap[id];
  CC.looks = () => allLooks;
  CC.products = () => Object.keys(productMap).map((k) => productMap[k]).filter((p) => !p.custom);
  CC.rebuildCatalog = rebuildCatalog;

  CC.resolve = (ref) => {
    const parts = String(ref).split(":"), p = productMap[parts[0]];
    if (!p) return null;
    const color = parts[1] || p.colors[0];
    return { p, color, hex: CC.art.hexOf(color) };
  };
  CC.discountPct = (price, mrp) => (mrp > price ? Math.round((1 - price / mrp) * 100) : 0);
  CC.lookInfo = (look) => {
    if (infoCache[look.id]) return infoCache[look.id];
    const items = look.items.map(CC.resolve).filter(Boolean);
    const total = items.reduce((s, i) => s + i.p.price, 0), mrp = items.reduce((s, i) => s + i.p.mrp, 0);
    return (infoCache[look.id] = { items, total, mrp, discount: CC.discountPct(total, mrp), colors: items.map((i) => i.color) });
  };
  CC.lookImage = (look, h) => {
    if (look.photo) return { uri: look.photo, spots: look.spots || { [look.items[0]]: { x: 50, y: 55 } }, ratio: look.aspect, photo: true };   // real photo: give look.spots = { productId: { x: %, y: % } } to place hotspots
    const info = CC.lookInfo(look);
    return CC.art.figure(info.items, { gender: look.gender, bg: look.bg, skin: look.skin, h: h || Math.round(400 * look.aspect) });
  };
  CC.productImage = (p, color) => p.photo || CC.art.thumb(p, color);
  CC.slotOf = (p) => p.type;
  CC.userSizeFor = (p) => {
    if (p.type === "accessory") return "Free size";
    if (p.type === "shoes") return p.sizes[Math.floor(p.sizes.length / 2)];
    return S.size && p.sizes.includes(S.size.size) ? S.size.size : (p.sizes.includes("M") ? "M" : p.sizes[0]);
  };
  CC.lookUrl = (id) => location.href.split("#")[0] + "#/look/" + id;
  CC.productUrl = (id) => location.href.split("#")[0] + "#/product/" + id;
  CC.starHTML = (r) => { const full = Math.round(r * 2) / 2; let s = ""; for (let i = 1; i <= 5; i++) s += `<i class="fa-${full >= i ? "solid" : full >= i - .5 ? "solid fa-star-half-stroke" : "regular"} fa-star" aria-hidden="true"></i>`; return `<span class="stars" role="img" aria-label="${r} out of 5">${s}</span>`; };

  /* ---------- scroll lock ---------- */
  const locks = new Set();
  CC.lock = (name, on) => { if (on) locks.add(name); else locks.delete(name); document.body.classList.toggle("no-scroll", locks.size > 0); };

  /* ---------- toast ---------- */
  let toastTimer = null;
  CC.toast = (message, icon) => {
    const el = $("#toast");
    el.innerHTML = `<i class="${icon || "fa-solid fa-circle-check"}" aria-hidden="true"></i><span></span>`;
    el.querySelector("span").textContent = message;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add("is-visible"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.classList.remove("is-visible"); setTimeout(() => { el.hidden = true; }, 260); }, 2600);
  };

  /* ---------- notifications ---------- */
  CC.notify = (title, body, link) => {
    S.notifs.unshift({ id: uid("n"), title, body: body || "", time: Date.now(), read: false, link: link || "" });
    S.notifs = S.notifs.slice(0, 30);
    CC.saveKey("notifs");
  };
  CC.timeAgo = (t) => { const m = Math.round((Date.now() - t) / 60000); if (m < 1) return "just now"; if (m < 60) return m + " min ago"; const h = Math.round(m / 60); if (h < 24) return h + " hr ago"; return Math.round(h / 24) + " d ago"; };

  /* ---------- clipboard + share ---------- */
  CC.copyText = (text) => new Promise((resolve) => {
    const fallback = () => {
      const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove(); resolve(ok);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => resolve(true), fallback); else fallback();
  });
  CC.share = async (data) => {
    if (navigator.share) { try { await navigator.share(data); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    const ok = await CC.copyText((data.text ? data.text + "\n" : "") + (data.url || ""));
    CC.toast(ok ? "Link copied — paste it anywhere to share" : "Couldn't copy. Please copy the link from the address bar.", ok ? "fa-solid fa-link" : "fa-solid fa-triangle-exclamation");
  };

  /* ---------- modal manager (stackable, Esc / backdrop / focus trap) ---------- */
  const stack = [];
  const focusables = (root) => $$("button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])", root).filter((el) => !el.disabled && el.getClientRects().length > 0);
  function openModal(content, opts) {
    opts = opts || {};
    const wrap = document.createElement("div");
    wrap.className = "modal is-generic";
    wrap.setAttribute("role", "dialog"); wrap.setAttribute("aria-modal", "true");
    if (opts.label) wrap.setAttribute("aria-label", opts.label);
    wrap.innerHTML = `<div class="modal-card size-${opts.size || "md"} ${opts.flush ? "flush" : ""}"><button class="icon-btn modal-x" type="button" aria-label="Close"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button><div class="modal-body"></div></div>`;
    const body = $(".modal-body", wrap);
    if (typeof content === "string") body.innerHTML = content; else body.appendChild(content);
    const handle = { el: wrap, body, opener: document.activeElement, opts };
    handle.close = () => closeModal(handle);
    $(".modal-x", wrap).addEventListener("click", handle.close);
    let downOnBackdrop = false;
    wrap.addEventListener("mousedown", (e) => { downOnBackdrop = e.target === wrap; });
    wrap.addEventListener("click", (e) => {
      if (e.target !== wrap || !downOnBackdrop || opts.sticky) return;
      if (opts.guard && opts.guard()) { const card = $(".modal-card", wrap); card.classList.remove("is-nudged"); void card.offsetWidth; card.classList.add("is-nudged"); return; }
      handle.close();
    });
    wrap.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const f = focusables(wrap); if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
    // the modal being covered stops being "live" for screen readers
    if (stack.length) stack[stack.length - 1].el.setAttribute("aria-hidden", "true");
    stack.push(handle);
    $("#modalRoot").appendChild(wrap);
    CC.lock("modal", true);
    // forms ask for a specific field; everything else focuses the dialog itself so no random link gets a focus ring
    const card = $(".modal-card", wrap); card.tabIndex = -1;
    ((opts.focus && $(opts.focus, wrap)) || card).focus({ preventScroll: true });   // fall back to the dialog if the wanted field isn't rendered yet
    return handle;
  }
  function closeModal(handle) {
    const i = stack.indexOf(handle); if (i < 0) return;
    stack.splice(i, 1); handle.el.remove();
    if (stack.length) stack[stack.length - 1].el.removeAttribute("aria-hidden");
    CC.lock("modal", stack.length > 0);
    if (handle.opener && handle.opener.isConnected && handle.opener.getClientRects().length) handle.opener.focus();
    if (handle.opts.onClose) handle.opts.onClose();
    CC.emit("modal:closed");
  }
  CC.modal = {
    open: openModal,
    closeTop() { if (stack.length) { stack[stack.length - 1].close(); return true; } return false; },
    closeAll() { while (stack.length) stack[stack.length - 1].close(); },
    isOpen: () => stack.length > 0,
  };

  /* Small reusable dialogs (used instead of window.prompt / confirm so they look right) */
  CC.promptDialog = (opts) => new Promise((resolve) => {
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };
    const m = openModal(`<form class="dlg" novalidate><h2 class="dlg-title">${esc(opts.title)}</h2>${opts.text ? `<p class="dlg-text">${esc(opts.text)}</p>` : ""}<div class="field"><label for="dlgInput" class="sr-only">${esc(opts.label || opts.title)}</label><input id="dlgInput" type="text" maxlength="${opts.max || 40}" value="${esc(opts.value || "")}" placeholder="${esc(opts.placeholder || "")}" autocomplete="off"><p class="field-error" id="dlgErr" role="alert" hidden></p></div><div class="modal-actions"><button type="button" class="btn-secondary" data-cancel>Cancel</button><button type="submit" class="btn-primary">${esc(opts.ok || "Save")}</button></div></form>`, { size: "sm", label: opts.title, onClose: () => done(null), focus: "#dlgInput" });
    const input = $("#dlgInput", m.el); input.select();
    $("[data-cancel]", m.el).addEventListener("click", m.close);
    $(".dlg", m.el).addEventListener("submit", (e) => {
      e.preventDefault();
      const v = input.value.trim();
      if (!v) { const er = $("#dlgErr", m.el); er.textContent = "Please enter a name."; er.hidden = false; input.focus(); return; }
      done(v); m.close();
    });
  });
  CC.confirmDialog = (opts) => new Promise((resolve) => {
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };
    const m = openModal(`<div class="dlg"><h2 class="dlg-title">${esc(opts.title)}</h2><p class="dlg-text">${esc(opts.text || "")}</p><div class="modal-actions"><button type="button" class="btn-secondary" data-cancel>Cancel</button><button type="button" class="btn-primary ${opts.danger ? "is-danger" : ""}" data-ok>${esc(opts.ok || "Confirm")}</button></div></div>`, { size: "sm", label: opts.title, onClose: () => done(false), focus: "[data-cancel]" });
    $("[data-cancel]", m.el).addEventListener("click", m.close);
    $("[data-ok]", m.el).addEventListener("click", () => { done(true); m.close(); });
  });

  /* ---------- actions: any element with data-act="name" data-id="…" ---------- */
  CC.actions = {};
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]"); if (!el) return;
    const fn = CC.actions[el.dataset.act]; if (!fn) return;
    if (fn(el.dataset, el, e) !== false && el.tagName !== "INPUT") e.preventDefault();
  });

  /* ---------- router (#/view/arg). Views are <section id="view-NAME"> ---------- */
  const views = {}; let current = null;
  function parseHash() { const h = location.hash.replace(/^#\/?/, ""); const parts = h.split("?")[0].split("/"); return { name: parts[0] || "home", arg: decodeURIComponent(parts.slice(1).join("/")) }; }
  function showView(name, arg) {
    const def = views[name]; if (!def) return false;
    $$(".view").forEach((v) => { v.hidden = v.id !== "view-" + (def.el || name); });
    const fromNav = def.nav || name;
    $$("[data-nav]").forEach((a) => { const on = a.dataset.nav === fromNav; a.classList.toggle("is-active", on); if (a.matches("a")) { if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); } });
    document.title = (def.title ? def.title + " · " : "") + "Chhota Closet";
    if (name !== current) window.scrollTo(0, 0);
    current = name;
    if (def.enter) def.enter(arg);
    CC.emit("view", name);
    return true;
  }
  function onHash() {
    const { name, arg } = parseHash();
    const q = location.hash.split("?")[1];
    if (q) { const ref = new URLSearchParams(q).get("ref"); if (ref) CC.emit("route:ref", { name, arg, ref }); }
    if (name === "look" || name === "product") {
      if (!current) showView("home");
      if (name === "look" && CC.openLook && CC.getLook(arg)) CC.openLook(arg);
      if (name === "product" && CC.openProduct && CC.getProduct(arg)) CC.openProduct(arg);
      history.replaceState(null, "", "#/" + (current === "home" ? "" : current));
      return;
    }
    if (!showView(name, arg)) showView("home");
    CC.modal.closeAll();
  }
  CC.router = {
    register(name, def) { views[name] = def; },
    go(path) { const target = "#/" + path; if (location.hash === target) onHash(); else location.hash = target; },
    start() { window.addEventListener("hashchange", onHash); onHash(); },
    current: () => current,
  };

  rebuildCatalog();
})(window.CC = window.CC || {});
