import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@/components/ui-client";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Career Catalyst — Build Skills. Find Mentors. Accelerate Your Career.",
    template: "%s · Career Catalyst",
  },
  description:
    "Career Catalyst is a career-learning and mentorship platform where students learn coding, take assessments, earn points and grow with mentor-led groups.",
  keywords: ["career", "mentorship", "coding practice", "assessments", "learning", "students"],
};

export const viewport: Viewport = {
  themeColor: "#6366F1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
