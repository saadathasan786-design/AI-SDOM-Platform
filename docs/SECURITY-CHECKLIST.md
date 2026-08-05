# Security Checklist

Theme/plugin code only covers part of this. Rest = hosting + process.

## Code-level (covered by boilerplate)
- [x] `DISALLOW_FILE_EDIT` set — no wp-admin file editor
- [x] XML-RPC disabled (`xmlrpc_enabled` filter)
- [x] Version string stripped from head/generator
- [x] `/wp/v2/users` REST route hidden from anon requests
- [x] Basic security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`)
- [x] Generic login error message (no user-enumeration hints)
- [x] REST/CPT permission callbacks explicit, never `__return_true` for writes

## Server/hosting-level (not in code — do these too)
- [ ] Force HTTPS, HSTS header at server/CDN
- [ ] Disable directory listing (`Options -Indexes`)
- [ ] Block direct PHP execution in `/wp-content/uploads/`
- [ ] `wp-config.php` outside web root or permissions `640`
- [ ] Unique, long `AUTH_KEY`/`SALT` values (generate at https://api.wordpress.org/secret-key/1.1/salt/)
- [ ] Limit login attempts (fail2ban, Wordfence, or a lightweight rate-limit plugin)
- [ ] Two-factor auth for all admin accounts
- [ ] Application Passwords used for API/MCP access instead of storing real passwords
- [ ] Database backups automated + tested restore at least once
- [ ] `wp-config.php`: `define('DISALLOW_UNFILTERED_HTML', true);` unless a trusted role needs it
- [ ] Keep WP core, theme, and every plugin on auto-update or a real patch cadence
- [ ] Remove unused plugins/themes entirely (don't just deactivate)
- [ ] Review user roles regularly — no shared/unused admin accounts

## Before every migration or client handoff
- [ ] Rotate all Application Passwords / API keys
- [ ] Reset the DB `wp` table prefix if this was a demo/clone site
- [ ] Scan for known malware signatures (WPScan, Sucuri SiteCheck)
- [ ] Confirm `WP_DEBUG` is `false` and no debug log is publicly reachable
