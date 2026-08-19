# Validation Tests

The generated project must provide executable checks appropriate to its selected stack.

## Required checks

1. Required files and directories exist.
2. Project configuration conforms to `config/project.schema.json`.
3. Production builds contain no unresolved client-data placeholders.
4. HTML provides a document language, viewport, title, description, skip link, main landmark, navigation, heading hierarchy, and contact actions.
5. Styles provide visible keyboard focus states and responsive behavior.
6. Navigation, asset references, and links are valid.
7. No fabricated business claims are present in baseline content.
8. Runtime/build errors are absent.

## Acceptance command

Use the repository's standard validation runner when one is available. If no runner is configured yet, the checks above are the explicit acceptance contract and must be automated before the boilerplate is released.

Passing the boilerplate baseline does not constitute production acceptance of a generated project.