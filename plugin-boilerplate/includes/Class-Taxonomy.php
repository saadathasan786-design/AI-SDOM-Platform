<?php
namespace Boilerplate\Plugin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers custom taxonomies.
 */
class Taxonomy {

	public function register(): void {
		add_action( 'init', array( $this, 'register_project_category' ) );
	}

	public function register_project_category(): void {
		register_taxonomy( 'project_category', array( 'project' ), array(
			'labels'            => array(
				'name'          => __( 'Project Categories', 'boilerplate-plugin' ),
				'singular_name' => __( 'Project Category', 'boilerplate-plugin' ),
			),
			'public'            => true,
			'show_in_rest'      => true,
			'rest_base'         => 'project-categories',
			'hierarchical'      => true, // category-style; set false for tag-style.
			'rewrite'           => array( 'slug' => 'project-category' ),
		) );
	}
}
