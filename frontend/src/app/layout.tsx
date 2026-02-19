import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ['300', '400', '500', '700', '900'],
  display: 'swap'
});

export const metadata: Metadata = {
  title: "DMP Performance Report Analysis",
  description: "Advanced advertising performance analysis platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={noto.className}>
        {children}
      </body>
    </html>
  );
}
