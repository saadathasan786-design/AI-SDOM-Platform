<?php
/**
 * Fires only when the plugin is deleted via wp-admin (not on deactivate).
 * WordPress requires this exact guard.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'boilerplate_plugin_version' );

// Uncomment if you want a full data wipe on uninstall (destructive — most
// plugins should leave user content behind by default):
// $projects = get_posts( array( 'post_type' => 'project', 'numberposts' => -1, 'post_status' => 'any' ) );
// foreach ( $projects as $project ) {
// 	wp_delete_post( $project->ID, true );
// }
