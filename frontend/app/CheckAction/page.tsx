"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function page() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const TIMEOUT_MS = 600000;

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.replace("/");
    alert("You have been logged out due to 10 minutes of inactivity.");
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(handleLogout, TIMEOUT_MS);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  return null;
}