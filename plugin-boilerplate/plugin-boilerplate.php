<?php
/**
 * Plugin Name: Boilerplate Plugin
 * Plugin URI: https://example.com
 * Description: Starter plugin scaffold — custom post types, taxonomies, ACF integration, REST API endpoints, activation/deactivation hooks.
 * Version: 1.0.0
 * Author: Your Name
 * Requires at least: 6.4
 * Requires PHP: 8.0
 * License: GPL v2 or later
 * Text Domain: boilerplate-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // No direct access.
}

define( 'BOILERPLATE_PLUGIN_VERSION', '1.0.0' );
define( 'BOILERPLATE_PLUGIN_FILE', __FILE__ );
define( 'BOILERPLATE_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'BOILERPLATE_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// Composer autoload (PSR-4: Boilerplate\Plugin\ => includes/).
if ( file_exists( BOILERPLATE_PLUGIN_DIR . 'vendor/autoload.php' ) ) {
	require_once BOILERPLATE_PLUGIN_DIR . 'vendor/autoload.php';
} else {
	// Fallback manual includes if Composer hasn't been run yet.
	require_once BOILERPLATE_PLUGIN_DIR . 'includes/Class-CPT.php';
	require_once BOILERPLATE_PLUGIN_DIR . 'includes/Class-Taxonomy.php';
	require_once BOILERPLATE_PLUGIN_DIR . 'includes/Class-ACF.php';
	require_once BOILERPLATE_PLUGIN_DIR . 'includes/Class-RestApi.php';
	require_once BOILERPLATE_PLUGIN_DIR . 'includes/Class-Activator.php';
	require_once BOILERPLATE_PLUGIN_DIR . 'includes/Class-Deactivator.php';
}

use Boilerplate\Plugin\CPT;
use Boilerplate\Plugin\Taxonomy;
use Boilerplate\Plugin\ACF_Fields;
use Boilerplate\Plugin\Rest_Api;
use Boilerplate\Plugin\Activator;
use Boilerplate\Plugin\Deactivator;

register_activation_hook( __FILE__, array( Activator::class, 'activate' ) );
register_deactivation_hook( __FILE__, array( Deactivator::class, 'deactivate' ) );

add_action( 'plugins_loaded', function () {
	( new CPT() )->register();
	( new Taxonomy() )->register();
	( new ACF_Fields() )->register();
	( new Rest_Api() )->register();
} );
