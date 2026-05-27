// =============================================================================
// tailwind.config.js — Tailwind CSS v3 Configuration
// ใช้งานร่วมกับ: postcss.config.js, src/app/globals.css
// =============================================================================

/** @type {import('tailwindcss').Config} */
module.exports = {
  // กำหนด path ของไฟล์ที่ใช้ Tailwind classes
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  // เปิด dark mode ผ่าน class
  darkMode: 'class',

  theme: {
    extend: {
      // ------------------- Color Palette -------------------
      // Custom brand colors ที่สวยงาม harmonious
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6ff',
          300: '#a5b8ff',
          400: '#7c93ff',
          500: '#5a6bff', // Primary brand color
          600: '#3d4ee0',
          700: '#2e3bbf',
          800: '#2830a0',
          900: '#252c83',
          950: '#16194d',
        },
        accent: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Accent orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        surface: {
          // Dark mode surfaces
          900: '#0a0a0f',
          800: '#111118',
          700: '#1a1a2e',
          600: '#16213e',
          500: '#0f3460',
        },
      },

      // ------------------- Typography -------------------
      fontFamily: {
        sans: ['var(--font-serif-thai)', 'Noto Serif Thai', 'Inter', 'system-ui', 'serif'],
        display: ['var(--font-serif-thai)', 'Noto Serif Thai', 'Inter', 'system-ui', 'serif'],
      },

      // ------------------- Animations -------------------
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-up': 'fadeUp 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 8s linear infinite',
        'gradient': 'gradientShift 6s ease infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(90,107,255,0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(90,107,255,0.8)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },

      // ------------------- Backdrop Blur -------------------
      backdropBlur: {
        xs: '2px',
      },

      // ------------------- Box Shadow -------------------
      boxShadow: {
        'glow': '0 0 30px rgba(90,107,255,0.4)',
        'glow-accent': '0 0 30px rgba(249,115,22,0.4)',
        'card': '0 4px 20px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.5)',
      },

      // ------------------- Background Size -------------------
      backgroundSize: {
        '200%': '200%',
        '300%': '300%',
      },
    },
  },

  plugins: [],
}
