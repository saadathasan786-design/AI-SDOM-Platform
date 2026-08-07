# Contributing to AI-SDOM

Thank you for your interest in contributing to AI-SDOM.

We welcome bug reports, feature requests, documentation improvements, and code contributions.

## Prerequisites

Before contributing, ensure you have:

- Git
- Node.js 24 or later
- npm 11 or later
- A GitHub account
- A local clone of this repository

## Getting Started

Clone the repository:

```bash
git clone https://github.com/saadathasan786-design/AI-SDOM-Platform.git
cd AI-SDOM
```

Install dependencies where required.

For example:

```bash
cd mcp-server
npm install
```

Some framework packages do not require dependency installation.

## Running Tests

Run tests inside the package you are modifying.

Example:

```bash
cd generators
node --test test/*.test.js
```

Always ensure tests pass before submitting changes.

## Coding Standards

- Follow the project's architecture.
- Keep frameworks independent.
- Avoid unnecessary dependencies.
- Write clear, descriptive commit messages.
- Update documentation when behaviour changes.

## Pull Requests

Before opening a pull request:

- Ensure tests pass.
- Keep commits focused.
- Describe the purpose of the change.
- Reference related issues where applicable.

## Reporting Issues

Please include:

- Operating system
- Node.js version
- npm version
- Steps to reproduce
- Expected behaviour
- Actual behaviour
- Error messages or logs

## Questions

If you are unsure about a design decision, open a GitHub Discussion or Issue before implementing large changes.