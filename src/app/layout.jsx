import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Budgety",
  description: "Budget and expense tracking app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
