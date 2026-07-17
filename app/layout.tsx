import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hazzi.app"), // 나중에 실제 도메인으로 변경

  title: {
    default: "hazzi",
    template: "%s | hazzi",
  },

  description:
    "습관을 3초 만에 공유하는 앱. 사진 한 장으로 인증하고 친구들의 인정으로 꾸준함을 이어가세요.",

  applicationName: "hazzi",

  keywords: [
    "hazzi",
    "습관",
    "습관앱",
    "인증",
    "습관 인증",
    "루틴",
    "챌린지",
    "친구",
    "공유",
  ],

  authors: [
    {
      name: "hazzi",
    },
  ],

  creator: "hazzi",

  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "hazzi",
    title: "hazzi | 습관을 3초 만에 공유하는 앱",
    description:
      "사진 한 장으로 인증하고 친구들의 인정으로 꾸준함을 이어가세요.",
    images: [
      {
        url: "/logo2.png",
        width: 1200,
        height: 630,
        alt: "hazzi",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "hazzi | 습관을 3초 만에 공유하는 앱",
    description:
      "사진 한 장으로 인증하고 친구들의 인정으로 꾸준함을 이어가세요.",
    images: ["/logo2.png"],
  },

  icons: {
    icon: "/logo2.png",
    shortcut: "/logo2.png",
    apple: "/logo2.png",
  },

  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-black">
        {children}
      </body>
    </html>
  );
}