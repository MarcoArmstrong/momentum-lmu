# Tailwind CSS Setup

This Electron project has been configured with Tailwind CSS v4.

## Configuration Files

- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration using `@tailwindcss/postcss` plugin
- `src/renderer/assets/main.css` - Main CSS file with Tailwind directives

## Usage

Tailwind CSS is now available throughout your renderer process. You can use Tailwind utility classes in your HTML files and TypeScript/JavaScript components.

### Example Usage

```html
<div class="bg-blue-500 text-white p-4 rounded-lg shadow-lg">
  <h1 class="text-2xl font-bold">Hello Tailwind!</h1>
  <p class="text-sm opacity-90">This is styled with Tailwind CSS</p>
</div>
```

## Development

To start the development server with Tailwind CSS:

```bash
npm run dev
```

## Build

To build the project with Tailwind CSS:

```bash
npm run build
```

## Customization

You can customize Tailwind CSS by modifying the `tailwind.config.js` file. The configuration includes:

- Content paths for the renderer process
- Theme extensions
- Custom plugins (if needed)

## Notes

- This project uses Tailwind CSS v4, which has some syntax differences from v3
- The CSS is processed through PostCSS with `@tailwindcss/postcss` plugin and Autoprefixer
- Tailwind utilities are available in all renderer files
- Requires `@tailwindcss/postcss` package for PostCSS integration 