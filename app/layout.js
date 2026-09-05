import "./globals.css";

export const metadata = {
  title: "Resort-Style",
  description: "Private Relaxation Salon",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('click', function (event) {
                var recruitTrigger = event.target.closest && event.target.closest('.menu-trigger');
                if (!recruitTrigger) return;
                event.preventDefault();
                event.stopPropagation();
                window.location.href = '/recruit';
              }, true);
            `,
          }}
        />
      </body>
    </html>
  );
}
