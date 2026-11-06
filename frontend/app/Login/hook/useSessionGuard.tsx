"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5005";

export function useSessionGuard(intervalMs = 1000) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    const checkSession = async () => {
      const username = localStorage.getItem("username");
      const sessionId = localStorage.getItem("sessionId");

      if (!username || !sessionId) return;

      try {
        const response = await fetch(`${API_URL}/api/session-check`, {
          headers: {
            "x-username": username,
            "x-session-id": sessionId,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("username");
          localStorage.removeItem("sessionId");
          localStorage.removeItem("id");
          router.replace("/");
          return;
        }

        if (!response.ok) {
          console.error("Session check failed:", response.status);
        }
      } catch (error) {
        console.error("Session check request failed:", error);
      }
    };

    const poll = async () => {
      await checkSession();
      if (!stopped) timer = setTimeout(poll, intervalMs);
    };

    void poll();

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [intervalMs, router]);
}
