/* ==========================================================================
   data.js — sample catalog for Chhota Closet (all prices in NPR)
   Everything here is demo data. Swap it for your real API later.
   ========================================================================== */
(function (CC) {
  "use strict";

  /* ---------- colours (name -> hex), used by the artwork + colour pickers ---------- */
  const COLORS = {
    black: "#1f2430", white: "#f6f3ee", navy: "#26335e", grey: "#9aa1af", beige: "#dcc7a3",
    olive: "#6c7b4c", red: "#c9413c", maroon: "#7b2033", pink: "#f08fb0", blue: "#4a86d9",
    yellow: "#f3bb3d", green: "#3f9a6b", brown: "#7b5a3c", cream: "#f1e6cf", lavender: "#b8a5e3",
    orange: "#ee8a3a", mustard: "#d6a01c", khaki: "#b9a57b", denim: "#4f74ad",
  };
  const COLOR_LABEL = { denim: "Denim blue" };

  /* ---------- sellers ---------- */
  const SELLERS = {
    thamel:   { name: "Thamel Threads",      country: "Nepal", city: "Kathmandu",  rating: 4.7, sales: "5.2k", since: 2019, reply: "within 1 hour" },
    newa:     { name: "Newa Studio",         country: "Nepal", city: "Lalitpur",   rating: 4.8, sales: "3.9k", since: 2018, reply: "within 2 hours" },
    lakeside: { name: "Lakeside Boutique",   country: "Nepal", city: "Pokhara",    rating: 4.6, sales: "2.4k", since: 2020, reply: "within 3 hours" },
    himal:    { name: "Himal Denim Co.",     country: "Nepal", city: "Kathmandu",  rating: 4.5, sales: "6.8k", since: 2017, reply: "within 1 hour" },
    lumbini:  { name: "Lumbini Looms",       country: "Nepal", city: "Butwal",     rating: 4.6, sales: "1.7k", since: 2021, reply: "within 4 hours" },
    chitwan:  { name: "Chitwan Cloth House", country: "Nepal", city: "Chitwan",    rating: 4.4, sales: "1.2k", since: 2020, reply: "within 5 hours" },
    koshi:    { name: "Koshi Street Co.",    country: "Nepal", city: "Biratnagar", rating: 4.5, sales: "2.1k", since: 2019, reply: "within 3 hours" },
    patan:    { name: "Patan Tailors",       country: "Nepal", city: "Lalitpur",   rating: 4.9, sales: "4.4k", since: 2015, reply: "within 2 hours" },
  };

  /* ---------- products ---------- */
  const SIZES = {
    apparel: ["XS", "S", "M", "L", "XL", "XXL"],
    boysShoes: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"],
    girlsShoes: ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7"],
    free: ["Free size"],
  };

  // type: top | bottom | shoes | accessory.   full:true => a one-piece (dress, daura set…) that covers top + bottom
  function P(id, name, gender, type, cat, price, mrp, colors, seller, rating, reviews, occ, season, style, o) {
    const s = SELLERS[seller];
    const sizes = type === "shoes" ? (gender === "girls" ? SIZES.girlsShoes : SIZES.boysShoes)
                : type === "accessory" ? SIZES.free : SIZES.apparel;
    return Object.assign({
      id, name, gender, type, cat, price, mrp, colors, seller, sizes, rating, reviews,
      occ: occ.split(" "), season: season.split(" "), style: style.split(" "),
      brand: s.name, city: s.city, full: false, print: false, isNew: false,
    }, o || {});
  }

  const PRODUCTS = [
    /* ---- boys: tops ---- */
    P("bt1", "Oversized Graphic Tee", "boys", "top", "tee", 899, 1199, ["black", "white", "olive"], "thamel", 4.5, 212, "casual streetwear college", "summer monsoon spring", "streetwear", { print: true, isNew: true }),
    P("bt2", "Everyday Cotton Tee", "boys", "top", "tee", 449, 599, ["white", "navy", "grey", "black"], "chitwan", 4.3, 540, "casual college", "summer monsoon spring", "casual minimal"),
    P("bt3", "Striped Polo Shirt", "boys", "top", "polo", 799, 999, ["navy", "white", "green"], "himal", 4.4, 168, "casual college", "summer spring autumn", "casual"),
    P("bt4", "Classic Oxford Shirt", "boys", "top", "shirt", 1199, 1599, ["white", "blue", "black"], "patan", 4.6, 301, "college party wedding", "all", "formal"),
    P("bt5", "Fleece Pullover Hoodie", "boys", "top", "hoodie", 1699, 2199, ["grey", "black", "navy", "maroon"], "thamel", 4.7, 415, "casual streetwear college winter", "winter autumn", "streetwear casual"),
    P("bt6", "Washed Denim Jacket", "boys", "top", "jacket", 2199, 2899, ["denim", "black"], "himal", 4.5, 188, "casual streetwear college", "autumn spring winter", "streetwear casual"),
    P("bt7", "Quilted Puffer Jacket", "boys", "top", "puffer", 3299, 4499, ["black", "olive", "navy"], "lakeside", 4.6, 232, "winter casual", "winter", "sporty streetwear"),
    P("bt8", "Chunky Knit Sweater", "boys", "top", "sweater", 1599, 1999, ["beige", "maroon", "navy"], "lakeside", 4.4, 143, "winter casual college", "winter autumn", "casual"),
    P("bt9", "Holi Fun White Tee", "unisex", "top", "tee", 549, 749, ["white"], "chitwan", 4.2, 96, "festival casual", "spring summer", "casual", { print: true }),
    P("bt10", "Linen Kurta", "boys", "top", "kurta", 1499, 1999, ["cream", "blue", "maroon"], "patan", 4.6, 127, "festival traditional wedding party", "all", "traditional"),
    /* ---- boys: one-piece traditional sets ---- */
    P("bf1", "Daura Suruwal Set", "boys", "top", "daura", 3799, 4999, ["cream", "black", "maroon"], "patan", 4.8, 264, "traditional wedding festival", "all", "traditional", { full: true }),
    P("bf2", "Silk-Blend Kurta Suruwal", "boys", "top", "kurtaset", 3299, 4299, ["maroon", "navy", "green"], "newa", 4.6, 118, "festival wedding traditional party", "all", "traditional", { full: true }),
    P("bf3", "Cotton Kurta Suruwal", "boys", "top", "kurtaset", 2299, 2999, ["white", "blue", "cream"], "chitwan", 4.4, 201, "festival traditional college", "all", "traditional", { full: true }),
    /* ---- boys: bottoms ---- */
    P("bb1", "Slim Fit Blue Jeans", "boys", "bottom", "jeans", 1399, 1799, ["denim", "black", "grey"], "himal", 4.5, 622, "casual college streetwear party", "all", "casual streetwear"),
    P("bb2", "Utility Cargo Pants", "boys", "bottom", "cargo", 1299, 1699, ["olive", "black", "khaki"], "thamel", 4.6, 388, "streetwear casual college", "all", "streetwear"),
    P("bb3", "Cotton Jogger Pants", "boys", "bottom", "joggers", 899, 1199, ["grey", "black", "navy"], "chitwan", 4.4, 455, "casual college", "autumn winter spring", "sporty casual"),
    P("bb4", "Chino Shorts", "boys", "bottom", "shorts", 799, 999, ["khaki", "navy", "olive"], "himal", 4.3, 210, "casual", "summer monsoon", "casual"),
    P("bb5", "Slim Formal Trousers", "boys", "bottom", "trousers", 1399, 1799, ["black", "grey", "navy"], "patan", 4.5, 244, "party wedding college festival", "all", "formal"),
    P("bb6", "Basic Track Pants", "boys", "bottom", "joggers", 549, 749, ["black", "navy"], "chitwan", 4.1, 330, "casual", "all", "sporty"),
    P("bb7", "Baggy Wide Denim", "boys", "bottom", "baggy", 1599, 1999, ["denim", "black"], "koshi", 4.6, 176, "streetwear casual", "all", "streetwear", { isNew: true }),
    P("bb8", "Fleece-Lined Joggers", "boys", "bottom", "joggers", 1099, 1399, ["black", "grey", "navy"], "lakeside", 4.5, 140, "winter casual", "winter", "sporty"),
    P("bb9", "Everyday Cotton Shorts", "boys", "bottom", "shorts", 449, 599, ["grey", "navy", "black"], "chitwan", 4.2, 260, "casual", "summer monsoon", "casual"),
    /* ---- boys: shoes ---- */
    P("bs1", "Classic White Sneakers", "boys", "shoes", "sneakers", 1999, 2599, ["white", "black"], "thamel", 4.6, 512, "casual college streetwear", "all", "casual minimal"),
    P("bs2", "Chunky Street Sneakers", "boys", "shoes", "chunky", 2799, 3499, ["black", "white", "grey"], "koshi", 4.5, 190, "streetwear", "all", "streetwear"),
    P("bs3", "Formal Leather Oxfords", "boys", "shoes", "oxford", 2299, 2999, ["black", "brown"], "patan", 4.5, 152, "party wedding festival", "all", "formal traditional"),
    P("bs4", "Trail Hiking Boots", "boys", "shoes", "boots", 3499, 4499, ["brown", "black"], "lakeside", 4.7, 205, "winter casual", "winter monsoon autumn", "sporty"),
    P("bs5", "Casual Leather Sandals", "boys", "shoes", "sandals", 699, 899, ["brown", "black"], "chitwan", 4.2, 340, "casual festival", "summer monsoon spring", "casual"),
    P("bs6", "Canvas Lace-Up Shoes", "boys", "shoes", "canvas", 1299, 1699, ["navy", "white", "black"], "himal", 4.3, 270, "college casual", "all", "casual"),
    /* ---- boys / unisex: accessories ---- */
    P("ba1", "Embroidered Baseball Cap", "unisex", "accessory", "cap", 499, 649, ["black", "white", "navy", "olive"], "thamel", 4.4, 300, "casual streetwear college", "summer monsoon spring", "streetwear"),
    P("ba2", "Dhaka Topi", "boys", "accessory", "topi", 599, 799, ["red", "blue"], "patan", 4.8, 410, "traditional festival wedding", "all", "traditional"),
    P("ba3", "Wool Beanie", "unisex", "accessory", "beanie", 399, 549, ["grey", "black", "red", "maroon"], "lakeside", 4.5, 220, "winter casual", "winter", "casual"),
    P("ba4", "Analog Wrist Watch", "unisex", "accessory", "watch", 1299, 1799, ["black", "brown", "grey"], "himal", 4.5, 133, "party wedding college", "all", "formal"),
    P("ba5", "Crossbody Sling Bag", "unisex", "accessory", "sling", 899, 1199, ["black", "olive", "beige"], "thamel", 4.5, 246, "streetwear college casual", "all", "streetwear casual"),
    P("ba6", "Classic Sunglasses", "unisex", "accessory", "sunglasses", 599, 799, ["black", "brown"], "koshi", 4.3, 180, "casual party festival", "summer spring", "casual"),
    P("ba7", "Woollen Muffler", "unisex", "accessory", "muffler", 449, 599, ["grey", "maroon", "navy", "beige"], "lakeside", 4.4, 160, "winter", "winter", "casual"),

    /* ---- girls: tops ---- */
    P("gt1", "Cropped Graphic Tee", "girls", "top", "croptee", 799, 1099, ["white", "black", "pink"], "thamel", 4.5, 260, "casual streetwear college", "summer monsoon spring", "streetwear", { print: true }),
    P("gt2", "Ribbed Basic Top", "girls", "top", "ribtop", 499, 649, ["white", "beige", "black", "pink"], "chitwan", 4.3, 480, "casual college", "summer spring autumn", "minimal casual"),
    P("gt3", "Puff-Sleeve Blouse", "girls", "top", "blouse", 1099, 1499, ["pink", "white", "lavender"], "newa", 4.6, 205, "party college casual", "spring summer autumn", "casual minimal"),
    P("gt4", "Oversized Fleece Hoodie", "girls", "top", "hoodie", 1799, 2299, ["lavender", "grey", "black", "pink"], "thamel", 4.7, 390, "winter casual streetwear college", "winter autumn", "streetwear casual"),
    P("gt5", "Cropped Denim Jacket", "girls", "top", "jacket", 2299, 2999, ["denim", "black"], "himal", 4.5, 167, "casual college streetwear", "autumn spring winter", "streetwear casual"),
    P("gt6", "Soft Wool Cardigan", "girls", "top", "cardigan", 1699, 2199, ["beige", "pink", "maroon"], "lakeside", 4.6, 175, "winter casual college", "winter autumn", "casual minimal"),
    P("gt7", "Cotton Kurti", "girls", "top", "kurti", 999, 1299, ["mustard", "green", "white", "pink"], "newa", 4.5, 610, "college festival traditional casual", "all", "traditional casual"),
    P("gt8", "Embroidered Festive Kurti", "girls", "top", "kurti", 1499, 1999, ["maroon", "blue", "pink"], "newa", 4.7, 232, "festival wedding traditional party", "all", "traditional", { print: true }),
    P("gt9", "Satin Party Top", "girls", "top", "partytop", 1299, 1699, ["red", "black", "lavender"], "lumbini", 4.4, 118, "party", "all", "formal"),
    P("gt10", "Quilted Puffer Jacket", "girls", "top", "puffer", 3499, 4599, ["pink", "black", "olive"], "lakeside", 4.6, 151, "winter casual", "winter", "sporty streetwear"),
    /* ---- girls: one-piece ---- */
    P("gd1", "Floral Summer Dress", "girls", "top", "dress", 1899, 2499, ["yellow", "pink", "white"], "lakeside", 4.6, 340, "casual party college", "summer spring", "casual", { full: true, print: true }),
    P("gd2", "Sequin Party Dress", "girls", "top", "partydress", 3299, 4299, ["black", "maroon", "lavender"], "lumbini", 4.5, 140, "party wedding", "all", "formal", { full: true }),
    P("gd3", "Pleated Midi Dress", "girls", "top", "dress", 1999, 2599, ["lavender", "green", "beige"], "newa", 4.5, 166, "college party casual", "spring autumn summer", "minimal", { full: true }),
    P("gd4", "Gunyu Cholo Set", "girls", "top", "gunyu", 4299, 5499, ["red", "green", "maroon"], "patan", 4.8, 152, "traditional festival wedding", "all", "traditional", { full: true }),
    P("gd5", "Wedding-Guest Lehenga Choli", "girls", "top", "lehenga", 4999, 6499, ["maroon", "pink", "blue"], "lumbini", 4.7, 111, "wedding festival party", "all", "traditional", { full: true }),
    P("gd6", "Cotton Kurta Set", "girls", "top", "kurtaset", 2499, 3199, ["green", "yellow", "pink", "white"], "newa", 4.5, 225, "festival traditional college", "all", "traditional", { full: true }),
    P("gd7", "Knit Sweater Dress", "girls", "top", "sweaterdress", 2299, 2999, ["beige", "maroon", "grey"], "lakeside", 4.5, 130, "winter party casual", "winter autumn", "casual minimal", { full: true }),
    P("gd8", "Teej Red Sari", "girls", "top", "sari", 3999, 5299, ["red", "maroon"], "patan", 4.8, 187, "festival traditional wedding", "all", "traditional", { full: true }),
    /* ---- girls: bottoms ---- */
    P("gb1", "High-Waist Straight Jeans", "girls", "bottom", "jeans", 1499, 1899, ["denim", "black"], "himal", 4.5, 470, "casual college streetwear", "all", "casual streetwear"),
    P("gb2", "Pleated Mini Skirt", "girls", "bottom", "skirt", 899, 1199, ["black", "pink", "beige"], "newa", 4.4, 290, "casual college party", "summer spring autumn", "casual"),
    P("gb3", "Stretch Cotton Leggings", "girls", "bottom", "leggings", 499, 649, ["black", "navy", "maroon"], "chitwan", 4.3, 780, "casual college traditional", "all", "minimal traditional"),
    P("gb4", "Cotton Palazzo Pants", "girls", "bottom", "palazzo", 899, 1199, ["white", "black", "green"], "newa", 4.4, 215, "traditional festival college casual", "all", "traditional casual"),
    P("gb5", "Utility Cargo Pants", "girls", "bottom", "cargo", 1399, 1799, ["olive", "beige", "black"], "koshi", 4.5, 180, "streetwear casual", "all", "streetwear"),
    P("gb6", "Wide-Leg Trousers", "girls", "bottom", "trousers", 1499, 1899, ["black", "beige", "cream"], "lumbini", 4.5, 140, "college party", "all", "formal minimal"),
    P("gb7", "Fleece-Lined Leggings", "girls", "bottom", "leggings", 799, 999, ["black", "grey", "maroon"], "lakeside", 4.4, 320, "winter casual", "winter", "minimal"),
    P("gb8", "Distressed Denim Shorts", "girls", "bottom", "shorts", 799, 1099, ["denim", "black"], "himal", 4.3, 150, "casual", "summer monsoon", "casual"),
    /* ---- girls: shoes ---- */
    P("gs1", "White Platform Sneakers", "girls", "shoes", "sneakers", 1899, 2399, ["white", "pink"], "thamel", 4.6, 330, "casual college streetwear", "all", "casual minimal"),
    P("gs2", "Block Heel Sandals", "girls", "shoes", "heels", 2299, 2999, ["black", "beige", "maroon"], "lumbini", 4.4, 120, "party wedding festival", "all", "formal traditional"),
    P("gs3", "Classic Ballet Flats", "girls", "shoes", "flats", 1199, 1499, ["black", "pink", "beige"], "newa", 4.4, 260, "college casual party", "all", "minimal casual"),
    P("gs4", "Suede Ankle Boots", "girls", "shoes", "boots", 3299, 4199, ["black", "brown"], "lakeside", 4.6, 98, "winter party casual", "winter autumn", "casual"),
    P("gs5", "Kolhapuri Sandals", "girls", "shoes", "kolhapuri", 799, 1099, ["brown", "beige"], "chitwan", 4.3, 300, "festival traditional casual", "summer monsoon spring", "traditional casual"),
    P("gs6", "Chunky Street Sneakers", "girls", "shoes", "chunky", 2499, 3199, ["white", "lavender"], "koshi", 4.5, 140, "streetwear", "all", "streetwear"),
    /* ---- girls: accessories ---- */
    P("ga1", "Satin Hair Bow Band", "girls", "accessory", "hairband", 199, 299, ["pink", "black", "white"], "newa", 4.3, 410, "casual college party", "all", "casual"),
    P("ga2", "Potey Beaded Necklace", "girls", "accessory", "potey", 699, 999, ["green", "red"], "patan", 4.8, 520, "traditional festival wedding", "all", "traditional"),
    P("ga3", "Gold-Tone Jhumka Earrings", "girls", "accessory", "jhumka", 599, 799, ["mustard"], "patan", 4.7, 380, "traditional festival wedding party", "all", "traditional"),
    P("ga4", "Mini Crossbody Bag", "girls", "accessory", "sling", 999, 1299, ["pink", "black", "beige"], "thamel", 4.5, 270, "casual college party streetwear", "all", "casual streetwear"),
    P("ga5", "Cat-Eye Sunglasses", "girls", "accessory", "sunglasses", 599, 799, ["black", "pink"], "koshi", 4.3, 160, "casual party festival streetwear", "summer spring", "casual"),
    P("ga6", "Cozy Wool Scarf", "girls", "accessory", "muffler", 499, 699, ["maroon", "beige", "pink"], "lakeside", 4.5, 190, "winter", "winter", "casual"),
    P("ga7", "Rose-Tone Wrist Watch", "girls", "accessory", "watch", 1299, 1799, ["pink", "grey"], "himal", 4.4, 110, "party college wedding", "all", "formal minimal"),
  ];

  /* ---------- creators ---------- */
  const CREATORS = [
    { id: "c1", name: "Aayush Shrestha",  handle: "aayush.styles", country: "Nepal", city: "Kathmandu",  followers: 12480, following: 214, likes: 88400, bio: "Campus streetwear & winter layering from Kathmandu." },
    { id: "c2", name: "Sneha Gurung",     handle: "sneha.wears", country: "Nepal",   city: "Pokhara",    followers: 9320,  following: 301, likes: 61200, bio: "Lakeside outfits, cosy knits and easy weekend looks." },
    { id: "c3", name: "Nirajan Rai",      handle: "nirajan.fits", country: "Nepal",  city: "Biratnagar", followers: 7150,  following: 188, likes: 42900, bio: "Cargo, denim and everything oversized." },
    { id: "c4", name: "Prerana Thapa",    handle: "prerana.looks", country: "Nepal", city: "Chitwan",    followers: 10870, following: 246, likes: 70300, bio: "Kurtis, festive fits and fresher-day ideas." },
    { id: "c5", name: "Bibek Tamang",     handle: "bibek.threads", country: "Nepal", city: "Butwal",     followers: 5640,  following: 132, likes: 30100, bio: "Smart party looks and Dashain-ready daura sets." },
    { id: "c6", name: "Ritika Maharjan",  handle: "ritika.newa", country: "Nepal",   city: "Lalitpur",   followers: 15920, following: 174, likes: 112800, bio: "Newari-inspired festive fashion and wedding season edits." },
  ];

  /* ---------- looks (the "pins" on the feed) ----------
     items: product ids. Use "id:colour" to pick a specific colour, e.g. "gd6:yellow".            */
  const bgFor = { boys: ["blue", "mint", "grey", "sand"], girls: ["pink", "lilac", "peach", "sand"] };
  function L(id, title, gender, items, tags, season, o) {
    return Object.assign({ id, title, gender, items, tags: tags.split(" "), season: season.split(" "), fest: [], likes: 500, saves: 200, aspect: 1.5, creator: "c1" }, o || {});
  }
  const LOOKS = [
    /* boys */
    L("l1",  "Campus Casual",             "boys",  ["bt3", "bb1", "bs6", "ba5"],  "casual college", "autumn spring", { creator: "c1", likes: 2140, saves: 860,  fest: ["college"], aspect: 1.45 }),
    L("l2",  "Street Cargo Edit",         "boys",  ["bt1", "bb2", "bs2", "ba1"],  "streetwear casual", "all", { creator: "c3", likes: 3260, saves: 1420, aspect: 1.7 }),
    L("l3",  "Kathmandu Winter Layers",   "boys",  ["bt5", "bb3", "bs4", "ba3"],  "winter casual", "winter", { creator: "c1", likes: 1870, saves: 940, fest: ["winter"], aspect: 1.6 }),
    L("l4",  "Dashain Tika Look",         "boys",  ["bf1", "bs3", "ba2"],         "traditional festival", "all", { creator: "c5", likes: 2900, saves: 1310, fest: ["dashain", "tihar"], aspect: 1.75 }),
    L("l5",  "Tihar Lights Kurta",        "boys",  ["bt10:maroon", "bb5", "bs3", "ba4"], "festival traditional", "all", { creator: "c5", likes: 1650, saves: 720, fest: ["tihar", "dashain"], aspect: 1.5 }),
    L("l6",  "Wedding Guest Classic",     "boys",  ["bt4", "bb5", "bs3", "ba4"],  "wedding party", "all", { creator: "c5", likes: 1490, saves: 690, fest: ["wedding"], aspect: 1.65 }),
    L("l7",  "Holi Ready",                "boys",  ["bt9", "bb4", "bs5", "ba6"],  "festival casual", "spring summer", { creator: "c3", likes: 1210, saves: 480, fest: ["holi"], aspect: 1.4 }),
    L("l8",  "Baisakh Kurta Morning",     "boys",  ["bf3", "bs5", "ba2"],         "traditional festival", "spring summer", { creator: "c5", likes: 980, saves: 410, fest: ["newyear"], aspect: 1.6 }),
    L("l9",  "Fresher Day Fit",           "boys",  ["bt6", "bb1", "bs1", "ba1"],  "college casual streetwear", "autumn spring", { creator: "c3", likes: 2480, saves: 1120, fest: ["college"], aspect: 1.55 }),
    L("l10", "Weekend Baggy Denim",       "boys",  ["bt2", "bb7", "bs1", "ba5"],  "casual streetwear", "all", { creator: "c3", likes: 2010, saves: 930, aspect: 1.45 }),
    L("l11", "Puffer Season",             "boys",  ["bt7", "bb8", "bs4", "ba7"],  "winter", "winter", { creator: "c1", likes: 1760, saves: 880, fest: ["winter"], aspect: 1.7 }),
    L("l12", "Party Night Smart",         "boys",  ["bt4:blue", "bb1:black", "bs3", "ba6"], "party casual", "all", { creator: "c5", likes: 1330, saves: 540, aspect: 1.5 }),
    L("l13", "Summer Chill",              "boys",  ["bt2:white", "bb4", "bs5", "ba6"], "casual", "summer monsoon", { fest: ["holi"], creator: "c3", likes: 870, saves: 330, aspect: 1.4 }),
    L("l14", "Groom Squad Kurta Suruwal", "boys",  ["bf2", "bs3", "ba2", "ba4"],  "wedding festival traditional", "all", { creator: "c5", likes: 1720, saves: 810, fest: ["wedding"], aspect: 1.75 }),
    L("l15", "Sweater Weather Campus",    "boys",  ["bt8", "bb1", "bs6", "ba7"],  "winter college casual", "winter autumn", { creator: "c1", likes: 1140, saves: 520, fest: ["winter"], aspect: 1.55 }),
    L("l16", "Dashain Kurta & Jeans",     "boys",  ["bt10:blue", "bb1", "bs6", "ba2"], "festival traditional casual", "all", { creator: "c1", likes: 1580, saves: 640, fest: ["dashain", "tihar", "newyear"], aspect: 1.5 }),
    /* girls */
    L("l20", "Café Date Dress",           "girls", ["gd1", "gs3", "ga4", "ga1"],  "casual party", "summer spring", { creator: "c2", likes: 2730, saves: 1260, aspect: 1.7 }),
    L("l21", "Campus Denim Combo",        "girls", ["gt2", "gb1", "gs1", "ga4"],  "college casual", "autumn spring", { creator: "c1", likes: 2320, saves: 1080, fest: ["college"], aspect: 1.5 }),
    L("l22", "Street Cargo Girl",         "girls", ["gt1", "gb5", "gs6", "ga5"],  "streetwear casual", "all", { creator: "c2", likes: 2880, saves: 1340, aspect: 1.6 }),
    L("l23", "Teej Red Glam",             "girls", ["gd8", "gs5", "ga2:red", "ga3"], "festival traditional", "all", { creator: "c6", likes: 3540, saves: 1690, fest: ["teej"], aspect: 1.75 }),
    L("l24", "Dashain Gunyu Cholo",       "girls", ["gd4", "gs5", "ga2", "ga3"],  "traditional festival", "all", { creator: "c6", likes: 3120, saves: 1470, fest: ["dashain", "tihar", "teej"], aspect: 1.7 }),
    L("l25", "Tihar Kurti & Palazzo",     "girls", ["gt8", "gb4", "gs5", "ga3"],  "festival traditional", "all", { creator: "c4", likes: 1960, saves: 870, fest: ["tihar", "dashain", "teej", "newyear"], aspect: 1.55 }),
    L("l26", "Wedding Season Lehenga",    "girls", ["gd5", "gs2", "ga3", "ga2"],  "wedding festival", "all", { creator: "c6", likes: 3890, saves: 1980, fest: ["wedding", "teej"], aspect: 1.8 }),
    L("l27", "Holi Fun Set",              "girls", ["bt9", "gb8", "gs1", "ga5"],  "festival casual", "spring summer", { creator: "c4", likes: 1390, saves: 560, fest: ["holi"], aspect: 1.4 }),
    L("l28", "Baisakh Kurti Day",         "girls", ["gt7", "gb3", "gs5", "ga3"],  "traditional festival casual", "spring summer", { creator: "c4", likes: 1120, saves: 470, fest: ["newyear"], aspect: 1.5 }),
    L("l29", "Winter Cosy Cardigan",      "girls", ["gt6", "gb7", "gs4", "ga6"],  "winter casual", "winter", { creator: "c2", likes: 1980, saves: 1010, fest: ["winter"], aspect: 1.6 }),
    L("l30", "Fresher Girl Style",        "girls", ["gt3", "gb2", "gs3", "ga1"],  "college casual party", "spring autumn", { creator: "c4", likes: 2540, saves: 1190, fest: ["college"], aspect: 1.55 }),
    L("l31", "Sequin Party Night",        "girls", ["gd2", "gs2", "ga3", "ga7"],  "party wedding", "all", { creator: "c6", likes: 2210, saves: 950, aspect: 1.7 }),
    L("l32", "Pink Puffer Day",           "girls", ["gt10", "gb7", "gs4", "ga6"], "winter casual", "winter", { creator: "c2", likes: 1690, saves: 780, fest: ["winter"], aspect: 1.65 }),
    L("l33", "Lavender Hoodie Day",       "girls", ["gt4", "gb1", "gs6", "ga1"],  "casual college winter streetwear", "winter autumn", { creator: "c1", likes: 2050, saves: 960, aspect: 1.5 }),
    L("l34", "Pleated Midi Picnic",       "girls", ["gd3", "gs3", "ga4", "ga5"],  "casual party college", "spring summer", { creator: "c2", likes: 1470, saves: 640, aspect: 1.7 }),
    L("l35", "Sweater Dress Evening",     "girls", ["gd7", "gs4", "ga6", "ga7"],  "winter party", "winter", { creator: "c6", likes: 1240, saves: 590, fest: ["winter"], aspect: 1.75 }),
    L("l36", "Teej Green & Gold",         "girls", ["gd6:green", "gs5", "ga2", "ga3"], "festival traditional", "all", { creator: "c4", likes: 2640, saves: 1280, fest: ["teej"], aspect: 1.6 }),
    L("l37", "Tihar Glow Set",            "girls", ["gd6:yellow", "gs5", "ga3", "ga2:red"], "festival traditional", "all", { creator: "c6", likes: 1830, saves: 810, fest: ["tihar", "dashain", "teej"], aspect: 1.5 }),
    L("l38", "Reception Sequin Maroon",   "girls", ["gd2:maroon", "gs2", "ga3", "ga7"], "wedding party", "all", { creator: "c6", likes: 1560, saves: 730, fest: ["wedding"], aspect: 1.65 }),
  ];
  LOOKS.forEach((l, i) => { const set = bgFor[l.gender]; l.bg = set[i % set.length]; l.skin = i % 4; });

  /* ---------- festival collections ---------- */
  const FESTIVALS = [
    { id: "dashain", name: "Dashain", emoji: "🪁", when: "Typically Ashwin (Sep–Oct)", color: "#c9413c", blurb: "Tika-day reds, daura suruwal and gunyu cholo for the biggest festival of the year." },
    { id: "tihar",   name: "Tihar",   emoji: "🪔", when: "Typically Kartik (Oct–Nov)", color: "#e8a020", blurb: "Bright, lamp-lit looks for Deusi-Bhailo evenings and family puja." },
    { id: "teej",    name: "Teej",    emoji: "💃", when: "Typically Bhadra (Aug–Sep)", color: "#d1345b", blurb: "Red saris, potey and jhumka for a day of dancing and fasting." },
    { id: "holi",    name: "Holi",    emoji: "🎨", when: "Typically Falgun–Chaitra (Mar)", color: "#8b5cf6", blurb: "White-tee-and-shorts fits that are ready for colour." },
    { id: "newyear", name: "Nepali New Year", emoji: "🌼", when: "Baisakh 1 (mid-April)", color: "#2f9e6b", blurb: "Fresh cotton kurtas and kurtis to welcome the new Bikram Sambat year." },
    { id: "wedding", name: "Wedding Season", emoji: "💍", when: "Peaks in Mangsir & Falgun", color: "#a3316b", blurb: "Lehenga, sequins, kurta sets and sharp formals for every guest." },
    { id: "college", name: "College / Fresher", emoji: "🎓", when: "New intake, all year", color: "#3e8fff", blurb: "Easy campus outfits and fresher-day fits that survive a full timetable." },
    { id: "winter",  name: "Winter",  emoji: "🧣", when: "Poush–Magh (Dec–Jan)", color: "#4a6fa5", blurb: "Puffers, hoodies, cardigans and boots for Kathmandu mornings." },
  ];

  /* ---------- Nepal trend radar (demo data) ---------- */
  const TRENDS = {
    Kathmandu: [
      { style: "Oversized graphic tees", pct: 48, saves: 2140, likes: 6320, products: ["bt1", "gt1", "bs2"] },
      { style: "Cargo & baggy denim",    pct: 36, saves: 1730, likes: 5110, products: ["bb2", "bb7", "gb5"] },
      { style: "Puffer jackets",         pct: 29, saves: 1490, likes: 4260, products: ["bt7", "gt10", "ba3"] },
      { style: "Fusion kurti + sneakers", pct: 22, saves: 1180, likes: 3340, products: ["gt7", "gs1", "gb3"] },
    ],
    Pokhara: [
      { style: "Lakeside trekking layers", pct: 41, saves: 1520, likes: 4380, products: ["bt5", "bb8", "bs4"] },
      { style: "Boho summer dresses",      pct: 33, saves: 1310, likes: 3920, products: ["gd1", "gd3", "gs3"] },
      { style: "Denim jackets",            pct: 27, saves: 990,  likes: 2870, products: ["bt6", "gt5", "ba1"] },
      { style: "Sporty joggers",           pct: 19, saves: 760,  likes: 2210, products: ["bb3", "bb6", "bs6"] },
    ],
    Chitwan: [
      { style: "Light cotton kurtis",      pct: 37, saves: 1290, likes: 3760, products: ["gt7", "gb4", "gs5"] },
      { style: "Summer shorts & tees",     pct: 31, saves: 1050, likes: 3080, products: ["bb4", "bt2", "bs5"] },
      { style: "Canvas sneakers",          pct: 24, saves: 830,  likes: 2440, products: ["bs6", "bs1", "gs1"] },
      { style: "Daura suruwal for festivals", pct: 21, saves: 720, likes: 2050, products: ["bf1", "bf3", "ba2"] },
    ],
    Butwal: [
      { style: "Sequin party dresses",     pct: 44, saves: 1610, likes: 4720, products: ["gd2", "gs2", "ga7"] },
      { style: "Formal shirts & trousers", pct: 27, saves: 940,  likes: 2690, products: ["bt4", "bb5", "bs3"] },
      { style: "Block heels",              pct: 23, saves: 810,  likes: 2330, products: ["gs2", "gd5", "ga3"] },
      { style: "Sling bags",               pct: 18, saves: 650,  likes: 1970, products: ["ba5", "ga4", "bb2"] },
    ],
    Biratnagar: [
      { style: "Streetwear cargos",        pct: 39, saves: 1410, likes: 4050, products: ["bb2", "bt1", "bs2"] },
      { style: "Wedding-season lehenga",   pct: 35, saves: 1330, likes: 3810, products: ["gd5", "gs2", "ga2"] },
      { style: "Polo tees",                pct: 24, saves: 870,  likes: 2520, products: ["bt3", "bb4", "bs6"] },
      { style: "Kolhapuri sandals",        pct: 20, saves: 690,  likes: 1930, products: ["gs5", "bs5", "gb4"] },
    ],
  };

  /* ---------- outfit battles ---------- */
  const BATTLES = [
    { id: "b1", a: "l2",  b: "l10", tag: "Street vs Denim",       votes: [1284, 946] },
    { id: "b2", a: "l24", b: "l25", tag: "Dashain vs Tihar",      votes: [2210, 1874] },
    { id: "b3", a: "l1",  b: "l9",  tag: "Campus Casual vs Fresher Fit", votes: [730, 802] },
    { id: "b4", a: "l21", b: "l30", tag: "Denim vs Skirt Day",    votes: [1104, 1290] },
    { id: "b5", a: "l6",  b: "l12", tag: "Wedding vs Party Shirt", votes: [640, 588] },
    { id: "b6", a: "l3",  b: "l11", tag: "Hoodie vs Puffer",      votes: [1520, 1610] },
  ];

  /* ---------- delivery & payments (edit freely — nothing is hard-coded elsewhere) ---------- */
  const DELIVERY = {
    disclaimer: "Estimates depend on the courier, festivals, weather and road conditions. They are not guarantees.",
    nonDeliveryWeekdays: [6],            // 0 = Sunday … 6 = Saturday. Saturday off by default.
    freeShippingOver: 3000,              // NPR. Set to null to disable.
    zones: [
      { id: "valley",  label: "Kathmandu Valley",   minDays: 1, maxDays: 2, fee: 100,
        match: ["kathmandu", "lalitpur", "bhaktapur", "patan", "thamel", "baneshwor", "koteshwor", "kirtipur", "budhanilkantha", "balaju", "kalanki", "lagankhel", "new road", "maharajgunj", "boudha", "chabahil", "kalimati"] },
      { id: "city",    label: "Major city",         minDays: 2, maxDays: 4, fee: 180,
        match: ["pokhara", "chitwan", "bharatpur", "butwal", "biratnagar", "birgunj", "dharan", "hetauda", "janakpur", "nepalgunj", "itahari", "dhangadhi", "bhairahawa", "damak", "lumbini"] },
      { id: "outside", label: "Outside Kathmandu",  minDays: 3, maxDays: 7, fee: 250, match: [] },
    ],
    cities: ["Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Chitwan", "Butwal", "Biratnagar", "Birgunj", "Dharan", "Hetauda", "Janakpur", "Nepalgunj", "Itahari", "Dhangadhi", "Bhairahawa", "Ilam", "Jumla", "Dolakha", "Gorkha"],
  };
  const PAYMENTS = [
    { id: "cod",   label: "Cash on Delivery",   note: "Pay in cash when your parcel arrives." },
    { id: "esewa", label: "eSewa",              note: "Pay with your eSewa wallet." },
    { id: "khalti",label: "Khalti",             note: "Pay with your Khalti wallet." },
    { id: "bank",  label: "Bank Payment",       note: "Mobile / internet banking transfer." },
    { id: "qr",    label: "QR Payment",         note: "Scan with any Nepali QR-enabled banking app." },
  ];

  /* ---------- payment plans: advance deposit, full payment or cash on delivery ----------
     pct = share of the order total paid at checkout. The advance is held by the store platform
     (demo: simulated) until delivery, and is refundable under REFUND below.                       */
  const PAY_PLANS = [
    { id: "advance", pct: 50,  label: "Pay 50% now",     tag: "Refundable advance", note: "The rest is paid when your parcel arrives." },
    { id: "full",    pct: 100, label: "Pay in full now", tag: "",                    note: "Nothing to pay on delivery." },
    { id: "cod",     pct: 0,   label: "Cash on delivery", tag: "",                   note: "Pay everything when your parcel arrives." },
  ];
  const REFUND = {
    returnWindowDays: 7,                        // days after delivery in which a return can be requested
    refundWorkingDays: [1, 3],                  // how long a refund takes to reach the original payment method
    cancelStages: ["placed", "confirmed", "packed"],   // stages in which the buyer can cancel and get the advance back in full
    rules: [
      "Cancel before your parcel is handed to the courier and the whole advance goes back to you — no fee.",
      "If the seller cancels, or cannot deliver, the advance is refunded automatically and in full.",
      "Parcel damaged, wrong item, or not what was shown? Refuse it or request a return within the return window for a full refund of everything you paid.",
      "Refunds go back to the wallet or bank you paid with, usually within the working days shown on your order.",
    ],
  };

  /* ---------- seed Reels & Stories (demo content from creators & stores, so the feeds aren't empty) ----------
     ref = "look:ID" or "product:ID". Timestamps are relative to load time so Stories always look fresh.        */
  const NOWMS = Date.now();
  const hrs = (n) => NOWMS - n * 3600e3;
  const SEED_REELS = [
    { id: "rl1", owner: { type: "creator", id: "c1" }, ref: "look:l2",  caption: "Street cargo fit for a Kathmandu evening 🧡", tags: ["streetwear", "kathmandu", "cargo"], music: "Lo-fi Beats", likes: 1240, comments: 38, views: 15400, t: hrs(5) },
    { id: "rl2", owner: { type: "seller", id: "thamel" }, ref: "product:bt1", caption: "Oversized tees just dropped — true to size, super soft.", tags: ["oversized", "tee", "newarrival"], music: "Chill Vibes", likes: 860, comments: 21, views: 9800, t: hrs(9) },
    { id: "rl3", owner: { type: "creator", id: "c6" }, ref: "look:l36", caption: "Teej green & gold — tag your dance partner 💃", tags: ["teej", "festival", "traditional"], music: "Dohori Mix", likes: 2310, comments: 64, views: 28100, t: hrs(14) },
    { id: "rl4", owner: { type: "creator", id: "c3" }, ref: "look:l10", caption: "Denim on denim, always a yes.", tags: ["denim", "streetwear"], music: "Beat Drop", likes: 990, comments: 17, views: 11200, t: hrs(22) },
    { id: "rl5", owner: { type: "seller", id: "himal" }, ref: "product:bt6", caption: "Washed denim jacket — layer it over anything.", tags: ["denim", "jacket"], music: "Golden Hour", likes: 640, comments: 12, views: 7300, t: hrs(30) },
    { id: "rl6", owner: { type: "creator", id: "c4" }, ref: "look:l37", caption: "Tihar glow set for Deusi-Bhailo night 🪔", tags: ["tihar", "festival"], music: "Diyo Ko Ujyalo", likes: 1780, comments: 45, views: 19600, t: hrs(40) },
  ];
  const SEED_STORIES = [
    { id: "st1", owner: { type: "seller", id: "thamel" }, ref: "product:bt5", text: "Winter restock 🔥", t: hrs(2) },
    { id: "st2", owner: { type: "creator", id: "c2" },    ref: "look:l14",   text: "Lakeside weekend fit", t: hrs(4) },
    { id: "st3", owner: { type: "seller", id: "patan" },  ref: "product:bt4", text: "New Oxford shirts in store", t: hrs(6) },
    { id: "st4", owner: { type: "creator", id: "c5" },    ref: "look:l6",    text: "Wedding season ready", t: hrs(10) },
    { id: "st5", owner: { type: "creator", id: "c6" },    ref: "look:l38",   text: "Reception glam ✨", t: hrs(13) },
    { id: "st6", owner: { type: "seller", id: "lakeside" }, ref: "product:bt7", text: "Puffer season has arrived", t: hrs(18) },
  ];

  const SEARCH_SUGGESTIONS = [
    "black oversized t-shirt", "girls party dress", "boys cargo pant", "Dashain outfit",
    "college outfit under 2000", "winter puffer jacket", "Teej red sari", "kurti and palazzo",
    "boys formal shirt", "white sneakers", "Holi outfit", "wedding lehenga",
  ];

  CC.data = { COLORS, COLOR_LABEL, SELLERS, SIZES, PRODUCTS, CREATORS, LOOKS, FESTIVALS, TRENDS, BATTLES, DELIVERY, PAYMENTS, PAY_PLANS, REFUND, SEED_REELS, SEED_STORIES, SEARCH_SUGGESTIONS };
})(window.CC = window.CC || {});
