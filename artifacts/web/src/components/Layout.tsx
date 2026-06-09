import { Link, useLocation } from "wouter";
import { FallingAsh } from "./FallingAsh";
import { SecretLevel } from "./SecretLevel";
import { GlitchText } from "./GlitchText";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useT } from "@/i18n/LanguageContext";
import { useCart } from "@/hooks/useCart";
import { CartDrawer } from "./CartDrawer";
import { ShoppingCart } from "lucide-react";
import logoImg from "@assets/logo_1776018973004.png";
import bgHome from "@assets/f696c6bc-1e83-49d8-a36a-90d5c6251f08_1781045951908.png";
import bgAbout from "@assets/3f3d238a-b813-45ed-b7ef-48eed199098c_1781048063605.png";
import bgMusic from "@assets/4ca4b9e4-f8d5-4bae-af3c-11137c6e2398_1781048063605.png";
import bgMerch from "@assets/75ea4f64-8652-4cd1-bcfc-95bee264e9d5_1781048063606.png";
import bgContacts from "@assets/772beca9-400c-4f53-8e13-47c71cdcb65a_1781048063606.png";

const PAGE_BACKGROUNDS: Record<string, string> = {
  "/": bgHome,
  "/about": bgAbout,
  "/music": bgMusic,
  "/merch": bgMerch,
  "/contacts": bgContacts,
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { t } = useT();
  const { count: cartCount, open: openCart } = useCart();
  const bg = PAGE_BACKGROUNDS[location] ?? bgHome;

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

      <FallingAsh />
      <SecretLevel />

      <div className="relative flex flex-col min-h-screen text-foreground" style={{ zIndex: 2 }}>
        <header className="sleepy sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-primary/20" style={{ boxShadow: "0 0 20px rgba(139,0,0,0.3), 0 0 40px rgba(255,69,0,0.1)" }}>
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
                    className={`sleepy relative inline-flex items-center gap-1.5 transition-colors hover:text-primary ${location === link.href ? "text-primary border-b border-primary" : "text-muted-foreground"}`}
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
              <button
                type="button"
                onClick={openCart}
                aria-label={`Кошик (${cartCount})`}
                className="sleepy apoc-card relative inline-flex items-center gap-2 px-3 py-2 text-white/70 hover:text-[#00f0ff] transition-colors"
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
              <a href="https://www.instagram.com/gatheringofthefallen" target="_blank" rel="noopener noreferrer" className="sleepy apoc-card px-3 py-1.5 text-white/50 hover:text-primary transition-colors" style={{ borderRadius: "10px" }}>
                Instagram
              </a>
              <a href="https://www.tiktok.com/@gatheringofthefallen" target="_blank" rel="noopener noreferrer" className="sleepy apoc-card px-3 py-1.5 text-white/50 hover:text-primary transition-colors" style={{ borderRadius: "10px" }}>
                TikTok
              </a>
              <a href="https://www.youtube.com/@gathering-of-the-fallen" target="_blank" rel="noopener noreferrer" className="sleepy apoc-card px-3 py-1.5 text-white/50 hover:text-primary transition-colors" style={{ borderRadius: "10px" }}>
                YouTube
              </a>
              <a href="https://www.facebook.com/share/1BJU7ec7ft/" target="_blank" rel="noopener noreferrer" className="sleepy apoc-card px-3 py-1.5 text-white/50 hover:text-primary transition-colors" style={{ borderRadius: "10px" }}>
                Facebook
              </a>
              <a href="https://open.spotify.com/artist/gatheringofthefallen" target="_blank" rel="noopener noreferrer" className="sleepy apoc-card px-3 py-1.5 text-white/50 hover:text-secondary transition-colors" style={{ borderRadius: "10px" }}>
                Spotify
              </a>
              <a href="https://music.apple.com/artist/gatheringofthefallen" target="_blank" rel="noopener noreferrer" className="sleepy apoc-card px-3 py-1.5 text-white/50 hover:text-secondary transition-colors" style={{ borderRadius: "10px" }}>
                Apple Music
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
