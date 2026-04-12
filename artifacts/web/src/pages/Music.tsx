import { motion } from "framer-motion";
import { MusicPlayer } from "@/components/MusicPlayer";

export default function Music() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-12 md:py-24 max-w-5xl"
    >
      <h1 className="font-creepster text-5xl md:text-7xl text-primary mb-12 text-center">МУЗИКА</h1>
      
      <div className="mb-24">
        <h2 className="font-mono text-2xl text-secondary mb-8 uppercase tracking-widest flex items-center gap-4">
          <span className="w-8 h-px bg-secondary"></span>
          Радіотрансляції
          <span className="flex-1 h-px bg-secondary/30"></span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rusted-border p-2 bg-black/40 backdrop-blur-sm">
            <div className="aspect-video w-full bg-muted/20 relative">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="absolute inset-0"
              ></iframe>
            </div>
            <div className="p-4 font-mono text-sm text-muted-foreground">
              &gt; ТРАНСЛЯЦІЯ: ЗАБУТЕ Я (OFFICIAL VIDEO)
            </div>
          </div>
          <div className="rusted-border p-2 bg-black/40 backdrop-blur-sm">
            <div className="aspect-video w-full bg-muted/20 relative">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="absolute inset-0"
              ></iframe>
            </div>
            <div className="p-4 font-mono text-sm text-muted-foreground">
              &gt; ТРАНСЛЯЦІЯ: ІЗ ПОПЕЛУ (LIVE IN BUNKER 4)
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-mono text-2xl text-primary mb-8 uppercase tracking-widest flex items-center gap-4">
          <span className="w-8 h-px bg-primary"></span>
          Аудіоархів
          <span className="flex-1 h-px bg-primary/30"></span>
        </h2>
        <MusicPlayer />
      </div>
    </motion.div>
  );
}
