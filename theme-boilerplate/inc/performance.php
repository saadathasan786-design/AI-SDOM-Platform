<?php
/**
 * Performance defaults. See docs/PERFORMANCE-CHECKLIST.md for hosting/CDN/
 * caching-plugin-level items outside the scope of theme code.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Native lazy-loading is on by default in modern WP, but make sure it applies
// to content images consistently.
add_filter( 'wp_lazy_loading_enabled', '__return_true' );

// Preconnect to Google Fonts (or whatever external origin you actually use)
// only if you use it — remove otherwise, this is just an example hint.
add_filter( 'wp_resource_hints', function ( $urls, $relation_type ) {
	if ( 'preconnect' === $relation_type ) {
		$urls[] = array( 'href' => 'https://fonts.gstatic.com', 'crossorigin' => true );
	}
	return $urls;
}, 10, 2 );

// Limit post revisions to reduce database bloat (set in wp-config.php too:
// define( 'WP_POST_REVISIONS', 5 );). This filter is a theme-level fallback.
add_filter( 'wp_revisions_to_keep', function ( $num, $post ) {
	return 5;
}, 10, 2 );

// Remove emoji script/styles on the front end unless you need them.
add_action( 'init', function () {
	remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
	remove_action( 'wp_print_styles', 'print_emoji_styles' );
} );

// Split heartbeat API frequency down on the front end to reduce admin-ajax load.
add_filter( 'heartbeat_settings', function ( $settings ) {
	$settings['interval'] = 60;
	return $settings;
} );
