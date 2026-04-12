import { motion } from "framer-motion";

const SONGS = [
  {
    title: "Із Попелу",
    desc: "Гімн відродження. Коли все згоріло, залишається лише попіл... і з нього народжується нове. Це пісня про силу духу, що піднімається з руїн."
  },
  {
    title: "Молодість",
    desc: "Спогади про час, коли світ ще стояв. Ностальгія за днями, коли все було попереду, а руїни ще не затьмарили горизонт."
  },
  {
    title: "Емігрант",
    desc: "Історія того, хто залишив батьківщину в пошуках кращого світу. Біль розлуки та надія на нове життя серед чужих руїн."
  },
  {
    title: "Старий Хорон",
    desc: "Легенда про давнього воїна, який охороняє останнє вціліле місто. Його тінь блукає руїнами, захищаючи тих, хто залишився."
  },
  {
    title: "Життя",
    desc: "Філософія існування в зруйнованому світі. Що означає жити, коли все навколо — прах і тіні?"
  },
  {
    title: "Частина мене",
    desc: "Найглибша пісня гурту. Про те, як музика стає частиною душі, як кожна нота — це шматочок серця, залишений серед руїн."
  },
  {
    title: "Забуте Я",
    desc: "Жінка, загублена в первісному лісі, шукає свою забуту ідентичність серед древніх дерев та шепотів пам'яті."
  }
];

export default function Songs() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-12 md:py-24 max-w-6xl"
    >
      <h1 className="font-creepster text-5xl md:text-7xl text-primary mb-12 text-center">ПІСНІ ТА ЛЕГЕНДИ</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {SONGS.map((song, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rusted-border bg-black/40 backdrop-blur-sm p-6 hover:bg-black/60 transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <h3 className="font-creepster text-3xl text-white mb-4 group-hover:text-primary transition-colors">{song.title}</h3>
            <p className="font-mono text-sm text-muted-foreground leading-relaxed border-l-2 border-secondary/30 pl-4 py-2">
              {song.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
