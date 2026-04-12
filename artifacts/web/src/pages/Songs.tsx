import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { GlitchButton } from "@/components/GlitchButton";

const SONGS = [
  {
    title: "Із Попелу (Through the Ashes)",
    youtubeId: "pGHn8UmSeVw",
    desc: "Гімн відродження. Рвані гітари розривають тишу руїн, а потужний вокал піднімає полеглих з попелу. Це пісня про силу, яка народжується після падіння.",
  },
  {
    title: "Молодість",
    youtubeId: "YGqN3dVWBqg",
    desc: "Ностальгічна пісня про час, коли світ ще стояв. Спогади про молодість, яка згоріла в постапокаліптичному вогні.",
  },
  {
    title: "Емігрант",
    youtubeId: "2kdtj1rwS5w",
    desc: "Пісня про вигнанців нового світу. Тиша руїн, біль розлуки і надія знайти новий дім серед зруйнованих хмарочосів.",
  },
  {
    title: "Старий Хорон",
    youtubeId: null,
    desc: "Давній клич предків крізь шум зруйнованого міста. Фольк-метал елемент, який оживає в постапокаліпсисі.",
  },
  {
    title: "Вогонь В Руках",
    youtubeId: "bfbYohcYrnM",
    desc: "Енергійний трек про силу, що горить всередині. Вогонь — це і зброя, і надія. Пісня про тих, хто тримає полум'я, не боячись опіків.",
  },
  {
    title: "Реквієм Народу",
    youtubeId: "hboWQxvrau8",
    desc: "Реквієм для тих, хто впав. Пам'ять народу, що не зламався під тиском долі. Потужна балада про незламність духу.",
  },
  {
    title: "Пустеля Душ",
    youtubeId: "EiUXYLow4v8",
    desc: "Коли внутрішній світ перетворюється на пустелю — лише музика здатна повернути дощ. Філософська подорож у глибини свідомості.",
  },
  {
    title: "Несу",
    youtubeId: "2zY3ABqlVYI",
    desc: "Пісня про тягар, який несе кожен вцілілий. Ноша болю, надії та відповідальності за тих, хто йде поруч крізь руїни.",
  },
  {
    title: "Крізь уламки і Дим",
    youtubeId: "f_KBbl_kK4A",
    desc: "Шлях крізь зруйнований світ. Дим застилає горизонт, уламки хрустять під ногами, але крок — завжди вперед.",
  },
  {
    title: "Життя (Life)",
    youtubeId: "7ABVER4M8Tk",
    desc: "Філософія існування в зруйнованому світі. Що означає жити, коли все навколо — прах і тіні?",
  },
  {
    title: "Кобзар (Kobzar)",
    youtubeId: "8lSH05b_iCM",
    desc: "Образ кобзаря — вічного співця, який несе пам'ять народу крізь руїни. Голос, що не замовкає навіть після кінця світу.",
  },
  {
    title: "Залізний Спадок",
    youtubeId: "J2HkPII236E",
    desc: "Спадщина залізної волі. Коли від предків залишилось лише залізо та незламність, це стає найціннішим скарбом.",
  },
];

export default function Songs() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-12 md:py-24 max-w-6xl"
    >
      <h1 className="font-creepster text-5xl md:text-7xl text-primary mb-4 text-center">
        ПІСНІ ТА ЛЕГЕНДИ
      </h1>
      <p
        className="font-mono text-secondary text-center mb-16 text-lg uppercase tracking-widest"
        style={{
          textShadow:
            "0 0 10px rgba(138,43,226,0.8), 0 0 20px rgba(138,43,226,0.4)",
        }}
      >
        Кожна пісня — легенда зруйнованого світу
      </p>

      <div className="space-y-8">
        {SONGS.map((song, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rusted-border bg-black/40 backdrop-blur-sm overflow-hidden hover:bg-black/60 transition-all duration-300 group relative"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className={`flex flex-col ${song.youtubeId ? "md:flex-row" : ""}`}>
              {song.youtubeId && (
                <div className="md:w-[420px] flex-shrink-0">
                  <div className="aspect-video w-full relative">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${song.youtubeId}`}
                      title={song.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}

              <div className="p-6 flex flex-col justify-center flex-1">
                <h3 className="font-creepster text-3xl md:text-4xl text-white mb-4 group-hover:text-primary transition-colors">
                  {song.title}
                </h3>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed border-l-2 border-secondary/30 pl-4 py-2 mb-4">
                  {song.desc}
                </p>
                {song.youtubeId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${song.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start"
                  >
                    <GlitchButton className="text-sm py-2 px-4">
                      <ExternalLink size={14} className="inline mr-2" />
                      Слухати на YouTube
                    </GlitchButton>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-16 text-center"
      >
        <a
          href="https://www.youtube.com/@gathering-of-the-fallen"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GlitchButton className="text-lg py-4 px-8 border-secondary text-secondary hover:bg-secondary/20 hover:border-secondary">
            <ExternalLink size={18} className="inline mr-2" />
            Всі пісні на YouTube
          </GlitchButton>
        </a>
      </motion.div>
    </motion.div>
  );
}
