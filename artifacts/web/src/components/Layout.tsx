import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { FallingAsh } from "./FallingAsh";
import { SecretLevel } from "./SecretLevel";
import { GlitchText } from "./GlitchText";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useT } from "@/i18n/LanguageContext";
import { useCart } from "@/hooks/useCart";
import { CartDrawer } from "./CartDrawer";
import { ShoppingCart } from "lucide-react";
import { HeroSequence } from "./HeroSequence";
import logoImg from "@assets/logo_1776018973004.png";
import bgHome from "@/assets/home-background.png";
import bgAbout from "@assets/3f3d238a-b813-45ed-b7ef-48eed199098c_1781048063605.png";
import bgMusic from "@assets/4ca4b9e4-f8d5-4bae-af3c-11137c6e2398_1781048063605.png";
import bgMerch from "@assets/75ea4f64-8652-4cd1-bcfc-95bee264e9d5_1781048063606.png";
import bgContacts from "@assets/772beca9-400c-4f53-8e13-47c71cdcb65a_1781048063606.png";
import gameIcon from "@/assets/game-icon.png";

const PAGE_BACKGROUNDS: Record<string, string> = {
  "/": bgHome,
  "/about": bgAbout,
  "/music": bgMusic,
  "/merch": bgMerch,
  "/contacts": bgContacts,
};

function useDesktopHeroEnabled(): boolean {
  const [enabled, setEnabled] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const update = () => setEnabled(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return enabled;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { t } = useT();
  const { count: cartCount, open: openCart } = useCart();
  const bg = PAGE_BACKGROUNDS[location] ?? bgHome;
  const heroEnabled = useDesktopHeroEnabled();

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/about", label: t("nav.about") },
    { href: "/music", label: t("nav.music") },
    { href: "/merch", label: t("nav.merch") },
    { href: "/contacts", label: t("nav.contacts") },
  ];

  return (
    <div className="relative min-h-screen">
      <img
        key={location}
        src={bg}
        alt=""
        aria-hidden="true"
        className="page-bg fixed inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />

      <div
        className="fixed inset-0"
        style={{
          zIndex: 1,
          background:
            'radial-gradient(ellipse at 50% 38%, rgba(5,5,12,0.12) 0%, rgba(8,5,20,0.4) 70%, rgba(4,4,10,0.66) 100%)',
        }}
      />

      {location === "/" && heroEnabled && (
        <HeroSequence className="pointer-events-none fixed inset-x-0 top-0 z-[1] h-svh" />
      )}

      <FallingAsh />
      <SecretLevel />
      <Link
        href="/authors-world"
        aria-label="Інший світ — світ авторів"
        title="Інший світ — світ авторів"
        className="fixed right-[6.5rem] top-48 z-50 block h-24 w-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] focus-visible:ring-offset-2 focus-visible:ring-offset-black md:right-[8.5rem] md:top-24 md:h-32 md:w-24"
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 5 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          style={{ transformOrigin: "top right" }}
          className={`group relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[18px] border-2 px-1 text-center transition-colors duration-500 ${
            location === "/authors-world"
              ? "border-[#00f0ff] bg-[#081c26]/90 text-white shadow-[0_0_28px_rgba(0,240,255,0.65)]"
              : "border-[#00f0ff]/60 bg-[#07131b]/90 text-[#8ceeff] shadow-[0_0_15px_rgba(0,240,255,0.38)] hover:border-white hover:bg-[#0b2833] hover:text-white hover:shadow-[0_0_30px_rgba(0,240,255,0.7)]"
          }`}
        >
          <span aria-hidden="true" className="pointer-events-none absolute inset-2 border border-[#00f0ff]/30" />
          <span aria-hidden="true" className="pointer-events-none absolute -inset-8 bg-[radial-gradient(circle,rgba(0,240,255,0.2),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <span className="relative z-10 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#b9f7ff]">
            ІНШИЙ
          </span>
          <span className="relative z-10 mt-1 font-creepster text-sm leading-none tracking-[0.12em] text-[#00f0ff] drop-shadow-[0_0_7px_#00f0ff]">
            СВІТ
          </span>
          <span className="relative z-10 mt-2 border-t border-[#00f0ff]/40 pt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-white/70">
            АВТОРИ
          </span>
        </motion.span>
      </Link>
      <Link
        href="/game"
        aria-label={t("nav.game")}
        title={t("nav.game")}
        className="fixed right-4 top-48 z-50 block h-24 w-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7043] focus-visible:ring-offset-2 focus-visible:ring-offset-black md:right-8 md:top-24 md:h-32 md:w-24"
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 5 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          style={{ transformOrigin: "top right" }}
          className={`group relative block h-full w-full overflow-hidden rounded-[18px] border-2 transition-colors duration-500 ${
            location === "/game"
              ? "border-[#ff7043] shadow-[0_0_24px_rgba(255,91,54,0.55)]"
              : "border-[#ff7043]/60 shadow-[0_0_15px_rgba(255,91,54,0.5)] hover:border-[#ffb184] hover:shadow-[0_0_30px_rgba(255,91,54,0.7)]"
          }`}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 bg-[#ff7043]/20 opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-100"
          />
          <img
            src={gameIcon}
            alt={t("nav.game")}
            className="h-full w-full bg-[#050208] object-contain p-0.5 transition-transform duration-700 group-hover:scale-110"
          />
          <span className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/80 to-transparent px-1 pb-2 pt-7 text-center">
            <span className="font-creepster text-sm tracking-[0.14em] text-[#ffb184] drop-shadow-[0_0_6px_#ff7043]">
              {t("nav.game")}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 rounded-[16px] border border-white/10 transition-colors group-hover:border-white/30"
          />
        </motion.span>
      </Link>

      <div className="relative flex flex-col min-h-screen text-foreground" style={{ zIndex: 2 }}>
        <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-primary/20" style={{ boxShadow: "0 0 20px rgba(139,0,0,0.3), 0 0 40px rgba(255,69,0,0.1)" }}>
          <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="glitch-text font-creepster text-xl md:text-2xl text-primary hover:text-white transition-colors tracking-widest">
              GATHERING OF THE FALLEN
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-4 text-sm font-mono uppercase tracking-widest">
              {links.map((link) => {
                const isMerch = link.href === "/merch";
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative inline-flex items-center gap-1.5 transition-colors hover:text-primary ${location === link.href ? "text-primary border-b border-primary" : "text-muted-foreground"}`}
                  >
                    <span className="glitch-text nav-spark hover:scale-105 transition-transform inline-block">{link.label}</span>
                    {isMerch && cartCount > 0 && (
                      <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full bg-secondary/25 border border-secondary/60 text-[10px] leading-none text-secondary shadow-[0_0_10px_rgba(138,43,226,0.65)]">
                        <ShoppingCart size={10} />
                        {cartCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/owner-analytics"
                className="apoc-card inline-flex items-center px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] text-[#ffb49a] transition-colors hover:border-[#ff9b71] hover:bg-[#ff6b35]/15 hover:text-white"
                style={{ borderRadius: "12px" }}
              >
                {t("home.ownerStats")}
              </Link>
              <button
                type="button"
                onClick={openCart}
                aria-label={`Кошик (${cartCount})`}
                className="apoc-card relative inline-flex items-center gap-2 px-3 py-2 text-white/70 hover:text-[#00f0ff] transition-colors"
                style={{ borderRadius: "12px", padding: "10px 14px" }}
              >
                <ShoppingCart size={16} />
                <span className="glitch-text font-mono text-xs uppercase tracking-[0.2em]">Кошик</span>
                {cartCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#8a2be2] border border-[#a855f7] text-[10px] font-mono text-white shadow-[0_0_10px_rgba(138,43,226,0.7)]">
                    {cartCount}
                  </span>
                )}
              </button>
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <main className="flex-1 w-full">
          {children}
        </main>

        <CartDrawer />

        <footer className="border-t border-primary/30 bg-black/50 backdrop-blur-sm py-8 mt-16">
          <div className="container mx-auto px-4 text-center font-mono text-xs text-muted-foreground">
            <p className="glitch-text font-creepster text-lg text-primary mb-4 tracking-widest">GATHERING OF THE FALLEN</p>
            <p className="mb-2">&copy; {new Date().getFullYear()} GATHERING OF THE FALLEN</p>
            <p className="text-secondary/50 mb-6">{t("footer.transmission")}</p>
            <div className="flex flex-wrap justify-center gap-3 mb-4">
              <a href="https://www.instagram.com/gatheringofthefallen" target="_blank" rel="noopener noreferrer" className="apoc-card px-3 py-1.5 text-white/50 hover:text-primary transition-colors" style={{ borderRadius: "10px" }}>
                Instagram
              </a>
              <a href="https://www.tiktok.com/@gatheringofthefallen" target="_blank" rel="noopener noreferrer" className="apoc-card px-3 py-1.5 text-white/50 hover:text-primary transition-colors" style={{ borderRadius: "10px" }}>
                TikTok
              </a>
              <a href="https://www.youtube.com/@gathering-of-the-fallen" target="_blank" rel="noopener noreferrer" className="apoc-card px-3 py-1.5 text-white/50 hover:text-primary transition-colors" style={{ borderRadius: "10px" }}>
                YouTube
              </a>
              <a href="https://www.facebook.com/share/1BJU7ec7ft/" target="_blank" rel="noopener noreferrer" className="apoc-card px-3 py-1.5 text-white/50 hover:text-primary transition-colors" style={{ borderRadius: "10px" }}>
                Facebook
              </a>
              <a href="https://open.spotify.com/artist/gatheringofthefallen" target="_blank" rel="noopener noreferrer" className="apoc-card px-3 py-1.5 text-white/50 hover:text-secondary transition-colors" style={{ borderRadius: "10px" }}>
                Spotify
              </a>
              <a href="https://music.apple.com/artist/gatheringofthefallen" target="_blank" rel="noopener noreferrer" className="apoc-card px-3 py-1.5 text-white/50 hover:text-secondary transition-colors" style={{ borderRadius: "10px" }}>
                Apple Music
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
