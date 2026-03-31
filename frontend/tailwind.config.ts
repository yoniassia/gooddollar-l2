import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        goodgreen: {
          DEFAULT: '#00B0A0',
          50: '#E6F9F7',
          100: '#B3EDE8',
          200: '#80E1D9',
          300: '#4DD5CA',
          400: '#26CCBF',
          500: '#00B0A0',
          600: '#009A8C',
          700: '#007A6F',
          800: '#005A52',
          900: '#003A35',
        },
        dark: {
          DEFAULT: '#0f1729',
          50: '#1a2540',
          100: '#151e35',
          200: '#121a2e',
          300: '#0f1729',
          400: '#0c1320',
          500: '#091018',
        },
      },
    },
  },
  plugins: [],
}
export default config
