import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In CI (GitHub Actions) the deploy lives under https://<user>.github.io/tenno_forge/,
// so assets need that prefix. Locally and in `npm run preview` we want relative paths.
const base = process.env.GITHUB_ACTIONS ? '/tenno_forge/' : './';

export default defineConfig({
  plugins: [react()],
  base,
});
