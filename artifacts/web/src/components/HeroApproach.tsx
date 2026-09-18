import { useEffect, useRef, useState } from "react";
import heroColorVideo from "@/assets/hero-distance-color.mp4";
import heroMaskVideo from "@/assets/hero-distance-mask.mp4";
import heroPoster from "@/assets/hero-distance-poster.png";

type HeroApproachProps = {
  className?: string;
};

export function HeroApproach({ className = "" }: HeroApproachProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorVideoRef = useRef<HTMLVideoElement>(null);
  const maskVideoRef = useRef<HTMLVideoElement>(null);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const colorVideo = colorVideoRef.current;
    const maskVideo = maskVideoRef.current;
    if (!canvas || !colorVideo || !maskVideo) return;

    const context = canvas.getContext("2d", { alpha: true });
    const maskCanvas = document.createElement("canvas");
    const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
    if (!context || !maskContext) return;

    let animationFrame = 0;
    let disposed = false;
    let hasDrawnFrame = false;
    let lastMaskSyncAt = 0;
    const loopTailSeconds = 2;

    const drawFrame = () => {
      if (disposed) return;

      if (
        colorVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        maskVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        const width = colorVideo.videoWidth || 720;
        const height = colorVideo.videoHeight || 1280;

        if (
          Number.isFinite(colorVideo.duration) &&
          colorVideo.duration > loopTailSeconds &&
          colorVideo.currentTime >= colorVideo.duration - loopTailSeconds
        ) {
          colorVideo.currentTime = 0;
          maskVideo.currentTime = 0;
          lastMaskSyncAt = performance.now();
        }

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          maskCanvas.width = width;
          maskCanvas.height = height;
        }

        const now = performance.now();
        const maskDrift = Math.abs(maskVideo.currentTime - colorVideo.currentTime);
        if (maskDrift > 0.12 && now - lastMaskSyncAt > 250) {
          maskVideo.currentTime = colorVideo.currentTime;
          lastMaskSyncAt = now;
        }

        context.clearRect(0, 0, width, height);
        context.drawImage(colorVideo, 0, 0, width, height);
        maskContext.clearRect(0, 0, width, height);
        maskContext.drawImage(maskVideo, 0, 0, width, height);

        const colorFrame = context.getImageData(0, 0, width, height);
        const maskFrame = maskContext.getImageData(0, 0, width, height);
        let visiblePixels = 0;

        for (let index = 0; index < colorFrame.data.length; index += 4) {
          const maskValue = maskFrame.data[index];
          const alpha =
            maskValue < 22
              ? 0
              : Math.min(255, ((maskValue - 22) * 255) / 233);
          colorFrame.data[index + 3] = alpha;
          if (alpha > 8) visiblePixels += 1;
        }

        context.putImageData(colorFrame, 0, 0);

        if (!hasDrawnFrame && visiblePixels > 100) {
          hasDrawnFrame = true;
          setCanvasReady(true);
        }
      }

      animationFrame = requestAnimationFrame(drawFrame);
    };

    const startPlayback = async () => {
      try {
        await Promise.all([colorVideo.play(), maskVideo.play()]);
      } catch {
        // Browsers may defer autoplay until a user gesture.
      }
    };

    colorVideo.currentTime = 0;
    maskVideo.currentTime = 0;
    void startPlayback();
    animationFrame = requestAnimationFrame(drawFrame);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      colorVideo.pause();
      maskVideo.pause();
    };
  }, []);

  return (
    <div className={`h-full w-full overflow-hidden ${className}`}>
      <div className="relative h-full w-full">
        <video
          ref={colorVideoRef}
          src={heroColorVideo}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
        <video
          ref={maskVideoRef}
          src={heroMaskVideo}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
        <img
          src={heroPoster}
          alt=""
          aria-hidden="true"
          className={`pointer-events-none absolute left-1/2 top-0 block h-full w-auto max-w-none -translate-x-1/2 ${
            canvasReady ? "hidden" : "block"
          }`}
        />
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 z-10 block h-full w-auto max-w-none -translate-x-1/2"
        />
      </div>
    </div>
  );
}