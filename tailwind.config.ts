import type { Config } from "tailwindcss";

const config: Config = {
  // Enable dark mode using the 'class' strategy
  darkMode: ["class"],
  
  // Specify the files to scan for classes
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  
  theme: {
    extend: {
      // Define custom colors using CSS variables
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)'
      },
      
      // Define custom border radius values
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      
      // Define custom font sizes
      fontSize: {
        '10xl': '10rem',
        '7xl': '4.5rem',
        '6xl': '3.75rem',
        '2xl': '1.5rem',
        'xl': '1.25rem', // Custom size for h3
      },
    }
  },
  
  // Add the tailwindcss-animate plugin
  plugins: [require("tailwindcss-animate")],
};

export default config;
