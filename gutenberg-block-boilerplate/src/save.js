import { useBlockProps, RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { quote, author } = attributes;
	const blockProps = useBlockProps.save( { className: 'testimonial' } );

	return (
		<div { ...blockProps }>
			<RichText.Content tagName="p" className="testimonial__quote" value={ quote } />
			<RichText.Content tagName="cite" className="testimonial__author" value={ author } />
		</div>
	);
}
