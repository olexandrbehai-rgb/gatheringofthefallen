import { motion } from "framer-motion";
import { Link } from "wouter";
import { GlitchButton } from "@/components/GlitchButton";
import { useT } from "@/i18n/LanguageContext";
import logoVideo from "@assets/grok-video-4e191f5f-3c1c-4e03-97ea-bc727051f844_1778193049750.mp4";
import lineup1Img from "@assets/a33ec048-5ffc-400a-8499-f0246ed136d2_1779324411927.png";
import lineup2Img from "@assets/photo_2026-06-07_20-29-09_1781050027752.jpg";
import lineup3Img from "@assets/grok-image-3ba37ea6-9c2c-42f3-93a1-0da705b2bdc9_1779324411927.png";
import merchTshirt1 from "@assets/1backt-shirt_1779322287600.png";
import merchTshirt2 from "@assets/2frontt-shirt_1779322287600.png";
import merchTshirt3 from "@assets/3frontt-shirt_1779322287600.png";
import merchHoodie4 from "@assets/4backhoodie_1779322287601.png";
import merchHoodie5 from "@assets/5backhoodie_1779322287601.png";

const lineupImages = [lineup1Img, lineup2Img, lineup3Img];

type Release = { title: string; type: string; date: string };

export default function Home() {
  const { t, tArr } = useT();
  const releases = tArr<Release>("home.releases");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-24">
        <motion.video
          src={logoVideo}
          poster={lineup1Img}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-label="Герб гурту Gathering Of The Fallen"
          className="w-full max-w-3xl mx-auto mb-10 mix-blend-screen neon-glow-img-strong"
          style={{
            WebkitMaskImage:
              "radial-gradient(ellipse 42% 55% at center, #000 20%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.25) 78%, transparent 100%)",
            maskImage:
              "radial-gradient(ellipse 42% 55% at center, #000 20%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.25) 78%, transparent 100%)",
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        <motion.div
          className="w-full max-w-4xl mb-12 apoc-card bg-black/70 border border-primary/40 backdrop-blur-sm p-6 md:p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="text-xs md:text-sm uppercase tracking-[0.35em] text-red-400 mb-3 font-mono font-bold">
            {t("home.albumBadge")}
          </div>
          <h1 className="glitch-text font-creepster text-3xl md:text-5xl text-white mb-4" style={{ textShadow: '0 0 28px rgba(138,43,226,0.55), 0 0 4px rgba(255,255,255,0.15)' }}>
            {t("home.albumTitle")}
          </h1>
          <p className="text-white/95 font-mono text-sm md:text-base leading-relaxed mb-5">
            {t("home.albumDesc")}
          </p>
          <Link href="/music">
            <GlitchButton className="text-sm py-2 px-5">
              {t("home.listenAlbum")}
            </GlitchButton>
          </Link>
        </motion.div>

        <motion.p
          className="glitch-text font-creepster text-2xl md:text-4xl text-primary mb-6 uppercase tracking-widest text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ textShadow: '0 0 15px rgba(0,240,255,0.7), 0 0 30px rgba(138,43,226,0.5)' }}
        >
          {t("home.slogan")}
        </motion.p>

        <motion.p
          className="font-mono text-sm md:text-base text-white/80 max-w-2xl text-center mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          {t("home.bandDesc")}
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link href="/music">
            <GlitchButton className="text-lg py-4 px-8 w-full sm:w-auto">
              {t("home.listenMusic")}
            </GlitchButton>
          </Link>
          <Link href="/merch">
            <GlitchButton className="text-lg py-4 px-8 w-full sm:w-auto border-secondary text-secondary hover:bg-secondary/20 hover:border-secondary">
              {t("home.goMerch")}
            </GlitchButton>
          </Link>
        </motion.div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="glitch-text font-creepster text-4xl md:text-5xl text-primary mb-8 border-b border-primary/20 pb-4 text-center">{t("home.bandHeading")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {lineupImages.map((src, i) => (
            <div key={src} className={`apoc-card overflow-hidden group ${i === 0 ? "no-scanlines md:col-span-1 md:row-span-2" : ""}`}>
              <img
                src={src}
                alt={t("home.groupAlt")}
                loading="lazy"
                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${i === 0 ? "aspect-[4/5]" : "aspect-[4/5]"}`}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <h2 className="glitch-text font-creepster text-4xl text-primary mb-8 border-b border-primary/20 pb-4">{t("home.latestHeading")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {releases.map((release, i) => {
            const featured = i === 0;
            return (
              <Link key={i} href="/music" className="block">
                <motion.div
                  className={`apoc-card backdrop-blur-sm p-6 transition-colors group cursor-pointer h-full ${featured ? "bg-primary/10 border-primary/60 hover:bg-primary/15" : "bg-black/40 hover:bg-black/50"}`}
                >
                  <div className={`text-xs font-mono mb-2 ${featured ? "text-red-300" : "text-secondary"}`}>{release.type} // {release.date}</div>
                  <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">{release.title}</h3>
                  {featured && (
                    <div className="mt-2 text-[10px] uppercase tracking-widest text-primary font-mono">{t("home.mainTrack")}</div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <h2 className="glitch-text font-creepster text-4xl text-primary mb-8 border-b border-primary/20 pb-4 text-center">{t("home.merchHeading")}</h2>

        <svg width="0" height="0" className="absolute" aria-hidden>
          <defs>
            <filter id="gtf-knockout-white-home" colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="1 0 0 0 0
                        0 1 0 0 0
                        0 0 1 0 0
                        -1.4 -1.4 -1.4 0 3.1"
              />
              <feComponentTransfer>
                <feFuncA type="linear" slope="6" intercept="-2.4" />
              </feComponentTransfer>
            </filter>
          </defs>
        </svg>

        <Link href="/merch" className="block group">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {[merchTshirt1, merchTshirt2, merchTshirt3, merchHoodie4, merchHoodie5].map((src, i) => (
              <motion.div
                key={i}
                className="apoc-card relative aspect-[3/4] overflow-hidden border border-white/10 group-hover:border-[#00f0ff]/40 transition-colors"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 45%, #2a1240 0%, #160826 38%, #0a0414 70%, #050208 100%)",
                }}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 40%, rgba(138,43,226,0.28) 0%, rgba(0,240,255,0.06) 35%, transparent 65%)",
                    mixBlendMode: "screen",
                  }}
                />
                <img
                  src={src}
                  alt={t("home.merchAlt")}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  style={{ filter: "url(#gtf-knockout-white-home)" }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.55) 0%, transparent 55%)",
                  }}
                />
              </motion.div>
            ))}
          </div>
        </Link>
      </section>
    </motion.div>
  );
}
