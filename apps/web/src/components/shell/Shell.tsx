"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import GlobalHeader from "./GlobalHeader";

export default function Shell({ children }:{ children: React.ReactNode }) {
  const pathname = usePathname();
  const hide = pathname.startsWith("/login");
  if (hide) return <>{children}</>;
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen">
        <GlobalHeader />
        <main className="pt-12 min-h-screen">{children}</main>
      </div>
    </div>
  );
}