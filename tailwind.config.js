export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ocean: { 500:"#0ea5e9", 600:"#0284c7", 700:"#0369a1" },
        leaf: { 400:"#34d399", 500:"#10b981", 600:"#059669" }
      },
      boxShadow: { glow: "0 0 40px rgba(14,165,233,0.25)" }
    }
  },
  plugins: []
}
