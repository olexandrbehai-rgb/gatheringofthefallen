import { useEffect, useRef } from "react";
import originalHeroColor from "@/assets/hero-distance-color.mp4";
import originalHeroMask from "@/assets/hero-distance-mask.mp4";
import heroOne from "@assets/grok-video-2bce09f4-f42e-49af-a101-4e9a37cf6692_1789685928037.mp4";
import heroOneMask from "@/assets/hero-one-mask.mp4";
import heroTwo from "@assets/grok-video-6b071f1d-cc31-41fa-b7c2-b94151af9a4a_1789685928037.mp4";
import heroTwoMask from "@/assets/hero-two-mask.mp4";
import heroThree from "@assets/grok-video-dea96e2d-e6e1-46a7-a95f-5c49e612aacd_1789685928037.mp4";
import heroThreeMask from "@/assets/hero-three-mask.mp4";

type HeroSource = {
  color: string;
  mask?: string;
};

const heroSources: HeroSource[] = [
  { color: originalHeroColor, mask: originalHeroMask },
  { color: heroOne, mask: heroOneMask },
  { color: heroTwo, mask: heroTwoMask },
  { color: heroThree, mask: heroThreeMask },
];
const trimHeadSeconds = 1.25;
const trimTailSeconds = 2;
const interludeMilliseconds = 3000;
const framesToSkipAfterStart = 4;
const backgroundThreshold = 8;
const foregroundHoldFrames = 2;
const maskFramesToHide = 3;
const darkComponentMinSize = 300;

type HeroSequenceProps = {
  className?: string;
};

export function HeroSequence({ className = "" }: HeroSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const maskRefs = useRef<Array<HTMLVideoElement | null>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", {
      alpha: true,
      willReadFrequently: true,
    });
    const maskCanvas = document.createElement("canvas");
    const maskContext = maskCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!canvas || !context || !maskContext) return;

    let animationFrame = 0;
    let disposed = false;
    let activeIndex = 0;
    let phase: "playing" | "interlude" = "playing";
    let interludeEndsAt = 0;
    let foregroundConfidence = new Uint8Array(0);
    let filledForeground = new Uint8Array(0);
    let edgeBackground = new Uint8Array(0);
    let floodStack = new Int32Array(0);
    let darkComponentKeep = new Uint8Array(0);
    let componentPixels = new Int32Array(0);
    let maskAlpha = new Uint8Array(0);
    let maskLowConfidence = new Uint8Array(0);
    let framesToSkip = 0;

    const clearCanvas = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };

    const playActive = () => {
      const video = videoRefs.current[activeIndex];
      if (!video) return;
      const maskVideo = maskRefs.current[activeIndex];

      video.currentTime = trimHeadSeconds;
      if (maskVideo) {
        maskVideo.currentTime = trimHeadSeconds;
      }
      foregroundConfidence.fill(0);
      maskAlpha.fill(0);
      maskLowConfidence.fill(0);
      framesToSkip = framesToSkipAfterStart;
      phase = "playing";
      clearCanvas();
      void video.play().catch(() => {
        // Muted autoplay can still wait for a browser gesture.
      });
      void maskVideo?.play().catch(() => {});
    };

    const startInterlude = (
      video: HTMLVideoElement,
      maskVideo: HTMLVideoElement | null,
    ) => {
      video.pause();
      video.currentTime = Math.max(0, video.duration - trimTailSeconds);
      if (maskVideo) {
        maskVideo.pause();
        maskVideo.currentTime = Math.max(
          0,
          maskVideo.duration - trimTailSeconds,
        );
      }
      phase = "interlude";
      interludeEndsAt = performance.now() + interludeMilliseconds;
      clearCanvas();
    };

    const drawFrame = () => {
      if (disposed) return;

      if (phase === "interlude") {
        clearCanvas();
        if (performance.now() >= interludeEndsAt) {
          activeIndex = (activeIndex + 1) % heroSources.length;
          playActive();
        }
      } else {
        const video = videoRefs.current[activeIndex];
        const maskVideo = maskRefs.current[activeIndex];

        if (
          video &&
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          (!maskVideo ||
            maskVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)
        ) {
          if (
            Number.isFinite(video.duration) &&
            video.duration > trimTailSeconds &&
            video.currentTime >= video.duration - trimTailSeconds
          ) {
            startInterlude(video, maskVideo);
          } else {
            const videoBeforeStart =
              video.currentTime < trimHeadSeconds - 0.04;
            const maskBeforeStart =
              maskVideo &&
              maskVideo.currentTime < trimHeadSeconds - 0.04;
            if (videoBeforeStart || maskBeforeStart) {
              video.currentTime = trimHeadSeconds;
              if (maskVideo) {
                maskVideo.currentTime = trimHeadSeconds;
              }
              framesToSkip = framesToSkipAfterStart;
              clearCanvas();
              animationFrame = requestAnimationFrame(drawFrame);
              return;
            }

            const width = video.videoWidth || 720;
            const height = video.videoHeight || 1280;

            if (canvas.width !== width || canvas.height !== height) {
              canvas.width = width;
              canvas.height = height;
              maskCanvas.width = width;
              maskCanvas.height = height;
              const pixelCount = width * height;
              foregroundConfidence = new Uint8Array(pixelCount);
              filledForeground = new Uint8Array(pixelCount);
              edgeBackground = new Uint8Array(pixelCount);
              floodStack = new Int32Array(pixelCount);
              darkComponentKeep = new Uint8Array(pixelCount);
              componentPixels = new Int32Array(pixelCount);
              maskAlpha = new Uint8Array(pixelCount);
              maskLowConfidence = new Uint8Array(pixelCount);
            }

            if (framesToSkip > 0) {
              framesToSkip -= 1;
              clearCanvas();
              animationFrame = requestAnimationFrame(drawFrame);
              return;
            }

            context.clearRect(0, 0, width, height);
            context.drawImage(video, 0, 0, width, height);

            const frame = context.getImageData(0, 0, width, height);
            const pixelCount = width * height;

            if (maskVideo) {
              const maskDrift = Math.abs(
                maskVideo.currentTime - video.currentTime,
              );
              if (maskDrift > 0.04) {
                maskVideo.currentTime = video.currentTime;
              }

              maskContext.clearRect(0, 0, width, height);
              maskContext.drawImage(maskVideo, 0, 0, width, height);
              const maskFrame = maskContext.getImageData(
                0,
                0,
                width,
                height,
              );

              for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
                const targetAlpha = maskFrame.data[pixelIndex * 4];
                if (targetAlpha < 22) {
                  maskLowConfidence[pixelIndex] = Math.min(
                    maskFramesToHide,
                    maskLowConfidence[pixelIndex] + 1,
                  );
                  if (maskLowConfidence[pixelIndex] >= maskFramesToHide) {
                    maskAlpha[pixelIndex] = 0;
                  }
                } else {
                  maskLowConfidence[pixelIndex] = 0;
                  maskAlpha[pixelIndex] = targetAlpha;
                }

                frame.data[pixelIndex * 4 + 3] = maskAlpha[pixelIndex];
              }
            } else {
              edgeBackground.fill(0);
              let stackSize = 0;
              const isBackgroundPixel = (pixelIndex: number) => {
                const dataIndex = pixelIndex * 4;
                return (
                  Math.max(
                    frame.data[dataIndex],
                    frame.data[dataIndex + 1],
                    frame.data[dataIndex + 2],
                  ) <= backgroundThreshold
                );
              };
              const seedBackground = (pixelIndex: number) => {
                if (
                  pixelIndex < 0 ||
                  pixelIndex >= pixelCount ||
                  edgeBackground[pixelIndex] ||
                  !isBackgroundPixel(pixelIndex)
                ) {
                  return;
                }
                edgeBackground[pixelIndex] = 1;
                floodStack[stackSize] = pixelIndex;
                stackSize += 1;
              };

              for (let x = 0; x < width; x += 1) {
                seedBackground(x);
                seedBackground((height - 1) * width + x);
              }
              for (let y = 1; y < height - 1; y += 1) {
                seedBackground(y * width);
                seedBackground(y * width + width - 1);
              }

              while (stackSize > 0) {
                const pixelIndex = floodStack[--stackSize];
                const x = pixelIndex % width;
                const y = Math.floor(pixelIndex / width);

                if (x > 0) seedBackground(pixelIndex - 1);
                if (x < width - 1) seedBackground(pixelIndex + 1);
                if (y > 0) seedBackground(pixelIndex - width);
                if (y < height - 1) seedBackground(pixelIndex + width);
              }

              filledForeground.fill(0);
              darkComponentKeep.fill(0);
              for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
                if (
                  filledForeground[pixelIndex] ||
                  edgeBackground[pixelIndex] ||
                  !isBackgroundPixel(pixelIndex)
                ) {
                  continue;
                }

                let componentSize = 0;
                stackSize = 0;
                filledForeground[pixelIndex] = 1;
                floodStack[stackSize] = pixelIndex;
                stackSize += 1;

                while (stackSize > 0) {
                  const currentPixel = floodStack[--stackSize];
                  componentPixels[componentSize] = currentPixel;
                  componentSize += 1;

                  const currentX = currentPixel % width;
                  const currentY = Math.floor(currentPixel / width);
                  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
                    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
                      if (offsetX === 0 && offsetY === 0) continue;
                      const nextX = currentX + offsetX;
                      const nextY = currentY + offsetY;
                      if (
                        nextX < 0 ||
                        nextX >= width ||
                        nextY < 0 ||
                        nextY >= height
                      ) {
                        continue;
                      }

                      const nextPixel = nextY * width + nextX;
                      if (
                        !filledForeground[nextPixel] &&
                        !edgeBackground[nextPixel] &&
                        isBackgroundPixel(nextPixel)
                      ) {
                        filledForeground[nextPixel] = 1;
                        floodStack[stackSize] = nextPixel;
                        stackSize += 1;
                      }
                    }
                  }
                }

                if (componentSize >= darkComponentMinSize) {
                  for (let componentIndex = 0; componentIndex < componentSize; componentIndex += 1) {
                    darkComponentKeep[componentPixels[componentIndex]] = 1;
                  }
                }
              }

              for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
                const foregroundCandidate =
                  !isBackgroundPixel(pixelIndex) ||
                  darkComponentKeep[pixelIndex];
                if (foregroundCandidate) {
                  foregroundConfidence[pixelIndex] = Math.min(
                    foregroundHoldFrames,
                    foregroundConfidence[pixelIndex] + 1,
                  );
                } else {
                  foregroundConfidence[pixelIndex] = Math.max(
                    0,
                    foregroundConfidence[pixelIndex] - 1,
                  );
                }

                frame.data[pixelIndex * 4 + 3] =
                  foregroundConfidence[pixelIndex] > 0 ? 255 : 0;
              }
            }
            context.putImageData(frame, 0, 0);
          }
        }
      }

      animationFrame = requestAnimationFrame(drawFrame);
    };

    playActive();
    animationFrame = requestAnimationFrame(drawFrame);

    const resumePlayback = () => {
      if (phase === "playing") {
        void videoRefs.current[activeIndex]?.play().catch(() => {});
      }
    };
    window.addEventListener("pointerdown", resumePlayback, { passive: true });

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointerdown", resumePlayback);
      videoRefs.current.forEach((video) => video?.pause());
      maskRefs.current.forEach((video) => video?.pause());
    };
  }, []);

  return (
    <div className={`h-full w-full overflow-hidden ${className}`}>
      {heroSources.map((source, index) => (
        <div key={source.color}>
          <video
            ref={(video) => {
              videoRefs.current[index] = video;
            }}
            src={source.color}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
            className="pointer-events-none absolute h-px w-px opacity-0"
          />
          {source.mask && (
            <video
              ref={(video) => {
                maskRefs.current[index] = video;
              }}
              src={source.mask}
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              tabIndex={-1}
              className="pointer-events-none absolute h-px w-px opacity-0"
            />
          )}
        </div>
      ))}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 z-10 block h-full w-auto max-w-none -translate-x-1/2"
      />
    </div>
  );
}