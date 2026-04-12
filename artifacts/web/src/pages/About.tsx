import { motion } from "framer-motion";
import gurtImg from "@assets/гурт_1776018973007.jpg";
import gurt2Img from "@assets/гурт_2_1776018973007.jpg";

export default function About() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-12 md:py-24 max-w-5xl"
    >
      <h1 className="font-creepster text-5xl md:text-7xl text-primary mb-12 text-center">ПРО ГУРТ</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <div className="rusted-border p-2 bg-black/30 backdrop-blur-sm overflow-hidden group">
          <img 
            src={gurtImg} 
            alt="Gathering Of The Fallen на сцені" 
            loading="lazy"
            className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="rusted-border p-2 bg-black/30 backdrop-blur-sm overflow-hidden group">
          <img 
            src={gurt2Img} 
            alt="Gathering Of The Fallen" 
            loading="lazy"
            className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>
      
      <div className="space-y-12 font-mono text-lg text-muted-foreground leading-relaxed">
        <div className="rusted-border bg-black/50 backdrop-blur-sm p-8 relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-secondary"></div>
          <p className="text-xl md:text-2xl text-white font-bold italic pl-4">
            "У світі, який упав, ми — Gathering Of The Fallen — збираємо полеглих. Наша музика — це крик крізь руїни, кришталеві акорди, що піднімаються з попелу старого світу. Ми поєднуємо сирі людські емоції, історії та постапокаліптичний рок/метал. Приєднуйся до падших."
          </p>
        </div>

        <div className="bg-black/30 backdrop-blur-sm p-6 rounded">
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

        <div className="bg-black/30 backdrop-blur-sm p-6 rounded">
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

        <div className="bg-black/30 backdrop-blur-sm p-6 rounded">
          <h2 className="text-primary text-2xl mb-4 uppercase tracking-widest border-b border-primary/20 pb-2">
            &gt; Архівний запис 03: Місія
          </h2>
          <p className="mb-4">
            Gathering Of The Fallen — це не просто гурт. Це рух. Ми збираємо тих, хто впав, і даємо їм голос. Кожна пісня — це маніфест виживання, кожен концерт — це доказ того, що мистецтво сильніше за руйнування.
          </p>
          <p>
            Ми — голос тих, хто залишився серед руїн. Наша музика — це гімн виживання, крик із темряви, що розриває тишу зруйнованого світу.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
