import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'var(--background)',
  			foreground: 'var(--foreground)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
		  fontSize: {
			'10xl': '10rem',
			'7xl': '4.5rem',
			'6xl': '3.75rem',
			'2xl': '1.5rem',
			'xl': '1.25rem', // Custom size for h3
		  },
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
