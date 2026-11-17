const PRODUCT_TABLE = "products";
const IMAGE_BUCKET = "product-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

let supabaseClient;
let currentProducts = [];
let previewObjectUrl = "";

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function setStatus(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("error", isError);
}

function isAdminEmail(email) {
  const configuredEmails = window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.adminEmails;
  const allowed = Array.isArray(configuredEmails)
    ? configuredEmails.map((value) => String(value).trim().toLowerCase())
    : [];
  return allowed.includes(String(email || "").trim().toLowerCase());
}

function showAuth(message = "", isError = false) {
  $("#dashboard").hidden = true;
  $("#authPanel").hidden = false;
  $("#signOutBtn").hidden = true;
  if (message) setStatus($("#authStatus"), message, isError);
}

function showRecovery() {
  $("#signInView").hidden = true;
  $("#resetForm").hidden = true;
  $("#recoveryForm").hidden = false;
  $("#authPanel").hidden = false;
  $("#dashboard").hidden = true;
  $("#signOutBtn").hidden = true;
}

async function showDashboard(user) {
  if (!user || !isAdminEmail(user.email)) {
    showAuth("This account is not on the El-Ori admin allow-list.", true);
    await supabaseClient.auth.signOut();
    return;
  }
  $("#authPanel").hidden = true;
  $("#dashboard").hidden = false;
  $("#signOutBtn").hidden = false;
  $("#signedInEmail").textContent = user.email;
  await loadProducts();
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function productRow(product) {
  const image = product.image_url || "assets/emblem.png";
  const stateLabel = product.active ? "Published" : "Archived";
  const actionLabel = product.active ? "Archive" : "Restore";
  return `<tr class="${product.active ? "" : "archived"}">
    <td>
      <div class="product-cell">
        <img src="${escapeHtml(image)}" alt="" loading="lazy">
        <span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category)}</small></span>
      </div>
    </td>
    <td>GHS ${Number(product.price).toLocaleString("en-GH")}</td>
    <td>${stateLabel}</td>
    <td><div class="row-actions">
      <button class="btn secondary" type="button" data-edit="${escapeHtml(product.id)}">Edit</button>
      <button class="btn ${product.active ? "danger" : "secondary"}" type="button" data-toggle="${escapeHtml(product.id)}">${actionLabel}</button>
    </div></td>
  </tr>`;
}

async function loadProducts() {
  setStatus($("#listStatus"), "Loading products…");
  try {
    const { data, error } = await supabaseClient
      .from(PRODUCT_TABLE)
      .select("id, slug, name, category, price, image_url, active, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    currentProducts = Array.isArray(data) ? data : [];
    $("#productsTableBody").innerHTML = currentProducts.map(productRow).join("");
    setStatus($("#listStatus"), currentProducts.length
      ? `${currentProducts.length} product${currentProducts.length === 1 ? "" : "s"} loaded.`
      : "No products yet. Add the first piece using the form.");
  } catch (error) {
    setStatus($("#listStatus"), `Could not load products: ${error.message || error}`, true);
  }
}

function resetEditor() {
  $("#productForm").reset();
  $("#productId").value = "";
  $("#productActive").checked = true;
  $("#editorTitle").textContent = "Add a product";
  $("#saveProductBtn").textContent = "Save product";
  $("#cancelEditBtn").hidden = true;
  $("#imagePreview").hidden = true;
  $("#imagePreview").replaceChildren();
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = "";
  $("#productImage").value = "";
}

function editProduct(product) {
  $("#productId").value = product.id;
  $("#productName").value = product.name;
  $("#productCategory").value = product.category;
  $("#productPrice").value = product.price;
  $("#productActive").checked = Boolean(product.active);
  $("#editorTitle").textContent = "Edit product";
  $("#saveProductBtn").textContent = "Save changes";
  $("#cancelEditBtn").hidden = false;
  $("#imagePreview").replaceChildren();
  if (product.image_url) {
    const image = document.createElement("img");
    image.src = product.image_url;
    image.alt = "";
    const label = document.createElement("span");
    label.textContent = "Current photo. Choose a file to replace it.";
    $("#imagePreview").append(image, label);
    $("#imagePreview").hidden = false;
  } else {
    $("#imagePreview").hidden = true;
  }
  setStatus($("#adminStatus"), "");
  $("#productName").focus();
}

function validateImage(file) {
  if (!file) return "";
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Choose a JPEG, PNG, WebP or AVIF image.";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "Image must be 5 MB or smaller.";
  }
  return "";
}

async function uploadProductImage(productId, file) {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  const path = `${productId}/${Date.now()}-${safeName}`;
  const { error } = await supabaseClient.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  const { data } = supabaseClient.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  if (!data || !data.publicUrl) throw new Error("Photo uploaded, but Supabase did not return its public URL.");
  return data.publicUrl;
}

async function saveProduct(event) {
  event.preventDefault();
  const file = $("#productImage").files[0];
  const imageError = validateImage(file);
  if (imageError) {
    setStatus($("#adminStatus"), imageError, true);
    return;
  }

  const name = $("#productName").value.trim();
  const category = $("#productCategory").value.trim();
  const price = Number($("#productPrice").value);
  const slug = slugify(name);
  if (!name || !category || !slug || !Number.isFinite(price) || price < 0) {
    setStatus($("#adminStatus"), "Enter a product name, category and valid non-negative price.", true);
    return;
  }

  const editingId = $("#productId").value;
  const productId = editingId || crypto.randomUUID();
  const existing = currentProducts.find((product) => product.id === productId);
  const product = {
    slug,
    name,
    category,
    price,
    image_url: existing ? existing.image_url : "",
    active: $("#productActive").checked
  };
  const button = $("#saveProductBtn");
  button.disabled = true;
  setStatus($("#adminStatus"), file ? "Uploading photo and saving product…" : "Saving product…");

  try {
    if (file) product.image_url = await uploadProductImage(productId, file);
    const result = editingId
      ? await supabaseClient.from(PRODUCT_TABLE).update(product).eq("id", productId).select().single()
      : await supabaseClient.from(PRODUCT_TABLE).insert({ id: productId, ...product }).select().single();
    if (result.error) throw result.error;
    setStatus($("#adminStatus"), "Product saved.");
    resetEditor();
    await loadProducts();
  } catch (error) {
    setStatus($("#adminStatus"), `Could not save product: ${error.message || error}`, true);
  } finally {
    button.disabled = false;
  }
}

async function toggleProduct(product) {
  const nextActive = !product.active;
  setStatus($("#listStatus"), `${nextActive ? "Restoring" : "Archiving"} ${product.name}…`);
  try {
    const { error } = await supabaseClient
      .from(PRODUCT_TABLE)
      .update({ active: nextActive })
      .eq("id", product.id);
    if (error) throw error;
    await loadProducts();
  } catch (error) {
    setStatus($("#listStatus"), `Could not update product: ${error.message || error}`, true);
  }
}

function attachEvents() {
  $("#signInForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = $("#signInEmail").value.trim();
    if (!isAdminEmail(email)) {
      setStatus($("#authStatus"), "This email is not on the El-Ori admin allow-list.", true);
      return;
    }
    setStatus($("#authStatus"), "Signing in…");
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password: $("#signInPassword").value
      });
      if (error) throw error;
      await showDashboard(data.user);
    } catch (error) {
      setStatus($("#authStatus"), `Sign-in failed: ${error.message || error}`, true);
    }
  });

  $("#showResetBtn").addEventListener("click", () => {
    $("#signInView").hidden = true;
    $("#resetForm").hidden = false;
    $("#resetEmail").value = $("#signInEmail").value.trim();
    setStatus($("#resetStatus"), "");
  });
  $("#backToSignInBtn").addEventListener("click", () => {
    $("#resetForm").hidden = true;
    $("#signInView").hidden = false;
    setStatus($("#authStatus"), "");
  });
  $("#resetForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = $("#resetEmail").value.trim();
    if (!isAdminEmail(email)) {
      setStatus($("#resetStatus"), "This email is not on the El-Ori admin allow-list.", true);
      return;
    }
    setStatus($("#resetStatus"), "Sending password email…");
    try {
      const redirectTo = new URL("admin.html", window.location.href).href;
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setStatus($("#resetStatus"), "If this admin account is active, a password link is on its way.");
    } catch (error) {
      setStatus($("#resetStatus"), `Could not send the password email: ${error.message || error}`, true);
    }
  });
  $("#recoveryForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = $("#newPassword").value;
    if (password.length < 8 || password !== $("#confirmPassword").value) {
      setStatus($("#recoveryStatus"), "Use at least 8 characters and make sure both passwords match.", true);
      return;
    }
    try {
      const { data, error } = await supabaseClient.auth.updateUser({ password });
      if (error) throw error;
      if (!data.user || !isAdminEmail(data.user.email)) {
        setStatus($("#recoveryStatus"), "This account is not on the El-Ori admin allow-list.", true);
        await supabaseClient.auth.signOut();
        return;
      }
      $("#recoveryForm").hidden = true;
      await showDashboard(data.user);
    } catch (error) {
      setStatus($("#recoveryStatus"), `Could not update password: ${error.message || error}`, true);
    }
  });

  $("#signOutBtn").addEventListener("click", async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      showAuth("You have signed out.");
    } catch (error) {
      setStatus($("#listStatus"), `Sign-out failed: ${error.message || error}`, true);
    }
  });
  $("#productForm").addEventListener("submit", saveProduct);
  $("#cancelEditBtn").addEventListener("click", resetEditor);
  $("#reloadProductsBtn").addEventListener("click", loadProducts);
  $("#productImage").addEventListener("change", () => {
    const file = $("#productImage").files[0];
    const error = validateImage(file);
    if (error) {
      $("#productImage").value = "";
      setStatus($("#adminStatus"), error, true);
      return;
    }
    if (!file) return;
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = URL.createObjectURL(file);
    const image = document.createElement("img");
    image.src = previewObjectUrl;
    image.alt = "";
    const label = document.createElement("span");
    label.textContent = file.name;
    $("#imagePreview").replaceChildren(image, label);
    $("#imagePreview").hidden = false;
    setStatus($("#adminStatus"), "");
  });
  $("#productsTableBody").addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit]");
    if (editButton) {
      const product = currentProducts.find((item) => item.id === editButton.dataset.edit);
      if (product) editProduct(product);
      return;
    }
    const toggleButton = event.target.closest("[data-toggle]");
    if (toggleButton) {
      const product = currentProducts.find((item) => item.id === toggleButton.dataset.toggle);
      if (product) toggleProduct(product);
    }
  });
}

async function initialize() {
  attachEvents();
  const config = window.SUPABASE_CONFIG;
  if (!window.supabase || !config || !config.url || !config.publishableKey) {
    showAuth("Supabase configuration is missing. Check supabase-config.js.", true);
    return;
  }
  try {
    supabaseClient = window.supabase.createClient(config.url, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" }
    });
  } catch (error) {
    showAuth(`Could not initialize Supabase: ${error.message || error}`, true);
    return;
  }

  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" && session && session.user) {
      if (isAdminEmail(session.user.email)) showRecovery();
      else showAuth("This account is not on the El-Ori admin allow-list.", true);
      return;
    }
    if (event === "SIGNED_OUT") {
      showAuth();
      return;
    }
    if (session && session.user && $("#dashboard").hidden && !$("#recoveryForm").hidden) return;
    if (session && session.user) {
      setTimeout(() => showDashboard(session.user), 0);
    }
  });

  let sessionResult;
  try {
    sessionResult = await supabaseClient.auth.getSession();
  } catch (error) {
    showAuth(`Could not restore sign-in: ${error.message || error}`, true);
    return;
  }
  const { data, error } = sessionResult;
  if (error) {
    showAuth(`Could not restore sign-in: ${error.message}`, true);
    return;
  }
  const recoveryLink = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
  if (recoveryLink && data.session && isAdminEmail(data.session.user.email)) {
    showRecovery();
  } else if (data.session) {
    await showDashboard(data.session.user);
  }
}

document.addEventListener("DOMContentLoaded", initialize);
