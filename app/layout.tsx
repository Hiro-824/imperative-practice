import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "王冠と、ことばの騎士 | The Missing Crown",
  description:
    "あなたのひと言で、物語が動く。命令文と丁寧な依頼を使い分ける英語学習RPG。",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
