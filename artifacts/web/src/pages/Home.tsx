import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { BootSequence } from "@/components/BootSequence";
import { GlitchButton } from "@/components/GlitchButton";

export default function Home() {
  const [booting, setBooting] = useState(() => {
    // Only boot on first visit per session
    if (sessionStorage.getItem("booted")) return false;
    return true;
  });

  const handleBootComplete = () => {
    sessionStorage.setItem("booted", "true");
    setBooting(false);
  };

  return (
    <>
      <AnimatePresence>
        {booting && <BootSequence onComplete={handleBootComplete} />}
      </AnimatePresence>

      {!booting && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="container mx-auto px-4 py-24 min-h-[80vh] flex flex-col items-center justify-center space-y-24"
        >
          <div className="text-center w-full">
            <h1 className="font-creepster text-5xl md:text-7xl lg:text-9xl text-center mb-6 neon-pulse text-foreground leading-tight py-4">
              GATHERING OF THE FALLEN
            </h1>
            <p className="font-mono text-xl md:text-2xl text-secondary mb-12 uppercase tracking-widest bg-secondary/10 inline-block px-6 py-2 border-l-4 border-secondary">
              З руїн цивілізації. З попелу — вічність.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16">
              <Link href="/music">
                <GlitchButton className="text-lg py-4 px-8 w-full sm:w-auto">
                  Слухати музику
                </GlitchButton>
              </Link>
              <Link href="/merch">
                <GlitchButton className="text-lg py-4 px-8 w-full sm:w-auto border-secondary text-secondary hover:bg-secondary/20 hover:border-secondary">
                  Перейти до мерчу
                </GlitchButton>
              </Link>
            </div>

            <div className="max-w-2xl mx-auto rusted-border bg-black/60 p-8 backdrop-blur-sm text-left">
              <p className="font-mono text-muted-foreground leading-relaxed">
                <span className="text-primary mr-2">&gt; SIGNAL ACQUIRED...</span>
                Ми граємо музику для кінця світу. Коли все згоріло, залишився тільки звук. Шукаємо світло в найтемніших бункерах і збираємо полеглих серед попелу.
              </p>
            </div>
          </div>
          
          <div className="w-full max-w-5xl">
            <h2 className="font-creepster text-4xl text-primary mb-8 border-b border-primary/20 pb-4">Останні релізи</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Забуте Я", type: "SINGLE", date: "2099.08.14" },
                { title: "Із Попелу", type: "EP", date: "2099.05.22" },
                { title: "Молодість", type: "SINGLE", date: "2099.02.10" }
              ].map((release, i) => (
                <Link key={i} href="/songs" className="block">
                  <div className="rusted-border bg-[#0a0a0a] p-6 hover:bg-[#111] transition-colors group cursor-pointer h-full">
                    <div className="text-xs text-secondary font-mono mb-2">{release.type} // {release.date}</div>
                    <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">{release.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}