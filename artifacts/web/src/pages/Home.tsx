import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { BootSequence } from "@/components/BootSequence";
import { GlitchButton } from "@/components/GlitchButton";
import logoImg from "@assets/logo_1776019192682.jpg";
import gurtImg from "@assets/гурт_1776018973007.jpg";
import gurt2Img from "@assets/гурт_2_1776018973007.jpg";
import merchAllImg from "@assets/photo_2026-03-19_11-20-07_1776018973005.jpg";

export default function Home() {
  const [booting, setBooting] = useState(() => {
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
        >
          <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-4 py-24">
            <motion.img 
              src={logoImg} 
              alt="Gathering Of The Fallen" 
              className="w-full max-w-2xl mx-auto mb-8 neon-glow-img"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            
            <motion.p 
              className="font-mono text-xl md:text-2xl text-secondary mb-12 uppercase tracking-widest bg-secondary/10 inline-block px-6 py-2 border-l-4 border-secondary text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              З руїн цивілізації. З попелу — вічність.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row justify-center gap-6 mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
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
            </motion.div>

            <motion.div 
              className="max-w-2xl mx-auto rusted-border bg-black/40 backdrop-blur-sm p-8 text-left"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <p className="font-mono text-muted-foreground leading-relaxed">
                <span className="text-primary mr-2">&gt; SIGNAL ACQUIRED...</span>
                У світі, який упав, ми — Gathering Of The Fallen — збираємо полеглих. Наша музика — це крик крізь руїни, кришталеві акорди, що піднімаються з попелу старого світу.
              </p>
            </motion.div>
          </section>

          <section className="container mx-auto px-4 py-16">
            <h2 className="font-creepster text-4xl text-primary mb-8 border-b border-primary/20 pb-4 text-center">Гурт</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="rusted-border overflow-hidden group">
                <img 
                  src={gurtImg} 
                  alt="Gathering Of The Fallen на сцені" 
                  loading="lazy"
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="rusted-border overflow-hidden group">
                <img 
                  src={gurt2Img} 
                  alt="Gathering Of The Fallen" 
                  loading="lazy"
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </section>
          
          <section className="container mx-auto px-4 py-16 max-w-5xl">
            <h2 className="font-creepster text-4xl text-primary mb-8 border-b border-primary/20 pb-4">Останні релізи</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Із Попелу", type: "SINGLE", date: "2025" },
                { title: "Молодість", type: "SINGLE", date: "2025" },
                { title: "Емігрант", type: "SINGLE", date: "2025" }
              ].map((release, i) => (
                <Link key={i} href="/songs" className="block">
                  <motion.div 
                    whileHover={{ scale: 1.03 }}
                    className="rusted-border bg-black/40 backdrop-blur-sm p-6 hover:bg-black/50 transition-colors group cursor-pointer h-full"
                  >
                    <div className="text-xs text-secondary font-mono mb-2">{release.type} // {release.date}</div>
                    <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">{release.title}</h3>
                  </motion.div>
                </Link>
              ))}
            </div>
          </section>

          <section className="container mx-auto px-4 py-16 max-w-5xl">
            <h2 className="font-creepster text-4xl text-primary mb-8 border-b border-primary/20 pb-4 text-center">Наш мерч</h2>
            <Link href="/merch" className="block">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="rusted-border overflow-hidden group cursor-pointer"
              >
                <img 
                  src={merchAllImg} 
                  alt="Мерч Gathering Of The Fallen" 
                  loading="lazy"
                  className="w-full h-auto object-cover group-hover:brightness-110 transition-all duration-500"
                />
              </motion.div>
            </Link>
          </section>
        </motion.div>
      )}
    </>
  );
}
