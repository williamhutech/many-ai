import type { Config } from "tailwindcss";

const config: Config = {
  // Enables dark mode using the 'class' strategy for more control
  darkMode: ["class"],
  // Specifies which files Tailwind should scan for classes to generate CSS
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // Added src directory
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Defines custom color variables for consistent theming
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        border: 'var(--border)',
      },
      // Sets up custom border radius values for consistent rounded corners
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  // Adds additional functionality to Tailwind CSS
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"), // Added typography plugin
  ],
};

export default config;
