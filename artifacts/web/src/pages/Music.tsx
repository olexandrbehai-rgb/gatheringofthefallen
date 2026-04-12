import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { GlitchButton } from "@/components/GlitchButton";

const TRACKS = [
  {
    id: "pGHn8UmSeVw",
    title: "Through the Ashes (Із Попелу)",
    description: "Гімн відродження. Коли все згоріло, залишається лише попіл... і з нього народжується нове. Ця пісня про силу духу, що піднімається з руїн.",
  },
  {
    id: "YGqN3dVWBqg",
    title: "Молодість",
    description: "Спогади про час, коли світ ще стояв. Ностальгія за днями, коли все було попереду, а руїни ще не затьмарили горизонт.",
  },
  {
    id: "2kdtj1rwS5w",
    title: "Емігрант",
    description: "Історія того, хто залишив батьківщину в пошуках кращого світу. Біль розлуки та надія на нове життя серед чужих руїн.",
  },
  {
    id: "hboWQxvrau8",
    title: "Реквієм Народу",
    description: "Реквієм для тих, хто впав. Пам'ять народу, що не зламався під тиском долі. Потужна балада про незламність духу.",
  },
  {
    id: "EiUXYLow4v8",
    title: "Пустеля Душ",
    description: "Коли внутрішній світ перетворюється на пустелю — лише музика здатна повернути дощ. Філософська подорож у глибини свідомості.",
  },
  {
    id: "bfbYohcYrnM",
    title: "Вогонь В Руках",
    description: "Вогонь — це і зброя, і надія. Пісня про тих, хто тримає полум'я, не боячись опіків, і веде за собою у темряві.",
  },
];

export default function Music() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-12 md:py-24 max-w-6xl"
    >
      <h1 className="font-creepster text-5xl md:text-7xl text-primary mb-4 text-center">
        МУЗИКА
      </h1>
      <p
        className="font-mono text-secondary text-center mb-16 text-lg uppercase tracking-widest"
        style={{
          textShadow:
            "0 0 10px rgba(138,43,226,0.8), 0 0 20px rgba(138,43,226,0.4)",
        }}
      >
        Офіційні треки гурту
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {TRACKS.map((track, i) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rusted-border bg-black/40 backdrop-blur-sm overflow-hidden group"
          >
            <div className="aspect-video w-full relative">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${track.id}`}
                title={track.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0"
                loading="lazy"
              />
            </div>
            <div className="p-5">
              <h3 className="font-creepster text-2xl text-primary mb-3 group-hover:text-white transition-colors">
                {track.title}
              </h3>
              <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-4">
                {track.description}
              </p>
              <a
                href={`https://www.youtube.com/watch?v=${track.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GlitchButton className="text-sm py-2 px-4">
                  <ExternalLink size={14} className="inline mr-2" />
                  Дивитися на YouTube
                </GlitchButton>
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-16 text-center"
      >
        <a
          href="https://www.youtube.com/@gathering-of-the-fallen"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GlitchButton className="text-lg py-4 px-8 border-secondary text-secondary hover:bg-secondary/20 hover:border-secondary">
            <ExternalLink size={18} className="inline mr-2" />
            Всі треки на YouTube
          </GlitchButton>
        </a>
      </motion.div>
    </motion.div>
  );
}
