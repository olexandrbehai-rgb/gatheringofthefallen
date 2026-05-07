import { motion } from "framer-motion";
import { Link } from "wouter";
import { GlitchButton } from "@/components/GlitchButton";
import { useT } from "@/i18n/LanguageContext";
import logoVideo from "@assets/grok-video-4e191f5f-3c1c-4e03-97ea-bc727051f844_1778193049750.mp4";
import groupImg from "@assets/Група_1777383007687.png";
import oleksandrImg from "@assets/Oleksandr_1777381963172.png";
import merchAllImg from "@assets/photo_2026-03-19_11-20-07_1776018973005.jpg";

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
          autoPlay
          loop
          muted
          playsInline
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
          className="w-full max-w-4xl mb-12 rusted-border bg-black/70 border border-primary/40 backdrop-blur-sm p-6 md:p-8 text-center shadow-[0_0_40px_rgba(138,43,226,0.25)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="text-xs md:text-sm uppercase tracking-[0.35em] text-red-400 mb-3 font-mono font-bold">
            {t("home.albumBadge")}
          </div>
          <h2 className="font-creepster text-3xl md:text-5xl text-primary mb-4" style={{ textShadow: '0 0 18px rgba(0,240,255,0.55), 0 0 38px rgba(138,43,226,0.5)' }}>
            {t("home.albumTitle")}
          </h2>
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
          className="font-mono text-xl md:text-2xl text-secondary mb-12 uppercase tracking-widest text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ textShadow: '0 0 10px rgba(138,43,226,0.8), 0 0 20px rgba(138,43,226,0.4)' }}
        >
          {t("home.slogan")}
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
        <h2 className="font-creepster text-4xl text-primary mb-8 border-b border-primary/20 pb-4 text-center">{t("home.bandHeading")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="rusted-border overflow-hidden group no-scanlines">
            <img
              src={groupImg}
              alt={t("home.groupAlt")}
              loading="lazy"
              className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="rusted-border overflow-hidden group">
            <img
              src={oleksandrImg}
              alt={t("home.oleksandrAlt")}
              loading="lazy"
              className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <h2 className="font-creepster text-4xl text-primary mb-8 border-b border-primary/20 pb-4">{t("home.latestHeading")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {releases.map((release, i) => {
            const featured = i === 0;
            return (
              <Link key={i} href="/music" className="block">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className={`rusted-border backdrop-blur-sm p-6 transition-colors group cursor-pointer h-full ${featured ? "bg-primary/10 border-primary/60 hover:bg-primary/15" : "bg-black/40 hover:bg-black/50"}`}
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

      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <h2 className="font-creepster text-4xl text-primary mb-8 border-b border-primary/20 pb-4 text-center">{t("home.merchHeading")}</h2>
        <Link href="/merch" className="block">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rusted-border overflow-hidden group cursor-pointer"
          >
            <img
              src={merchAllImg}
              alt={t("home.merchAlt")}
              loading="lazy"
              className="w-full h-auto object-cover group-hover:brightness-110 transition-all duration-500"
            />
          </motion.div>
        </Link>
      </section>
    </motion.div>
  );
}
