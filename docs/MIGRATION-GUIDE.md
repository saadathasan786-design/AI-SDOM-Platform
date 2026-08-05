# Migration Guide (Local → Staging/Live)

## Recommended path: WP-CLI + `search-replace`
Local by Flywheel bundles WP-CLI (site shell → right-click site → "Open Site
Shell"). This is the reliable path — avoid GUI export/import tools for
anything beyond a quick demo, they mangle serialized PHP data more often.

1. **Export DB**
   ```bash
   wp db export local-export.sql
   ```
2. **Push files** (theme, plugins, uploads) via SFTP/rsync/git — whichever
   your host supports. Don't copy `wp-content/cache` or `wp-content/debug.log`.
3. **Import DB on the destination**
   ```bash
   wp db import local-export.sql
   ```
4. **Search-replace the URL** (serialized-data-safe — never do this with a
   plain SQL find/replace tool, it corrupts serialized arrays):
   ```bash
   wp search-replace 'https://mysite.local' 'https://mysite.com' --all-tables --precise
   ```
5. **Flush rewrite rules + regenerate permalinks**
   ```bash
   wp rewrite flush
   ```
6. **Re-check**:
   - [ ] Site URL / Home URL correct (Settings → General)
   - [ ] Application Passwords re-generated for the new environment (old ones
     tied to the old DB row don't reliably survive a migration)
   - [ ] Any hardcoded absolute URLs in ACF fields, widgets, or page builder
     JSON (Elementor stores some absolute URLs — run search-replace again
     specifically targeting `_elementor_data` if needed)
   - [ ] SSL/HTTPS enforced on the new environment
   - [ ] Cron: Local's cron may differ from host's real cron — confirm
     `WP_CRON` behavior on the destination
   - [ ] robots.txt / indexing settings — don't launch a site that's still
     set to "Discourage search engines" from the Local build

## Rolling back
Keep the pre-migration DB export and a file backup until the new environment
has been verified end-to-end (checkout flow if WooCommerce, forms, admin
login) — not just "homepage loads."
