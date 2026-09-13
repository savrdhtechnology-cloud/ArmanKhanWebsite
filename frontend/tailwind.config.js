/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
    theme: {
        extend: {
            colors: {
                background: '#050505',
                foreground: '#ffffff',
                brand: {
                    black: '#050505',
                    surface: '#111111',
                    elevated: '#1A1A1A',
                    gold: '#C9A961',
                    goldLight: '#DCC287',
                },
                border: 'rgba(255,255,255,0.08)',
                input: 'rgba(255,255,255,0.1)',
                ring: '#C9A961',
                card: {
                    DEFAULT: '#111111',
                    foreground: '#ffffff'
                },
                popover: {
                    DEFAULT: '#111111',
                    foreground: '#ffffff'
                },
                primary: {
                    DEFAULT: '#C9A961',
                    foreground: '#050505'
                },
                secondary: {
                    DEFAULT: '#1A1A1A',
                    foreground: '#ffffff'
                },
                muted: {
                    DEFAULT: '#1A1A1A',
                    foreground: '#A3A3A3'
                },
                accent: {
                    DEFAULT: '#C9A961',
                    foreground: '#050505'
                },
                destructive: {
                    DEFAULT: '#DC2626',
                    foreground: '#ffffff'
                },
            },
            fontFamily: {
                playfair: ['Playfair Display', 'serif'],
                manrope: ['Manrope', 'sans-serif'],
                signature: ['Great Vibes', 'cursive'],
            },
            borderRadius: {
                lg: '0px',
                md: '0px',
                sm: '0px'
            },
            keyframes: {
                'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
                'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out'
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
