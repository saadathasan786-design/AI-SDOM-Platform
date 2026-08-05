<?php
/**
 * Enqueue theme styles/scripts. Versioned by filemtime so caches bust
 * automatically on deploy — no manual version bumps needed.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'wp_enqueue_scripts', function () {
	$style_path = BOILERPLATE_THEME_DIR . '/style.css';
	wp_enqueue_style(
		'boilerplate-style',
		BOILERPLATE_THEME_URI . '/style.css',
		array(),
		file_exists( $style_path ) ? filemtime( $style_path ) : BOILERPLATE_THEME_VERSION
	);

	$script_path = BOILERPLATE_THEME_DIR . '/assets/js/main.js';
	if ( file_exists( $script_path ) ) {
		wp_enqueue_script(
			'boilerplate-main',
			BOILERPLATE_THEME_URI . '/assets/js/main.js',
			array(),
			filemtime( $script_path ),
			array( 'strategy' => 'defer', 'in_footer' => true )
		);
	}
} );

// Dequeue block-library CSS you don't use to trim payload — uncomment once
// you've audited which core blocks the theme actually uses.
// add_action( 'wp_enqueue_scripts', function () {
// 	wp_dequeue_style( 'wp-block-library-theme' );
// }, 20 );
