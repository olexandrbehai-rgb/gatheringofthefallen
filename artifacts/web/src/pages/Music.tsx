import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { GlitchButton } from "@/components/GlitchButton";
import { useT } from "@/i18n/LanguageContext";

const FEATURED_ID = "3Kkywl6MFfw";
const TRACK_IDS = [
  "O-uzMQfY-KI", // Підіймай Вогонь
  "8CjKQohRQwQ", // Чуже Лице
  "jnp7IErWCDs", // Нічний Снайпер
  "NU1SSEoijIk", // Бас і Дим
  "q2fmSRDy8QU", // Блукаючий Козак
  "sm4yVIlE0Oc", // Псалми
  "bfbYohcYrnM", // Вогонь в руках (колишній головний сингл)
  "pGHn8UmSeVw",
  "YGqN3dVWBqg",
  "2kdtj1rwS5w",
  "hboWQxvrau8",
  "EiUXYLow4v8",
];

type Track = { title: string; description: string };

export default function Music() {
  const { t, tArr, tObj } = useT();
  const featured = tObj<Track>("music.featured");
  const tracks = tArr<Track>("music.tracks");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-12 md:py-24 max-w-6xl"
    >
      <h1 className="glitch-text font-creepster text-5xl md:text-7xl text-primary mb-4 text-center">
        {t("music.title")}
      </h1>
      <p
        className="font-mono text-secondary text-center mb-12 text-lg uppercase tracking-widest"
        style={{
          textShadow:
            "0 0 10px rgba(138,43,226,0.8), 0 0 20px rgba(138,43,226,0.4)",
        }}
      >
        {t("music.subtitle")}
      </p>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="apoc-card bg-black/65 border border-primary/40 backdrop-blur-sm p-6 md:p-10 mb-14"
      >
        <div className="text-xs md:text-sm uppercase tracking-[0.35em] text-red-400 mb-3 font-mono font-bold text-center">
          {t("music.newAlbumBadge")}
        </div>
        <h2
          className="glitch-text font-creepster text-4xl md:text-6xl text-white text-center mb-5"
          style={{ textShadow: "0 0 28px rgba(138,43,226,0.55), 0 0 4px rgba(255,255,255,0.15)" }}
        >
          {t("music.albumTitle")}
        </h2>
        <p className="font-mono text-white/95 text-center text-base md:text-lg leading-relaxed max-w-3xl mx-auto mb-8">
          {t("music.albumDesc")}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
          <div className="aspect-video w-full relative hover-image overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${FEATURED_ID}`}
              title={featured.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[11px] uppercase tracking-[0.3em] text-red-300 font-mono mb-2">
              {t("music.mainSingleLabel")}
            </div>
            <h3 className="glitch-text font-creepster text-3xl md:text-4xl text-primary mb-4">
              {featured.title}
            </h3>
            <p className="font-mono text-sm md:text-base text-white/90 leading-relaxed mb-5">
              {featured.description}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`https://www.youtube.com/watch?v=${FEATURED_ID}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GlitchButton className="text-sm py-2 px-4">
                  <ExternalLink size={14} className="inline mr-2" />
                  {t("music.watchClip")}
                </GlitchButton>
              </a>
              <a
                href="https://music.youtube.com/channel/UCJNjRvO6Nce6qExLl2hFuAw"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GlitchButton className="text-sm py-2 px-4 border-secondary text-secondary hover:bg-secondary/20 hover:border-secondary">
                  <ExternalLink size={14} className="inline mr-2" />
                  {t("music.listenYTMusic")}
                </GlitchButton>
              </a>
            </div>
          </div>
        </div>
      </motion.section>

      <h2 className="glitch-text font-creepster text-3xl md:text-4xl text-primary mb-8 border-b border-primary/20 pb-3">
        {t("music.otherTracks")}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {tracks.map((track, i) => {
          const id = TRACK_IDS[i];
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="apoc-card bg-black/40 backdrop-blur-sm overflow-hidden group"
            >
              <div className="aspect-video w-full relative">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${id}`}
                  title={track.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                <h3 className="glitch-text font-creepster text-2xl text-primary mb-3 group-hover:text-white transition-colors">
                  {track.title}
                </h3>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-4">
                  {track.description}
                </p>
                <a
                  href={`https://www.youtube.com/watch?v=${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GlitchButton className="text-sm py-2 px-4">
                    <ExternalLink size={14} className="inline mr-2" />
                    {t("music.watchYouTube")}
                  </GlitchButton>
                </a>
              </div>
            </motion.div>
          );
        })}
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
            {t("music.allOnYouTube")}
          </GlitchButton>
        </a>
      </motion.div>
    </motion.div>
  );
}
