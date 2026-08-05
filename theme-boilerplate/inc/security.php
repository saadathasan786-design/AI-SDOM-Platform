<?php
/**
 * Baseline security hardening. See docs/SECURITY-CHECKLIST.md for the full
 * server/hosting-level checklist — this file only covers what's reasonable
 * to set from within a theme.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Remove version number from head/RSS/scripts/styles — avoids advertising
// exactly which WP version (and therefore which known vulnerabilities) you run.
remove_action( 'wp_head', 'wp_generator' );
add_filter( 'the_generator', '__return_empty_string' );

// Disable the file editor in wp-admin (Appearance > Theme/Plugin Editor).
if ( ! defined( 'DISALLOW_FILE_EDIT' ) ) {
	define( 'DISALLOW_FILE_EDIT', true );
}

// Disable XML-RPC unless you specifically need it (Jetpack, remote publishing).
add_filter( 'xmlrpc_enabled', '__return_false' );

// Remove author archive username disclosure (avoids leaking valid usernames
// for brute-force targeting).
add_filter( 'rest_endpoints', function ( $endpoints ) {
	if ( isset( $endpoints['/wp/v2/users'] ) && ! is_user_logged_in() ) {
		unset( $endpoints['/wp/v2/users'] );
	}
	if ( isset( $endpoints['/wp/v2/users/(?P<id>[\d]+)'] ) && ! is_user_logged_in() ) {
		unset( $endpoints['/wp/v2/users/(?P<id>[\d]+)'] );
	}
	return $endpoints;
} );

// Send basic security headers. Prefer setting these at the server/CDN level
// where possible — this is a fallback for shared hosting without config access.
add_action( 'send_headers', function () {
	if ( is_admin() ) {
		return;
	}
	header( 'X-Content-Type-Options: nosniff' );
	header( 'X-Frame-Options: SAMEORIGIN' );
	header( 'Referrer-Policy: strict-origin-when-cross-origin' );
	header( 'Permissions-Policy: geolocation=(), microphone=(), camera=()' );
} );

// Limit login error messages so they don't confirm whether a username exists.
add_filter( 'login_errors', function () {
	return __( 'Invalid login credentials.', 'boilerplate-theme' );
} );
