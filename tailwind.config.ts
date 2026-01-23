import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Paul Davis Brand Colors - Refined Premium Palette
        // Core gold with aged patina feel
        gold: {
          DEFAULT: "#a08347",
          50: "#faf8f2",
          100: "#f4f0e1",
          200: "#e9e0c3",
          300: "#dbcc9d",
          400: "#c9b274",
          500: "#a08347", // Primary gold - slightly deeper
          600: "#8a6f3a",
          700: "#725a30",
          800: "#5e4a2b",
          900: "#4e3e26",
          950: "#2a2013",
        },
        // Warm accent for highlights
        amber: {
          DEFAULT: "#d4a853",
          50: "#fdfaf3",
          100: "#faf3e0",
          200: "#f4e4bb",
          300: "#ebcf8c",
          400: "#d4a853", // Bright accent
          500: "#c4923d",
          600: "#ab7832",
          700: "#8e5f2c",
          800: "#744d2a",
          900: "#614126",
          950: "#362112",
        },
        // Deep charcoal/ink for dark elements
        ink: {
          DEFAULT: "#1a1612",
          50: "#f7f6f5",
          100: "#eceae7",
          200: "#d8d4cf",
          300: "#bdb6ad",
          400: "#9f9588",
          500: "#877c6e",
          600: "#756a5e",
          700: "#60574e",
          800: "#514a43",
          900: "#46413b",
          950: "#1a1612", // Rich black with warm undertone
        },
        // Warm stone for backgrounds and neutrals
        stone: {
          DEFAULT: "#f5f3ef",
          50: "#fafaf8",
          100: "#f5f3ef",
          200: "#eae6de",
          300: "#dbd4c7",
          400: "#c5baaa",
          500: "#b0a28f",
          600: "#9d8d79",
          700: "#827465",
          800: "#6b6055",
          900: "#594f47",
          950: "#2f2924",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Refined type scale
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
        xs: ["0.75rem", { lineHeight: "1.125rem" }],
        sm: ["0.875rem", { lineHeight: "1.375rem" }],
        base: ["1rem", { lineHeight: "1.625rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.875rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1.15" }],
        "6xl": ["3.75rem", { lineHeight: "1.1" }],
        "7xl": ["4.5rem", { lineHeight: "1.05" }],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.02em",
        tight: "-0.01em",
        normal: "0",
        wide: "0.02em",
        wider: "0.05em",
        widest: "0.1em",
        "ultra-wide": "0.2em",
      },
      boxShadow: {
        // Refined shadows with warm undertones
        card: "0 1px 3px 0 rgba(26, 22, 18, 0.04), 0 1px 2px -1px rgba(26, 22, 18, 0.04)",
        "card-hover": "0 4px 12px -2px rgba(26, 22, 18, 0.08), 0 2px 6px -2px rgba(26, 22, 18, 0.04)",
        "card-active": "0 1px 2px 0 rgba(26, 22, 18, 0.03)",
        elevated: "0 8px 30px -8px rgba(26, 22, 18, 0.12), 0 4px 10px -6px rgba(26, 22, 18, 0.06)",
        "gold-glow": "0 0 20px -5px rgba(160, 131, 71, 0.4)",
        "gold-glow-lg": "0 0 40px -10px rgba(160, 131, 71, 0.5)",
        inner: "inset 0 2px 4px 0 rgba(26, 22, 18, 0.04)",
        "inner-lg": "inset 0 4px 8px 0 rgba(26, 22, 18, 0.06)",
      },
      backgroundImage: {
        // Premium gradients
        "gold-gradient": "linear-gradient(135deg, #c9b274 0%, #a08347 50%, #725a30 100%)",
        "gold-gradient-subtle": "linear-gradient(135deg, #f4f0e1 0%, #e9e0c3 100%)",
        "dark-gradient": "linear-gradient(180deg, #1a1612 0%, #2a2013 100%)",
        "hero-pattern": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(160, 131, 71, 0.15), transparent)",
        "hero-pattern-dark": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(160, 131, 71, 0.08), transparent)",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(8px)", opacity: "0.8" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "gold-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px -5px rgba(160, 131, 71, 0.4)" },
          "50%": { boxShadow: "0 0 30px -5px rgba(160, 131, 71, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "fade-in-down": "fade-in-down 0.4s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite linear",
        "gold-pulse": "gold-pulse 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "250ms",
        slow: "400ms",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-expo": "cubic-bezier(0.87, 0, 0.13, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
