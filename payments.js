/* ==========================================================================
   payments.js — the refundable-advance payment system
   · at checkout the buyer can pay a 50% advance (refundable), pay in full, or
     pay cash on delivery — see the "Payment plan" fieldset added in cart.js
   · every order remembers what was paid now, what's due on delivery, and how
     much of that is refundable
   · orders can be cancelled up to the point they're packed for a full refund
     of the advance; a delivered parcel can still be returned within the
     return window for a full refund of everything paid (see CC.data.REFUND)
   ========================================================================== */
(function (CC) {
  "use strict";
  const { $, $$, esc, money, S } = CC;
  const R = CC.data.REFUND;
  const STAGES = ["placed", "confirmed", "packed", "shipped", "delivered"];

  function canCancel(o) { return o.status.indexOf("Cancelled") < 0 && o.status.indexOf("Returned") < 0 && R.cancelStages.indexOf(o.stage || "placed") >= 0; }
  function planBadge(o) {
    if (o.plan === "advance") return `<span class="pay-badge is-advance"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> ${money(o.paidNow)} paid · refundable</span>`;
    if (o.plan === "full") return `<span class="pay-badge is-full"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Paid in full</span>`;
    return `<span class="pay-badge is-cod"><i class="fa-solid fa-truck" aria-hidden="true"></i> Cash on delivery</span>`;
  }
  function attribBadge(o) {
    if (!o.attribCh) return "";
    const label = o.attribCh === "reel" ? "Reel" : o.attribCh === "story" ? "Story" : "shared link";
    return `<span class="attrib-badge"><i class="fa-solid ${o.attribCh === "reel" ? "fa-clapperboard" : o.attribCh === "story" ? "fa-camera-retro" : "fa-link"}" aria-hidden="true"></i> via ${label}</span>`;
  }

  CC.orderCardHTML = function (o) {
    o.stage = o.stage || "placed"; o.plan = o.plan || "cod"; o.paidNow = o.paidNow || 0; o.dueOnDelivery = o.dueOnDelivery != null ? o.dueOnDelivery : o.total; o.refundable = o.refundable || 0; o.refundStatus = o.refundStatus || "none";
    const cancellable = canCancel(o);
    return `<li class="order-card"><div class="oc-head"><div><b>${esc(o.id)}</b><small>${new Date(o.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · ${esc(o.method)}</small></div><span class="status-pill">${esc(o.status)}</span></div>
      <div class="oc-badges">${planBadge(o)}${attribBadge(o)}</div>
      ${o.status.indexOf("Cancelled") < 0 ? `<ol class="oc-stages" aria-label="Order progress">${STAGES.map((s, i) => `<li class="${STAGES.indexOf(o.stage) >= i ? "is-done" : ""}">${esc(CC.cap(s))}</li>`).join("")}</ol>` : ""}
      <ul class="oc-lines">${o.lines.map((l) => `<li><span>${l.qty} × ${esc(l.name)}${l.size && l.size !== "Free size" ? ` <small>(${esc(l.size)}, ${esc(CC.cap(l.color))})</small>` : ""}</span><b>${money(l.price * l.qty)}</b></li>`).join("")}</ul>
      <div class="oc-money"><span>Paid now</span><b>${money(o.paidNow)}</b></div>${o.dueOnDelivery ? `<div class="oc-money"><span>Due on delivery</span><b>${money(o.dueOnDelivery)}</b></div>` : ""}
      ${o.refundStatus === "pending" ? `<p class="refund-note is-pending"><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> Refund of ${money(o.refundable)} is processing — usually ${R.refundWorkingDays[0]}–${R.refundWorkingDays[1]} working days.</p>` : ""}
      ${o.refundStatus === "refunded" ? `<p class="refund-note is-done"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> ${money(o.refundable)} refunded to your original payment method.</p>` : ""}
      <div class="oc-foot"><span><i class="fa-solid fa-truck-fast" aria-hidden="true"></i> Expected ${esc(o.etaDates)} to ${esc(o.location)}</span><b>Total ${money(o.total)}</b></div>
      <div class="oc-actions">
        <button class="btn-secondary btn-small" type="button" data-act="reorder" data-id="${o.id}">Order again</button>
        ${cancellable ? `<button class="btn-secondary btn-small danger" type="button" data-act="cancelOrder" data-id="${o.id}"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Cancel &amp; refund</button>` : ""}
        ${o.stage === "delivered" && o.refundStatus === "none" ? `<button class="btn-secondary btn-small" type="button" data-act="returnOrder" data-id="${o.id}"><i class="fa-solid fa-box-open" aria-hidden="true"></i> Request return</button>` : ""}
        ${!cancellable && o.stage !== "delivered" && o.status.indexOf("Cancelled") < 0 ? `<button class="btn-secondary btn-small" type="button" data-act="advanceOrder" data-id="${o.id}"><i class="fa-solid fa-forward" aria-hidden="true"></i> Simulate next stage</button>` : ""}
      </div></li>`;
  };

  function refresh() { if (CC.router.current() === "orders") { const host = $("#ordersHost"); const list = host && $(".order-list", host); if (list) list.outerHTML = `<ul class="order-list">${S.orders.map(CC.orderCardHTML).join("")}</ul>`; } }

  CC.actions.cancelOrder = async (d) => {
    const o = S.orders.find((x) => x.id === d.id); if (!o) return;
    const ok = await confirmCancel(o);
    if (!ok) return;
    o.status = o.paidNow ? `Cancelled · ${money(o.refundable)} refund processing` : "Cancelled";
    o.stage = "cancelled";
    if (o.refundable) { o.refundStatus = "pending"; setTimeout(() => { o.refundStatus = "refunded"; o.status = `Cancelled · ${money(o.refundable)} refunded`; CC.saveKey("orders"); refresh(); CC.notify("Refund complete", `${money(o.refundable)} for ${o.id} is back with you.`, "#/orders"); }, 4000); }
    CC.saveKey("orders"); refresh();
    CC.toast(o.refundable ? `Order cancelled — ${money(o.refundable)} refund is on its way` : "Order cancelled", "fa-solid fa-rotate-left");
  };
  function confirmCancel(o) {
    return new Promise((resolve) => {
      const md = CC.modal.open(`<div class="dlg"><h2 class="dlg-title">Cancel this order?</h2><p class="dlg-text">${o.refundable ? `Your ${money(o.refundable)} advance will be refunded in full to your original payment method, usually within ${R.refundWorkingDays[0]}–${R.refundWorkingDays[1]} working days.` : "This order has nothing paid yet, so there's nothing to refund."}</p><div class="modal-actions"><button type="button" class="btn-secondary" data-no>Keep order</button><button type="button" class="btn-primary is-danger" data-yes>Cancel order</button></div></div>`, { size: "sm", label: "Cancel order", focus: "[data-no]" });
      $("[data-no]", md.el).addEventListener("click", () => { md.close(); resolve(false); });
      $("[data-yes]", md.el).addEventListener("click", () => { md.close(); resolve(true); });
    });
  }
  CC.actions.returnOrder = (d) => {
    const o = S.orders.find((x) => x.id === d.id); if (!o) return;
    o.refundStatus = "pending"; o.status = `Return requested · ${money(o.total)} refund processing`; CC.saveKey("orders"); refresh();
    CC.toast("Return requested — we'll email you a pickup slip", "fa-solid fa-box-open");
    setTimeout(() => { o.refundStatus = "refunded"; o.status = `Returned · ${money(o.total)} refunded`; CC.saveKey("orders"); refresh(); CC.notify("Refund complete", `${money(o.total)} for ${o.id} is back with you.`, "#/orders"); }, 5000);
  };
  /* demo-only: step an order through placed → confirmed → packed → shipped → delivered */
  CC.actions.advanceOrder = (d) => {
    const o = S.orders.find((x) => x.id === d.id); if (!o) return;
    const i = STAGES.indexOf(o.stage || "placed");
    if (i < STAGES.length - 1) { o.stage = STAGES[i + 1]; o.status = o.stage === "delivered" ? (o.dueOnDelivery ? `Delivered · ${money(o.dueOnDelivery)} collected` : "Delivered") : CC.cap(o.stage) + (o.paidNow ? ` · ${money(o.paidNow)} paid` : ""); CC.saveKey("orders"); refresh(); }
  };

  CC.actions.refundInfo = () => {
    CC.modal.open(`<div class="dlg refund-dlg"><h2 class="dlg-title"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Refund policy</h2>
      <ul class="refund-list">${R.rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
      <p class="muted small">Return window: ${R.returnWindowDays} days after delivery · Refunds: ${R.refundWorkingDays[0]}–${R.refundWorkingDays[1]} working days.</p></div>`, { size: "sm", label: "Refund policy" });
    return false;
  };
})(window.CC = window.CC || {});
