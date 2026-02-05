/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#6366F1', // Indigo
                    dark: '#4F46E5',
                },
                success: '#10B981',
                warning: '#F59E0B',
                danger: '#EF4444',
                dark: {
                    DEFAULT: '#0F172A', // Slate 900
                    card: '#1E293B',    // Slate 800
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
