import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ExamGraph - Dynamic Graph Coloring Exam Timetabling & Seating Plan Generator",
  description:
    "An academic university examination management system utilizing Greedy Graph Coloring, DSATUR, and First-Fit Decreasing Bin Packing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "!bg-card !text-card-foreground !border !border-border",
              duration: 3500,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
