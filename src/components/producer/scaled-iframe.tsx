"use client";

import { useRef, useLayoutEffect, useState } from "react";

const IFRAME_W = 794;
const IFRAME_H = 1800;

export function ScaledIframe({ src }: { src: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setScale(entry.contentRect.width / IFRAME_W);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: "100%", height: IFRAME_H * scale, overflow: "hidden" }}>
      <iframe
        src={src}
        title="Calendário Sanitário"
        scrolling="no"
        style={{
          width: IFRAME_W,
          height: IFRAME_H,
          border: "none",
          display: "block",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
