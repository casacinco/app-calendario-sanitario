"use client";

import { useEffect } from "react";

export function LessonTracker({ lessonId }: { lessonId: number }) {
  useEffect(() => {
    fetch("/api/progress/lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_id: lessonId }),
    }).catch(() => {});
  }, [lessonId]);

  return null;
}
