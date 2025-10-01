"use client";
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@lifecalling/ui";
import { useUnreadNotificationsCount } from "@/lib/hooks";
import NotificationBell from "./NotificationBell";
import { cn } from "@/lib/utils";

export default function GlobalHeader() {
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem("lc_sidebar");
    if (saved) setSidebarCollapsed(saved === "1");

    // Listen for sidebar changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "lc_sidebar") {
        setSidebarCollapsed(e.newValue === "1");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 right-0 h-12 bg-background/95 backdrop-blur-sm border-b border-border/50 z-40 flex items-center justify-end px-6 transition-all duration-300 ease-in-out",
      sidebarCollapsed ? "left-16" : "left-64"
    )}>
      <div className="flex items-center gap-3">
        {/* Global Notifications */}
        <NotificationBell />
      </div>
    </header>
  );
}