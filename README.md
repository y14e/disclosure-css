# Disclosure (CSS Animation)

WAI-ARIA compliant [disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) pattern implementation in TypeScript. Using the `<details>` and `<summary>` element.

## Install

```bash
npm i @y14e/disclosure-css
```

```ts
// npm
import Disclosure from '@y14e/disclosure-css';

// CDNs
import Disclosure from 'https://esm.sh/@y14e/disclosure-css@1.3.13';
// or
import Disclosure from 'https://cdn.jsdelivr.net/npm/@y14e/disclosure-css@1.3.13/+esm';
// or
import Disclosure from 'https://esm.unpkg.com/@y14e/disclosure-css@1.3.13';
```

## Usage

```ts
new Disclosure(root);
// => Disclosure

```

## 📦 APIs

### `close`

```ts
disclosure.close(details);
// => void
//
// details: HTMLDetailsElement
```

### `destroy`

Destroys the instance and cleans up all event listeners.

```ts
disclosure.destroy();
// => void
```

### `open`

```ts
disclosure.open(details);
// => void
//
// details: HTMLDetailsElement
```

## Demo

- https://y14e.github.io/disclosure-css/
