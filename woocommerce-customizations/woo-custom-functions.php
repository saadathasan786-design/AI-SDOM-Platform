<?php
/**
 * WooCommerce customizations. Load this file from your theme's functions.php
 * or a dedicated mu-plugin — guard every hook with function_exists/class_exists
 * so nothing fatals when WooCommerce is inactive.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'plugins_loaded', function () {
	if ( ! class_exists( 'WooCommerce' ) ) {
		return;
	}

	// Declare HPOS (High-Performance Order Storage) compatibility — required
	// for new WooCommerce installs, and good practice for all custom code.
	add_action( 'before_woocommerce_init', function () {
		if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
				'custom_order_tables',
				__FILE__,
				true
			);
		}
	} );

	// Reduce products per page (default 12 → adjust to your grid).
	add_filter( 'loop_shop_per_page', fn() => 12, 20 );

	// Add a custom "Delivery Estimate" field on the product edit screen.
	add_action( 'woocommerce_product_options_shipping', function () {
		woocommerce_wp_text_input( array(
			'id'          => '_delivery_estimate',
			'label'       => __( 'Delivery Estimate (days)', 'boilerplate-plugin' ),
			'type'        => 'number',
			'desc_tip'    => true,
			'description' => __( 'Estimated delivery time shown on the product page.', 'boilerplate-plugin' ),
		) );
	} );
	add_action( 'woocommerce_process_product_meta', function ( $post_id ) {
		if ( isset( $_POST['_delivery_estimate'] ) ) {
			update_post_meta( $post_id, '_delivery_estimate', sanitize_text_field( wp_unslash( $_POST['_delivery_estimate'] ) ) );
		}
	} );

	// Show that delivery estimate on the single product page.
	add_action( 'woocommerce_single_product_summary', function () {
		global $product;
		$estimate = get_post_meta( $product->get_id(), '_delivery_estimate', true );
		if ( $estimate ) {
			printf(
				'<p class="delivery-estimate">%s</p>',
				esc_html( sprintf( __( 'Estimated delivery: %s days', 'boilerplate-plugin' ), $estimate ) )
			);
		}
	}, 25 );

	// Custom order status example: "Awaiting Pickup".
	add_action( 'init', function () {
		register_post_status( 'wc-awaiting-pickup', array(
			'label'                     => _x( 'Awaiting Pickup', 'Order status', 'boilerplate-plugin' ),
			'public'                    => true,
			'show_in_admin_status_list' => true,
			'label_count'               => _n_noop( 'Awaiting Pickup (%s)', 'Awaiting Pickup (%s)', 'boilerplate-plugin' ),
		) );
	} );
	add_filter( 'wc_order_statuses', function ( $statuses ) {
		$statuses['wc-awaiting-pickup'] = _x( 'Awaiting Pickup', 'Order status', 'boilerplate-plugin' );
		return $statuses;
	} );
} );
