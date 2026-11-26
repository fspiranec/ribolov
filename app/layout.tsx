import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: "Ribolov · Pomoćnik za ribolov na moru",
  description: "Smiješ li loviti tu, koja riba je aktivna, vrijeme i more – za tvoju lokaciju na Jadranu.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#0b2540", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr" className={manrope.variable} suppressHydrationWarning>
      <head>
        {/* Apply a saved theme before first paint to avoid a light flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("ribolov:tema");if(t)document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans text-ink antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            // Offline cache only in production; in development it would show stale pages.
            __html:
              process.env.NODE_ENV === "production"
                ? `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}`
                : `if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));caches&&caches.keys().then(ks=>ks.forEach(k=>caches.delete(k)))}`,
          }}
        />
      </body>
    </html>
  );
}
