import { useEffect, useRef } from "react";
import creatureColor from "@assets/author-creature-color.mp4";
import creatureMask from "@assets/author-creature-mask.mp4";
import creaturePoster from "@assets/author-creature-poster.png";

type AmbientCreatureProps = {
  className?: string;
  staticOnMobile?: boolean;
};

export function AmbientCreature({ className = "", staticOnMobile = false }: AmbientCreatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorVideoRef = useRef<HTMLVideoElement>(null);
  const maskVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (staticOnMobile) return;

    const canvas = canvasRef.current;
    const colorVideo = colorVideoRef.current;
    const maskVideo = maskVideoRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    const maskCanvas = document.createElement("canvas");
    const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });

    if (!canvas || !colorVideo || !maskVideo || !context || !maskContext) return;

    let animationFrame = 0;
    let disposed = false;

    const drawFrame = () => {
      if (disposed) return;

      if (
        colorVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        maskVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        const width = colorVideo.videoWidth || 1080;
        const height = colorVideo.videoHeight || 1080;

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          maskCanvas.width = width;
          maskCanvas.height = height;
        }

        if (Math.abs(colorVideo.currentTime - maskVideo.currentTime) > 0.08) {
          maskVideo.currentTime = colorVideo.currentTime;
        }

        context.clearRect(0, 0, width, height);
        context.drawImage(colorVideo, 0, 0, width, height);
        maskContext.clearRect(0, 0, width, height);
        maskContext.drawImage(maskVideo, 0, 0, width, height);

        const colorFrame = context.getImageData(0, 0, width, height);
        const maskFrame = maskContext.getImageData(0, 0, width, height);

        for (let index = 0; index < colorFrame.data.length; index += 4) {
          const maskValue = maskFrame.data[index];
          colorFrame.data[index + 3] = maskValue < 8 ? 0 : maskValue;
        }

        context.putImageData(colorFrame, 0, 0);
      }

      animationFrame = window.requestAnimationFrame(drawFrame);
    };

    colorVideo.currentTime = 0;
    maskVideo.currentTime = 0;
    void colorVideo.play().catch(() => {});
    void maskVideo.play().catch(() => {});
    animationFrame = window.requestAnimationFrame(drawFrame);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      colorVideo.pause();
      maskVideo.pause();
    };
  }, [staticOnMobile]);

  return (
    <div className={`pointer-events-none fixed overflow-visible ${className}`} aria-hidden="true">
      {!staticOnMobile && (
        <>
          <video
            ref={colorVideoRef}
            src={creatureColor}
            muted
            playsInline
            loop
            preload="auto"
            tabIndex={-1}
            className="absolute h-px w-px opacity-0"
          />
          <video
            ref={maskVideoRef}
            src={creatureMask}
            muted
            playsInline
            loop
            preload="auto"
            tabIndex={-1}
            className="absolute h-px w-px opacity-0"
          />
        </>
      )}
      <img
        src={creaturePoster}
        alt=""
        className="absolute inset-0 h-full w-full object-contain"
      />
      {!staticOnMobile && <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-contain" />}
    </div>
  );
}