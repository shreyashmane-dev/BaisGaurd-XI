/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
      extend: {
          colors: {
              "on-tertiary-container": "#503d00",
              "background": "#fdf7ff",
              "surface-container-lowest": "#ffffff",
              "surface-container-high": "#ece6ee",
              "on-secondary-fixed-variant": "#4b4263",
              "primary-fixed": "#e9ddff",
              "surface-container-highest": "#e6e0e9",
              "outline-variant": "#cbc4d2",
              "on-primary-container": "#e0d2ff",
              "tertiary": "#765b00",
              "secondary-fixed": "#e9ddff",
              "on-primary-fixed-variant": "#4f378a",
              "on-surface-variant": "#494551",
              "error-container": "#ffdad6",
              "outline": "#7a7582",
              "primary-container": "#6750a4",
              "on-primary": "#ffffff",
              "on-background": "#1d1b20",
              "on-surface": "#1d1b20",
              "surface-tint": "#6750a4",
              "surface-variant": "#e6e0e9",
              "on-error": "#ffffff",
              "on-secondary-fixed": "#1f1635",
              "secondary": "#63597c",
              "tertiary-fixed-dim": "#e7c365",
              "on-tertiary": "#ffffff",
              "surface-container-low": "#f8f2fa",
              "inverse-surface": "#322f35",
              "on-tertiary-fixed-variant": "#594400",
              "primary": "#4f378a",
              "surface-dim": "#ded8e0",
              "error": "#ba1a1a",
              "tertiary-container": "#c9a74d",
              "on-tertiary-fixed": "#241a00",
              "on-secondary-container": "#645a7d",
              "primary-fixed-dim": "#cfbcff",
              "surface-container": "#f2ecf4",
              "on-secondary": "#ffffff",
              "on-primary-fixed": "#22005d",
              "inverse-primary": "#cfbcff",
              "on-error-container": "#93000a",
              "inverse-on-surface": "#f5eff7",
              "secondary-fixed-dim": "#cdc0e9",
              "tertiary-fixed": "#ffdf93",
              "secondary-container": "#e1d4fd",
              "surface": "#fdf7ff",
              "surface-bright": "#fdf7ff"
          },
          borderRadius: {
              DEFAULT: "0.25rem",
              lg: "0.5rem",
              xl: "0.75rem",
              full: "9999px"
          },
          spacing: {
              sm: "16px",
              xs: "8px",
              md: "24px",
              lg: "40px",
              container_max_width: "1280px",
              base: "4px",
              xl: "64px",
              grid_columns: "12",
              grid_gutter: "24px"
          },
          fontFamily: {
              "label-caps": ["Inter", "sans-serif"],
              "h2": ["Inter", "sans-serif"],
              "h1": ["Inter", "sans-serif"],
              "display-lg": ["Inter", "sans-serif"],
              "body-sm": ["Inter", "sans-serif"],
              "body-main": ["Inter", "sans-serif"]
          },
          fontSize: {
              "label-caps": ["12px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "600" }],
              "h2": ["24px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
              "h1": ["32px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
              "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
              "body-sm": ["14px", { lineHeight: "1.5", letterSpacing: "0", fontWeight: "400" }],
              "body-main": ["16px", { lineHeight: "1.6", letterSpacing: "0", fontWeight: "400" }]
          }
      }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
