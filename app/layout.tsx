import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { EveDrawer } from "@/components/eve/EveDrawer";
import { EveProvider } from "@/components/eve/EveProvider";
import { ProgressProvider } from "@/components/progress/ProgressProvider";
import { TopBar } from "@/components/TopBar";
import { COURSE_TAGLINE, COURSE_TITLE } from "@/lib/course";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: COURSE_TITLE, template: `%s · ${COURSE_TITLE}` },
  description: COURSE_TAGLINE,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ProgressProvider>
          <EveProvider>
            <TopBar />
            <div className="app-shell flex-1">{children}</div>
            <EveDrawer />
          </EveProvider>
        </ProgressProvider>
      </body>
    </html>
  );
}
