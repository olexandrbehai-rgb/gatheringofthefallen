import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { FallingAsh } from "./FallingAsh";
import { SecretLevel } from "./SecretLevel";
import { GlitchText } from "./GlitchText";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useT } from "@/i18n/LanguageContext";
import { AUTHORS_WORLD_COPY } from "@/i18n/authorsWorld";
import { useCart } from "@/hooks/useCart";
import { useAmbientMusic } from "@/hooks/useAmbientMusic";
import { CartDrawer } from "./CartDrawer";
import { ArrowLeft, LogIn, LogOut, Music2, ShoppingCart, UserRound, Volume2, VolumeX } from "lucide-react";
import { HeroSequence } from "./HeroSequence";
import { Domovyk } from "./author-world/Domovyk";
import { AmbientCreature } from "./AmbientCreature";
import { useClerk, useUser } from "@clerk/react";
import logoImg from "@assets/logo_1776018973004.png";
import bgHome from "@/assets/home-background.png";
import bgAbout from "@assets/3f3d238a-b813-45ed-b7ef-48eed199098c_1781048063605.png";
import bgMusic from "@assets/4ca4b9e4-f8d5-4bae-af3c-11137c6e2398_1781048063605.png";
import bgMerch from "@assets/75ea4f64-8652-4cd1-bcfc-95bee264e9d5_1781048063606.png";
import bgContacts from "@assets/772beca9-400c-4f53-8e13-47c71cdcb65a_1781048063606.png";
import gameIcon from "@/assets/game-icon.png";

const bgAuthorsWorld = `${import.meta.env.BASE_URL}authors-world-background.png`;

const PAGE_BACKGROUNDS: Record<string, string> = {
  "/": bgHome,
  "/about": bgAbout,
  "/music": bgMusic,
  "/merch": bgMerch,
  "/contacts": bgContacts,
  "/authors-world": bgAuthorsWorld,
};

const authorsWorldButtonBackground = `${import.meta.env.BASE_URL}authors-world-button-background.png`;

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

function AuthControls() {
  const { lang } = useT();
  const copy = AUTHORS_WORLD_COPY[lang].header;
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8ceeff]/60">{copy.checking}</span>;
  }

  if (!isSignedIn) {
    return (
      <Link href="/sign-in" className="neon-control inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#b9f7ff]">
        <LogIn className="h-3.5 w-3.5" aria-hidden="true" /> {copy.signIn}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/authors-world?edit=1" className="neon-control inline-flex max-w-40 items-center gap-1.5 truncate px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#b9f7ff]" title={user?.primaryEmailAddress?.emailAddress ?? copy.myPortal}>
        <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {copy.myPortal}
      </Link>
      <button type="button" onClick={() => void signOut({ redirectUrl: "/" })} className="neon-control inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#ffb184]">
        <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> {copy.signOut}
      </button>
    </div>
  );
}

export function Layout({ children, authEnabled = true }: { children: React.ReactNode; authEnabled?: boolean }) {
  const [location, setLocation] = useLocation();
  const { t, lang } = useT();
  const authorsWorldCopy = AUTHORS_WORLD_COPY[lang].header;
  const { count: cartCount, open: openCart } = useCart();
  const { enabled, playing, volume, setVolume, toggle, setRouteMuted } = useAmbientMusic();
  const bg = PAGE_BACKGROUNDS[location] ?? bgHome;
  const heroEnabled = useDesktopHeroEnabled();

  useEffect(() => {
    setRouteMuted(location === "/game");
  }, [location, setRouteMuted]);

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
      {location === "/authors-world" && <Domovyk compact={typeof window !== "undefined" && window.innerWidth <= 640} />}

      {location === "/" && heroEnabled && (
        <HeroSequence className="pointer-events-none fixed inset-x-0 top-0 z-[1] h-svh" />
      )}
      {location === "/authors-world" && (
        <AmbientCreature
          className="bottom-[2vh] right-[2vw] z-[1] h-[min(54vw,290px)] w-[min(54vw,290px)] sm:bottom-[3vh] sm:right-[4vw] sm:h-[min(34vw,440px)] sm:w-[min(34vw,440px)]"
        />
      )}

      <FallingAsh />
      <SecretLevel />
      <Link
        href="/authors-world"
        aria-label={`${authorsWorldCopy.other} ${authorsWorldCopy.world} — ${authorsWorldCopy.authors}`}
        title={`${authorsWorldCopy.other} ${authorsWorldCopy.world} — ${authorsWorldCopy.authors}`}
         className={`fixed right-[7.25rem] top-48 z-50 h-24 w-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] focus-visible:ring-offset-2 focus-visible:ring-offset-black md:right-[9.25rem] md:top-24 md:h-32 md:w-24 ${location === "/game" ? "hidden" : location === "/authors-world" ? "hidden md:block" : "block"}`}
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
           whileHover={{ scale: 1.08 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          style={{ transformOrigin: "top right" }}
          className={`group relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[18px] border-2 px-1 text-center transition-colors duration-500 ${
            location === "/authors-world"
              ? "border-[#00f0ff] bg-[#081c26]/90 text-white shadow-[0_0_28px_rgba(0,240,255,0.65)]"
              : "border-[#00f0ff]/60 bg-[#07131b]/90 text-[#8ceeff] shadow-[0_0_15px_rgba(0,240,255,0.38)] hover:border-white hover:bg-[#0b2833] hover:text-white hover:shadow-[0_0_30px_rgba(0,240,255,0.7)]"
          }`}
        >
          <span aria-hidden="true" className="pointer-events-none absolute inset-2 border border-[#00f0ff]/30" />
          <img
            src={authorsWorldButtonBackground}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-fill opacity-75 transition-transform duration-700 group-hover:scale-110"
          />
          <span aria-hidden="true" className="pointer-events-none absolute -inset-8 bg-[radial-gradient(circle,rgba(0,240,255,0.2),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <span className="relative z-10 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#b9f7ff]">
            {authorsWorldCopy.other}
          </span>
          <span className="relative z-10 mt-1 font-creepster text-sm leading-none tracking-[0.12em] text-[#00f0ff] drop-shadow-[0_0_7px_#00f0ff]">
            {authorsWorldCopy.world}
          </span>
          <span className="relative z-10 mt-2 border-t border-[#00f0ff]/40 pt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-white/70">
            {authorsWorldCopy.authors}
          </span>
        </motion.span>
      </Link>
      <Link
        href="/game"
        aria-label={t("nav.game")}
        title={t("nav.game")}
        className={`fixed right-4 top-48 z-50 h-24 w-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7043] focus-visible:ring-offset-2 focus-visible:ring-offset-black md:right-8 md:top-24 md:h-32 md:w-24 ${location === "/game" ? "hidden" : location === "/authors-world" ? "hidden md:block" : "block"}`}
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
           whileHover={{ scale: 1.08 }}
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
          <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3 md:flex-row md:gap-4">
            <Link href="/" className="glitch-text font-creepster text-lg tracking-[0.18em] text-primary transition-colors hover:text-white sm:text-xl md:text-2xl md:tracking-widest">
              GATHERING OF THE FALLEN
            </Link>
            <nav className="order-3 flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] font-mono uppercase tracking-[0.16em] sm:gap-4 sm:text-sm sm:tracking-widest md:order-none md:w-auto">
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
            <div className="flex w-full flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 md:w-auto">
              {location !== "/" && (
                <button
                  type="button"
                  onClick={() => setLocation(location.startsWith("/author/") ? "/authors-world" : "/")}
                  className="neon-control inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/80"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Назад
                </button>
              )}
              {authEnabled && <AuthControls />}
              <Link
                href="/owner-analytics"
                className="neon-control inline-flex items-center px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#ffb49a]"
                style={{ borderRadius: "12px" }}
              >
                {t("home.ownerStats")}
              </Link>
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? "Вимкнути фонову музику" : "Увімкнути фонову музику"}
                title={playing ? "Вимкнути фонову музику" : "Увімкнути фонову музику"}
                className={`neon-control inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${playing ? "text-[#b9f7ff]" : enabled ? "text-white/75" : "text-white/45"}`}
              >
                {playing && volume > 0 ? <Volume2 className="h-3.5 w-3.5" aria-hidden="true" /> : enabled ? <Music2 className="h-3.5 w-3.5" aria-hidden="true" /> : <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />}
                <span className="hidden sm:inline">Музика</span>
              </button>
              <label className="neon-control inline-flex items-center gap-2 px-2.5 py-2 text-[#b9f7ff]" title={`Гучність музики: ${Math.round(volume * 100)}%`}>
                <Volume2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="sr-only">Гучність музики: {Math.round(volume * 100)}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(volume * 100)}
                  onChange={(event) => setVolume(Number(event.target.value) / 100)}
                  aria-label="Гучність музики"
                  className="h-1.5 w-16 cursor-pointer accent-[#00f0ff] sm:w-20"
                />
              </label>
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
