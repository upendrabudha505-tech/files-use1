/* ==========================================================================
   pins.js — the reusable fashion "pin" card + like / share actions
   boards.js logic (create / rename / delete / save / share) lives at the bottom
   ========================================================================== */
(function (CC) {
  "use strict";
  const { $, $$, esc, money, compact, S } = CC;

  /* ---------- likes (works for looks *and* products) ---------- */
  const isLiked = (id) => S.likes.indexOf(id) >= 0;
  function toggleLike(id) {
    const i = S.likes.indexOf(id);
    if (i >= 0) S.likes.splice(i, 1); else S.likes.push(id);
    CC.saveKey("likes");
    paintLike(id);
    return i < 0;
  }
  function paintLike(id) {
    const on = isLiked(id);
    $$(`[data-act="like"][data-id="${id}"]`).forEach((b) => {
      b.classList.toggle("is-saved", on); b.setAttribute("aria-pressed", on ? "true" : "false");
      const ic = $("i", b); if (ic) ic.className = (on ? "fa-solid" : "fa-regular") + " fa-heart";
    });
    const look = CC.getLook(id);
    if (look) $$(`[data-likes="${id}"]`).forEach((n) => { n.textContent = compact(look.likes + (on ? 1 : 0)); });
  }
  CC.pins = { isLiked, toggleLike, paintLike };

  /* ---------- pin card ---------- */
  function cardHTML(look) {
    const info = CC.lookInfo(look), img = CC.lookImage(look), liked = isLiked(look.id), saved = CC.boards.has(look.id);
    const cr = CC.getCreator(look.creator), g = look.gender === "girls" ? "girls" : "boys";
    const h = Math.round(400 * img.ratio);
    const pieces = info.items.length;
    return `<article class="card pin" data-look="${look.id}">
      <div class="card-media">
        <button class="pin-open" type="button" data-act="look" data-id="${look.id}" aria-label="Open ${esc(look.title)} and shop this look">
          <img src="${esc(img.uri)}" alt="${esc(look.title)} — ${pieces} piece ${g} outfit" loading="lazy" width="400" height="${h}">
        </button>
        <span class="tag ${g}">${g === "girls" ? "Girls" : "Boys"}</span>
        ${info.discount ? `<span class="pin-off">−${info.discount}%</span>` : ""}
        <div class="pin-tools">
          <button class="save-toggle ${liked ? "is-saved" : ""}" type="button" data-act="like" data-id="${look.id}" aria-pressed="${liked}" aria-label="Like ${esc(look.title)}"><i class="fa-${liked ? "solid" : "regular"} fa-heart" aria-hidden="true"></i></button>
          <button class="save-toggle ${saved ? "is-saved is-board" : ""}" type="button" data-act="save" data-id="${look.id}" aria-label="Save ${esc(look.title)} to a board"><i class="fa-${saved ? "solid" : "regular"} fa-bookmark" aria-hidden="true"></i></button>
          <button class="save-toggle" type="button" data-act="share" data-kind="look" data-id="${look.id}" aria-label="Share ${esc(look.title)}"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i></button>
          ${look.custom ? `<button class="save-toggle danger" type="button" data-act="deleteCustom" data-id="${look.id}" aria-label="Delete my pin"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button>` : ""}
        </div>
      </div>
      <div class="card-static-info">
        <h3>${esc(look.title)}</h3>
        <div class="pin-price"><span class="price">${money(info.total)}</span>${info.discount ? ` <s>${money(info.mrp)}</s>` : ""}</div>
        <div class="pin-meta">
          <img class="mini-avatar" src="${CC.art.avatar(cr.name)}" alt="" width="20" height="20"><span class="pin-by">${esc(cr.name)}</span>
          <span class="pin-likes"><i class="fa-solid fa-heart" aria-hidden="true"></i> <span data-likes="${look.id}">${compact(look.likes + (liked ? 1 : 0))}</span></span>
        </div>
        <button class="btn-shop" type="button" data-act="look" data-id="${look.id}"><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i> Shop This Look <span class="btn-shop-n">${pieces} pcs</span></button>
      </div>
    </article>`;
  }
  CC.pins.cardHTML = cardHTML;
  CC.pins.gridHTML = (looks) => looks.map(cardHTML).join("");

  /* ---------- actions ---------- */
  CC.actions.like = (d) => { const on = toggleLike(d.id); const l = CC.getLook(d.id), p = CC.getProduct(d.id); if (on) CC.toast(`Liked ${l ? l.title : p ? p.name : ""}`, "fa-solid fa-heart"); };
  CC.actions.look = (d) => CC.openLook(d.id);
  CC.actions.product = (d) => CC.openProduct(d.id, { color: d.color });
  CC.actions.share = (d) => {
    if (d.kind === "product") { const p = CC.getProduct(d.id); return CC.share({ title: p.name, text: `${p.name} — ${money(p.price)} on Chhota Closet`, url: CC.productUrl(p.id) }); }
    const l = CC.getLook(d.id), info = CC.lookInfo(l);
    CC.share({ title: l.title, text: `${l.title} — complete look ${money(info.total)} on Chhota Closet`, url: CC.lookUrl(l.id) });
  };
  CC.actions.deleteCustom = async (d) => {
    const l = CC.getLook(d.id); if (!l) return;
    if (!(await CC.confirmDialog({ title: "Delete this pin?", text: `“${l.title}” will be removed from the feed and your boards.`, ok: "Delete", danger: true }))) return;
    S.custom = S.custom.filter((c) => "lc-" + c.id !== d.id); CC.saveKey("custom");
    S.boards.forEach((b) => { b.pins = b.pins.filter((p) => p !== d.id); }); S.likes = S.likes.filter((x) => x !== d.id); CC.saveKey("boards"); CC.saveKey("likes");
    CC.rebuildCatalog(); CC.emit("catalog"); CC.toast("Pin deleted", "fa-regular fa-trash-can");
  };

  /* ==========================================================================
     Fashion Boards — data operations + "Save to board" picker + boards page
     ========================================================================== */
  const boards = CC.boards = {
    get: (id) => S.boards.find((b) => b.id === id),
    has: (lookId) => S.boards.some((b) => b.pins.indexOf(lookId) >= 0),
    create(name) { const b = { id: CC.uid("bd"), name: name.trim().slice(0, 40), pins: [] }; S.boards.push(b); CC.saveKey("boards"); return b; },
    rename(id, name) { const b = boards.get(id); if (b) { b.name = name.trim().slice(0, 40); CC.saveKey("boards"); } },
    remove(id) { S.boards = S.boards.filter((b) => b.id !== id); CC.saveKey("boards"); },
    toggle(boardId, lookId) {
      const b = boards.get(boardId), i = b.pins.indexOf(lookId);
      if (i >= 0) b.pins.splice(i, 1); else b.pins.unshift(lookId);
      CC.saveKey("boards"); paintSaved(lookId); return i < 0;
    },
    shareText(b) {
      const names = b.pins.map(CC.getLook).filter(Boolean).slice(0, 6).map((l) => "• " + l.title).join("\n");
      return `${b.name} — a fashion board on Chhota Closet (${b.pins.length} look${b.pins.length === 1 ? "" : "s"})` + (names ? "\n" + names : "");
    },
    coverHTML(b) {
      const looks = b.pins.map(CC.getLook).filter(Boolean).slice(0, 4);
      if (!looks.length) return `<div class="board-cover is-empty"><i class="fa-regular fa-bookmark" aria-hidden="true"></i></div>`;
      return `<div class="board-cover n${looks.length}">${looks.map((l) => `<img src="${esc(CC.lookImage(l).uri)}" alt="" loading="lazy">`).join("")}</div>`;
    },
  };
  function paintSaved(lookId) {
    const on = boards.has(lookId);
    $$(`[data-act="save"][data-id="${lookId}"]`).forEach((b) => { b.classList.toggle("is-saved", on); b.classList.toggle("is-board", on); const ic = $("i", b); if (ic) ic.className = (on ? "fa-solid" : "fa-regular") + " fa-bookmark"; });
  }

  boards.openPicker = (lookId) => {
    const look = CC.getLook(lookId); if (!look) return;
    const md = CC.modal.open(`<div class="dlg picker"><h2 class="dlg-title">Save to board</h2><p class="dlg-text">${esc(look.title)}</p><ul class="picker-list" id="pickerList"></ul>
      <form class="picker-new" id="pickerNew" novalidate><label class="sr-only" for="pickerName">New board name</label><input id="pickerName" type="text" maxlength="40" placeholder="New board, e.g. Tihar Fashion" autocomplete="off"><button class="btn-secondary btn-small" type="submit"><i class="fa-solid fa-plus" aria-hidden="true"></i> Create</button></form><p class="field-error" id="pickerErr" role="alert" hidden></p></div>`, { size: "sm", label: "Save to board", focus: "#pickerList button" });
    const list = $("#pickerList", md.el);
    const paint = () => {
      list.innerHTML = S.boards.length ? S.boards.map((b) => { const on = b.pins.indexOf(lookId) >= 0; return `<li><button type="button" class="picker-row ${on ? "is-on" : ""}" data-board="${b.id}" aria-pressed="${on}"><span class="picker-name">${esc(b.name)}</span><span class="picker-count">${b.pins.length} pin${b.pins.length === 1 ? "" : "s"}</span><i class="fa-solid ${on ? "fa-circle-check" : "fa-circle-plus"}" aria-hidden="true"></i></button></li>`; }).join("") : `<li class="muted">No boards yet — create your first one below.</li>`;
    };
    paint();
    const firstRow = $("button", list); if (firstRow) firstRow.focus();
    list.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-board]"); if (!btn) return;
      const added = boards.toggle(btn.dataset.board, lookId), b = boards.get(btn.dataset.board);
      CC.toast(added ? `Saved to “${b.name}”` : `Removed from “${b.name}”`, added ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark");
      paint(); const nb = $(`[data-board="${btn.dataset.board}"]`, list); if (nb) nb.focus();
    });
    $("#pickerNew", md.el).addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = $("#pickerName", md.el), err = $("#pickerErr", md.el), name = inp.value.trim();
      if (!name) { err.textContent = "Give your board a name first."; err.hidden = false; inp.focus(); return; }
      if (S.boards.some((b) => b.name.toLowerCase() === name.toLowerCase())) { err.textContent = "You already have a board with that name."; err.hidden = false; inp.focus(); return; }
      err.hidden = true;
      const b = boards.create(name); boards.toggle(b.id, lookId);
      CC.toast(`Saved to new board “${b.name}”`, "fa-solid fa-bookmark"); inp.value = ""; paint();
    });
  };

  /* ---------- boards page (#/boards and #/boards/ID) ---------- */
  function renderBoards(arg) {
    const host = $("#boardsHost");
    if (arg && boards.get(arg)) return renderBoard(host, boards.get(arg));
    host.innerHTML = `<div class="page-head"><div><p class="eyebrow">Fashion boards</p><h1>Your inspiration, organised.</h1><p class="lead">Save looks into boards like <em>Dashain 2026</em> or <em>Wedding Outfit</em>, then come back and shop them when you’re ready.</p></div><button class="btn-primary" type="button" data-act="newBoard"><i class="fa-solid fa-plus" aria-hidden="true"></i> Create board</button></div>
      ${S.boards.length ? `<div class="board-grid">${S.boards.map((b) => `<a class="board-card" href="#/boards/${b.id}" aria-label="Open board ${esc(b.name)}">${boards.coverHTML(b)}<div class="board-info"><h3>${esc(b.name)}</h3><p>${b.pins.length} pin${b.pins.length === 1 ? "" : "s"}</p></div></a>`).join("")}</div>` : `<div class="empty-state"><i class="fa-regular fa-bookmark big" aria-hidden="true"></i><p>No boards yet.</p><button class="btn-primary" type="button" data-act="newBoard">Create your first board</button></div>`}
      <div class="suggest-boards"><h2>Need ideas?</h2><div class="chip-row">${["My College Looks", "Dashain 2026", "Tihar Fashion", "Wedding Outfit", "Winter Collection", "Future Purchases"].filter((n) => !S.boards.some((b) => b.name === n)).map((n) => `<button class="filter-pill" type="button" data-act="quickBoard" data-name="${esc(n)}">+ ${esc(n)}</button>`).join("") || `<span class="muted">You’ve got them all — nice.</span>`}</div></div>`;
  }
  function renderBoard(host, b) {
    const looks = b.pins.map(CC.getLook).filter(Boolean);
    host.innerHTML = `<div class="page-head"><div><a class="back-link" href="#/boards"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> All boards</a><h1>${esc(b.name)}</h1><p class="lead">${looks.length} pin${looks.length === 1 ? "" : "s"}</p></div>
      <div class="head-actions"><button class="btn-secondary" type="button" data-act="renameBoard" data-id="${b.id}"><i class="fa-solid fa-pen" aria-hidden="true"></i> Rename</button><button class="btn-secondary" type="button" data-act="shareBoard" data-id="${b.id}"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i> Share</button><button class="btn-secondary danger" type="button" data-act="deleteBoard" data-id="${b.id}"><i class="fa-regular fa-trash-can" aria-hidden="true"></i> Delete</button></div></div>
      ${looks.length ? `<div class="gallery" id="boardGallery">${CC.pins.gridHTML(looks)}</div>` : `<div class="empty-state"><i class="fa-regular fa-bookmark big" aria-hidden="true"></i><p>This board is empty.</p><a class="btn-primary" href="#/">Find looks to save</a></div>`}`;
  }
  CC.router.register("boards", { title: "Fashion Boards", nav: "boards", enter: renderBoards });
  CC.on("change:boards", () => { if (CC.router.current() === "boards") renderBoards((location.hash.split("/")[2]) || ""); });

  CC.actions.save = (d) => boards.openPicker(d.id);
  CC.actions.newBoard = async () => {
    const name = await CC.promptDialog({ title: "Create a board", label: "Board name", placeholder: "e.g. Tihar Fashion", ok: "Create" });
    if (name) { const b = boards.create(name); CC.toast(`Board “${b.name}” created`, "fa-solid fa-bookmark"); CC.router.go("boards/" + b.id); }
  };
  CC.actions.quickBoard = (d) => { const b = boards.create(d.name); CC.toast(`Board “${b.name}” created`, "fa-solid fa-bookmark"); };
  CC.actions.renameBoard = async (d) => {
    const b = boards.get(d.id); const name = await CC.promptDialog({ title: "Rename board", value: b.name, ok: "Rename" });
    if (name) { boards.rename(d.id, name); CC.toast("Board renamed", "fa-solid fa-pen"); }
  };
  CC.actions.deleteBoard = async (d) => {
    const b = boards.get(d.id);
    if (await CC.confirmDialog({ title: `Delete “${b.name}”?`, text: "The looks inside stay on the feed — only this board is removed.", ok: "Delete board", danger: true })) { boards.remove(d.id); CC.toast("Board deleted", "fa-regular fa-trash-can"); CC.router.go("boards"); }
  };
  CC.actions.shareBoard = (d) => { const b = boards.get(d.id); CC.share({ title: b.name, text: boards.shareText(b), url: location.href.split("#")[0] + "#/boards" }); };
})(window.CC = window.CC || {});
