# Performance Checklist

## Code-level (covered by boilerplate)
- [x] Cache-busted asset versions via `filemtime()`, not manual bumps
- [x] Scripts deferred, loaded in footer
- [x] Native lazy-loading enabled for images
- [x] Post revisions capped (5)
- [x] Emoji detection script/styles removed
- [x] Heartbeat API throttled to 60s

## Hosting/plugin-level (not in code)
- [ ] Object cache: Redis or Memcached (esp. for WooCommerce sites)
- [ ] Page cache: WP Rocket, W3 Total Cache, or host-level (e.g. Local isn't representative of prod caching — test on staging)
- [ ] Image optimization/CDN (ShortPixel, Imagify, or host's built-in image CDN)
- [ ] Database cleanup: expired transients, post revisions, spam comments (WP-Optimize or manual `wp-cli` queries)
- [ ] GZIP/Brotli compression at server level
- [ ] HTTP/2 or HTTP/3 enabled
- [ ] Critical CSS / render-blocking resource audit (Lighthouse, PageSpeed Insights)
- [ ] Database indexes reviewed for any custom meta queries (`meta_query` on unindexed keys is a common slow-query source)
- [ ] Limit `posts_per_page` on archive/query blocks to something reasonable (10–12), paginate rest

## WooCommerce-specific
- [ ] HPOS (High-Performance Order Storage) enabled — much faster order queries than legacy post-based orders
- [ ] Product image sizes trimmed to only what the theme actually uses (Settings → Media)
- [ ] Cart/checkout page cache excluded (these must stay dynamic)

## Measuring
- [ ] Baseline with Query Monitor (dev) before optimizing
- [ ] Re-test with PageSpeed Insights / WebPageTest after each major change, not just once at the end
