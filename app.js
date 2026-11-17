/* =========================================================
   El-Ori — storefront logic (vanilla JS, no dependencies)
   ========================================================= */

const CONFIG = {
  // Replace with the real business WhatsApp number: country code + number, digits only.
  whatsapp: "233502981045",
  instagram: "https://www.instagram.com/el_orriii",
  email: "eloriii02@gmail.com",
  currency: "GHS"
};

function normalizeProduct(product) {
  const id = String(product.id || product.slug || product.name || "");
  const slug = String(product.slug || id);
  const fallback = PRODUCTS.find((item) => item.id === slug || item.slug === slug);
  const category = String(product.category || "Misc");
  const active = product.active !== false;
  return {
    id,
    slug,
    name: String(product.name || (fallback && fallback.name) || product.slug || "Untitled item"),
    category,
    price: Number(product.price) || 0,
    image: safeImageUrl(product.image_url || product.image),
    badge: String(product.badge || (fallback && fallback.badge) || ""),
    stock: product.stock == null ? (fallback ? fallback.stock : (active ? 99 : 0)) : Math.max(0, Number(product.stock) || 0),
    desc: String(product.desc || (fallback && fallback.desc) || `${category} by El-Ori.`),
    details: Array.isArray(product.details) && product.details.length
      ? product.details.map(String)
      : (fallback ? [...fallback.details] : ["Gift-boxed and delivered nationwide"]),
    hot: Boolean(product.hot ?? (fallback && fallback.hot) ?? false)
  };
}

function safeImageUrl(value) {
  const source = String(value || "");
  return /^(https?:\/\/|assets\/|\.\/)/i.test(source) ? source : "assets/emblem.png";
}

function getSupabaseClient() {
  const config = window.SUPABASE_CONFIG;
  if (!window.supabase || !config || !config.url || !config.publishableKey) return null;
  return window.supabase.createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
}

function setCatalogStatus(message, isError = false) {
  const status = $("#catalogStatus");
  status.textContent = message;
  status.classList.toggle("is-error", isError);
  status.hidden = !message;
}

async function hydrateCatalog() {
  setCatalogStatus("Loading the El-Ori collection…");
  const client = getSupabaseClient();
  if (!client) {
    setCatalogStatus("Supabase is not configured. Showing the saved El-Ori catalog.", true);
    return;
  }
  try {
    const { data, error } = await client
      .from("products")
      .select("id, slug, name, category, price, image_url, active, created_at")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const nextProducts = (Array.isArray(data) ? data : []).map(normalizeProduct);
    const previousProducts = PRODUCTS;
    const nextBySlug = new Map(nextProducts.map((product) => [product.slug, product]));
    const migratedCart = {};
    Object.entries(cart).forEach(([id, quantity]) => {
      const previousProduct = previousProducts.find((product) => product.id === id);
      const product = nextBySlug.get(previousProduct ? (previousProduct.slug || previousProduct.id) : id);
      if (product && quantity > 0) migratedCart[product.id] = quantity;
    });
    PRODUCTS = nextProducts;
    cart = migratedCart;
    saveCart();
    setCatalogStatus("");
  } catch (error) {
    setCatalogStatus(`We couldn't load the live collection (${error.message || "connection error"}). Showing the saved El-Ori catalog.`, true);
  }
}

const CATEGORIES = [
  { name: "Necklaces", short: "Necklaces", img: "assets/categories/necklaces.jpg" },
  { name: "Bracelets", short: "Bracelets", img: "assets/categories/bracelets.jpg" },
  { name: "Earrings", short: "Earrings", img: "assets/categories/earrings.jpg" },
  { name: "Rings", short: "Rings", img: "assets/categories/rings.jpg" },
  { name: "Anklets", short: "Anklets", img: "assets/categories/anklets.jpg" },
  { name: "Jewelry Sets", short: "Sets", img: "assets/categories/sets.jpg" },
  { name: "Watches", short: "Watches", img: "assets/categories/watches.jpg" },
  { name: "Gift Packages", short: "Gifts", img: "assets/categories/gifts.jpg" }
];

let PRODUCTS = [
  {
    id: "crystal-clover-necklace",
    name: "Crystal Clover Necklace [Gold]",
    category: "Necklaces",
    price: 100,
    image: "assets/products/necklace-clover.jpg",
    badge: "Bestseller",
    stock: 6,
    desc: "A delicate gold-tone chain carrying a four-leaf clover pendant set with light-catching crystals. A quiet symbol of luck you can wear every day.",
    details: ["18k gold-plated stainless steel", "Non-tarnish and water resistant", "40 cm chain with 5 cm extender", "Arrives in an El-Ori gift box"],
    hot: true
  },
  {
    id: "pearl-strand-necklace",
    name: "Pearl Strand Necklace",
    category: "Necklaces",
    price: 120,
    image: "assets/products/necklace-pearl.jpg",
    badge: "",
    stock: 4,
    desc: "A single strand of smooth, lustrous pearls finished with a small gold clasp. The piece that makes a plain neckline look considered.",
    details: ["Freshwater-style pearls", "Gold-tone clasp", "42 cm strand", "Arrives in an El-Ori gift box"],
    hot: false
  },
  {
    id: "layered-chain-necklace",
    name: "Layered Chain Necklace [Silver]",
    category: "Necklaces",
    price: 85,
    image: "assets/products/necklace-layered.jpg",
    badge: "New",
    stock: 8,
    desc: "Two fine chains, one coin pendant, zero effort. A layered look that stays untangled from morning to night.",
    details: ["Stainless steel", "Non-tarnish finish", "Double chain: 38 cm and 45 cm", "Arrives in an El-Ori gift box"],
    hot: true
  },
  {
    id: "tennis-bracelet-silver",
    name: "Tennis Bracelet [Silver]",
    category: "Bracelets",
    price: 85,
    image: "assets/products/bracelet-tennis.jpg",
    badge: "Bestseller",
    stock: 7,
    desc: "A continuous line of brilliant crystals set in silver-tone steel. The classic that never leaves the rotation.",
    details: ["Stainless steel with cubic zirconia", "17 cm with extender", "Unisex design", "Arrives in an El-Ori gift box"],
    hot: true
  },
  {
    id: "love-bangle-gold",
    name: "Love Bangle [Gold]",
    category: "Bracelets",
    price: 90,
    image: "assets/products/bracelet-love.jpg",
    badge: "Bestseller",
    stock: 8,
    desc: "A polished gold-tone bangle with signature screw details. Stack it with the tennis bracelet or wear it solo.",
    details: ["18k gold-plated stainless steel", "Non-tarnish and water resistant", "17 cm inner circumference", "Unisex design"],
    hot: true
  },
  {
    id: "good-luck-dainty-bracelet",
    name: "Good Luck Dainty Bracelet",
    category: "Bracelets",
    price: 60,
    image: "assets/products/bracelet-goodluck.jpg",
    badge: "",
    stock: 2,
    desc: "Tiny charms — an evil eye, a star, a heart — on a barely-there chain. A little luck, every day.",
    details: ["Gold-tone stainless steel", "Adjustable 16–19 cm", "Non-tarnish finish", "Arrives in an El-Ori gift box"],
    hot: true
  },
  {
    id: "emerald-stud-earrings",
    name: "Emerald Stud Earrings",
    category: "Earrings",
    price: 70,
    image: "assets/products/earrings-emerald.jpg",
    badge: "Bestseller",
    stock: 7,
    desc: "Deep emerald crystals in a warm gold setting. Small, but they catch everything.",
    details: ["Gold-plated stainless steel", "Hypoallergenic posts", "6 mm crystal", "Arrives in an El-Ori gift box"],
    hot: true
  },
  {
    id: "daisy-stud-earrings",
    name: "Daisy Stud Earrings",
    category: "Earrings",
    price: 65,
    image: "assets/products/earrings-daisy.jpg",
    badge: "",
    stock: 9,
    desc: "White petals and a gold centre, like a tiny flower on your earlobe. The pair you'll reach for on good days.",
    details: ["Stainless steel with enamel detail", "8 mm width", "Hypoallergenic posts", "Arrives in an El-Ori gift box"],
    hot: true
  },
  {
    id: "crystal-solitaire-ring",
    name: "Crystal Solitaire Ring",
    category: "Rings",
    price: 55,
    image: "assets/products/ring-solitaire.jpg",
    badge: "",
    stock: 6,
    desc: "One clear crystal, one clean silver band. Understated, and impossible to stop looking at.",
    details: ["Stainless steel with cubic zirconia", "Sizes 6–9 available", "Non-tarnish finish", "Arrives in an El-Ori gift box"],
    hot: false
  },
  {
    id: "stacking-ring-set",
    name: "Stacking Ring Set",
    category: "Rings",
    price: 80,
    image: "assets/products/rings-stack.jpg",
    badge: "New",
    stock: 4,
    desc: "Three thin bands, three finishes. Wear them together on one finger or trade them out through the week.",
    details: ["Set of three stainless steel rings", "Gold, silver and rose gold finishes", "Sizes 6–9 available", "Arrives in an El-Ori gift box"],
    hot: true
  },
  {
    id: "crystal-anklet-silver",
    name: "Crystal Anklet [Silver]",
    category: "Anklets",
    price: 50,
    image: "assets/products/anklet-crystal.jpg",
    badge: "",
    stock: 5,
    desc: "A fine silver chain with scattered crystals and a tiny heart. For the days you wear sandals.",
    details: ["Stainless steel with crystals", "23 cm with 5 cm extender", "Non-tarnish finish", "Arrives in an El-Ori gift box"],
    hot: false
  },
  {
    id: "pearl-anklet",
    name: "Pearl Anklet",
    category: "Anklets",
    price: 55,
    image: "assets/products/anklet-pearl.jpg",
    badge: "",
    stock: 0,
    desc: "Small pearls along a delicate gold chain. Quietly pretty, especially with bare feet and a long dress.",
    details: ["Pearl with gold-plated steel chain", "23 cm with 5 cm extender", "Non-tarnish finish", "Arrives in an El-Ori gift box"],
    hot: false
  },
  {
    id: "tresor-jewelry-set",
    name: "Trésor Jewelry Set",
    category: "Jewelry Sets",
    price: 180,
    image: "assets/products/set-tresor.jpg",
    badge: "Bestseller",
    stock: 3,
    desc: "Necklace, bracelet and earrings in one gift-ready box. Our most-gifted set, for birthdays and brides alike.",
    details: ["Three-piece set: necklace, bracelet, earrings", "Gold-plated stainless steel", "Arrives in a lined El-Ori gift box", "Handwritten note available on request"],
    hot: true
  },
  {
    id: "ladies-watch-rose-gold",
    name: "Ladies Watch [Rose Gold]",
    category: "Watches",
    price: 150,
    image: "assets/products/watch-ladies.jpg",
    badge: "",
    stock: 0,
    desc: "A slim rose-gold mesh strap and a clean white dial. Jewelry that happens to tell time.",
    details: ["Stainless steel mesh strap", "32 mm case", "Water resistant to 3 ATM", "Arrives in an El-Ori gift box"],
    hot: false
  },
  {
    id: "mens-watch-black-steel",
    name: "Men's Watch [Black Steel]",
    category: "Watches",
    price: 180,
    image: "assets/products/watch-mens.jpg",
    badge: "",
    stock: 4,
    desc: "A black steel chronograph with presence. Built for everyday, dressed for evenings.",
    details: ["Stainless steel case and strap", "42 mm case", "Water resistant to 3 ATM", "Arrives in an El-Ori gift box"],
    hot: false
  },
  {
    id: "signature-gift-set",
    name: "Signature Gift Set",
    category: "Gift Packages",
    price: 250,
    image: "assets/products/gift-signature.jpg",
    badge: "Bestseller",
    stock: 5,
    desc: "Our rose gift box: a gold necklace, a rose hair perfume and a sprig of dried lavender. Ready to give, hard to give away.",
    details: ["Three items in a keepsake box", "Gift-wrapped as standard", "Handwritten note available", "Limited weekly stock"],
    hot: true
  }
];

window.EL_ORI_DEFAULT_PRODUCTS = PRODUCTS.slice();

/* ---------- Helpers ---------- */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function fmt(amount) {
  return `${CONFIG.currency} ${amount.toLocaleString("en-GH")}`;
}

function byId(id) {
  return PRODUCTS.find((p) => p.id === id);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const state = {
  category: "All",
  query: "",
  sort: "featured"
};

/* ---------- Cart ---------- */

const CART_KEY = "elori_cart_v1";
let cart = {};

try {
  const saved = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
  if (saved && typeof saved === "object") {
    Object.keys(saved).forEach((id) => {
      const qty = parseInt(saved[id], 10);
      if (byId(id) && qty > 0) cart[id] = qty;
    });
  }
} catch (e) {
  cart = {};
}

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    /* storage may be unavailable; cart still works in-memory */
  }
}

function cartCount() {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

function cartTotal() {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = byId(id);
    return p ? sum + p.price * qty : sum;
  }, 0);
}

function addToCart(id, qty = 1) {
  const p = byId(id);
  if (!p || p.stock === 0) return;
  cart[id] = (cart[id] || 0) + qty;
  saveCart();
  renderCart();
  bumpCount();
  toast(`${p.name} added to your bag`);
}

function setQty(id, qty) {
  if (qty <= 0) {
    delete cart[id];
  } else {
    cart[id] = qty;
  }
  saveCart();
  renderCart();
}

function bumpCount() {
  const el = $("#cartCount");
  el.classList.remove("is-bump");
  void el.offsetWidth;
  el.classList.add("is-bump");
}

function renderCart() {
  const count = cartCount();
  $("#cartCount").textContent = count;
  $("#cartSubtitle").textContent = `${count} ${count === 1 ? "piece" : "pieces"}`;

  const itemsEl = $("#cartItems");
  const emptyEl = $("#cartEmpty");
  const footEl = $("#cartFoot");
  const perkEl = $("#cartPerk");
  const entries = Object.entries(cart);

  if (entries.length === 0) {
    itemsEl.innerHTML = "";
    emptyEl.style.display = "flex";
    footEl.hidden = true;
    perkEl.hidden = true;
    return;
  }

  emptyEl.style.display = "none";
  footEl.hidden = false;
  perkEl.hidden = false;

  itemsEl.innerHTML = entries
    .map(([id, qty]) => {
      const p = byId(id);
      if (!p) return "";
      return `
      <div class="cart-item" data-id="${esc(p.id)}">
        <img class="cart-item__img" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">
        <div>
          <p class="cart-item__name">${esc(p.name)}</p>
          <p class="cart-item__price">${fmt(p.price)}</p>
          <div class="qty">
            <button type="button" data-act="dec" aria-label="Decrease quantity of ${esc(p.name)}">−</button>
            <span>${qty}</span>
            <button type="button" data-act="inc" aria-label="Increase quantity of ${esc(p.name)}">+</button>
          </div>
        </div>
        <button type="button" class="cart-item__remove" data-act="remove" aria-label="Remove ${esc(p.name)}">Remove</button>
      </div>`;
    })
    .join("");

  $("#cartTotal").textContent = fmt(cartTotal());
}

/* ---------- Product cards ---------- */

function badgeMarkup(p) {
  if (p.stock === 0) return `<span class="card-badge is-sold">Sold out</span>`;
  if (p.stock <= 2) return `<span class="card-badge">Low stock</span>`;
  if (p.badge) return `<span class="card-badge">${esc(p.badge)}</span>`;
  return "";
}

function cardMarkup(p) {
  const sold = p.stock === 0;
  return `
  <article class="product-card" data-id="${esc(p.id)}">
    <div class="card-media" data-open="${esc(p.id)}">
      ${badgeMarkup(p)}
      <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" width="820" height="820">
      ${
        sold
          ? ""
          : `<button class="quick-add" type="button" data-add="${esc(p.id)}" aria-label="Add ${esc(p.name)} to bag">Add to bag</button>`
      }
    </div>
    <div class="card-body">
      <p class="card-cat">${esc(p.category)}</p>
      <h3 class="card-name"><button type="button" data-open="${esc(p.id)}">${esc(p.name)}</button></h3>
      <div class="card-price-row">
        <span class="card-price"><small>GHS</small>${p.price.toLocaleString("en-GH")}</span>
        ${sold ? '<span class="card-sold">Sold out</span>' : ""}
      </div>
    </div>
  </article>`;
}

function renderHottest() {
  const hot = PRODUCTS.filter((p) => p.hot).slice(0, 8);
  const featured = hot.length ? hot : PRODUCTS.slice(0, 4);
  $("#hottestRail").innerHTML = featured.map(cardMarkup).join("");
}

function renderCategories() {
  const counts = PRODUCTS.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  $("#categoryGrid").innerHTML = CATEGORIES
    .map(
      (c) => `
    <button class="cat" type="button" data-cat="${esc(c.name)}">
      <span class="cat__ring"><img class="cat__img" src="${c.img}" alt="" loading="lazy"></span>
      <span>
        <span class="cat__name">${esc(c.short || c.name)}</span>
        <span class="cat__count">${counts[c.name] || 0} ${(counts[c.name] || 0) === 1 ? "piece" : "pieces"}</span>
      </span>
    </button>`
    )
    .join("");
}

function visibleProducts() {
  let list = PRODUCTS.slice();
  if (state.category !== "All") {
    list = list.filter((p) => p.category === state.category);
  }
  if (state.query.trim()) {
    const q = state.query.trim().toLowerCase();
    list = list.filter((p) =>
      [p.name, p.category, p.desc].join(" ").toLowerCase().includes(q)
    );
  }
  switch (state.sort) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "name":
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      list.sort((a, b) => Number(b.hot) - Number(a.hot));
  }
  return list;
}

function renderGrid() {
  const list = visibleProducts();
  const grid = $("#productGrid");
  grid.innerHTML = list.map(cardMarkup).join("");
  $("#emptyState").classList.toggle("is-visible", list.length === 0);

  const label = state.category === "All" ? "all categories" : state.category.toLowerCase();
  $("#resultLine").textContent = list.length
    ? `Showing ${list.length} ${list.length === 1 ? "piece" : "pieces"} in ${label}${state.query ? ` for “${state.query}”` : ""}`
    : "";
  if (!PRODUCTS.length) {
    $("#emptyState h3").textContent = "The collection is being updated";
    $("#emptyState p").textContent = "Please check back soon or message us on WhatsApp for availability.";
    $("#resetFilters").hidden = true;
  } else {
    $("#emptyState h3").textContent = "No pieces match that search";
    $("#emptyState p").textContent = "Try a different word, or browse every piece in the collection.";
    $("#resetFilters").hidden = false;
  }
}

function renderChips() {
  const chips = ["All", ...CATEGORIES.map((c) => c.name)];
  $("#filterChips").innerHTML = chips
    .map(
      (c) =>
        `<button class="chip ${state.category === c ? "is-active" : ""}" type="button" data-chip="${esc(c)}" aria-pressed="${state.category === c}">${
          c === "All" ? "All pieces" : esc(c)
        }</button>`
    )
    .join("");
}

function renderFooterShop() {
  $("#footerShopLinks").innerHTML = CATEGORIES.map(
    (c) => `<button type="button" data-cat="${esc(c.name)}">${esc(c.name)}</button>`
  ).join("");
}

/* ---------- Filters ---------- */

function setCategory(cat, scroll = false) {
  state.category = cat;
  renderChips();
  renderGrid();
  if (scroll) {
    document.getElementById("shop").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function setQuery(q, scroll = false) {
  state.query = q;
  $("#shopSearchInput").value = q;
  $("#shopSearchWrap").classList.toggle("has-value", q.length > 0);
  renderGrid();
  if (scroll) {
    document.getElementById("shop").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* ---------- Modal ---------- */

let activeProduct = null;
let modalQty = 1;
let lastFocused = null;

function openModal(id) {
  const p = byId(id);
  if (!p) return;
  activeProduct = p;
  modalQty = 1;
  lastFocused = document.activeElement;

  $("#modalImg").src = safeImageUrl(p.image);
  $("#modalImg").alt = p.name;
  $("#modalCat").textContent = p.category;
  $("#modalName").textContent = p.name;
  $("#modalPrice").textContent = p.price.toLocaleString("en-GH");
  $("#modalDesc").textContent = p.desc;
  $("#modalDetails").innerHTML = p.details
    .map(
      (d) =>
        `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>${esc(d)}</span></li>`
    )
    .join("");
  $("#modalQty").textContent = modalQty;

  const sold = p.stock === 0;
  $("#modalBuy").hidden = sold;
  $("#modalSold").hidden = !sold;

  $("#modalBackdrop").classList.add("is-open");
  document.body.style.overflow = "hidden";
  $("#modalClose").focus();
}

function closeModal() {
  $("#modalBackdrop").classList.remove("is-open");
  document.body.style.overflow = "";
  activeProduct = null;
  if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
}

/* ---------- Cart drawer ---------- */

function openCart() {
  $("#cartDrawer").classList.add("is-open");
  $("#drawerBackdrop").classList.add("is-open");
  $("#cartDrawer").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  $("#closeCart").focus();
}

function closeCart() {
  $("#cartDrawer").classList.remove("is-open");
  $("#drawerBackdrop").classList.remove("is-open");
  $("#cartDrawer").setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

/* ---------- Mobile menu ---------- */

function setMenu(open) {
  const menu = $("#mobileMenu");
  const burger = $("#burger");
  menu.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", String(open));
}

/* ---------- Focus trap ---------- */

function trapFocus(container, e) {
  if (e.key !== "Tab" || !container) return;
  const candidates = Array.from(
    container.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')
  ).filter((el) => el.getClientRects().length > 0);
  if (candidates.length === 0) return;
  const first = candidates[0];
  const last = candidates[candidates.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/* ---------- Toast ---------- */

let toastTimer = null;

function toast(message) {
  const el = $("#toast");
  $("#toastText").textContent = message;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2400);
}

/* ---------- Checkout ---------- */

function buildOrderMessage(customer) {
  const lines = Object.entries(cart).map(([id, qty]) => {
    const p = byId(id);
    return `• ${qty} × ${p.name} — ${fmt(p.price * qty)}`;
  });
  return [
    "Hello El-Ori! I'd like to place an order:",
    "",
    ...lines,
    "",
    `Subtotal: ${fmt(cartTotal())}`,
    "",
    `Name: ${customer.name}`,
    `Phone: ${customer.phone}`,
    `Delivery address: ${customer.address}`,
    "",
    "Please confirm the delivery fee and Mobile Money or payment-on-delivery details."
  ].join("\n");
}

function checkout(event) {
  event.preventDefault();
  if (cartCount() === 0) return;
  const customer = {
    name: $("#customerName").value.trim(),
    phone: $("#customerPhone").value.trim(),
    address: $("#deliveryAddress").value.trim()
  };
  if (!customer.name || !customer.phone || !customer.address) {
    $("#checkoutForm").reportValidity();
    return;
  }
  const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(buildOrderMessage(customer))}`;
  window.open(url, "_blank", "noopener");
}

/* ---------- Events ---------- */

document.addEventListener("click", (e) => {
  const t = e.target;

  const addBtn = t.closest("[data-add]");
  if (addBtn) {
    addToCart(addBtn.getAttribute("data-add"));
    return;
  }

  const openBtn = t.closest("[data-open]");
  if (openBtn) {
    openModal(openBtn.getAttribute("data-open"));
    return;
  }

  const chip = t.closest("[data-chip]");
  if (chip) {
    setCategory(chip.getAttribute("data-chip"));
    return;
  }

  const catBtn = t.closest("[data-cat]");
  if (catBtn) {
    setCategory(catBtn.getAttribute("data-cat"), true);
    return;
  }

  const cartAct = t.closest("[data-act]");
  if (cartAct) {
    const item = cartAct.closest(".cart-item");
    const id = item && item.getAttribute("data-id");
    if (id) {
      const act = cartAct.getAttribute("data-act");
      const current = cart[id] || 0;
      if (act === "inc") setQty(id, current + 1);
      if (act === "dec") setQty(id, current - 1);
      if (act === "remove") setQty(id, 0);
    }
    return;
  }

  if (t.id === "modalBackdrop") closeModal();
  if (t.id === "drawerBackdrop") closeCart();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if ($("#modalBackdrop").classList.contains("is-open")) closeModal();
    if ($("#cartDrawer").classList.contains("is-open")) closeCart();
    if ($("#mobileMenu").classList.contains("is-open")) setMenu(false);
  }
  if ($("#modalBackdrop").classList.contains("is-open")) trapFocus($("#productModal"), e);
  else if ($("#cartDrawer").classList.contains("is-open")) trapFocus($("#cartDrawer"), e);
});

function init() {
  renderCategories();
  renderChips();
  renderHottest();
  renderGrid();
  renderFooterShop();
  renderCart();

  $("#year").textContent = new Date().getFullYear();

  // Contact links
  const waLink = `https://wa.me/${CONFIG.whatsapp}`;
  ["#contactWhatsapp", "#socialWhatsapp"].forEach((sel) => {
    const el = $(sel);
    if (el) el.href = waLink;
  });
  ["#contactInstagram", "#socialInstagram"].forEach((sel) => {
    const el = $(sel);
    if (el) el.href = CONFIG.instagram;
  });
  ["#contactEmail", "#socialEmail"].forEach((sel) => {
    const el = $(sel);
    if (el) el.href = `mailto:${CONFIG.email}`;
  });

  // Header scroll state
  const header = $("#siteHeader");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Search: hero
  $("#heroSearchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    setQuery($("#heroSearchInput").value, true);
    $("#heroSearchInput").blur();
  });

  // Search: shop
  let debounce = null;
  $("#shopSearchInput").addEventListener("input", (e) => {
    const value = e.target.value;
    $("#shopSearchWrap").classList.toggle("has-value", value.length > 0);
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.query = value;
      renderGrid();
    }, 140);
  });

  $("#clearSearch").addEventListener("click", () => {
    setQuery("");
    $("#shopSearchInput").focus();
  });

  $("#sortSelect").addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderGrid();
  });

  $("#resetFilters").addEventListener("click", () => {
    state.category = "All";
    setQuery("");
    state.sort = "featured";
    $("#sortSelect").value = "featured";
    renderChips();
    renderGrid();
  });

  // Cart open/close
  $("#openCart").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", closeCart);
  $("#continueShopping").addEventListener("click", closeCart);
  $("#cartEmptyShop").addEventListener("click", () => {
    closeCart();
    document.getElementById("shop").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#checkoutForm").addEventListener("submit", checkout);

  // Search jump
  $("#searchJump").addEventListener("click", () => {
    document.getElementById("shop").scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => $("#shopSearchInput").focus(), 450);
  });

  // Modal
  $("#modalClose").addEventListener("click", closeModal);
  $("#modalQtyMinus").addEventListener("click", () => {
    modalQty = Math.max(1, modalQty - 1);
    $("#modalQty").textContent = modalQty;
  });
  $("#modalQtyPlus").addEventListener("click", () => {
    modalQty = Math.min(10, modalQty + 1);
    $("#modalQty").textContent = modalQty;
  });
  $("#modalAdd").addEventListener("click", () => {
    if (!activeProduct) return;
    addToCart(activeProduct.id, modalQty);
    closeModal();
  });

  // Mobile menu
  const burger = $("#burger");
  burger.addEventListener("click", () => setMenu(!$("#mobileMenu").classList.contains("is-open")));
  $$("#mobileMenu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

  // Reveal on scroll
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveals = $$(".reveal");
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await hydrateCatalog();
  init();
});
