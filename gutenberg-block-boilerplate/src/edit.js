import { useBlockProps, RichText } from '@wordpress/block-editor';

export default function Edit( { attributes, setAttributes } ) {
	const { quote, author } = attributes;
	const blockProps = useBlockProps( { className: 'testimonial' } );

	return (
		<div { ...blockProps }>
			<RichText
				tagName="p"
				className="testimonial__quote"
				value={ quote }
				onChange={ ( value ) => setAttributes( { quote: value } ) }
				placeholder="Enter the quote..."
			/>
			<RichText
				tagName="cite"
				className="testimonial__author"
				value={ author }
				onChange={ ( value ) => setAttributes( { author: value } ) }
				placeholder="— Author name"
			/>
		</div>
	);
}
