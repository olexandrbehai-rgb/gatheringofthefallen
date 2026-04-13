import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { GlitchButton } from "@/components/GlitchButton";

const SONGS = [
  {
    title: "Із Попелу (Through the Ashes)",
    youtubeId: "pGHn8UmSeVw",
    desc: "Ми згоріли, але встали. Ця пісня — про кожного українця, який втратив все і піднявся заново. Попіл минулого стає фундаментом для нового життя. Ми не зламані — ми загартовані вогнем.",
  },
  {
    title: "Молодість",
    youtubeId: "YGqN3dVWBqg",
    desc: "Ті вулиці, ті обличчя, той сміх... Молодість, яку ми залишили вдома. Еміграція забрала нас далеко, але спогади — це нитка, яка тримає нас. Пісня для кожного, хто пам'ятає, як пахне рідне місто.",
  },
  {
    title: "Емігрант",
    youtubeId: "2kdtj1rwS5w",
    desc: "Серце тут, душа — там. Пісня про тих, хто живе між двома світами. Ми — емігранти, але ми не загубились. Ми несемо Україну всюди, куди ступає наша нога. Біль розлуки і сила волі — в кожному слові.",
  },
  {
    title: "Вогонь В Руках",
    youtubeId: "bfbYohcYrnM",
    desc: "Вогонь у руках — це дух, який не гасне. Пісня про внутрішню силу, яку ніхто не здатен відібрати. Далеко від дому, під чужим небом, ми тримаємо полум'я і ведемо за собою тих, хто ще шукає дорогу.",
  },
  {
    title: "Реквієм Народу",
    youtubeId: "hboWQxvrau8",
    desc: "Пам'ять про тих, хто не дійшов. Реквієм для нашого народу, який пройшов через століття випробувань і не зламався. Ця пісня — наш поклон кожному, хто боровся і боротиметься за Україну.",
  },
  {
    title: "Пустеля Душ",
    youtubeId: "EiUXYLow4v8",
    desc: "Бувають дні, коли всередині — пустеля. Коли тиша еміграції давить, а рідних голосів не чути. Ця пісня — про ті моменти, коли лише музика повертає дощ у висохлу душу.",
  },
  {
    title: "Несу",
    youtubeId: "2zY3ABqlVYI",
    desc: "Кожен емігрант несе свій тягар — біль, надію, відповідальність за тих, хто залишився. Ми несемо і не скаржимось. Бо ми — українці, і наші плечі витримують все.",
  },
  {
    title: "Крізь уламки і Дим",
    youtubeId: "f_KBbl_kK4A",
    desc: "Крізь війни, кризи, еміграцію — ми йдемо вперед. Уламки старого життя під ногами, дим невизначеності попереду, але крок — завжди вперед. Пісня про незупинну ходу сильних людей.",
  },
  {
    title: "Кобзар",
    youtubeId: "8lSH05b_iCM",
    desc: "Кобзар — вічний голос України. Як колись кобзарі несли правду народу, так і ми несемо українську пісню далеко від дому. Спадок Шевченка в рок-звучанні — для нового покоління українців по всьому світу.",
  },
  {
    title: "Залізний Спадок",
    youtubeId: "J2HkPII236E",
    desc: "Від наших дідів — залізна воля. Від наших батьків — незламний характер. Це наш спадок, і ми несемо його з гордістю. Залізний спадок — це те, що тримає українця на ногах, де б він не був.",
  },
  {
    title: "Rock Opera",
    youtubeId: "7ABVER4M8Tk",
    desc: "Масштабна рок-опера про долю, боротьбу і перемогу людського духу. Епічне звучання, що поєднує всі теми гурту — еміграцію, силу волі, любов до Батьківщини та незламність українського характеру.",
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
        Кожна пісня — голос українського духу
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

            <div className="flex flex-col md:flex-row">
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

              <div className="p-6 flex flex-col justify-center flex-1">
                <h3 className="font-creepster text-3xl md:text-4xl text-white mb-4 group-hover:text-primary transition-colors">
                  {song.title}
                </h3>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed border-l-2 border-secondary/30 pl-4 py-2 mb-4">
                  {song.desc}
                </p>
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
