"use client";

import { useEffect } from "react";

export default function AutoRefresh({ everyMs = 600000 }: { everyMs?: number }) {
  useEffect(() => {
    const t = window.setInterval(() => {
      window.location.reload();
    }, everyMs);
    return () => window.clearInterval(t);
  }, [everyMs]);

  return null;
}
