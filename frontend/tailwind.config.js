/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        marine: {
          950: '#060D17', // deepest abyss
          900: '#0B1524', // control room dark background
          850: '#0E1D33', // sidebar/card background
          800: '#142742', // card surface
          750: '#1A3357', // elevated card/hover
          700: '#224370', // active border
          600: '#2F5C99', // interactive steel blue
          500: '#0284C7', // primary accent blue
          400: '#38BDF8', // bright indicator
        },
        slate: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          400: '#94A3B8',
          300: '#CBD5E1',
          100: '#F1F5F9',
        },
        steel: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        operational: {
          feasible: '#10B981',   // emerald green
          warning: '#F59E0B',    // amber
          infeasible: '#EF4444', // red
          info: '#0284C7',       // blue
          savings: '#059669',    // green
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
      }
    },
  },
  plugins: [],
}
