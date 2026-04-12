import { Link, useLocation } from "wouter";
import { AnimatedFog } from "./AnimatedFog";
import { CRTScanline } from "./CRTScanline";
import { SecretLevel } from "./SecretLevel";
import { GlitchText } from "./GlitchText";

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
      <AnimatedFog />
      <CRTScanline />
      <SecretLevel />
      
      <div className="min-h-screen text-foreground flex flex-col relative z-10">
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-primary/20">
          <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="font-creepster text-2xl md:text-3xl text-primary neon-pulse hover:text-white transition-colors">
              GATHERING OF THE FALLEN
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
            <p className="mb-2">© {new Date().getFullYear()} GATHERING OF THE FALLEN</p>
            <p className="text-secondary/50">TRANSMISSION ENCRYPTED</p>
          </div>
        </footer>
      </div>
    </>
  );
}
