<?php
/**
 * Core theme setup: supports, nav menus, image sizes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'after_setup_theme', function () {
	// Block theme + editor support.
	add_theme_support( 'wp-block-styles' );
	add_theme_support( 'editor-styles' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'customize-selective-refresh-widgets' );
	add_theme_support( 'appearance-tools' ); // Pulls in extra theme.json UI controls.

	register_nav_menus( array(
		'primary' => __( 'Primary Menu', 'boilerplate-theme' ),
		'footer'  => __( 'Footer Menu', 'boilerplate-theme' ),
	) );

	add_image_size( 'card', 480, 320, true );
	add_image_size( 'hero', 1600, 900, true );

	load_theme_textdomain( 'boilerplate-theme', BOILERPLATE_THEME_DIR . '/languages' );
} );

// Register widget/block pattern categories.
add_action( 'init', function () {
	register_block_pattern_category( 'boilerplate', array(
		'label' => __( 'Boilerplate', 'boilerplate-theme' ),
	) );
} );
