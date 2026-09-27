/* ==========================================================================
   editor.js — the creation Studio behind every auto-generated Story & Reel
   Opened from: Share sheet (Story/Reel), product "Create Reel", Story "Save as Reel".
   Lets the user pick the image, add text/stickers/emoji/music (Story) or a
   caption, hashtags and music (Reel), see a live 9:16 preview, then publish.
   ========================================================================== */
(function (CC) {
  "use strict";
  const { $, $$, esc, money, S } = CC;

  const STICKERS = ["🔥", "✨", "😍", "🛍️", "💯", "🎉", "👑", "💫", "❤️", "🌟"];
  const MUSIC = ["No music", "Lo-fi Beats", "Chill Vibes", "Golden Hour", "Beat Drop", "Dohori Mix", "Diyo Ko Ujyalo"];

  function frameHTML(mode, m, st) {
    const disc = m.discount ? `<span class="stf-disc">−${m.discount}%</span>` : "";
    return `<div class="studio-canvas" style="background-image:url('${esc(st.img)}')">
      <div class="studio-scrim"></div>
      ${st.stickers.length ? `<div class="studio-stickers">${st.stickers.map((e, i) => `<span class="studio-sticker" style="--i:${i}">${e}</span>`).join("")}</div>` : ""}
      ${mode === "story" && st.text ? `<p class="studio-text">${esc(st.text)}</p>` : ""}
      <div class="studio-strip"><div><b>${esc(m.title)}</b><span>${m.price ? money(m.price) : ""} ${m.mrp > m.price ? `<s>${money(m.mrp)}</s>` : ""} ${disc}</span><small>${esc(m.owner.name)} · ${esc(m.owner.country || "Nepal")}</small></div><span class="studio-cta">${esc(m.cta.label)}</span></div>
      ${st.music !== "No music" ? `<p class="studio-music"><i class="fa-solid fa-music" aria-hidden="true"></i> ${esc(st.music)}</p>` : ""}
    </div>`;
  }

  CC.studio = {};
  CC.studio.open = function (opts) {
    const mode = opts.mode === "reel" ? "reel" : "story", m = opts.model;
    if (!m) return;
    const st = { img: m.images[0], text: "", stickers: [], music: "No music", caption: opts.prefillCaption || m.caption || "", tags: (m.tags || []).join(" ") };
    const md = CC.modal.open(`<div class="studio" id="studio"></div>`, { size: "lg", label: (mode === "reel" ? "Create Reel" : "Create Story") });
    const root = $("#studio", md.el);

    function paint() {
      root.innerHTML = `<h2 class="dlg-title">${mode === "reel" ? "🎬 Create Reel" : "📸 Create Story"}</h2>
        <div class="studio-grid">
          <div class="studio-preview">${frameHTML(mode, m, st)}</div>
          <div class="studio-controls">
            ${m.images.length > 1 ? `<p class="studio-label">Media</p><div class="studio-thumbs">${m.images.map((src, i) => `<button type="button" class="studio-thumb ${src === st.img ? "is-on" : ""}" data-pick-img="${i}"><img src="${esc(src)}" alt=""></button>`).join("")}</div>` : ""}

            ${mode === "story" ? `<label class="studio-label" for="stText">Text</label><input id="stText" type="text" maxlength="60" placeholder="Say something…" value="${esc(st.text)}">` :
              `<label class="studio-label" for="rlCaption">Caption</label><textarea id="rlCaption" rows="2" maxlength="220" placeholder="Write a caption…">${esc(st.caption)}</textarea>
               <label class="studio-label" for="rlTags">Hashtags</label><input id="rlTags" type="text" maxlength="140" value="${esc(st.tags)}" placeholder="#fashion #nepal">`}

            <p class="studio-label">Stickers &amp; emoji</p><div class="studio-emoji">${STICKERS.map((e) => `<button type="button" class="emoji-btn" data-add-emoji="${e}">${e}</button>`).join("")}${st.stickers.length ? `<button type="button" class="link-btn" id="clearStickers">Clear</button>` : ""}</div>

            <label class="studio-label" for="stMusic">Music</label><select id="stMusic">${MUSIC.map((mm) => `<option ${mm === st.music ? "selected" : ""}>${esc(mm)}</option>`).join("")}</select>

            <button type="button" class="btn-primary btn-block studio-publish" id="studioPublish"><i class="fa-solid ${mode === "reel" ? "fa-clapperboard" : "fa-camera-retro"}" aria-hidden="true"></i> ${mode === "reel" ? "Publish Reel" : "Post Story"}</button>
            <p class="muted small">${mode === "reel" ? "Your Reel appears in the main Reels feed for everyone." : "Your Story is visible for 24 hours, or save it to a Highlight."}</p>
          </div></div>`;
      $$("[data-pick-img]", root).forEach((b) => b.addEventListener("click", () => { st.img = m.images[+b.dataset.pickImg]; paint(); }));
      $$("[data-add-emoji]", root).forEach((b) => b.addEventListener("click", () => { if (st.stickers.length < 6) st.stickers.push(b.dataset.addEmoji); paint(); }));
      const cs = $("#clearStickers", root); if (cs) cs.addEventListener("click", () => { st.stickers = []; paint(); });
      const ti = $("#stText", root); if (ti) ti.addEventListener("input", () => { st.text = ti.value; $(".studio-preview", root).innerHTML = frameHTML(mode, m, st); });
      const cap = $("#rlCaption", root); if (cap) cap.addEventListener("input", () => { st.caption = cap.value; });
      const tags = $("#rlTags", root); if (tags) tags.addEventListener("input", () => { st.tags = tags.value; });
      $("#stMusic", root).addEventListener("change", (e) => { st.music = e.target.value; $(".studio-preview", root).innerHTML = frameHTML(mode, m, st); });
      $("#studioPublish", root).addEventListener("click", () => {
        if (mode === "story") { CC.stories.publish(m, { text: st.text, stickers: st.stickers, music: st.music === "No music" ? null : st.music }); }
        else { const tagList = st.tags.split(/\s+/).map((t) => t.trim()).filter(Boolean).map((t) => (t[0] === "#" ? t : "#" + t)); CC.reels.publish(m, { caption: st.caption, tags: tagList, music: st.music === "No music" ? null : st.music }); }
        md.close();
      });
      (ti || cap || root).focus();
    }
    paint();
  };

  /* entry points -------------------------------------------------------- */
  CC.actions.createReel = (d) => { const m = CC.shareModel(d.kind || "product", d.id, d); if (m) CC.studio.open({ mode: "reel", model: m }); };
})(window.CC = window.CC || {});
