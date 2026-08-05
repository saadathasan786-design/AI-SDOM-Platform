<?php
namespace Boilerplate\Plugin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers custom post types. Add one method per CPT and call it from
 * register() so each type stays easy to find and remove independently.
 */
class CPT {

	public function register(): void {
		add_action( 'init', array( $this, 'register_project_cpt' ) );
	}

	public function register_project_cpt(): void {
		register_post_type( 'project', array(
			'labels'             => array(
				'name'          => __( 'Projects', 'boilerplate-plugin' ),
				'singular_name' => __( 'Project', 'boilerplate-plugin' ),
				'add_new_item'  => __( 'Add New Project', 'boilerplate-plugin' ),
				'edit_item'     => __( 'Edit Project', 'boilerplate-plugin' ),
				'all_items'     => __( 'All Projects', 'boilerplate-plugin' ),
			),
			'public'              => true,
			'show_in_rest'        => true,          // Required for Gutenberg + REST API access.
			'rest_base'           => 'projects',
			'menu_icon'           => 'dashicons-portfolio',
			'supports'            => array( 'title', 'editor', 'thumbnail', 'excerpt', 'custom-fields' ),
			'has_archive'         => true,
			'rewrite'             => array( 'slug' => 'projects' ),
			'taxonomies'          => array( 'project_category' ),
			'capability_type'     => 'post',
			'map_meta_cap'        => true,
			'show_in_menu'        => true,
		) );
	}
}
