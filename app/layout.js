import "./globals.css";

export const metadata = {
  title: "Resort-Style",
  description: "Private Relaxation Salon",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
