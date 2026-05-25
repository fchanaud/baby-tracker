import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '400px',
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Activity colors
        'feed-bg': 'var(--pink-50)',
        'feed': 'var(--pink-500)',
        'sleep-bg': 'var(--purple-50)',
        'sleep': 'var(--purple-500)',
        'nappy-bg': 'var(--yellow-50)',
        'nappy': 'var(--yellow-500)',
        'weight-bg': 'var(--green-50)',
        'weight': 'var(--green-500)',
        'note-bg': 'var(--blue-50)',
        'note': 'var(--blue-500)',
        // Neutrals
        gray: {
          50: 'var(--gray-50)',
          100: 'var(--gray-100)',
          200: 'var(--gray-200)',
          500: 'var(--gray-500)',
          900: 'var(--gray-900)',
        },
        // Functional
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '12': 'var(--space-12)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        'full': 'var(--radius-full)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
      },
      fontSize: {
        'xs': 'var(--text-xs)',
        'sm': 'var(--text-sm)',
        'base': 'var(--text-base)',
        'lg': 'var(--text-lg)',
        'xl': 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
      },
    },
  },
  plugins: [],
};
export default config;
