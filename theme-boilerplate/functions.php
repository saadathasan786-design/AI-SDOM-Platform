<?php
/**
 * Boilerplate Theme functions and definitions.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // No direct access.
}

define( 'BOILERPLATE_THEME_VERSION', '1.0.0' );
define( 'BOILERPLATE_THEME_DIR', get_template_directory() );
define( 'BOILERPLATE_THEME_URI', get_template_directory_uri() );

require_once BOILERPLATE_THEME_DIR . '/inc/setup.php';
require_once BOILERPLATE_THEME_DIR . '/inc/enqueue.php';
require_once BOILERPLATE_THEME_DIR . '/inc/security.php';
require_once BOILERPLATE_THEME_DIR . '/inc/performance.php';
