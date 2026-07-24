"use client";

import { useCallback, useEffect, useRef } from "react";

const LAST_CHECK_KEY = "study-reminder-last-check";

export function useStudyReminder(dailySolved: number, dailyGoal: number, enabled: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkAndNotify = useCallback(() => {
    if (!enabled) return;
    if (Notification.permission !== "granted") return;

    const today = new Date().toISOString().slice(0, 10);
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);

    if (lastCheck === today) return;
    localStorage.setItem(LAST_CHECK_KEY, today);

    if (dailySolved < dailyGoal) {
      new Notification("Behind Pace", {
        body: `You've solved ${dailySolved} of ${dailyGoal} daily problems. Time to jump back in!`,
        icon: "/favicon.ico",
      });
    }
  }, [dailySolved, dailyGoal, enabled]);

  const requestPermission = useCallback(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") return;
    if (Notification.permission === "denied") return;
    Notification.requestPermission();
  }, []);

  useEffect(() => {
    if (!enabled) return;
    requestPermission();
    intervalRef.current = setInterval(checkAndNotify, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkAndNotify, requestPermission, enabled]);

  return { requestPermission, checkAndNotify };
}
