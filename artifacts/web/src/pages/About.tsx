import { motion } from "framer-motion";
import bandImage from "@/assets/band-ruins.png";

export default function About() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-12 md:py-24 max-w-4xl"
    >
      <h1 className="font-creepster text-5xl md:text-7xl text-primary mb-12 text-center">ПРО ГУРТ</h1>
      
      <div className="mb-16 rusted-border p-2 bg-black/40">
        <img 
          src={bandImage} 
          alt="Gathering Of The Fallen у руїнах" 
          className="w-full h-auto object-cover opacity-80 filter contrast-125 saturate-50"
        />
      </div>
      
      <div className="space-y-12 font-mono text-lg text-muted-foreground leading-relaxed">
        <div className="rusted-border bg-black/80 p-8 relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-secondary"></div>
          <p className="text-xl md:text-2xl text-white font-bold italic">
            "У світі, який упав, ми — Gathering Of The Fallen — збираємо полеглих. Ми — голос тих, хто залишився серед руїн. Наша музика — це гімн виживання, крик із темряви, що розриває тишу зруйнованого світу."
          </p>
        </div>

        <div>
          <h2 className="text-primary text-2xl mb-4 uppercase tracking-widest border-b border-primary/20 pb-2">
            &gt; Архівний запис 01: Народження
          </h2>
          <p className="mb-4">
            Коли небо стало сірим від попелу, а бетонні джунглі перетворилися на лабіринти смерті, тиша стала нашим найбільшим ворогом. Зібрані з різних куточків зруйнованої України, ми знайшли одне одного завдяки старим радіочастотам.
          </p>
          <p>
            Наші інструменти — це зброя проти забуття. Зібрані з брухту та залишків старих технологій, вони звучать агресивніше, ніж будь-коли. Кожен риф — це відлуння минулого, кожен удар барабана — це серцебиття тих, хто вижив.
          </p>
        </div>

        <div>
          <h2 className="text-primary text-2xl mb-4 uppercase tracking-widest border-b border-primary/20 pb-2">
            &gt; Архівний запис 02: Філософія
          </h2>
          <p className="mb-4">
            Ми не співаємо про надію, яка ніколи не настане. Ми співаємо про реальність. Про біль втрат, про важкість кожного кроку по радіоактивному попелу, і про силу духу, яка дозволяє нам продовжувати йти.
          </p>
          <p>
            Наші концерти — це ритуали. Ми збираємося у вцілілих бункерах, занедбаних заводах та підземних станціях. Для нас музика — це не розвага. Це доказ того, що ми ще живі.
          </p>
        </div>
      </div>
    </motion.div>
  );
}