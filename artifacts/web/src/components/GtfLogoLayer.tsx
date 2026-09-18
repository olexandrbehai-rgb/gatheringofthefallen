import { useEffect, useRef } from "react";
import logoVideo from "@/assets/oracle-logo-transparent.webm";

export function GtfLogoLayer() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const scrubWithPointer = (event: PointerEvent) => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;

      const progress = Math.min(
        1,
        Math.max(0, event.clientX / Math.max(window.innerWidth, 1)),
      );
      video.currentTime = progress * Math.max(video.duration - 0.05, 0);
    };

    window.addEventListener("pointermove", scrubWithPointer, { passive: true });
    return () => window.removeEventListener("pointermove", scrubWithPointer);
  }, []);

  return (
    <video
      ref={videoRef}
      src={logoVideo}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
      className="pointer-events-none relative z-[1] mx-auto mb-10 block aspect-square w-full max-w-3xl object-contain opacity-90 mix-blend-screen"
      style={{
        WebkitMaskImage:
          "radial-gradient(circle at center, #000 22%, rgba(0,0,0,0.92) 34%, rgba(0,0,0,0.55) 46%, rgba(0,0,0,0.12) 57%, transparent 66%)",
        maskImage:
          "radial-gradient(circle at center, #000 22%, rgba(0,0,0,0.92) 34%, rgba(0,0,0,0.55) 46%, rgba(0,0,0,0.12) 57%, transparent 66%)",
      }}
    />
  );
}