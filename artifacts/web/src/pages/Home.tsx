import { motion } from "framer-motion";
import { Link } from "wouter";
import { GlitchButton } from "@/components/GlitchButton";
import logoImg from "@assets/logo_1776019192682.jpg";
import groupImg from "@assets/Група_1777383007687.png";
import oleksandrImg from "@assets/Oleksandr_1777381963172.png";
import merchAllImg from "@assets/photo_2026-03-19_11-20-07_1776018973005.jpg";

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-24">
        <motion.img
          src={logoImg}
          alt="Gathering Of The Fallen"
          className="w-full max-w-3xl mx-auto mb-10 mix-blend-screen neon-glow-img-strong"
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
          <div className="text-xs uppercase tracking-[0.4em] text-red-300 mb-3 font-mono">НОВИЙ АЛЬБОМ ВИХОДИТЬ НЕЗАБАРОМ!</div>
          <p className="text-white/95 font-mono text-sm md:text-base leading-relaxed">
            Скоро вийде довгоочікуваний новий альбом від Gathering of the Fallen. Темрява збирається. Нове звучання, нові сили, ще глибша безодня. Слідкуйте за оновленнями на сайті та в соцмережах — падіння тільки починається!
          </p>
        </motion.div>

        <motion.p
          className="font-mono text-xl md:text-2xl text-secondary mb-12 uppercase tracking-widest text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ textShadow: '0 0 10px rgba(138,43,226,0.8), 0 0 20px rgba(138,43,226,0.4)' }}
        >
          З руїн цивілізації. З попелу — вічність.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link href="/music">
            <GlitchButton className="text-lg py-4 px-8 w-full sm:w-auto">
              Слухати музику
            </GlitchButton>
          </Link>
          <Link href="/merch">
            <GlitchButton className="text-lg py-4 px-8 w-full sm:w-auto border-secondary text-secondary hover:bg-secondary/20 hover:border-secondary">
              Перейти до мерчу
            </GlitchButton>
          </Link>
        </motion.div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="font-creepster text-4xl text-primary mb-8 border-b border-primary/20 pb-4 text-center">Гурт — Новий склад 2026</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="rusted-border overflow-hidden group">
            <img
              src={groupImg}
              alt="Новий склад Gathering Of The Fallen у фіолетово-синіх неонових руїнах"
              loading="lazy"
              className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="rusted-border overflow-hidden group">
            <img
              src={oleksandrImg}
              alt="Олександр, засновник гурту, з гітарою на головній сцені"
              loading="lazy"
              className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <h2 className="font-creepster text-4xl text-primary mb-8 border-b border-primary/20 pb-4">Останні релізи</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Із Попелу", type: "SINGLE", date: "2025" },
            { title: "Молодість", type: "SINGLE", date: "2025" },
            { title: "Емігрант", type: "SINGLE", date: "2025" }
          ].map((release, i) => (
            <Link key={i} href="/music" className="block">
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="rusted-border bg-black/40 backdrop-blur-sm p-6 hover:bg-black/50 transition-colors group cursor-pointer h-full"
              >
                <div className="text-xs text-secondary font-mono mb-2">{release.type} // {release.date}</div>
                <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">{release.title}</h3>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <h2 className="font-creepster text-4xl text-primary mb-8 border-b border-primary/20 pb-4 text-center">Наш мерч</h2>
        <Link href="/merch" className="block">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rusted-border overflow-hidden group cursor-pointer"
          >
            <img
              src={merchAllImg}
              alt="Мерч Gathering Of The Fallen"
              loading="lazy"
              className="w-full h-auto object-cover group-hover:brightness-110 transition-all duration-500"
            />
          </motion.div>
        </Link>
      </section>
    </motion.div>
  );
}
