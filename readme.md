# El-Ori storefront

A responsive static storefront for El-Ori, built with HTML, CSS and vanilla JavaScript. It keeps the existing jewelry catalog, photos, Ghana delivery information and brand styling. Products are read from Supabase; the owner can manage published and archived products from the protected admin page.

## Project files

- `index.html`, `styles.css`, `app.js` — storefront, catalog filters, bag and WhatsApp order flow
- `admin.html`, `admin.js` — Supabase Auth-protected product editor and photo upload
- `supabase-config.js` — public Supabase URL, publishable key and admin email allow-list
- `supabase-schema.sql` — products schema, demo catalog, RLS and Storage policies
- `SUPABASE_SETUP.md` — Supabase Auth and GitHub Pages setup instructions
- `assets/` — El-Ori logo, editorial and product photos

## Run locally

Serve this directory over HTTP (for example with `python -m http.server 8000`) and open `http://localhost:8000`. Configure that admin callback in Supabase Auth before testing sign-in or password recovery.

## Product and order flow

The storefront reads active products from Supabase and includes visible loading, empty and fetch-error states. Product text is escaped before it is inserted into the page. Customers add items to the bag, enter their name, phone and delivery address, then send the order summary through WhatsApp. Payment is confirmed through the shop's Mobile Money process or on delivery; no card information is requested or stored.

The admin page requires an authenticated user whose email is in `supabase-config.js`; Supabase RLS and Storage policies enforce the same allow-list. Product images are uploaded to the public `product-images` bucket. Only the publishable key belongs in browser code.

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for project configuration, admin invitations, password recovery and GitHub Pages publishing.
