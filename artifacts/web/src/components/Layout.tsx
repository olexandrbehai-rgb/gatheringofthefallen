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
import bgAbout from "@assets/generated_images/bg-about.png";
import bgMusic from "@assets/generated_images/bg-music.png";
import bgMerch from "@assets/generated_images/bg-merch.png";
import bgContacts from "@assets/generated_images/bg-contacts.png";

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
        <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-primary/20">
          <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src={logoImg} alt="Gathering Of The Fallen" className="h-12 md:h-14 w-auto neon-glow-img" />
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-4 text-sm font-mono uppercase">
              {links.map((link) => {
                const isMerch = link.href === "/merch";
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative inline-flex items-center gap-1.5 transition-colors hover:text-primary ${location === link.href ? "text-primary border-b border-primary" : "text-muted-foreground"}`}
                  >
                    <GlitchText>{link.label}</GlitchText>
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
                className="relative inline-flex items-center gap-2 px-3 py-2 rounded border border-white/15 text-white/70 hover:text-[#00f0ff] hover:border-[#00f0ff]/60 transition-colors"
              >
                <ShoppingCart size={16} />
                <span className="font-mono text-xs uppercase tracking-[0.2em]">Кошик</span>
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
            <img src={logoImg} alt="GotF" className="h-8 mx-auto mb-4 opacity-50" />
            <p className="mb-2">&copy; {new Date().getFullYear()} GATHERING OF THE FALLEN</p>
            <p className="text-secondary/50 mb-6">{t("footer.transmission")}</p>
            <div className="flex flex-wrap justify-center gap-3 mb-4">
              <a href="https://www.instagram.com/gatheringofthefallen" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-primary transition-colors">
                Instagram
              </a>
              <a href="https://www.tiktok.com/@gatheringofthefallen" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-primary transition-colors">
                TikTok
              </a>
              <a href="https://www.youtube.com/@gathering-of-the-fallen" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-primary transition-colors">
                YouTube
              </a>
              <a href="https://www.facebook.com/share/1BJU7ec7ft/" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-primary transition-colors">
                Facebook
              </a>
              <a href="https://open.spotify.com/artist/gatheringofthefallen" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-secondary transition-colors">
                Spotify
              </a>
              <a href="https://music.apple.com/artist/gatheringofthefallen" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-secondary transition-colors">
                Apple Music
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
