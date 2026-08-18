"use client";

import { useEffect, useState } from "react";
import SidebarDesktop from "./SidebarDesktop";
import SidebarMobile from "./SidebarMobile";

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  if (isMobile) {
    return <SidebarMobile>{children}</SidebarMobile>;
  }

  return <SidebarDesktop>{children}</SidebarDesktop>;
}