import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const BOOT_LINES = [
  "BIOS Date 08/14/2099 15:43:21 Ver 1.00",
  "CPU : NUK-TEC Core(TM) i99-7900X CPU @ 3.30GHz",
  "Speed : 3.30 GHz",
  "Press DEL to enter SETUP",
  "32768MB OK",
  "Auto-Detecting Pri Master..IDE Hard Disk",
  "Auto-Detecting Pri Slave...Not Detected",
  "Pri Master: 9.04 YZ100-34X NUK-TEC 500GB",
  "Ultra DMA Mode-6, S.M.A.R.T. Capable and Status OK",
  "Connecting to network...",
  "Network failure. Retrying...",
  "Network failure. Retrying...",
  "Bypassing security protocols...",
  "Accessing local network...",
  "Connecting to Bunker Terminal 4...",
  "CONNECTION ESTABLISHED.",
  "SIGNAL ACQUIRED...",
  "DECRYPTING TRANSMISSION...",
];

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < BOOT_LINES.length) {
      const timeout = setTimeout(() => {
        setLines((prev) => [...prev, BOOT_LINES[currentIndex]]);
        setCurrentIndex((prev) => prev + 1);
      }, Math.random() * 150 + 50); // Random delay between 50-200ms
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black text-primary p-6 font-mono overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        scale: 1.1,
        filter: "blur(10px) contrast(200%) hue-rotate(90deg)",
        transition: { duration: 0.5, ease: "easeIn" }
      }}
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-1">
        {lines.map((line, i) => (
          <div key={i} className="text-sm md:text-base">
            {line}
          </div>
        ))}
        {currentIndex < BOOT_LINES.length && (
          <div className="terminal-cursor text-sm md:text-base inline-block">_</div>
        )}
      </div>
    </motion.div>
  );
}
