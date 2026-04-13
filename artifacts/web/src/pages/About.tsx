import { motion } from "framer-motion";
import gurtImg from "@assets/гурт_1776050105441.jpg";
import gurt2Img from "@assets/гурт_2_1776050105440.jpg";

export default function About() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-12 md:py-24 max-w-5xl"
    >
      <h1 className="font-creepster text-5xl md:text-7xl text-primary mb-12 text-center">ПРО ГУРТ</h1>
      
      <div className="mb-16 space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="photo-frame-neon overflow-hidden group"
        >
          <img 
            src={gurtImg} 
            alt="Gathering Of The Fallen на сцені" 
            loading="lazy"
            className="w-full h-auto block group-hover:scale-[1.03] transition-transform duration-700"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="photo-frame-neon overflow-hidden group"
        >
          <img 
            src={gurt2Img} 
            alt="Gathering Of The Fallen — учасники гурту" 
            loading="lazy"
            className="w-full h-auto block group-hover:scale-[1.03] transition-transform duration-700"
          />
        </motion.div>
      </div>
      
      <div className="space-y-12 font-mono text-lg text-muted-foreground leading-relaxed">
        <div className="rusted-border bg-black/50 backdrop-blur-sm p-8 relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-secondary"></div>
          <p className="text-xl md:text-2xl text-white font-bold italic pl-4">
            "Ми покинули дім, але дім не покинув нас. Gathering Of The Fallen — це голос тих, хто пішов, але не зламався. Наша музика — це біль еміграції, сила українського духу і крик серця, що б'ється між двома світами."
          </p>
        </div>

        <div className="bg-black/30 backdrop-blur-sm p-6 rounded">
          <h2 className="text-primary text-2xl mb-4 uppercase tracking-widest border-b border-primary/20 pb-2">
            &gt; Хто ми
          </h2>
          <p className="mb-4">
            Gathering Of The Fallen — українсько-канадський рок/метал гурт, створений емігрантами з України. Ми несемо свою історію крізь музику — історію людей, які залишили батьківщину, але зберегли свій дух, свою мову і свою незламність.
          </p>
          <p>
            Кожна наша пісня — це сповідь тих, хто знає ціну розлуки, хто несе Україну в серці за тисячі кілометрів від дому. Ми не забуваємо звідки ми, і наша музика — це міст між минулим і сьогоденням.
          </p>
        </div>

        <div className="bg-black/30 backdrop-blur-sm p-6 rounded">
          <h2 className="text-primary text-2xl mb-4 uppercase tracking-widest border-b border-primary/20 pb-2">
            &gt; Наша музика
          </h2>
          <p className="mb-4">
            Ми поєднуємо важкий рок і метал з українською душею. Наші пісні — про еміграцію, про молодість, що залишилась на тих вулицях, про вогонь у руках, який не гасне навіть далеко від Батьківщини.
          </p>
          <p>
            Кожен акорд — це відлуння рідної землі. Кожен крик — це голос сильних людей, які пройшли крізь уламки і дим, але не впали. Ми — Gathering Of The Fallen. Збір Повалених. Ми збираємо тих, кого розкидала доля, і даємо їм голос.
          </p>
        </div>

        <div className="bg-black/30 backdrop-blur-sm p-6 rounded">
          <h2 className="text-primary text-2xl mb-4 uppercase tracking-widest border-b border-primary/20 pb-2">
            &gt; Наша місія
          </h2>
          <p className="mb-4">
            Ми співаємо для кожного українця, де б він не був — у Канаді, Європі чи вдома в Україні. Наша місія — показати, що українська рок-музика жива, що емігранти не губляться серед чужих країн, а стають ще сильнішими.
          </p>
          <p>
            Gathering Of The Fallen — це не просто гурт. Це рух тих, хто несе свій залізний спадок крізь океани і кордони. Приєднуйся.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
