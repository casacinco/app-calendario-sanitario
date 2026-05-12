"use client";

import { useRef, useLayoutEffect, useState } from "react";

const IFRAME_W = 794;
const IFRAME_H_DEFAULT = 1800;

export function ScaledIframe({ src }: { src: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [iframeH, setIframeH] = useState(IFRAME_H_DEFAULT);

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

  function handleLoad(e: React.SyntheticEvent<HTMLIFrameElement>) {
    try {
      const h = e.currentTarget.contentDocument?.documentElement.scrollHeight;
      if (h && h > 0) setIframeH(h);
    } catch {}
  }

  return (
    <div ref={wrapperRef} style={{ width: "100%", height: iframeH * scale, overflow: "hidden" }}>
      <iframe
        src={src}
        title="Calendário Sanitário"
        scrolling="no"
        onLoad={handleLoad}
        style={{
          width: IFRAME_W,
          height: iframeH,
          border: "none",
          display: "block",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
