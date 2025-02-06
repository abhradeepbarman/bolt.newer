export const nextBaseFiles = `<boltArtifact id=\"project-import\" title=\"Project Files\"><boltAction type=\"file\" filePath=\"eslint.config.js\">import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['.next', 'out'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  }
);
</boltAction><boltAction type=\"file\" filePath=\"package.json\">{
  \"name\": \"nextjs-typescript-starter\",
  \"private\": true,
  \"version\": \"0.0.1\",
  \"type\": \"module\",
  \"scripts\": {
    \"dev\": \"next dev\",
    \"build\": \"next build\",
    \"start\": \"next start\",
    \"lint\": \"eslint .\"
  },
  \"dependencies\": {
    \"next\": \"13.4.0\",
    \"react\": \"^18.3.1\",
    \"react-dom\": \"^18.3.1\"
  },
  \"devDependencies\": {
    \"@eslint/js\": \"^9.9.1\",
    \"@types/react\": \"^18.3.5\",
    \"@types/react-dom\": \"^18.3.0\",
    \"autoprefixer\": \"^10.4.18\",
    \"eslint\": \"^9.9.1\",
    \"eslint-plugin-react-hooks\": \"^5.1.0-rc.0\",
    \"globals\": \"^15.9.0\",
    \"postcss\": \"^8.4.35\",
    \"tailwindcss\": \"^3.4.1\",
    \"typescript\": \"^5.5.3\",
    \"typescript-eslint\": \"^8.3.0\"
  }
}</boltAction><boltAction type=\"file\" filePath=\"postcss.config.js\">export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
</boltAction><boltAction type=\"file\" filePath=\"tailwind.config.js\">/** @type {import('tailwindcss').Config} */
export default {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
</boltAction><boltAction type=\"file\" filePath=\"tsconfig.json\">{
  \"compilerOptions\": {
    \"target\": \"ES2020\",
    \"lib\": [\"ES2020\", \"DOM\"],
    \"module\": \"ESNext\",
    \"skipLibCheck\": true,
    \"moduleResolution\": \"node\",
    \"strict\": true,
    \"esModuleInterop\": true,
    \"forceConsistentCasingInFileNames\": true,
    \"jsx\": \"preserve\",
    \"noEmit\": true,
    \"isolatedModules\": true,
    \"incremental\": true
  },
  \"include\": [\"next-env.d.ts\", \"**/*.ts\", \"**/*.tsx\"],
  \"exclude\": [\"node_modules\"]
}</boltAction><boltAction type=\"file\" filePath=\"next-env.d.ts\">/// <reference types=\"next\" />
/// <reference types=\"next/image-types/global\" />

// NOTE: This file should not be edited
// See https://nextjs.org/docs/basic-features/typescript for more information.
</boltAction><boltAction type=\"file\" filePath=\"pages/_app.tsx\">import type { AppProps } from 'next/app';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
</boltAction><boltAction type=\"file\" filePath=\"pages/index.tsx\">import React from 'react';

const HomePage = () => {
  return (
    <div className=\"min-h-screen bg-gray-100 flex items-center justify-center\">
      <p>Start your Next.js journey with TypeScript here!</p>
    </div>
  );
};

export default HomePage;
</boltAction><boltAction type=\"file\" filePath=\"styles/globals.css\">@tailwind base;
@tailwind components;
@tailwind utilities;
</boltAction></boltArtifact>`;
