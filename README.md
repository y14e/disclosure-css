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
import Disclosure from 'https://esm.sh/@y14e/disclosure-css@2.0.0';
// or
import Disclosure from 'https://cdn.jsdelivr.net/npm/@y14e/disclosure-css@2.0.0/+esm';
// or
import Disclosure from 'https://esm.unpkg.com/@y14e/disclosure-css@2.0.0';
```

## Usage

```ts
new Disclosure(root);
// => Disclosure

```

## 📦 APIs

### `collapse`

```ts
disclosure.collapse(details);
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

### `expand`

```ts
disclosure.expand(details);
// => void
//
// details: HTMLDetailsElement
```

## Demo

- https://y14e.github.io/disclosure-css/
