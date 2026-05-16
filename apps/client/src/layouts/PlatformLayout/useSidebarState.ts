import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";

const sidebarCookieName = "sidebar_state";
const sidebarCookieMaxAge = 60 * 60 * 24 * 7;
const mobileMediaQuery = "(max-width: 767px)";

export type SidebarPanelState = "collapsed" | "expanded";

export type SidebarState = {
  closeMobileSidebar: () => void;
  desktopOpen: boolean;
  isMobile: boolean;
  mobileOpen: boolean;
  panelState: SidebarPanelState;
  setDesktopOpen: Dispatch<SetStateAction<boolean>>;
  setMobileOpen: Dispatch<SetStateAction<boolean>>;
  toggleSidebar: () => void;
};

export function useSidebarState(): SidebarState {
  const [desktopOpen, setDesktopOpenState] = useState(readSidebarCookie);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(getInitialIsMobile);

  const setDesktopOpen = useCallback<Dispatch<SetStateAction<boolean>>>((value) => {
    setDesktopOpenState((currentOpen) => {
      const nextOpen = typeof value === "function" ? value(currentOpen) : value;
      writeSidebarCookie(nextOpen);
      return nextOpen;
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setMobileOpen((open) => !open);
      return;
    }

    setDesktopOpen((open) => !open);
  }, [isMobile, setDesktopOpen]);

  const closeMobileSidebar = useCallback(() => {
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(mobileMediaQuery);
    const syncIsMobile = () => setIsMobile(mediaQuery.matches);
    syncIsMobile();
    mediaQuery.addEventListener("change", syncIsMobile);

    return () => mediaQuery.removeEventListener("change", syncIsMobile);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "b" || (!event.metaKey && !event.ctrlKey)) {
        return;
      }

      event.preventDefault();
      toggleSidebar();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  return {
    closeMobileSidebar,
    desktopOpen,
    isMobile,
    mobileOpen,
    panelState: desktopOpen ? "expanded" : "collapsed",
    setDesktopOpen,
    setMobileOpen,
    toggleSidebar,
  };
}

function getInitialIsMobile() {
  return typeof window !== "undefined" ? window.matchMedia(mobileMediaQuery).matches : false;
}

function readSidebarCookie() {
  if (typeof document === "undefined") {
    return true;
  }

  return !document.cookie.split("; ").some((cookie) => cookie === `${sidebarCookieName}=false`);
}

function writeSidebarCookie(open: boolean) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${sidebarCookieName}=${open}; path=/; max-age=${sidebarCookieMaxAge}`;
}
