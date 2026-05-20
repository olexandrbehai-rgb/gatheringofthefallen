import { Link } from "wouter";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black px-4 py-20 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0, transparent 2px, #00f0ff 2px, #00f0ff 3px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(138,43,226,0.18),_transparent_70%)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-2xl"
      >
        <motion.h1
          animate={{
            x: [0, -2, 2, -1, 0],
            textShadow: [
              "0 0 30px rgba(0,240,255,0.6), -3px 0 0 rgba(255,0,80,0.7), 3px 0 0 rgba(138,43,226,0.7)",
              "0 0 30px rgba(0,240,255,0.6), 3px 0 0 rgba(255,0,80,0.7), -3px 0 0 rgba(138,43,226,0.7)",
              "0 0 30px rgba(0,240,255,0.6), -3px 0 0 rgba(255,0,80,0.7), 3px 0 0 rgba(138,43,226,0.7)",
            ],
          }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="font-creepster text-[8rem] md:text-[12rem] leading-none text-white"
        >
          404
        </motion.h1>

        <div className="font-mono text-xs uppercase tracking-[0.5em] text-[#8a2be2] mb-4">
          // SIGNAL_LOST //
        </div>

        <h2
          className="font-creepster text-3xl md:text-5xl text-[#00f0ff] mb-6"
          style={{ textShadow: "0 0 18px rgba(0,240,255,0.55), 0 0 38px rgba(138,43,226,0.5)" }}
        >
          Сторінка зникла у попелі
        </h2>

        <p className="font-mono text-sm md:text-base text-white/65 leading-relaxed mb-10">
          Те, що ви шукали, спалили разом із залишками старого світу.
          <br />
          Залишились лише уламки. Спробуйте повернутись на головну.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="group relative overflow-hidden rounded border border-[#8a2be2]/70 bg-black px-6 py-3 font-mono text-sm uppercase tracking-[0.3em] text-[#00f0ff] hover:border-[#00f0ff] hover:text-white hover:shadow-[0_0_22px_rgba(0,240,255,0.55)] transition-all"
          >
            <span className="relative z-10">⟵ Повернутись додому</span>
          </Link>
          <Link
            href="/music"
            className="rounded border border-white/15 bg-black px-6 py-3 font-mono text-sm uppercase tracking-[0.3em] text-white/60 hover:border-[#8a2be2] hover:text-white transition-all"
          >
            Слухати музику
          </Link>
        </div>

        <div className="mt-12 font-mono text-[10px] uppercase tracking-[0.4em] text-white/30">
          ERR_CODE: 0x404 · GATHERING_OF_THE_FALLEN
        </div>
      </motion.div>
    </div>
  );
}
