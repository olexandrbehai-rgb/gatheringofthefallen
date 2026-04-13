import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { GlitchButton } from "@/components/GlitchButton";

const TRACKS = [
  {
    id: "pGHn8UmSeVw",
    title: "Through the Ashes (Із Попелу)",
    description: "Ми згоріли, але встали. Попіл минулого — це фундамент нового. Пісня про кожного українця, який піднявся після падіння і йде далі з вогнем у серці.",
  },
  {
    id: "YGqN3dVWBqg",
    title: "Молодість",
    description: "Спогади про рідні вулиці, про тих, кого залишили. Молодість, яка назавжди лишилась в Україні — але живе в кожному акорді цієї пісні.",
  },
  {
    id: "2kdtj1rwS5w",
    title: "Емігрант",
    description: "Серце тут, душа — там. Пісня про тих, хто живе між двома світами, несучи Україну всюди, куди забирає доля. Біль розлуки і незламна воля.",
  },
  {
    id: "hboWQxvrau8",
    title: "Реквієм Народу",
    description: "Пам'ять про тих, хто боровся і не здався. Реквієм для народу, який пройшов через століття випробувань — і не зламався. Наш поклон кожному борцю.",
  },
  {
    id: "EiUXYLow4v8",
    title: "Пустеля Душ",
    description: "Дні, коли всередині — тиша і пустота. Коли рідних голосів не чути за тисячі кілометрів. Лише музика здатна повернути дощ у висохлу душу емігранта.",
  },
  {
    id: "bfbYohcYrnM",
    title: "Вогонь В Руках",
    description: "Внутрішня сила, яку ніхто не здатен відібрати. Далеко від дому, під чужим небом — ми тримаємо полум'я українського духу і не дамо йому згаснути.",
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
