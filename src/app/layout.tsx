import type { Metadata, Viewport } from "next";

import {
  APP_APPLE_TOUCH_ICON_SRC,
  APP_FAVICON_SRC,
  APP_ICON_192_SRC,
  APP_NAME,
  APP_OG_IMAGE_SRC,
  STITCH_COLORS,
  STITCH_DARK_COLORS,
} from "@constants";

import AppProviders from "@components/providers/AppProviders";

import { THEME_STORAGE_KEY } from "@/lib/theme";

import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Budget and expense tracking app",
  applicationName: APP_NAME,
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: APP_FAVICON_SRC, sizes: "32x32", type: "image/png" },
      { url: APP_ICON_192_SRC, sizes: "192x192", type: "image/png" },
      { url: "/budget.png", sizes: "any", type: "image/png" },
    ],
    apple: APP_APPLE_TOUCH_ICON_SRC,
  },
  openGraph: {
    title: APP_NAME,
    description: "Budget and expense tracking app",
    images: [{ url: APP_OG_IMAGE_SRC }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: STITCH_COLORS.BACKGROUND },
    { media: "(prefers-color-scheme: dark)", color: STITCH_DARK_COLORS.BACKGROUND },
  ],
  width: "device-width",
  initialScale: 1,
};

/**
 * Avoid light flash before ThemeProvider hydrates.
 * Missing key and `"system"` both follow `prefers-color-scheme` (same as ThemeProvider).
 */
const themeInitScript = `
(function(){
  try {
    var key=${JSON.stringify(THEME_STORAGE_KEY)};
    var pref=localStorage.getItem(key);
    var systemDark=window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark=pref==='dark'||((pref===null||pref==='system')&&systemDark);
    var root=document.documentElement;
    if(isDark){ root.classList.add('dark'); root.style.colorScheme='dark'; root.dataset.theme='dark'; }
    else { root.classList.remove('dark'); root.style.colorScheme='light'; root.dataset.theme='light'; }
  } catch(e){}
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
