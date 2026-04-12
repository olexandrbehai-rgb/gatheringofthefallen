import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SecretLevel() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const targetCode = "FALLEN";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const key = e.key.toUpperCase();
      setInput((prev) => {
        const next = (prev + key).slice(-targetCode.length);
        if (next === targetCode) {
          setIsOpen(true);
        }
        return next;
      });
      
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm"
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255,0,0,0.1) 2px,
              rgba(255,0,0,0.1) 4px
            )`
          }}></div>
          
          <h2 className="text-4xl md:text-6xl font-nosifer text-destructive mb-8 animate-[glitch-skew_0.5s_infinite]">
            TRANSMISSION INTERCEPTED
          </h2>
          
          <div className="max-w-2xl font-sans text-xl md:text-2xl space-y-6 text-foreground">
            <p className="text-primary italic animate-pulse">
              "Ми — тіні, що танцюють у вогні<br />
              Ми — голоси, що лунають у пустці<br />
              Ми — останній подих згасаючого світу<br />
              Ми — Gathering Of The Fallen"
            </p>
            
            <div className="mt-12">
              <a 
                href="https://www.youtube.com/@gathering-of-the-fallen" 
                target="_blank" 
                rel="noreferrer"
                className="inline-block px-8 py-4 border border-destructive text-destructive hover:bg-destructive hover:text-black transition-colors font-bold text-2xl"
              >
                [ ACCESS ARCHIVE ]
              </a>
            </div>
          </div>

          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-8 right-8 text-muted-foreground hover:text-primary"
          >
            [ ESC TO ABORT ]
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
