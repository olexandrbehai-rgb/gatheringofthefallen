import { useState } from "react";
import { Play, Pause, Square, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GlitchButton } from "./GlitchButton";

const TRACKS = [
  {
    id: 1,
    title: "Забуте Я (Forgotten Self)",
    lore: "A woman lost in a primeval forest, searching for her forgotten identity among ancient trees and whispered memories.",
    duration: "4:32"
  },
  {
    id: 2,
    title: "Попіл Імперії (Ashes of Empire)",
    lore: "The last broadcast from a crumbling empire, captured on a dying frequency.",
    duration: "5:15"
  },
  {
    id: 3,
    title: "Тіні Бункера (Shadows of the Bunker)",
    lore: "Echoes of those who sheltered underground when the sky turned to fire.",
    duration: "6:08"
  }
];

export function MusicPlayer() {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<typeof TRACKS[0] | null>(null);

  const togglePlay = (id: number) => {
    if (playingId === id) setPlayingId(null);
    else setPlayingId(id);
  };

  return (
    <div className="w-full max-w-3xl mx-auto rusted-border bg-black/40 backdrop-blur-sm p-6 relative overflow-hidden">
      {/* Decorative radio elements */}
      <div className="absolute top-0 right-0 p-2 flex gap-2">
        <div className="w-3 h-3 rounded-full bg-red-900 shadow-[0_0_5px_#ff0000]"></div>
        <div className="w-3 h-3 rounded-full bg-red-900 shadow-[0_0_5px_#ff0000]"></div>
        <div className="w-3 h-3 rounded-full bg-green-900 shadow-[0_0_5px_#00ff00]"></div>
      </div>
      
      <div className="flex items-center gap-4 mb-6 border-b border-secondary/30 pb-4">
        <div className="w-16 h-16 bg-black rounded-full border-4 border-secondary flex items-center justify-center">
          <div className="w-4 h-4 bg-secondary rounded-full"></div>
        </div>
        <div>
          <h3 className="font-sans text-secondary text-xl font-bold tracking-wider">SALVAGED COMMS UNIT v4</h3>
          <p className="text-xs text-muted-foreground">FREQ: 104.9 MHz // STATUS: DECRYPTING</p>
        </div>
      </div>

      <div className="space-y-4">
        {TRACKS.map(track => (
          <div key={track.id} className="flex items-center gap-4 p-3 bg-black/40 border border-border/50 hover:border-primary/50 transition-colors">
            <button 
              onClick={() => togglePlay(track.id)}
              className="text-primary hover:text-white transition-colors"
            >
              {playingId === track.id ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <div className="flex-1">
              <div className="font-bold text-foreground">{track.title}</div>
              <div className="text-xs text-muted-foreground">{track.duration}</div>
            </div>
            
            {/* Audio visualization bars for active track */}
            {playingId === track.id && (
              <div className="hidden md:flex gap-1 items-end h-6 mr-4">
                {[1,2,3,4,5].map(i => (
                  <div 
                    key={i} 
                    className="w-1 bg-primary animate-pulse" 
                    style={{ 
                      height: `${Math.random() * 100}%`,
                      animationDuration: `${0.3 + Math.random() * 0.5}s` 
                    }}
                  />
                ))}
              </div>
            )}

            <GlitchButton onClick={() => setSelectedTrack(track)} className="px-3 py-1 text-xs">
              <Info size={16} className="inline mr-1" /> LORE
            </GlitchButton>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedTrack} onOpenChange={() => setSelectedTrack(null)}>
        <DialogContent className="bg-black/90 border border-primary/50 backdrop-blur-md text-foreground font-mono">
          <DialogHeader>
            <DialogTitle className="text-primary text-xl font-bold font-sans">
              [DECRYPTED FILE: {selectedTrack?.title}]
            </DialogTitle>
            <DialogDescription className="text-foreground pt-4 text-lg">
              {selectedTrack?.lore}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
