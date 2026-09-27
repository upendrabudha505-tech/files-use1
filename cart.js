/* ==========================================================================
   cart.js — cart drawer, delivery estimator, checkout (COD / eSewa / Khalti /
   Bank / QR — all simulated), orders.
   Delivery times & fees come from CC.data.DELIVERY, so they are easy to edit.
   ========================================================================== */
(function (CC) {
  "use strict";
  const { $, $$, esc, money, S } = CC;
  const DL = CC.data.DELIVERY;

  /* ---------- delivery estimator ---------- */
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmtDate = (d) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  function addWorkingDays(from, n) {
    const d = new Date(from); let added = 0;
    while (added < n) { d.setDate(d.getDate() + 1); if (DL.nonDeliveryWeekdays.indexOf(d.getDay()) < 0) added++; }
    return d;
  }
  function zoneFor(text) {
    const t = String(text || "").trim().toLowerCase();
    if (!t) return null;
    for (let i = 0; i < DL.zones.length; i++) {
      const z = DL.zones[i];
      if (z.match.some((m) => t.indexOf(m) >= 0)) return z;
    }
    return DL.zones.filter((z) => !z.match.length)[0] || null;   // the "everywhere else" zone
  }
  function estimate(zone) {
    const from = addWorkingDays(new Date(), zone.minDays), to = addWorkingDays(new Date(), zone.maxDays);
    const range = zone.minDays === zone.maxDays ? `${zone.minDays}` : `${zone.minDays}–${zone.maxDays}`;
    return { range, from, to, text: `${range} working days`, dates: `${fmtDate(from)} – ${fmtDate(to)}` };
  }
  function feeFor(zone, subtotal) {
    if (!zone) return 0;
    if (DL.freeShippingOver != null && subtotal >= DL.freeShippingOver) return 0;
    return zone.fee;
  }
  function estimateHTML(text, subtotal) {
    const z = zoneFor(text);
    if (!z) return `<span class="dlv-hint"><i class="fa-solid fa-location-dot"></i> Enter your city or area to see the delivery estimate.</span>`;
    const e = estimate(z), fee = feeFor(z, subtotal || 0);
    const feeTxt = fee === 0 ? `<b class="dlv-free">Free delivery</b>` : `Delivery ${money(fee)}` + (DL.freeShippingOver != null ? ` <span class="dlv-hint">(free over ${money(DL.freeShippingOver)})</span>` : "");
    return `<span class="dlv-ok"><i class="fa-solid fa-truck-fast"></i> <b>${esc(z.label)}</b> · about ${e.text}</span><span class="dlv-dates">Expected ${e.dates} · ${feeTxt}</span><span class="dlv-hint">${esc(DL.disclaimer)}</span>`;
  }
  CC.delivery = {
    zoneFor, estimate, feeFor, estimateHTML,
    /* renders "Deliver to [city]" + live estimate into a host element */
    mount(host, getSubtotal) {
      const id = CC.uid("loc");
      host.innerHTML = `<div class="dlv"><label class="dlv-label" for="${id}">Deliver to</label><div class="dlv-row"><input id="${id}" type="text" list="cityList" value="${esc(S.location)}" placeholder="Enter your location" autocomplete="off"></div><div class="dlv-out" aria-live="polite"></div></div>`;
      const input = $("input", host), out = $(".dlv-out", host);
      const paint = () => { out.innerHTML = estimateHTML(input.value, getSubtotal ? getSubtotal() : 0); };
      input.addEventListener("input", () => { S.location = input.value; CC.saveKey("location"); paint(); });
      paint();
      return { refresh: paint };
    },
  };

  /* ---------- cart data ---------- */
  const lineKey = (pid, size, color) => pid + "|" + size + "|" + color;
  const MAX_QTY = 10;
  function lines() {
    return S.cart.map((l) => { const p = CC.getProduct(l.pid); return p ? Object.assign({ p }, l) : null; }).filter(Boolean);
  }
  function totals() {
    const ls = lines(), subtotal = ls.reduce((s, l) => s + l.p.price * l.qty, 0), zone = zoneFor(S.location);
    const fee = ls.length ? feeFor(zone, subtotal) : 0;
    return { ls, subtotal, zone, fee, total: subtotal + fee, count: ls.reduce((s, l) => s + l.qty, 0) };
  }
  function add(pid, o) {
    o = o || {};
    const p = CC.getProduct(pid); if (!p) return;
    const size = o.size || CC.userSizeFor(p), color = o.color || p.colors[0], qty = o.qty || 1, key = lineKey(pid, size, color);
    const ex = S.cart.find((l) => l.key === key);
    if (ex) ex.qty = Math.min(MAX_QTY, ex.qty + qty); else S.cart.push({ key, pid, size, color, qty: Math.min(MAX_QTY, qty) });
    CC.saveKey("cart");
  }
  const cart = CC.cart = {
    add(pid, o) { add(pid, o); const p = CC.getProduct(pid); CC.toast(`Added “${p.name}” to cart`, "fa-solid fa-bag-shopping"); },
    addLook(refs, o) {
      o = o || {}; const items = refs.map((r) => (typeof r === "string" ? CC.resolve(r) : r)).filter(Boolean);
      items.forEach((it) => add(it.p.id, { color: it.color, size: (o.sizes && o.sizes[it.p.id]) || undefined }));
      const total = items.reduce((s, i) => s + i.p.price, 0);
      CC.toast(`${o.label || "Complete look"} added — ${items.length} item${items.length === 1 ? "" : "s"}, ${money(total)}`, "fa-solid fa-bag-shopping");
      if (o.open !== false) { CC.modal.closeAll(); cart.open(); }
    },
    buyNow(pid, o) { add(pid, o); CC.modal.closeAll(); cart.open(); },
    remove(key) { S.cart = S.cart.filter((l) => l.key !== key); CC.saveKey("cart"); },
    setQty(key, q) { const l = S.cart.find((x) => x.key === key); if (!l) return; if (q <= 0) return cart.remove(key); l.qty = Math.min(MAX_QTY, q); CC.saveKey("cart"); },
    count: () => S.cart.reduce((s, l) => s + l.qty, 0),
    totals,
    open() { render(); $("#cartDrawer").classList.add("is-open"); $("#cartDrawer").setAttribute("aria-hidden", "false"); $("#scrim").hidden = false; CC.lock("drawer", true); $("#closeCart").focus(); },
    close() { $("#cartDrawer").classList.remove("is-open"); $("#cartDrawer").setAttribute("aria-hidden", "true"); if (!$("#sellModal") || $("#sellModal").hidden) $("#scrim").hidden = true; CC.lock("drawer", false); },
    isOpen: () => $("#cartDrawer").classList.contains("is-open"),
  };

  /* ---------- drawer rendering ---------- */
  let etaMount = null;
  function render() {
    const t = totals(), body = $("#cartBody"), foot = $("#cartFoot");
    $("#cartTitleCount").textContent = t.count ? `(${t.count})` : "";
    if (!t.ls.length) {
      body.innerHTML = `<div class="cart-empty"><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i><p>Your cart is empty.</p><p class="muted">Tap “Shop This Look” on any pin to add a full outfit in one go.</p><a class="btn-primary" href="#/" data-act="closeCart">Browse looks</a></div>`;
      foot.innerHTML = ""; foot.hidden = true; etaMount = null; return;
    }
    foot.hidden = false;
    body.innerHTML = `<ul class="cart-list">${t.ls.map((l) => `
      <li class="cart-item">
        <img src="${CC.productImage(l.p, l.color)}" alt="" width="72" height="72">
        <div class="cart-item-body">
          <h4><a href="#" data-act="product" data-id="${l.p.id}">${esc(l.p.name)}</a></h4>
          <p class="cart-meta">${l.size !== "Free size" ? "Size " + esc(l.size) + " · " : ""}${esc(CC.cap(l.color))}</p>
          <span class="price">${money(l.p.price)}</span>
          <div class="qty-row" role="group" aria-label="Quantity for ${esc(l.p.name)}">
            <button type="button" data-act="qty" data-key="${esc(l.key)}" data-d="-1" aria-label="Decrease quantity"><i class="fa-solid fa-minus" aria-hidden="true"></i></button>
            <span aria-live="polite">${l.qty}</span>
            <button type="button" data-act="qty" data-key="${esc(l.key)}" data-d="1" aria-label="Increase quantity" ${l.qty >= MAX_QTY ? "disabled" : ""}><i class="fa-solid fa-plus" aria-hidden="true"></i></button>
            <button type="button" class="remove-item" data-act="removeLine" data-key="${esc(l.key)}">Remove</button>
          </div>
        </div>
      </li>`).join("")}</ul>`;
    foot.innerHTML = `
      <div class="foot-scroll">
        <div id="cartEta"></div>
        <fieldset class="pay-methods"><legend>Payment method</legend>
          <div class="pay-grid">${CC.data.PAYMENTS.map((m) => `<label class="pay-opt ${S.payment === m.id ? "is-on" : ""}"><input type="radio" name="pay" value="${m.id}" ${S.payment === m.id ? "checked" : ""}><span>${esc(m.label)}</span></label>`).join("")}</div>
          <p class="pay-note" id="payNote"></p>
        </fieldset>
        <fieldset class="pay-plans" id="payPlans" hidden><legend>How much to pay now</legend>
          <div class="plan-grid">${CC.data.PAY_PLANS.filter((pl) => pl.id !== "cod").map((pl) => `<label class="plan-opt ${S.payPlan === pl.id ? "is-on" : ""}"><input type="radio" name="payplan" value="${pl.id}"><span><b>${esc(pl.label)}</b>${pl.tag ? `<em>${esc(pl.tag)}</em>` : ""}<small>${esc(pl.note)}</small></span></label>`).join("")}</div>
        </fieldset>
      </div>
      <div class="foot-total">
        <div class="sum" id="cartSum"></div>
        <button class="btn-primary btn-block" id="placeOrder" type="button"><i class="fa-solid fa-lock" aria-hidden="true"></i> <span></span></button>
        <p class="muted small center"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Advance payments are refundable — see <button type="button" class="link-btn" data-act="refundInfo">refund policy</button>. Demo checkout — no real payment is taken.</p>
      </div>`;
    etaMount = CC.delivery.mount($("#cartEta"), () => totals().subtotal);
    $("#cartEta input").addEventListener("input", paintSummary);
    $$("input[name=pay]", foot).forEach((r) => r.addEventListener("change", () => { S.payment = r.value; CC.saveKey("payment"); $$(".pay-opt", foot).forEach((o) => o.classList.toggle("is-on", $("input", o).checked)); paintSummary(); }));
    $$("input[name=payplan]", foot).forEach((r) => r.addEventListener("change", () => { S.payPlan = r.value; CC.saveKey("payPlan"); $$(".plan-opt", foot).forEach((o) => o.classList.toggle("is-on", $("input", o).checked)); paintSummary(); }));
    $("#placeOrder").addEventListener("click", startCheckout);
    paintSummary();
  }
  function planAmounts(total) {
    if (S.payment === "cod") return { plan: "cod", paidNow: 0, dueOnDelivery: total, refundable: 0 };
    const pl = CC.data.PAY_PLANS.find((p) => p.id === S.payPlan) || CC.data.PAY_PLANS[0];
    const paidNow = pl.id === "advance" ? Math.round(total * (pl.pct / 100)) : total;
    return { plan: pl.id, paidNow, dueOnDelivery: total - paidNow, refundable: paidNow };
  }
  function paintSummary() {
    const t = totals(); if (!$("#cartSum")) return;
    if (etaMount) etaMount.refresh();
    const method = CC.data.PAYMENTS.find((m) => m.id === S.payment), label = method.label;
    $("#payNote").textContent = method.note;
    const plans = $("#payPlans"); if (plans) plans.hidden = S.payment === "cod";
    const pa = planAmounts(t.total);
    $("#cartSum").innerHTML = `<div><span>Subtotal</span><b>${money(t.subtotal)}</b></div><div><span>Delivery${t.zone ? " · " + esc(t.zone.label) : ""}</span><b>${t.zone ? (t.fee ? money(t.fee) : "Free") : "—"}</b></div><div class="sum-total"><span>Total</span><b>${money(t.total)}</b></div>${S.payment !== "cod" ? `<div class="sum-plan"><span>${pa.plan === "advance" ? "Pay now (refundable)" : "Pay now"}</span><b>${money(pa.paidNow)}</b></div>${pa.dueOnDelivery ? `<div class="sum-plan"><span>Due on delivery</span><b>${money(pa.dueOnDelivery)}</b></div>` : ""}` : ""}`;
    $("#placeOrder span").textContent = S.payment === "cod" ? `Place order · ${money(t.total)}` : `Pay ${money(pa.paidNow)} with ${label}`;
  }
  CC.on("change:cart", () => {
    const n = cart.count(), b = $("#cartBadge");
    b.textContent = n; b.hidden = n === 0;
    if (cart.isOpen()) render();
  });

  /* ---------- checkout ---------- */
  function startCheckout() {
    const t = totals();
    if (!t.zone) { CC.toast("Please enter your delivery location first", "fa-solid fa-location-dot"); $("#cartEta input").focus(); return; }
    if (S.payment === "cod") return placeOrder(false);
    const pa = planAmounts(t.total);
    const m = CC.data.PAYMENTS.find((x) => x.id === S.payment), ref = "CC-" + String(Date.now()).slice(-6);
    let inner = "";
    const planLine = pa.plan === "advance" ? `<p class="pill-note refundable-note"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> ${money(pa.paidNow)} refundable advance · ${money(pa.dueOnDelivery)} due on delivery</p>` : "";
    if (m.id === "qr") inner = `<div class="qr-box">${CC.art.qr(pa.paidNow)}</div>${planLine}<p class="dlg-text">Scan with any QR-enabled Nepali mobile banking or wallet app, then confirm below.</p>`;
    else if (m.id === "bank") inner = `<dl class="bank-box"><dt>Bank</dt><dd>Demo Bank Nepal Ltd.</dd><dt>Account name</dt><dd>Chhota Closet Pvt. Ltd.</dd><dt>Account no.</dt><dd>0000 0000 0000</dd><dt>Reference</dt><dd>${ref}</dd></dl>${planLine}<p class="dlg-text">Transfer the exact amount using mobile or internet banking, then confirm below.</p>`;
    else inner = `<div class="wallet-box wallet-${m.id}"><i class="fa-solid fa-wallet" aria-hidden="true"></i><b>${esc(m.label)}</b></div>${planLine}<p class="dlg-text">In a live store you would be redirected to ${esc(m.label)} to approve this payment. Here, tap the button to simulate a successful payment.</p>`;
    const md = CC.modal.open(`<div class="dlg pay-dlg"><h2 class="dlg-title">Pay ${money(pa.paidNow)}</h2><p class="pill-note">Demo only — no money moves</p>${inner}<div class="modal-actions"><button type="button" class="btn-secondary" data-cancel>Back</button><button type="button" class="btn-primary" data-ok>${m.id === "bank" || m.id === "qr" ? "I've paid" : "Pay with " + esc(m.label)}</button></div></div>`, { size: "sm", label: "Payment", focus: "[data-ok]" });
    $("[data-cancel]", md.el).addEventListener("click", md.close);
    $("[data-ok]", md.el).addEventListener("click", () => { md.close(); placeOrder(true, ref); });
  }
  function placeOrder(paid, ref) {
    const t = totals(), z = t.zone, e = estimate(z), m = CC.data.PAYMENTS.find((x) => x.id === S.payment), pa = planAmounts(t.total);
    const attrib = S.attrib && (Date.now() - S.attrib.t) < 60 * 60e3 ? S.attrib : null;   // attribute to the last Reel/Story/link tap within the last hour
    const status = !paid ? "Confirmed · pay on delivery" : pa.plan === "advance" ? `Paid ${money(pa.paidNow)} · preparing` : "Paid in full · preparing";
    const order = {
      id: ref || "CC-" + String(Date.now()).slice(-6), date: Date.now(), status, stage: "placed",
      method: m.label, location: S.location, zone: z.label, eta: e.text, etaDates: e.dates, subtotal: t.subtotal, fee: t.fee, total: t.total,
      plan: pa.plan, paidNow: pa.paidNow, dueOnDelivery: pa.dueOnDelivery, refundable: pa.refundable, refundStatus: "none",
      attribCh: attrib ? attrib.ch : null, attribAt: attrib ? attrib.t : null,
      lines: t.ls.map((l) => ({ name: l.p.name, size: l.size, color: l.color, qty: l.qty, price: l.p.price, pid: l.p.id })),
    };
    S.orders.unshift(order); CC.saveKey("orders");
    S.cart = []; CC.saveKey("cart");
    CC.notify(`Order ${order.id} confirmed`, `Expected ${e.dates} (${z.label}).`, "#/orders");
    cart.close();
    const advanceNote = pa.plan === "advance" ? `<p class="dlg-text"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> You paid a <b>${money(pa.paidNow)} refundable advance</b>; the remaining ${money(pa.dueOnDelivery)} is due on delivery. Cancel any time before it ships for a full refund.</p>` : "";
    const md = CC.modal.open(`<div class="dlg success-dlg"><div class="success-mark"><i class="fa-solid fa-check" aria-hidden="true"></i></div><h2 class="dlg-title">Order placed!</h2><p class="dlg-text">Thank you. Your order <b>${esc(order.id)}</b> for ${money(order.total)} is confirmed.</p>${advanceNote}<p class="dlg-text">Expected ${esc(order.etaDates)} to <b>${esc(order.location)}</b>. ${esc(DL.disclaimer)}</p><div class="modal-actions"><button type="button" class="btn-secondary" data-cancel>Keep browsing</button><button type="button" class="btn-primary" data-ok>View my orders</button></div></div>`, { size: "sm", label: "Order confirmation", focus: "[data-ok]" });
    $("[data-cancel]", md.el).addEventListener("click", md.close);
    $("[data-ok]", md.el).addEventListener("click", () => { md.close(); CC.router.go("orders"); });
  }

  /* ---------- actions ---------- */
  CC.actions.qty = (d) => { const l = S.cart.find((x) => x.key === d.key); if (l) cart.setQty(d.key, l.qty + Number(d.d)); };
  CC.actions.removeLine = (d) => cart.remove(d.key);
  CC.actions.closeCart = () => { cart.close(); return false; };
  CC.actions.openCart = () => cart.open();
  CC.actions.addToCart = (d) => cart.add(d.id);

  CC.emit("change:cart");
})(window.CC = window.CC || {});
