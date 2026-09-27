/* ==========================================================================
   art.js — procedural fashion illustrations (no image files needed)
   figure(items, opts)  -> a dressed figure + hotspot coordinates
   thumb(product, col)  -> a flat product picture
   The same code draws everywhere, so hotspots always land on the right garment.
   Replace with real photography any time: give a look/product a `photo` URL.
   ========================================================================== */
(function (CC) {
  "use strict";
  const { COLORS } = CC.data;
  const hexOf = (c) => (c && c[0] === "#") ? c : (COLORS[c] || "#888888");

  function shade(h, amt) {
    const n = parseInt(h.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
    return "#" + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
  }
  const contrast = (h) => { const n = parseInt(h.slice(1), 16); const y = ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000; return y > 150 ? "#20263b" : "#ffffff"; };
  const uri = (svg) => "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rnd = (seed) => { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };

  const SKINS = ["#f2c8a6", "#e6b48c", "#cf9670", "#a86f4c"];
  const HAIR = "#2b2421";
  const GOLD = "#e5b53c";

  /* ---------- geometry helpers (figure lives in a 400 x 640 space) ---------- */
  const X = (side, d) => 200 + side * d;
  const legPath = (side, y0, y1, ho, hi, bo, bi) => `M${X(side, ho)},${y0} L${X(side, hi)},${y0} L${X(side, bi)},${y1} L${X(side, bo)},${y1} Z`;
  const armPt = (side, t) => { const sx = 200 + side * 50, sy = 164, wx = 200 + side * 98, wy = 318; return [sx + (wx - sx) * t, sy + (wy - sy) * t]; };
  const armLine = (side, t0, t1, w, col) => { const a = armPt(side, t0), b = armPt(side, t1); return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`; };
  const sleeves = (c, len, w) => armLine(-1, 0, len, w || 34, c) + armLine(1, 0, len, w || 34, c);
  const cuffs = (c, len) => { const l = len || .84; return armLine(-1, l - .1, l, 34, shade(c, -.18)) + armLine(1, l - .1, l, 34, shade(c, -.18)); };
  const torso = (c, hem, wt, wh) => { wt = wt || 52; wh = wh || 62; return `<path d="M${200 - wt},150 Q200,138 ${200 + wt},150 L${200 + wh},${hem - 8} Q200,${hem + 8} ${200 - wh},${hem - 8} Z" fill="${c}"/>`; };
  const neck = (c, wide) => `<path d="M${wide ? 168 : 176},148 Q200,${wide ? 180 : 172} ${wide ? 232 : 224},148" fill="none" stroke="${shade(c, -.28)}" stroke-width="6" stroke-linecap="round"/>`;
  const collar = (c) => { const w = shade(c, c === "#f6f3ee" ? -.06 : .28); return `<path d="M174,146 L200,180 L188,144 Z" fill="${w}"/><path d="M226,146 L200,180 L212,144 Z" fill="${w}"/>`; };
  const dots = (ys, c) => ys.map((y) => `<circle cx="200" cy="${y}" r="3" fill="${shade(c, .4)}"/>`).join("");
  const mark = (c, y) => { const a = contrast(c); return `<circle cx="200" cy="${y}" r="20" fill="none" stroke="${a}" stroke-width="4" opacity=".85"/><path d="M200,${y - 32} v-8 M200,${y + 32} v8 M168,${y} h-8 M232,${y} h8" stroke="${a}" stroke-width="4" stroke-linecap="round" opacity=".85"/>`; };

  /* ---------- tops ---------- */
  const TOPS = {
    tee: (c, o) => sleeves(c, .42, 36) + torso(c, 334) + neck(c) + (o.print ? mark(c, 236) : ""),
    croptee: (c, o) => sleeves(c, .4, 34) + torso(c, 292, 52, 56) + neck(c) + (o.print ? mark(c, 224) : ""),
    ribtop: (c) => sleeves(c, .3, 30) + torso(c, 320, 50, 54) + neck(c, true) + [196, 212, 228, 244, 260, 276, 292, 308].map((y) => `<path d="M152,${y} Q200,${y + 6} 248,${y}" stroke="${shade(c, -.1)}" stroke-width="2" fill="none"/>`).join(""),
    polo: (c) => sleeves(c, .42, 36) + torso(c, 334) + collar(c) + `<line x1="200" y1="178" x2="200" y2="216" stroke="${shade(c, -.3)}" stroke-width="3"/>` + dots([190, 204], c) + `<path d="M138,196 h124" stroke="${shade(c, .35)}" stroke-width="7" opacity=".5"/><path d="M140,222 h120 M141,248 h118 M142,274 h116" stroke="${shade(c, .35)}" stroke-width="7" opacity=".5"/>`,
    shirt: (c) => sleeves(c, .84, 30) + cuffs(c) + torso(c, 336) + collar(c) + `<line x1="200" y1="180" x2="200" y2="336" stroke="${shade(c, -.16)}" stroke-width="2.5"/>` + dots([196, 224, 252, 280, 308], c) + `<rect x="150" y="232" width="30" height="34" rx="4" fill="none" stroke="${shade(c, -.16)}" stroke-width="2"/>`,
    hoodie: (c) => sleeves(c, .85, 36) + cuffs(c, .85) + torso(c, 346) + `<rect x="138" y="330" width="124" height="18" rx="8" fill="${shade(c, -.14)}"/>` + `<path d="M156,146 Q200,196 244,146 Q238,130 200,128 Q162,130 156,146 Z" fill="${shade(c, -.14)}"/>` + `<path d="M188,168 L186,214 M212,168 L214,214" stroke="${shade(c, .5)}" stroke-width="3" stroke-linecap="round"/>` + `<path d="M158,282 L242,282 L254,326 L146,326 Z" fill="${shade(c, -.1)}"/>`,
    jacket: (c) => sleeves(c, .84, 34) + cuffs(c) + torso(c, 336) + collar(shade(c, -.05)) + `<line x1="200" y1="180" x2="200" y2="336" stroke="${shade(c, -.32)}" stroke-width="3"/>` + `<rect x="154" y="222" width="34" height="30" rx="4" fill="none" stroke="${shade(c, .3)}" stroke-width="2" stroke-dasharray="4 3"/><rect x="212" y="222" width="34" height="30" rx="4" fill="none" stroke="${shade(c, .3)}" stroke-width="2" stroke-dasharray="4 3"/><path d="M142,318 h116" stroke="${shade(c, .3)}" stroke-width="2" stroke-dasharray="4 3"/>`,
    puffer: (c) => sleeves(c, .85, 40) + [.18, .34, .5, .66, .82].map((t) => { const p = armPt(-1, t), q = armPt(1, t); return `<line x1="${p[0] - 16}" y1="${p[1] + 6}" x2="${p[0] + 12}" y2="${p[1] - 8}" stroke="${shade(c, -.3)}" stroke-width="2.5"/><line x1="${q[0] + 16}" y1="${q[1] + 6}" x2="${q[0] - 12}" y2="${q[1] - 8}" stroke="${shade(c, -.3)}" stroke-width="2.5"/>`; }).join("") + torso(c, 350, 54, 66) + [200, 236, 272, 308].map((y) => `<path d="M140,${y} Q200,${y + 10} 260,${y}" stroke="${shade(c, -.3)}" stroke-width="3" fill="none"/>`).join("") + `<rect x="170" y="134" width="60" height="20" rx="10" fill="${shade(c, -.12)}"/><line x1="200" y1="154" x2="200" y2="346" stroke="${shade(c, -.35)}" stroke-width="3"/>`,
    sweater: (c) => sleeves(c, .85, 36) + cuffs(c, .85) + torso(c, 340, 52, 62) + `<rect x="138" y="326" width="124" height="16" rx="6" fill="${shade(c, -.14)}"/>` + [190, 214, 238, 262, 286].map((y, i) => `<path d="M${140 - i * 0},${y} h${120}" stroke="${shade(c, i % 2 ? .3 : -.18)}" stroke-width="7" opacity=".55"/>`).join("") + `<path d="M170,146 Q200,166 230,146" fill="none" stroke="${shade(c, -.25)}" stroke-width="9" stroke-linecap="round"/>`,
    cardigan: (c) => sleeves(c, .85, 34) + cuffs(c, .85) + torso(c, 336) + `<path d="M188,150 L200,340 L212,150 Z" fill="${shade(c, .55)}"/>` + `<line x1="200" y1="176" x2="200" y2="336" stroke="${shade(c, -.25)}" stroke-width="2.5"/>` + dots([200, 232, 264, 296], shade(c, -.3)) + `<rect x="138" y="322" width="124" height="14" rx="6" fill="${shade(c, -.12)}"/>`,
    kurta: (c) => sleeves(c, .78, 32) + cuffs(c, .78) + torso(c, 432, 52, 66) + `<rect x="188" y="140" width="24" height="16" rx="4" fill="${shade(c, -.15)}"/>` + `<line x1="200" y1="156" x2="200" y2="290" stroke="${shade(c, -.22)}" stroke-width="2.5"/>` + dots([170, 196, 222], c) + `<path d="M137,412 h126" stroke="${shade(c, .4)}" stroke-width="6" opacity=".7"/><path d="M200,410 v22 M137,412 l-1,20 M263,412 l1,20" stroke="${shade(c, -.3)}" stroke-width="2"/>`,
    kurti: (c, o) => sleeves(c, .72, 30) + torso(c, 426, 50, 64) + `<path d="M154,152 Q200,142 246,152 L238,206 Q200,220 162,206 Z" fill="${o.print ? GOLD : shade(c, .3)}" opacity="${o.print ? .9 : .7}"/>` + (o.print ? [172, 190, 208, 226].map((x) => `<circle cx="${x}" cy="182" r="3" fill="${shade(c, -.3)}"/>`).join("") : "") + `<line x1="200" y1="206" x2="200" y2="418" stroke="${shade(c, -.2)}" stroke-width="2"/><path d="M137,408 h126" stroke="${GOLD}" stroke-width="5" opacity=".85"/>` + neck(c),
    blouse: (c) => `<circle cx="140" cy="176" r="26" fill="${c}"/><circle cx="260" cy="176" r="26" fill="${c}"/>` + armLine(-1, .3, .5, 26, shade(c, -.1)).replace("stroke-width=\"26\"", "stroke-width=\"22\"") + armLine(1, .3, .5, 26, shade(c, -.1)).replace("stroke-width=\"26\"", "stroke-width=\"22\"") + torso(c, 322, 50, 54) + `<path d="M172,146 Q200,178 228,146" fill="${shade(c, -.1)}" opacity=".6"/><path d="M152,318 h96" stroke="${shade(c, -.15)}" stroke-width="5"/>`,
    partytop: (c) => `<path d="M156,158 Q200,196 244,158 L252,318 Q200,330 148,318 Z" fill="${c}"/><path d="M170,158 L176,140 M230,158 L224,140" stroke="${c}" stroke-width="6" stroke-linecap="round"/>` + `<path d="M162,200 L232,300 M150,240 L200,304" stroke="${shade(c, .35)}" stroke-width="10" opacity=".28"/>`,
  };

  /* ---------- one-piece garments (cover top + bottom) ---------- */
  const florals = (c, seed) => { const r = rnd(seed); let s = ""; for (let i = 0; i < 16; i++) { const x = 116 + r() * 168, y = 340 + r() * 130; s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="6" fill="${shade(c, .4)}"/><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="2.2" fill="${GOLD}"/>`; } return s; };
  const sequins = (c, seed, y0, y1, x0, x1) => { const r = rnd(seed); let s = ""; for (let i = 0; i < 46; i++) { const y = y0 + r() * (y1 - y0); const hw = x0 + (x1 - x0) * ((y - y0) / (y1 - y0)); const x = 200 + (r() * 2 - 1) * hw; s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="2.6" fill="${r() > .5 ? GOLD : shade(c, .5)}" opacity=".9"/>`; } return s; };
  const FULL = {
    dress: (c, o) => sleeves(c, .22, 30) + `<path d="M150,150 Q200,138 250,150 L256,282 L322,478 Q200,500 78,478 L144,282 Z" fill="${c}"/><rect x="142" y="278" width="116" height="12" rx="5" fill="${shade(c, -.25)}"/>` + [130, 158, 186, 214, 242, 270].map((x) => `<path d="M${x},292 L${x - 20 + (x - 200) * .5},476" stroke="${shade(c, -.1)}" stroke-width="2" opacity=".5"/>`).join("") + neck(c, true) + (o.print ? florals(c, 7) : ""),
    partydress: (c) => `<path d="M152,150 Q200,138 248,150 L258,300 L274,452 Q200,470 126,452 L142,300 Z" fill="${c}"/><path d="M168,156 L172,138 M232,156 L228,138" stroke="${c}" stroke-width="6" stroke-linecap="round"/>` + `<path d="M170,152 Q200,186 230,152" fill="${shade(c, -.2)}"/>` + sequins(c, 11, 190, 450, 44, 66),
    gunyu: (c) => { const g = shade(c, -.28); return `<path d="M144,268 L256,268 L338,566 Q200,590 62,566 Z" fill="${c}"/><path d="M84,552 Q200,580 316,552" stroke="${GOLD}" stroke-width="10" fill="none" opacity=".9"/><path d="M84,522 Q200,548 316,522" stroke="${shade(c, .35)}" stroke-width="4" fill="none" opacity=".6"/>` + sleeves(g, .5, 30) + torso(g, 282, 50, 54) + neck(g) + `<rect x="140" y="272" width="120" height="14" rx="4" fill="${GOLD}"/><path d="M158,152 L262,300" stroke="#eab84a" stroke-width="22" stroke-linecap="round" opacity=".92"/><path d="M158,152 L262,300" stroke="${shade(c, -.2)}" stroke-width="3" stroke-dasharray="3 6" opacity=".7"/>`; },
    lehenga: (c) => { const g = shade(c, -.2); return `<path d="M146,264 L254,264 L346,566 Q200,592 54,566 Z" fill="${c}"/>` + [110, 150, 190, 230, 270, 310].map((x) => `<path d="M${x},572 L${200 + (x - 200) * .32},270" stroke="${shade(c, -.14)}" stroke-width="2" opacity=".55"/>`).join("") + `<path d="M76,550 Q200,578 324,550" stroke="${GOLD}" stroke-width="10" fill="none"/>` + sequins(c, 5, 300, 540, 34, 118) + sleeves(g, .34, 30) + torso(g, 274, 50, 52) + neck(g, true) + `<path d="M250,150 Q286,250 252,420 L292,420 Q322,250 266,146 Z" fill="${shade(c, .35)}" opacity=".92"/><path d="M250,150 Q286,250 252,420" stroke="${GOLD}" stroke-width="4" fill="none"/>`; },
    sari: (c) => { const g = shade(c, -.3); return `<path d="M144,262 L256,262 L286,566 Q200,584 114,566 Z" fill="${c}"/>` + [160, 180, 200, 220, 240].map((x) => `<path d="M${x},270 L${x + (x - 200) * .6},566" stroke="${shade(c, -.16)}" stroke-width="2" opacity=".6"/>`).join("") + `<path d="M118,556 Q200,576 282,556" stroke="${GOLD}" stroke-width="9" fill="none"/>` + sleeves(g, .34, 30) + torso(g, 268, 50, 52) + neck(g, true) + `<path d="M154,148 Q210,180 268,268 L296,470 L262,470 L236,290 Q206,222 154,196 Z" fill="${shade(c, .18)}"/><path d="M154,148 Q210,180 268,268" stroke="${GOLD}" stroke-width="5" fill="none"/>`; },
    daura: (c) => { const d = shade(c, -.1), vest = c === "#1f2430" ? "#7b2033" : "#2b3150"; return `<path d="${legPath(-1, 330, 556, 64, 1, 38, 10)}" fill="${shade(c, .1)}"/><path d="${legPath(1, 330, 556, 64, 1, 38, 10)}" fill="${shade(c, .1)}"/><path d="M150,552 h48 M202,552 h48" stroke="${shade(c, -.3)}" stroke-width="6" stroke-linecap="round"/>` + sleeves(d, .84, 32) + cuffs(d) + torso(d, 440, 52, 68) + `<path d="M170,146 L250,300 L236,440" stroke="${shade(d, -.3)}" stroke-width="2.5" fill="none"/>` + `<path d="M154,152 L196,152 L206,300 L156,348 Z" fill="${vest}"/><path d="M246,152 L204,152 L194,300 L244,348 Z" fill="${vest}"/><rect x="188" y="140" width="24" height="16" rx="4" fill="${shade(d, -.15)}"/>` + dots([180, 210, 240, 270], "#bfa14a"); },
    kurtaset: (c) => { const d = c; return `<path d="${legPath(-1, 330, 556, 58, 1, 40, 10)}" fill="${shade(c, .18)}"/><path d="${legPath(1, 330, 556, 58, 1, 40, 10)}" fill="${shade(c, .18)}"/>` + sleeves(d, .8, 32) + cuffs(d, .8) + torso(d, 420, 52, 64) + `<rect x="188" y="140" width="24" height="16" rx="4" fill="${shade(c, -.15)}"/><line x1="200" y1="156" x2="200" y2="290" stroke="${shade(c, -.22)}" stroke-width="2.5"/>` + dots([170, 196, 222], c) + `<path d="M138,400 h124" stroke="${GOLD}" stroke-width="5" opacity=".85"/>`; },
    sweaterdress: (c) => sleeves(c, .85, 36) + cuffs(c, .85) + `<path d="M148,150 Q200,138 252,150 L268,302 L282,446 Q200,462 118,446 L132,302 Z" fill="${c}"/>` + [190, 216, 242, 268, 294, 320, 346, 372, 398, 424].map((y, i) => `<path d="M${132 - (y - 300) * .1},${y} h${136 + (y - 300) * .2}" stroke="${shade(c, i % 2 ? .28 : -.16)}" stroke-width="6" opacity=".5"/>`).join("") + `<rect x="118" y="440" width="164" height="14" rx="6" fill="${shade(c, -.14)}"/><path d="M170,146 Q200,166 230,146" fill="none" stroke="${shade(c, -.25)}" stroke-width="9" stroke-linecap="round"/>`,
  };
  const HOOD_BACK = (c) => `<path d="M150,152 Q144,92 200,80 Q256,92 250,152 Z" fill="${shade(c, -.28)}"/>`;

  /* ---------- bottoms ---------- */
  const waist = (c) => `<rect x="137" y="320" width="126" height="16" rx="5" fill="${shade(c, -.2)}"/>`;
  const legs = (c, y1, ho, hi, bo, bi) => `<path d="${legPath(-1, 326, y1, ho, hi, bo, bi)}" fill="${c}"/><path d="${legPath(1, 326, y1, ho, hi, bo, bi)}" fill="${c}"/><line x1="200" y1="336" x2="200" y2="${Math.min(y1 - 20, 410)}" stroke="${shade(c, -.25)}" stroke-width="2"/>`;
  const stitches = (c, y1) => `<path d="M${X(-1, 60)},340 L${X(-1, 50)},${y1 - 6} M${X(1, 60)},340 L${X(1, 50)},${y1 - 6}" stroke="${shade(c, .3)}" stroke-width="2" stroke-dasharray="5 4" opacity=".8"/>`;
  const BOTTOMS = {
    jeans: (c) => legs(c, 562, 62, 1, 52, 6) + waist(c) + stitches(c, 562) + `<path d="M150,346 q12,16 30,10 M250,346 q-12,16 -30,10" stroke="${shade(c, .3)}" stroke-width="2" fill="none"/>`,
    baggy: (c) => legs(c, 564, 68, 1, 64, 4) + waist(c) + stitches(c, 564),
    cargo: (c) => legs(c, 562, 62, 1, 52, 6) + waist(c) + `<rect x="${X(-1, 62)}" y="392" width="34" height="46" rx="4" fill="${shade(c, -.12)}" stroke="${shade(c, .3)}" stroke-width="2" stroke-dasharray="4 3"/><rect x="${X(1, 28)}" y="392" width="34" height="46" rx="4" fill="${shade(c, -.12)}" stroke="${shade(c, .3)}" stroke-width="2" stroke-dasharray="4 3"/>` + `<path d="M${X(-1, 52)},520 h${46} M${X(1, 6)},520 h46" stroke="${shade(c, -.25)}" stroke-width="3"/>`,
    joggers: (c) => legs(c, 552, 60, 1, 46, 10) + waist(c) + `<rect x="${X(-1, 48)}" y="538" width="44" height="16" rx="6" fill="${shade(c, -.22)}"/><rect x="${X(1, 4)}" y="538" width="44" height="16" rx="6" fill="${shade(c, -.22)}"/><path d="M188,340 L184,372 M212,340 L216,372" stroke="${shade(c, .5)}" stroke-width="3" stroke-linecap="round"/>`,
    shorts: (c) => legs(c, 452, 62, 1, 58, 4) + waist(c) + `<path d="M${X(-1, 58)},446 h54 M${X(1, 4)},446 h54" stroke="${shade(c, -.25)}" stroke-width="3"/>`,
    trousers: (c) => legs(c, 562, 60, 1, 50, 8) + waist(c) + `<line x1="${X(-1, 30)}" y1="340" x2="${X(-1, 28)}" y2="560" stroke="${shade(c, .32)}" stroke-width="2" opacity=".7"/><line x1="${X(1, 30)}" y1="340" x2="${X(1, 28)}" y2="560" stroke="${shade(c, .32)}" stroke-width="2" opacity=".7"/><rect x="190" y="322" width="20" height="12" rx="2" fill="${GOLD}"/>`,
    leggings: (c) => legs(c, 560, 56, 1, 40, 8) + waist(c) + `<path d="M${X(-1, 30)},350 L${X(-1, 26)},550" stroke="${shade(c, .35)}" stroke-width="4" opacity=".35"/>`,
    palazzo: (c) => `<path d="${legPath(-1, 326, 564, 58, 1, 100, 2)}" fill="${c}"/><path d="${legPath(1, 326, 564, 58, 1, 100, 2)}" fill="${c}"/>` + waist(c) + [-1, 1].map((sd) => `<path d="M${X(sd, 24)},340 L${X(sd, 44)},562" stroke="${shade(c, -.12)}" stroke-width="2" opacity=".6"/>`).join(""),
    skirt: (c) => `<path d="M140,326 L260,326 L298,474 Q200,490 102,474 Z" fill="${c}"/>` + waist(c) + [112, 136, 160, 184, 208, 232, 256, 280].map((x) => `<path d="M${x + (x - 196) * -.1 + 20},336 L${x - 6 + (x - 200) * .18},480" stroke="${shade(c, -.16)}" stroke-width="2" opacity=".6"/>`).join("") + `<rect x="104" y="466" width="192" height="10" rx="5" fill="${shade(c, -.16)}"/>`,
  };

  /* ---------- shoes (left shoe; right is a mirror) ---------- */
  const SOLE = "#f1ede6";
  const SHOES = {
    sneakers: (c) => `<path d="M126,584 L200,584 L200,594 Q200,598 192,598 L132,598 Q122,598 126,590 Z" fill="${SOLE}"/><path d="M150,548 L198,548 L200,584 L128,584 Q126,574 138,568 Q148,564 150,548 Z" fill="${c}"/><path d="M128,584 Q126,574 138,568 Q150,566 158,584 Z" fill="${shade(c, c === "#f6f3ee" ? -.08 : .2)}"/><path d="M160,552 L188,556 M158,561 L186,565 M154,570 L180,574" stroke="${c === "#f6f3ee" ? "#b9b2a6" : "#fff"}" stroke-width="2.6" stroke-linecap="round"/>`,
    canvas: (c) => `<path d="M126,584 L200,584 L200,594 Q200,598 192,598 L132,598 Q122,598 126,590 Z" fill="${SOLE}"/><path d="M150,550 L198,550 L200,584 L128,584 Q126,574 138,568 Q148,564 150,550 Z" fill="${c}"/><path d="M128,584 Q126,574 138,568 Q150,566 158,584 Z" fill="${SOLE}"/><path d="M160,554 L188,558 M158,563 L186,567" stroke="${c === "#f6f3ee" ? "#b9b2a6" : "#fff"}" stroke-width="2.4" stroke-linecap="round"/>`,
    chunky: (c) => `<path d="M124,580 L200,580 L200,596 Q200,600 192,600 L130,600 Q120,600 124,590 Z" fill="${SOLE}"/><path d="M124,586 h76" stroke="#d6cfc2" stroke-width="3"/><path d="M148,542 L198,542 L200,580 L126,580 Q122,566 138,560 Q148,556 148,542 Z" fill="${c}"/><path d="M126,580 Q122,566 138,560 Q152,560 160,580 Z" fill="${shade(c, c === "#f6f3ee" ? -.1 : .25)}"/><path d="M158,548 L188,552 M156,558 L186,562" stroke="${c === "#f6f3ee" ? "#b9b2a6" : "#fff"}" stroke-width="2.6" stroke-linecap="round"/>`,
    oxford: (c) => `<path d="M126,588 L200,588 L200,594 Q200,598 192,598 L132,598 Q122,598 126,592 Z" fill="#161a26"/><path d="M150,552 L198,552 L200,588 L128,588 Q126,576 140,570 Q150,566 150,552 Z" fill="${c}"/><path d="M140,574 Q148,568 160,580" stroke="${shade(c, .3)}" stroke-width="3" fill="none"/><path d="M162,560 L188,564" stroke="${shade(c, .4)}" stroke-width="2"/>`,
    boots: (c) => `<path d="M124,586 L200,586 L200,596 Q200,600 192,600 L130,600 Q120,600 124,592 Z" fill="#2a2320"/><path d="M148,504 L198,504 L200,586 L126,586 Q124,572 138,566 Q148,562 148,504 Z" fill="${c}"/><rect x="146" y="504" width="54" height="12" rx="4" fill="${shade(c, -.2)}"/><path d="M152,530 h44 M152,544 h44" stroke="${shade(c, .3)}" stroke-width="2" stroke-dasharray="5 4"/>`,
    sandals: (c) => `<path d="M126,588 L200,588 L200,596 L128,596 Q122,596 124,590 Z" fill="${c}"/><path d="M130,588 Q136,566 192,568 L198,588 Z" fill="var(--skin)"/><path d="M134,588 Q158,566 196,584" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M160,572 L170,588 M182,570 L188,588" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
    kolhapuri: (c) => `<path d="M126,588 L200,588 L200,596 L128,596 Q122,596 124,590 Z" fill="${shade("#c99a5b", c === "#dcc7a3" ? .2 : 0)}"/><path d="M130,588 Q136,566 192,568 L198,588 Z" fill="var(--skin)"/><path d="M134,588 Q158,564 196,584" stroke="${c}" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="144" cy="580" r="5" fill="${GOLD}"/><path d="M166,570 L172,588" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
    flats: (c) => `<path d="M130,592 L200,592 L200,596 L132,596 Q126,596 130,592 Z" fill="#161a26"/><path d="M134,590 Q130,572 152,568 L192,566 Q202,572 200,590 Z" fill="${c}"/><circle cx="182" cy="574" r="4" fill="${shade(c, .4)}"/>`,
    heels: (c) => `<path d="M132,590 Q128,574 150,566 L196,556 L200,576 Q190,588 168,590 Z" fill="${c}"/><rect x="186" y="582" width="14" height="18" rx="3" fill="${shade(c, -.25)}"/><path d="M132,590 L170,590" stroke="${shade(c, -.3)}" stroke-width="3"/>`,
  };

  /* ---------- accessories ---------- */
  const ACC = {
    cap: (c) => `<path d="M164,80 Q164,42 200,42 Q236,42 236,80 Z" fill="${c}"/><path d="M226,76 Q268,74 270,88 Q250,92 226,86 Z" fill="${shade(c, -.22)}"/><path d="M200,44 v34" stroke="${shade(c, -.16)}" stroke-width="2"/><circle cx="200" cy="42" r="4" fill="${shade(c, -.2)}"/>`,
    topi: (c) => `<path d="M162,80 L168,44 Q200,34 232,44 L238,80 L226,76 Q200,70 174,76 Z" fill="${c}"/>` + [174, 190, 206, 222].map((x, i) => `<path d="M${x},70 L${x + 8},52 L${x + 16},70 Z" fill="${i % 2 ? "#f6f3ee" : "#f2c14e"}"/>`).join("") + `<path d="M162,80 Q200,72 238,80" stroke="#f2c14e" stroke-width="4" fill="none"/>`,
    beanie: (c) => `<path d="M162,80 Q160,38 200,36 Q240,38 238,80 Z" fill="${c}"/><rect x="160" y="66" width="80" height="16" rx="7" fill="${shade(c, -.16)}"/><circle cx="200" cy="32" r="9" fill="${shade(c, .3)}"/>` + [176, 192, 208, 224].map((x) => `<path d="M${x},68 v12" stroke="${shade(c, -.32)}" stroke-width="2"/>`).join(""),
    sunglasses: (c) => `<rect x="168" y="86" width="28" height="18" rx="7" fill="${c}"/><rect x="204" y="86" width="28" height="18" rx="7" fill="${c}"/><path d="M196,92 h8 M168,92 l-8,-3 M232,92 l8,-3" stroke="${c}" stroke-width="3"/><path d="M174,90 l8,-0" stroke="#fff" stroke-width="2" opacity=".5"/>`,
    watch: (c) => `<rect x="88" y="300" width="28" height="30" rx="5" fill="${c}"/><circle cx="102" cy="315" r="11" fill="#f6f3ee" stroke="${shade(c, -.3)}" stroke-width="3"/><path d="M102,315 v-6 M102,315 l5,3" stroke="#20263b" stroke-width="2" stroke-linecap="round"/>`,
    sling: (c) => `<path d="M248,150 L156,326" stroke="${c}" stroke-width="9" stroke-linecap="round"/><rect x="124" y="304" width="58" height="46" rx="9" fill="${c}"/><path d="M124,320 h58" stroke="${shade(c, -.25)}" stroke-width="3"/><circle cx="153" cy="326" r="4" fill="${GOLD}"/>`,
    muffler: (c) => `<path d="M156,138 Q200,170 244,138 L248,160 Q200,192 152,160 Z" fill="${c}"/><path d="M214,168 L236,246 L212,254 L200,176 Z" fill="${shade(c, -.16)}"/><path d="M216,192 l18,-6 M220,212 l18,-6" stroke="${shade(c, .35)}" stroke-width="4"/>`,
    hairband: (c) => `<path d="M164,68 Q200,32 236,68" stroke="${c}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M222,44 L246,34 L244,58 Z M222,44 L200,32 L204,56 Z" fill="${shade(c, .1)}"/><circle cx="222" cy="44" r="6" fill="${shade(c, -.2)}"/>`,
    potey: (c) => { let s = ""; for (let i = 0; i <= 14; i++) { const t = i / 14, x = 168 + 64 * t, y = 152 + 30 * Math.sin(Math.PI * t); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.8" fill="${i % 3 === 1 ? "#c9413c" : c}"/>`; } return s + `<path d="M200,188 l7,10 l-7,10 l-7,-10 Z" fill="${GOLD}"/>`; },
    jhumka: (c) => [166, 234].map((x) => `<circle cx="${x}" cy="102" r="3.5" fill="${c}"/><path d="M${x},106 l-7,18 h14 Z" fill="${c}"/><circle cx="${x}" cy="128" r="2.6" fill="${shade(c, .4)}"/>`).join(""),
  };

  /* ---------- where each hotspot sits on the figure ---------- */
  const ACC_ANCHOR = { cap: [200, 52], topi: [200, 54], beanie: [200, 52], hairband: [200, 46], sunglasses: [200, 95], watch: [102, 315], sling: [152, 326], muffler: [200, 160], potey: [200, 182], jhumka: [166, 118] };
  function anchor(p) {
    if (p.type === "accessory") return ACC_ANCHOR[p.cat] || [200, 100];
    if (p.type === "shoes") return [166, 580];
    if (p.type === "bottom") return p.cat === "skirt" ? [200, 400] : p.cat === "shorts" ? [166, 390] : [166, 440];
    if (p.full) return ["gunyu", "lehenga", "sari"].includes(p.cat) ? [200, 420] : [200, 330];
    return p.cat === "kurta" || p.cat === "kurti" ? [200, 250] : [200, 238];
  }

  /* ---------- background palettes ---------- */
  const BG = {
    pink: ["#f9dfe7", "#fdf0f4"], lilac: ["#e9e1f8", "#f5f0fd"], peach: ["#fddccb", "#fff0e6"], sand: ["#f6e6c4", "#fff6e2"],
    blue: ["#dbe8fb", "#eef4fe"], mint: ["#d9efe2", "#eef8f2"], grey: ["#e0e4ee", "#f1f3f8"],
  };

  /* ---------- pieces of the body ---------- */
  function head(gender, skin) {
    const ears = `<circle cx="166" cy="96" r="7" fill="${skin}"/><circle cx="234" cy="96" r="7" fill="${skin}"/>`;
    const face = `<circle cx="200" cy="92" r="34" fill="${skin}"/><circle cx="188" cy="94" r="2.8" fill="#2a2320"/><circle cx="212" cy="94" r="2.8" fill="#2a2320"/><path d="M192,108 Q200,115 208,108" stroke="#8a4a3a" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="180" cy="104" r="6" fill="#f08fb0" opacity=".28"/><circle cx="220" cy="104" r="6" fill="#f08fb0" opacity=".28"/>`;
    const hair = gender === "girls"
      ? `<path d="M164,88 Q160,50 200,50 Q240,50 236,88 Q232,66 210,62 Q184,60 170,74 Q166,80 164,88 Z" fill="${HAIR}"/>`
      : `<path d="M165,86 Q160,52 200,50 Q240,52 235,86 Q226,66 200,64 Q174,66 165,86 Z" fill="${HAIR}"/>`;
    return ears + face + hair;
  }
  const hairBack = (gender) => gender === "girls" ? `<path d="M160,88 Q156,44 200,42 Q244,44 240,88 L252,196 Q200,214 148,196 Z" fill="${HAIR}"/>` : "";
  const skinBody = (skin) => `<rect x="186" y="120" width="28" height="36" rx="10" fill="${skin}"/>` +
    armLine(-1, 0, 1, 24, skin) + armLine(1, 0, 1, 24, skin) +
    `<circle cx="${armPt(-1, 1)[0]}" cy="${armPt(-1, 1)[1] + 6}" r="13" fill="${skin}"/><circle cx="${armPt(1, 1)[0]}" cy="${armPt(1, 1)[1] + 6}" r="13" fill="${skin}"/>` +
    `<path d="${legPath(-1, 330, 566, 52, 1, 38, 8)}" fill="${skin}"/><path d="${legPath(1, 330, 566, 52, 1, 38, 8)}" fill="${skin}"/>`;

  function shoePair(item, skin) {
    const p = item.p, fn = SHOES[p.cat] || SHOES.sneakers, c = item.hex;
    const left = fn(c).replace(/var\(--skin\)/g, skin);
    return `<g>${left}</g><g transform="translate(400,0) scale(-1,1)">${left}</g>`;
  }
  const bareFeet = (skin) => `<ellipse cx="166" cy="580" rx="30" ry="12" fill="${skin}"/><ellipse cx="234" cy="580" rx="30" ry="12" fill="${skin}"/>`;

  function garmentSVG(item, skin, flat) {
    const p = item.p, c = item.hex, o = { print: p.print };
    if (p.type === "top") {
      const fn = p.full ? FULL[p.cat] : TOPS[p.cat];
      return (p.cat === "hoodie" && flat ? HOOD_BACK(c) : "") + (fn || TOPS.tee)(c, o);
    }
    if (p.type === "bottom") return (BOTTOMS[p.cat] || BOTTOMS.jeans)(c);
    if (p.type === "shoes") return shoePair(item, skin);
    return (ACC[p.cat] || ACC.cap)(c);
  }

  /* ---------- a whole dressed figure ---------- */
  const figCache = {};
  function figure(items, o) {
    o = o || {};
    const gender = o.gender === "boys" ? "boys" : "girls";
    const skin = SKINS[(o.skin || 0) % SKINS.length];
    const H = o.h || 640;
    const s = Math.min(1, H / 640), tx = (400 - 400 * s) / 2, ty = (H - 640 * s) / 2;
    const bg = BG[o.bg] || BG.sand;
    const key = JSON.stringify([items.map((i) => i.p.id + i.hex), gender, skin, H, o.bg, o.ghost]);
    if (figCache[key]) return figCache[key];

    const by = { top: null, bottom: null, shoes: null, acc: [] };
    items.forEach((it) => { if (it.p.type === "accessory") by.acc.push(it); else by[it.p.type] = it; });
    const full = by.top && by.top.p.full;
    const ghost = o.ghost !== false;
    const G = "#e7e1d7";

    let g = `<ellipse cx="200" cy="602" rx="118" ry="9" fill="#000" opacity=".1"/>`;
    g += hairBack(gender);
    if (by.top && by.top.p.cat === "hoodie") g += HOOD_BACK(by.top.hex);
    g += skinBody(skin);
    g += by.shoes ? shoePair(by.shoes, skin) : bareFeet(skin);
    if (full) g += garmentSVG(by.top, skin);
    else {
      g += by.bottom ? garmentSVG(by.bottom, skin) : (ghost ? `<g opacity=".5">${BOTTOMS.jeans(G)}</g>` : "");
      g += by.top ? garmentSVG(by.top, skin) : (ghost ? `<g opacity=".5">${TOPS.tee(G, {})}</g>` : "");
    }
    g += head(gender, skin);
    by.acc.forEach((a) => { g += garmentSVG(a, skin); });

    const decor = `<circle cx="200" cy="${H * .46}" r="${Math.min(176, H * .28)}" fill="#fff" opacity=".45"/><circle cx="${o.flip ? 60 : 340}" cy="${H * .12}" r="46" fill="#fff" opacity=".35"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 ${H}" width="400" height="${H}"><defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient></defs><rect width="400" height="${H}" fill="url(#bg)"/>${decor}<g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${s.toFixed(4)})">${g}</g></svg>`;
    const spots = {};
    items.forEach((it) => { const a = anchor(it.p); spots[it.p.id] = { x: ((tx + a[0] * s) / 400) * 100, y: ((ty + a[1] * s) / H) * 100 }; });
    return (figCache[key] = { svg, uri: uri(svg), spots, ratio: H / 400 });
  }

  /* ---------- flat product picture ---------- */
  const sq = (cx, cy, size) => [cx - size / 2, cy - size / 2, size, size];
  function thumbBox(p) {
    if (p.type === "top") {
      if (p.full) return ["gunyu", "lehenga", "sari"].includes(p.cat) ? sq(200, 360, 520) : sq(200, 340, 470);
      return ["kurta", "kurti"].includes(p.cat) ? sq(200, 280, 340) : p.cat === "hoodie" ? sq(200, 232, 330) : sq(200, 244, 300);
    }
    if (p.type === "bottom") return p.cat === "skirt" ? sq(200, 400, 260) : p.cat === "shorts" ? sq(200, 390, 220) : sq(200, 446, 290);
    if (p.type === "shoes") return sq(200, 572, 160);
    const m = { cap: sq(216, 62, 170), topi: sq(200, 56, 130), beanie: sq(200, 56, 150), hairband: sq(206, 52, 150), sunglasses: sq(200, 96, 100), watch: sq(102, 315, 62), sling: sq(154, 240, 260), muffler: sq(206, 176, 190), potey: sq(200, 176, 130), jhumka: sq(200, 116, 100) };
    return m[p.cat] || sq(200, 100, 200);
  }
  const thumbCache = {};
  function thumb(p, colorName) {
    const col = colorName || p.colors[0];
    const key = p.id + col;
    if (thumbCache[key]) return thumbCache[key];
    const hex = hexOf(col), b = thumbBox(p);
    const light = contrast(hex) === "#20263b";     // garment itself is light -> use a darker, cooler backdrop
    const tint = light ? "#d9dfeb" : { top: "#f3ece4", bottom: "#eef0f6", shoes: "#f1eee8", accessory: "#f6efe3" }[p.type];
    const inner = garmentSVG({ p, hex }, "#e6b48c", true).replace(/var\(--skin\)/g, "#e6b48c");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.join(" ")}" width="300" height="300"><rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}" fill="${tint}"/>${inner}</svg>`;
    return (thumbCache[key] = uri(svg));
  }

  /* ---------- misc small graphics ---------- */
  function avatar(name, seed) {
    const h = (seed !== undefined ? seed : hashStr(name)) % 360;
    const ini = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h},70%,68%)"/><stop offset="1" stop-color="hsl(${(h + 50) % 360},70%,58%)"/></linearGradient></defs><rect width="96" height="96" rx="48" fill="url(#a)"/><text x="48" y="58" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-weight="700" font-size="34" fill="#fff">${ini}</text></svg>`);
  }
  function qr(seed) {
    const n = 25, r = rnd(hashStr(String(seed))), cell = 8;
    let s = "";
    const finder = (x, y) => `<rect x="${x * cell}" y="${y * cell}" width="${7 * cell}" height="${7 * cell}" fill="#000"/><rect x="${(x + 1) * cell}" y="${(y + 1) * cell}" width="${5 * cell}" height="${5 * cell}" fill="#fff"/><rect x="${(x + 2) * cell}" y="${(y + 2) * cell}" width="${3 * cell}" height="${3 * cell}" fill="#000"/>`;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const inF = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!inF && r() > .52) s += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="#000"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-16 -16 ${n * cell + 32} ${n * cell + 32}" role="img" aria-label="Demo QR code"><rect x="-16" y="-16" width="${n * cell + 32}" height="${n * cell + 32}" fill="#fff"/>${s}${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</svg>`;
  }
  function spark(vals, color) {
    const w = 96, h = 30, max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
    const pts = vals.map((v, i) => `${(i / (vals.length - 1) * w).toFixed(1)},${(h - 3 - ((v - min) / ((max - min) || 1)) * (h - 6)).toFixed(1)}`).join(" ");
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  CC.art = { figure, thumb, avatar, qr, spark, hexOf, shade, hashStr, rnd, uri, SKINS };
})(window.CC = window.CC || {});
