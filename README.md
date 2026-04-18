# VSCode Extensions Farshid Pirahansiah


Monorepo containing multiple VS Code extensions.

## Extensions

| Extension | Description |
|-----------|-------------|
| [farshid-extension-pack](./farshid-extension-pack) | Curated extension pack for CV, ML, LLM and PKM projects |
| [farshid-auto-update-markdown](./farshid-auto-update-markdown) | Automatically sorts markdown tables on save |


## Usage

Each extension lives in its own folder with its own `package.json`. To build/package an individual extension:

```bash
cd farshid-auto-update-markdown
npm install
npm run compile
npx vsce package
```

To install dependencies for all extensions at once from the root:

```bash
npm install
```

## Contact

Please file any [issues](https://github.com/pirahansiah/vscode-extensions-farshid/issues) or have a suggestion please tweet me [@pirahansiah](https://x.com/pirahansiah).

## License

This project is open-sourced software licensed under the [MIT license](./LICENSE).






