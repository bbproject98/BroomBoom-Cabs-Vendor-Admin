import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BroomBoom Vendor Admin Panel",
  description:
    "Vendor Lead, Subscription and Plan Change Management for BroomBoom Cabs",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}