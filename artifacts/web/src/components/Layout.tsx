import { Link, useLocation } from "wouter";
import { AnimatedFog } from "./AnimatedFog";
import { CRTScanline } from "./CRTScanline";
import { SecretLevel } from "./SecretLevel";
import { GlitchText } from "./GlitchText";
import logoImg from "@assets/logo_1776018973004.png";
import heroBg from "@assets/hero-bg.png_1776018973003.png";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Головна" },
    { href: "/about", label: "Про гурт" },
    { href: "/music", label: "Музика" },
    { href: "/songs", label: "Пісні" },
    { href: "/merch", label: "Мерч" },
    { href: "/forge", label: "Кузня" },
    { href: "/contacts", label: "Контакти" },
  ];

  return (
    <>
      <div 
        className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="fixed inset-0 z-[-1] bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
      <AnimatedFog />
      <CRTScanline />
      <SecretLevel />
      
      <div className="min-h-screen text-foreground flex flex-col relative z-10">
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-primary/20">
          <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src={logoImg} alt="Gathering Of The Fallen" className="h-12 md:h-14 w-auto neon-glow-img" />
            </Link>
            <nav className="flex flex-wrap justify-center gap-4 text-sm font-mono uppercase">
              {links.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`transition-colors hover:text-primary ${location === link.href ? "text-primary border-b border-primary" : "text-muted-foreground"}`}
                >
                  <GlitchText>{link.label}</GlitchText>
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full">
          {children}
        </main>

        <footer className="border-t border-primary/30 bg-[#050505] py-8 mt-16">
          <div className="container mx-auto px-4 text-center font-mono text-xs text-muted-foreground">
            <img src={logoImg} alt="GotF" className="h-8 mx-auto mb-4 opacity-50" />
            <p className="mb-2">&copy; {new Date().getFullYear()} GATHERING OF THE FALLEN</p>
            <p className="text-secondary/50">TRANSMISSION ENCRYPTED</p>
          </div>
        </footer>
      </div>
    </>
  );
}
