<?php
namespace Boilerplate\Plugin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * ACF integration. Registers field groups in PHP (so they ship with the
 * plugin/theme and version-control cleanly instead of living only in the DB),
 * and exposes ACF field values through the REST API.
 *
 * Requires Advanced Custom Fields (free) or ACF PRO to be active — every
 * method here checks function_exists( 'acf_add_local_field_group' ) first
 * so the plugin doesn't fatal if ACF isn't installed.
 */
class ACF_Fields {

	public function register(): void {
		add_action( 'acf/init', array( $this, 'register_field_groups' ) );
		add_filter( 'acf/settings/save_json', array( $this, 'save_json_path' ) );
		add_filter( 'acf/settings/load_json', array( $this, 'load_json_paths' ) );

		// Expose ACF fields on the `project` CPT's REST response.
		add_action( 'rest_api_init', array( $this, 'register_rest_field' ) );
	}

	/**
	 * Point ACF's "Local JSON" sync at this plugin so field groups exported
	 * from wp-admin land in includes/acf-json and get committed to git.
	 */
	public function save_json_path( string $path ): string {
		return BOILERPLATE_PLUGIN_DIR . 'includes/acf-json';
	}

	public function load_json_paths( array $paths ): array {
		$paths[] = BOILERPLATE_PLUGIN_DIR . 'includes/acf-json';
		return $paths;
	}

	public function register_field_groups(): void {
		if ( ! function_exists( 'acf_add_local_field_group' ) ) {
			return;
		}

		acf_add_local_field_group( array(
			'key'      => 'group_project_details',
			'title'    => 'Project Details',
			'fields'   => array(
				array(
					'key'   => 'field_project_client',
					'label' => 'Client Name',
					'name'  => 'project_client',
					'type'  => 'text',
				),
				array(
					'key'   => 'field_project_url',
					'label' => 'Live URL',
					'name'  => 'project_url',
					'type'  => 'url',
				),
				array(
					'key'     => 'field_project_gallery',
					'label'   => 'Gallery',
					'name'    => 'project_gallery',
					'type'    => 'gallery',
				),
			),
			'location' => array(
				array(
					array(
						'param'    => 'post_type',
						'operator' => '==',
						'value'    => 'project',
					),
				),
			),
		) );
	}

	/**
	 * Adds an `acf` object to REST responses for the `project` CPT so
	 * front-ends (or the MCP server) can read/write these fields without
	 * a second round-trip.
	 */
	public function register_rest_field(): void {
		register_rest_field( 'project', 'acf', array(
			'get_callback' => function ( $post ) {
				return function_exists( 'get_fields' ) ? get_fields( $post['id'] ) : array();
			},
			'update_callback' => function ( $value, $post ) {
				if ( ! function_exists( 'update_field' ) || ! is_array( $value ) ) {
					return;
				}
				foreach ( $value as $field_name => $field_value ) {
					update_field( $field_name, $field_value, $post->ID );
				}
			},
			'schema' => array(
				'description' => 'ACF fields for this project',
				'type'        => 'object',
			),
		) );
	}
}
