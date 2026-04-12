import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BootSequence } from "@/components/BootSequence";
import { AnimatedFog } from "@/components/AnimatedFog";
import { CRTScanline } from "@/components/CRTScanline";
import { SecretLevel } from "@/components/SecretLevel";
import { GlitchText } from "@/components/GlitchText";
import { MusicPlayer } from "@/components/MusicPlayer";
import { MerchSection } from "@/components/MerchSection";
import { 
  Youtube, 
  Instagram, 
  Facebook, 
  Mail,
  TerminalSquare
} from "lucide-react";
import { FaTiktok } from "react-icons/fa";

export default function Home() {
  const [booting, setBooting] = useState(true);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <AnimatePresence>
        {booting && <BootSequence onComplete={() => setBooting(false)} />}
      </AnimatePresence>

      <AnimatedFog />
      <CRTScanline />
      <SecretLevel />

      {!booting && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative z-10 min-h-screen text-foreground"
        >
          {/* Header */}
          <header className="py-12 border-b border-primary/20 bg-black/60 backdrop-blur-sm sticky top-0 z-40">
            <div className="container mx-auto px-4 flex flex-col items-center">
              <h1 className="font-nosifer text-4xl md:text-6xl lg:text-7xl text-center mb-6 neon-pulse text-foreground">
                GATHERING OF THE FALLEN
              </h1>
              
              <nav className="flex flex-wrap justify-center gap-6 text-sm md:text-base font-mono uppercase">
                <button onClick={() => scrollTo('transmission')} className="text-muted-foreground hover:text-primary transition-colors">
                  <GlitchText>&gt; TRANSMISSION</GlitchText>
                </button>
                <button onClick={() => scrollTo('discography')} className="text-muted-foreground hover:text-primary transition-colors">
                  <GlitchText>&gt; DISCOGRAPHY</GlitchText>
                </button>
                <button onClick={() => scrollTo('factory')} className="text-muted-foreground hover:text-primary transition-colors">
                  <GlitchText>&gt; THE FACTORY</GlitchText>
                </button>
                <button onClick={() => scrollTo('comms')} className="text-muted-foreground hover:text-primary transition-colors">
                  <GlitchText>&gt; COMMS</GlitchText>
                </button>
              </nav>
            </div>
          </header>

          <main className="container mx-auto px-4 py-24 space-y-32">
            
            {/* About Section */}
            <section id="transmission" className="max-w-4xl mx-auto scroll-mt-32">
              <div className="rusted-border bg-black/80 p-8 md:p-12 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
                <h2 className="font-metal text-3xl md:text-5xl text-primary mb-8 animate-[glitch-skew_3s_infinite]">
                  [ DECRYPTED PROTOCOL ]
                </h2>
                <div className="space-y-6 text-lg font-mono leading-relaxed text-muted-foreground">
                  <p>
                    <span className="text-white">&gt; INITIALIZING... </span> 
                    Ми граємо музику для кінця світу. When the skies turned to ash and the cities crumbled, only the sound remained.
                  </p>
                  <p>
                    <span className="text-white">&gt; LOG ENTRY 44.9: </span>
                    Survival through music. Art in times of decay. Ми знаходимо красу в руйнуванні, шукаємо світло в найтемніших бункерах. Every chord is a memory of what we lost. Every scream is a defiance against the silence.
                  </p>
                  <p className="text-secondary italic mt-8 border-l-2 border-secondary pl-4 py-2 bg-secondary/10">
                    "З попелу ми повстанемо, щоб заспівати останню пісню."
                  </p>
                </div>
              </div>
            </section>

            {/* Music Section */}
            <section id="discography" className="scroll-mt-32">
              <h2 className="font-metal text-4xl md:text-5xl text-center mb-12 text-primary">
                &lt; DISCOGRAPHY &gt;
              </h2>
              <MusicPlayer />
            </section>

            {/* Merch Section */}
            <section id="factory" className="scroll-mt-32">
              <h2 className="font-metal text-4xl md:text-5xl text-center mb-12 text-primary">
                &lt; THE FACTORY &gt;
              </h2>
              <MerchSection />
            </section>

          </main>

          {/* Footer */}
          <footer id="comms" className="border-t border-primary/30 bg-[#050505] py-16 scroll-mt-32">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl mx-auto rusted-border p-6 bg-black">
                <div className="flex items-center gap-3 mb-6 text-primary border-b border-primary/20 pb-4">
                  <TerminalSquare size={24} />
                  <h3 className="font-bold text-xl uppercase tracking-widest">COMMUNICATION TERMINAL</h3>
                </div>
                
                <div className="space-y-4 font-mono">
                  <a href="https://youtube.com/@gathering-of-the-fallen" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-muted-foreground hover:text-white transition-colors group">
                    <Youtube className="group-hover:text-red-500" />
                    <GlitchText>CONNECT // YOUTUBE</GlitchText>
                  </a>
                  <a href="https://www.instagram.com/alexats2025?igsh=bjQzZWc4ZzQ3OHc=" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-muted-foreground hover:text-white transition-colors group">
                    <Instagram className="group-hover:text-pink-500" />
                    <GlitchText>CONNECT // INSTAGRAM</GlitchText>
                  </a>
                  <a href="https://www.tiktok.com/@kobzar25" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-muted-foreground hover:text-white transition-colors group">
                    <FaTiktok className="text-xl group-hover:text-cyan-400" />
                    <GlitchText>CONNECT // TIKTOK</GlitchText>
                  </a>
                  <a href="https://www.facebook.com/share/1CYJR7yWJz/" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-muted-foreground hover:text-white transition-colors group">
                    <Facebook className="group-hover:text-blue-500" />
                    <GlitchText>CONNECT // FACEBOOK</GlitchText>
                  </a>
                  <a href="mailto:gatheringofthefallen@gmail.com" className="flex items-center gap-4 text-muted-foreground hover:text-white transition-colors group">
                    <Mail className="group-hover:text-primary" />
                    <GlitchText>TRANSMIT // EMAIL</GlitchText>
                  </a>
                </div>
                
                <div className="mt-8 pt-4 border-t border-primary/20 text-xs text-primary/50 text-center">
                  SYSTEM READY. AWAITING INPUT.
                </div>
              </div>
            </div>
          </footer>
        </motion.div>
      )}
    </>
  );
}
