<?php
namespace Boilerplate\Plugin;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Custom REST API namespace/endpoints, separate from the auto-generated
 * /wp/v2/projects routes. Use this for anything that isn't a plain CRUD
 * mapping onto a post type — aggregate data, actions, integrations.
 */
class Rest_Api {

	const NAMESPACE_ = 'boilerplate/v1';

	public function register(): void {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes(): void {
		register_rest_route( self::NAMESPACE_, '/projects/featured', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_featured_projects' ),
			'permission_callback' => '__return_true', // Public read endpoint.
			'args'                => array(
				'limit' => array(
					'default'           => 5,
					'sanitize_callback' => 'absint',
				),
			),
		) );

		register_rest_route( self::NAMESPACE_, '/projects/(?P<id>\d+)/publish', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'publish_project' ),
			'permission_callback' => function () {
				return current_user_can( 'publish_posts' );
			},
			'args'                => array(
				'id' => array(
					'validate_callback' => function ( $param ) {
						return is_numeric( $param );
					},
				),
			),
		) );
	}

	public function get_featured_projects( WP_REST_Request $request ): WP_REST_Response {
		$limit = $request->get_param( 'limit' );

		$query = new \WP_Query( array(
			'post_type'      => 'project',
			'posts_per_page' => $limit,
			'meta_key'       => 'featured',
			'meta_value'     => '1',
		) );

		$data = array_map( function ( $post ) {
			return array(
				'id'    => $post->ID,
				'title' => get_the_title( $post ),
				'url'   => get_permalink( $post ),
			);
		}, $query->posts );

		return new WP_REST_Response( $data, 200 );
	}

	public function publish_project( WP_REST_Request $request ) {
		$id = (int) $request->get_param( 'id' );

		if ( 'project' !== get_post_type( $id ) ) {
			return new WP_Error( 'not_found', 'Project not found.', array( 'status' => 404 ) );
		}

		$updated = wp_update_post( array( 'ID' => $id, 'post_status' => 'publish' ), true );

		if ( is_wp_error( $updated ) ) {
			return $updated;
		}

		return new WP_REST_Response( array( 'id' => $id, 'status' => 'publish' ), 200 );
	}
}
