import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { GlitchButton } from "@/components/GlitchButton";

const FEATURED_TRACK = {
  id: "bfbYohcYrnM",
  title: "Вогонь в руках",
  description:
    "Головний сингл нового альбому «!3 Послань». Внутрішня сила, яку ніхто не здатен відібрати. Далеко від дому, під чужим небом — ми тримаємо полум'я українського духу і не дамо йому згаснути.",
};

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
        className="font-mono text-secondary text-center mb-12 text-lg uppercase tracking-widest"
        style={{
          textShadow:
            "0 0 10px rgba(138,43,226,0.8), 0 0 20px rgba(138,43,226,0.4)",
        }}
      >
        Офіційні треки гурту
      </p>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rusted-border bg-black/65 border border-primary/40 backdrop-blur-sm p-6 md:p-10 mb-14 shadow-[0_0_50px_rgba(138,43,226,0.25)]"
      >
        <div className="text-xs md:text-sm uppercase tracking-[0.35em] text-red-400 mb-3 font-mono font-bold text-center">
          НОВИЙ АЛЬБОМ — ВЖЕ У МЕРЕЖІ
        </div>
        <h2
          className="font-creepster text-4xl md:text-6xl text-primary text-center mb-5"
          style={{ textShadow: "0 0 18px rgba(0,240,255,0.55), 0 0 38px rgba(138,43,226,0.5)" }}
        >
          !3 ПОСЛАНЬ
        </h2>
        <p className="font-mono text-white/95 text-center text-base md:text-lg leading-relaxed max-w-3xl mx-auto mb-8">
          !3 Послань — це музичний маніфест, що складається з трьох ключових меседжів для тих, хто вижив у руїнах старого світу. Це голос нового племені живих.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
          <div className="aspect-video w-full relative rusted-border overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${FEATURED_TRACK.id}`}
              title={FEATURED_TRACK.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[11px] uppercase tracking-[0.3em] text-red-300 font-mono mb-2">
              Головний сингл альбому
            </div>
            <h3 className="font-creepster text-3xl md:text-4xl text-primary mb-4">
              {FEATURED_TRACK.title}
            </h3>
            <p className="font-mono text-sm md:text-base text-white/90 leading-relaxed mb-5">
              {FEATURED_TRACK.description}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`https://www.youtube.com/watch?v=${FEATURED_TRACK.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GlitchButton className="text-sm py-2 px-4">
                  <ExternalLink size={14} className="inline mr-2" />
                  Дивитися кліп
                </GlitchButton>
              </a>
              <a
                href="https://music.youtube.com/channel/UCJNjRvO6Nce6qExLl2hFuAw"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GlitchButton className="text-sm py-2 px-4 border-secondary text-secondary hover:bg-secondary/20 hover:border-secondary">
                  <ExternalLink size={14} className="inline mr-2" />
                  Слухати в YouTube Music
                </GlitchButton>
              </a>
            </div>
          </div>
        </div>
      </motion.section>

      <h2 className="font-creepster text-3xl md:text-4xl text-primary mb-8 border-b border-primary/20 pb-3">
        Інші треки
      </h2>

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
