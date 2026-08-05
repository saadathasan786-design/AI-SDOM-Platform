<?php
namespace Boilerplate\Plugin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Activator {

	public static function activate(): void {
		// CPTs/taxonomies must be registered before flushing, so hook them
		// once here rather than relying on the normal 'init' timing.
		( new CPT() )->register_project_cpt();
		( new Taxonomy() )->register_project_category();

		flush_rewrite_rules();

		if ( false === get_option( 'boilerplate_plugin_version' ) ) {
			add_option( 'boilerplate_plugin_version', BOILERPLATE_PLUGIN_VERSION );
		}
	}
}
