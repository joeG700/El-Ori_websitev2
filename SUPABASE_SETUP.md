# El-Ori setup and publishing

The shop is a static HTML/CSS/JavaScript site. Product data, admin sign-in and product photos use Supabase. Checkout opens WhatsApp; customers confirm delivery and pay with the shop's Mobile Money process or on delivery. The website never asks for card details.

## 1. Create Supabase project and configure the public key

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In **Project Settings → API**, copy the Project URL and the **publishable** key.
3. Replace `url` and `publishableKey` in `supabase-config.js`. Keep the existing `adminEmails` values in that file synchronized with the SQL allow-list in `supabase-schema.sql`.
4. The publishable key is intended for browser use. Never put a service-role key, secret key, database password, or password in this repository.

## 2. Create the catalog and image bucket

In the Supabase **SQL Editor**, run the complete `supabase-schema.sql` file. It can be re-run safely; it creates the `products` table, archives the eight old starter rows if present (without deleting them), adds the 16 El-Ori catalog items if they do not already exist, configures the public `product-images` bucket, and applies row-level security and storage policies.

Visitors can read active catalog items and product photos. Only authenticated users whose email is in the allow-list can read archived items, add or edit products, and upload, update, or delete product images. Database grants allow public reads and authenticated writes only; row-level security limits those writes to the allow-listed admins.

## 3. Configure Supabase Auth and invite admins

1. In **Authentication → URL Configuration**, set the **Site URL** to your GitHub Pages site, for example `https://joeg700.github.io/El-Ori-website/`.
2. Add both the published site and its admin callback to **Redirect URLs**, for example:
   - `https://joeg700.github.io/El-Ori-website/`
   - `https://joeg700.github.io/El-Ori-website/admin.html`
   - For local testing: `http://localhost:8000/admin.html`
3. In **Authentication → Users**, invite each email listed in `supabase-config.js`. The emails must match the SQL allow-list. Each admin sets their own password through Supabase's invitation email.
4. Open `admin.html`, sign in, or request a password-reset email. For recovery, follow the email link back to `admin.html` and set a new password there.

Admin authorization is checked in the page and enforced independently by database and Storage row-level security. The allow-list is public configuration, not a secret; access also requires an authenticated session for one of its emails.

## 4. Publish using GitHub Pages

1. Push the site files and assets to the repository's `main` branch.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and the `/ (root)` folder, then save.
4. Wait for the Pages deployment to finish and open the published site. Confirm the storefront and `/admin.html` both load over HTTPS.
5. Add the final Pages URLs to Supabase's Auth redirect URL list as described above.

No build step or package install is required. GitHub Pages is a static host; it does not run server-side code.

## 5. Manage products and orders

From `admin.html`, admins can add/edit a product's name, category, price and photo, and archive or restore it. Supported photo types are JPEG, PNG, WebP and AVIF, up to 5 MB. Published product rows appear in the storefront; archived rows remain admin-only.

Customers add products to the bag and submit their name, phone number and delivery address. Checkout opens WhatsApp with the itemized order. Confirm availability, delivery fee and Mobile Money/payment-on-delivery details in that conversation.

Before sharing the site, replace the placeholder WhatsApp number and sample contact details in the `CONFIG` block at the top of `app.js` with the shop's actual contact information.
