import { useState } from "react";
import { motion } from "framer-motion";
import { GlitchButton } from "@/components/GlitchButton";
import { ArrowDown } from "lucide-react";

export default function Forge() {
  const [isProducing, setIsProducing] = useState(false);

  const startProduction = () => {
    setIsProducing(true);
    setTimeout(() => setIsProducing(false), 5000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-12 md:py-24 max-w-4xl"
    >
      <h1 className="font-creepster text-5xl md:text-7xl text-secondary mb-6 text-center neon-pulse" style={{textShadow: "0 0 5px #8a2be2, 0 0 10px #8a2be2"}}>
        КУЗНЯ ПОВАЛЕНИХ
      </h1>
      <p className="text-center font-mono text-muted-foreground mb-16 max-w-2xl mx-auto">
        Тут, у глибинах бункера, у світлі неону та іскрах від зварювання, ми перетворюємо уламки старого світу на броню для тих, хто вижив.
      </p>

      <div className="rusted-border bg-[#050505] p-8 mb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="flex flex-col items-center justify-center space-y-8 font-mono">
          
          <motion.div 
            animate={isProducing ? { y: [0, 5, -5, 0], filter: ["grayscale(100%)", "grayscale(0%)"] } : {}}
            transition={{ duration: 0.5, repeat: isProducing ? Infinity : 0 }}
            className={`w-full max-w-md border-2 border-dashed ${isProducing ? 'border-primary bg-primary/10' : 'border-muted bg-black'} p-6 text-center rounded-lg`}
          >
            <h3 className="text-xl font-bold text-white mb-2">РУЇНИ</h3>
            <p className="text-sm text-muted-foreground">Металобрухт, попіл, залишки цивілізації</p>
          </motion.div>

          <ArrowDown size={32} className={`${isProducing ? 'text-primary animate-bounce' : 'text-muted'}`} />

          <motion.div 
            animate={isProducing ? { scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] } : {}}
            transition={{ duration: 0.8, repeat: isProducing ? Infinity : 0 }}
            className={`w-full max-w-md border-2 ${isProducing ? 'border-secondary bg-secondary/20 shadow-[0_0_30px_#8a2be240]' : 'border-muted bg-black'} p-6 text-center rounded-lg`}
          >
            <h3 className="text-xl font-bold text-white mb-2">КРИСТАЛІЗАЦІЯ</h3>
            <p className="text-sm text-muted-foreground">Очищення вогнем та звуком</p>
          </motion.div>

          <ArrowDown size={32} className={`${isProducing ? 'text-secondary animate-bounce' : 'text-muted'}`} />

          <motion.div 
            animate={isProducing ? { y: [0, -5, 0], boxShadow: ["0 0 0px #00f0ff", "0 0 20px #00f0ff", "0 0 0px #00f0ff"] } : {}}
            transition={{ duration: 1, repeat: isProducing ? Infinity : 0 }}
            className={`w-full max-w-md border-2 ${isProducing ? 'border-primary bg-primary/20' : 'border-muted bg-black'} p-6 text-center rounded-lg`}
          >
            <h3 className="text-xl font-bold text-white mb-2">ЕКІПІРУВАННЯ</h3>
            <p className="text-sm text-muted-foreground">Готовий мерч для виживання</p>
          </motion.div>

        </div>

        <div className="mt-12 text-center">
          <GlitchButton 
            onClick={startProduction} 
            disabled={isProducing}
            className={`py-4 px-8 text-xl ${isProducing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProducing ? 'ВИРОБНИЦТВО...' : 'ЗАПУСТИТИ ВИРОБНИЦТВО'}
          </GlitchButton>
        </div>
      </div>
    </motion.div>
  );
}