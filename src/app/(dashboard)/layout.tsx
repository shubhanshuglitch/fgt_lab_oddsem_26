"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { DataProvider } from "@/components/providers/data-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      <div className="min-h-screen bg-background flex text-foreground">
        <Sidebar />
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all duration-300">
          <Header />
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </main>
        </div>
      </div>
    </DataProvider>
  );
}

