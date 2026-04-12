import { motion } from "framer-motion";
import { Youtube, Instagram, Facebook, Mail, TerminalSquare } from "lucide-react";
import { FaTiktok } from "react-icons/fa";
import { GlitchText } from "@/components/GlitchText";
import { GlitchButton } from "@/components/GlitchButton";

export default function Contacts() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-12 md:py-24 max-w-5xl"
    >
      <h1 className="font-creepster text-5xl md:text-7xl text-primary mb-12 text-center">КОНТАКТИ</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="rusted-border p-8 bg-black font-mono">
          <div className="flex items-center gap-3 mb-8 text-primary border-b border-primary/20 pb-4">
            <TerminalSquare size={28} />
            <h2 className="font-bold text-2xl uppercase tracking-widest">ТЕРМІНАЛ ЗВ'ЯЗКУ</h2>
          </div>
          
          <div className="space-y-6">
            <a href="https://youtube.com/@gathering-of-the-fallen" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-muted-foreground hover:text-white transition-colors group p-4 border border-border/50 hover:border-red-500/50 bg-[#0a0a0a]">
              <Youtube className="group-hover:text-red-500 text-2xl" />
              <div className="flex flex-col">
                <span className="text-xs text-red-500/70 mb-1">ВІДЕОАРХІВ</span>
                <GlitchText>@gathering-of-the-fallen</GlitchText>
              </div>
            </a>
            
            <a href="https://www.instagram.com/alexats2025?igsh=bjQzZWc4ZzQ3OHc=" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-muted-foreground hover:text-white transition-colors group p-4 border border-border/50 hover:border-pink-500/50 bg-[#0a0a0a]">
              <Instagram className="group-hover:text-pink-500 text-2xl" />
              <div className="flex flex-col">
                <span className="text-xs text-pink-500/70 mb-1">ФОТОХРОНІКИ</span>
                <GlitchText>Gathering Of The Fallen</GlitchText>
              </div>
            </a>
            
            <a href="https://www.tiktok.com/@kobzar25" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-muted-foreground hover:text-white transition-colors group p-4 border border-border/50 hover:border-cyan-400/50 bg-[#0a0a0a]">
              <FaTiktok className="text-2xl group-hover:text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-xs text-cyan-400/70 mb-1">КОРОТКІ ПОВІДОМЛЕННЯ</span>
                <GlitchText>@kobzar25</GlitchText>
              </div>
            </a>
            
            <a href="https://www.facebook.com/share/1CYJR7yWJz/" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-muted-foreground hover:text-white transition-colors group p-4 border border-border/50 hover:border-blue-500/50 bg-[#0a0a0a]">
              <Facebook className="group-hover:text-blue-500 text-2xl" />
              <div className="flex flex-col">
                <span className="text-xs text-blue-500/70 mb-1">МЕРЕЖА ВИЖИВШИХ</span>
                <GlitchText>Facebook Спільнота</GlitchText>
              </div>
            </a>
            
            <a href="mailto:gatheringofthefallen@gmail.com" className="flex items-center gap-4 text-muted-foreground hover:text-white transition-colors group p-4 border border-border/50 hover:border-primary/50 bg-[#0a0a0a]">
              <Mail className="group-hover:text-primary text-2xl" />
              <div className="flex flex-col">
                <span className="text-xs text-primary/70 mb-1">ПРЯМИЙ ЗВ'ЯЗОК</span>
                <GlitchText>gatheringofthefallen@gmail.com</GlitchText>
              </div>
            </a>
          </div>
        </div>

        <div className="rusted-border p-8 bg-black font-mono flex flex-col">
          <div className="flex items-center gap-3 mb-8 text-secondary border-b border-secondary/20 pb-4">
            <span className="w-3 h-3 bg-secondary rounded-full animate-pulse"></span>
            <h2 className="font-bold text-2xl uppercase tracking-widest">ВІДПРАВИТИ СИГНАЛ</h2>
          </div>
          
          <form className="flex-1 flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground">&gt; ІДЕНТИФІКАТОР [ІМ'Я]</label>
              <input 
                type="text" 
                className="bg-[#050505] border border-border/50 focus:border-secondary p-3 text-white outline-none font-mono"
                placeholder="..."
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground">&gt; ЧАСТОТА ЗВОРОТНОГО ЗВ'ЯЗКУ [EMAIL]</label>
              <input 
                type="email" 
                className="bg-[#050505] border border-border/50 focus:border-secondary p-3 text-white outline-none font-mono"
                placeholder="..."
              />
            </div>
            
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-xs text-muted-foreground">&gt; ПОВІДОМЛЕННЯ</label>
              <textarea 
                className="bg-[#050505] border border-border/50 focus:border-secondary p-3 text-white outline-none font-mono flex-1 resize-none min-h-[150px]"
                placeholder="Введіть текст трансляції..."
              ></textarea>
            </div>
            
            <GlitchButton className="w-full py-4 mt-auto border-secondary text-secondary hover:bg-secondary/20 hover:border-secondary">
              ТРАНСЛЮВАТИ
            </GlitchButton>
          </form>
        </div>
      </div>
    </motion.div>
  );
}