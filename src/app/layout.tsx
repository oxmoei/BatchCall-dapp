import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/providers/AppProvider";

export const metadata: Metadata = {
  title: "Batch Caller",
  description: "Powered by MetaMask Smart Accounts, making batch transactions safer, easier, more efficient and more gas-saving!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 全局错误处理，忽略扩展相关错误
              window.addEventListener('error', function(e) {
                if (e.message && e.message.includes('Talisman')) {
                  e.preventDefault();
                  console.warn('Talisman extension error ignored:', e.message);
                }
              });
              
              // 忽略未捕获的Promise错误
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && e.reason.message && e.reason.message.includes('Talisman')) {
                  e.preventDefault();
                  console.warn('Talisman extension promise error ignored:', e.reason.message);
                }
              });
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
