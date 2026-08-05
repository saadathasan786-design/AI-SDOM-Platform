<?php
/**
 * A single custom Elementor widget: a "Call to Action" box.
 *
 * Registration: hook this into `elementor/widgets/register` from wherever
 * you're loading Elementor extensions (theme functions.php or a small
 * "elementor-extensions" plugin), guarded by did_action('elementor/loaded').
 *
 *   add_action( 'elementor/widgets/register', function ( $widgets_manager ) {
 *       require_once __DIR__ . '/widgets/class-custom-widget.php';
 *       $widgets_manager->register( new \Boilerplate_CTA_Widget() );
 *   } );
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Elementor\Widget_Base;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;

class Boilerplate_CTA_Widget extends Widget_Base {

	public function get_name(): string {
		return 'boilerplate_cta';
	}

	public function get_title(): string {
		return __( 'Boilerplate CTA', 'boilerplate-plugin' );
	}

	public function get_icon(): string {
		return 'eicon-call-to-action';
	}

	public function get_categories(): array {
		return array( 'general' );
	}

	protected function register_controls(): void {
		$this->start_controls_section( 'content_section', array(
			'label' => __( 'Content', 'boilerplate-plugin' ),
			'tab'   => Controls_Manager::TAB_CONTENT,
		) );

		$this->add_control( 'heading', array(
			'label'   => __( 'Heading', 'boilerplate-plugin' ),
			'type'    => Controls_Manager::TEXT,
			'default' => __( 'Ready to get started?', 'boilerplate-plugin' ),
		) );

		$this->add_control( 'button_text', array(
			'label'   => __( 'Button Text', 'boilerplate-plugin' ),
			'type'    => Controls_Manager::TEXT,
			'default' => __( 'Contact Us', 'boilerplate-plugin' ),
		) );

		$this->add_control( 'button_link', array(
			'label'       => __( 'Button Link', 'boilerplate-plugin' ),
			'type'        => Controls_Manager::URL,
			'placeholder' => 'https://example.com',
		) );

		$this->end_controls_section();

		$this->start_controls_section( 'style_section', array(
			'label' => __( 'Style', 'boilerplate-plugin' ),
			'tab'   => Controls_Manager::TAB_STYLE,
		) );

		$this->add_group_control( Group_Control_Typography::get_type(), array(
			'name'     => 'heading_typography',
			'selector' => '{{WRAPPER}} .boilerplate-cta__heading',
		) );

		$this->end_controls_section();
	}

	protected function render(): void {
		$settings = $this->get_settings_for_display();
		$url      = ! empty( $settings['button_link']['url'] ) ? $settings['button_link']['url'] : '#';
		$target   = ! empty( $settings['button_link']['is_external'] ) ? ' target="_blank"' : '';
		?>
		<div class="boilerplate-cta">
			<h3 class="boilerplate-cta__heading"><?php echo esc_html( $settings['heading'] ); ?></h3>
			<a class="boilerplate-cta__button" href="<?php echo esc_url( $url ); ?>"<?php echo $target; ?>>
				<?php echo esc_html( $settings['button_text'] ); ?>
			</a>
		</div>
		<?php
	}
}
