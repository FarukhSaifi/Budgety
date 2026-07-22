import AppProviders from "@components/providers/AppProviders";
import {
  APP_APPLE_TOUCH_ICON_SRC,
  APP_FAVICON_SRC,
  APP_ICON_192_SRC,
  APP_NAME,
  APP_OG_IMAGE_SRC,
  STITCH_COLORS,
} from "@constants";
import type { Metadata, Viewport } from "next";
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
  themeColor: STITCH_COLORS.PRIMARY,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
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
