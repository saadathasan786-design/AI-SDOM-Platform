<?php
namespace Boilerplate\Plugin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Deactivator {

	public static function deactivate(): void {
		flush_rewrite_rules();
		// Intentionally NOT deleting options/data here — that belongs in
		// uninstall.php, which only runs when the plugin is deleted, not
		// merely deactivated.
	}
}
