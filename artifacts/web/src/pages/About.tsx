import { motion } from "framer-motion";
import darynaImg from "@assets/Daryna_1777381963168.png";
import groupImg from "@assets/Group_1777381963170.png";
import oleksandrImg from "@assets/Oleksandr_1777381963172.png";
import tetianaImg from "@assets/Tetiana_1777381963174.png";
import yaroslavImg from "@assets/Yaroslav_1777381963176.jpg";

const MEMBERS = [
  {
    name: "Олександр",
    role: "засновник гурту, електрогітарист та автор пісень",
    image: oleksandrImg,
    alt: "Олександр, засновник Gathering of the Fallen з електрогітарою на сцені",
    description:
      "Олександр — засновник Gathering of the Fallen, архітектор нашої темряви і творець пісень, що народжуються з вогню, шрамів і незламної волі. Його гітара розтинає ніч, немов блискавка над спаленим небом, а рифи ведуть гурт крізь бурю, де кожен звук стає клятвою сили. Він не просто пише музику — він викарбовує дороги для тих, хто йде крізь попіл і не боїться підняти голову до полум’яного горизонту.",
  },
  {
    name: "Тетяна",
    role: "співзасновниця гурту, бас-гітаристка",
    image: tetianaImg,
    alt: "Тетяна, бас-гітаристка Gathering of the Fallen з бас-гітарою на тлі руїн",
    description:
      "Тетяна — співзасновниця Gathering of the Fallen, королева низьких частот і темного фундаменту, на якому тримається вся наша стихія. Її бас звучить як глибокий пульс землі під ногами воїнів, як древній заклик безодні, що не дозволяє музиці впасти в тишу. Вона несе холодну силу й вогняну гідність, перетворюючи кожен трек на ритуал відродження.",
  },
  {
    name: "Ярослав",
    role: "барабанщик",
    image: yaroslavImg,
    alt: "Ярослав, барабанщик Gathering of the Fallen на сцені серед вогню",
    description:
      "Ярослав — барабанщик Gathering of the Fallen, шалений ритм хаосу і відродження, що змушує серце битися в унісон із полум’ям сцени. Його удар — це грім проклятого неба, його темп — це штурм, від якого здригаються руїни та оживають легенди. Він перетворює кожну композицію на похід крізь бурю, де ритм стає зброєю, а звук — незламною опорою для всіх, хто йде поруч.",
  },
  {
    name: "Дарина",
    role: "клавішниця",
    image: darynaImg,
    alt: "Дарина, клавішниця Gathering of the Fallen за клавішами на темній сцені",
    description:
      "Дарина — клавішниця Gathering of the Fallen, хранителька атмосферних мелодій і містичних шарів, що огортають нашу музику туманом і зоряним пилом. Її клавіші відкривають брами між світами, де темрява співає, а світло народжується з попелу. Вона створює простір, у якому кожна нота стає шепотом стародавнього закляття, а кожен акорд — кроком у безодню прекрасного й величного.",
  },
];

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-12 md:py-24 max-w-6xl"
    >
      <h1 className="font-creepster text-5xl md:text-7xl text-primary mb-12 text-center">ПРО ГУРТ</h1>

      <div className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          {
            src: groupImg,
            alt: "Новий склад Gathering of the Fallen у фіолетово-синій атмосфері",
            title: "Новий склад Gathering of the Fallen — 2026",
          },
          {
            src: darynaImg,
            alt: "Дарина за клавішами в атмосферному сценічному світлі",
            title: "Клавішна стихія Дарини",
          },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: i === 0 ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2, duration: 0.6 }}
            className="photo-frame-neon overflow-hidden group lg:row-span-1"
          >
            <img
              src={item.src}
              alt={item.alt}
              loading="lazy"
              className="w-full h-full object-contain block group-hover:scale-[1.03] transition-transform duration-700"
            />
            <div className="p-4 bg-black/55 border-t border-primary/20 text-center font-mono text-xs uppercase tracking-widest text-primary/90">
              {item.title}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-8 font-mono text-lg text-muted-foreground leading-relaxed">
        <div className="rusted-border bg-black/50 backdrop-blur-sm p-8 relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-secondary"></div>
          <p className="text-xl md:text-2xl text-white font-bold italic pl-4">
            "Gathering of the Fallen — це темна сила, що піднімається з попелу забутих легенд. Ми збираємо занепалих, щоб вони встали ще сильнішими. Наша музика — це поєднання важких рифів, містичних мелодій, емоцій і древніх ритуалів. Кожен звук — це історія падіння і відродження, кожен виступ — це обряд, у якому темрява стає світлом."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MEMBERS.map((member) => (
            <div key={member.name} className="bg-black/35 backdrop-blur-sm p-6 rounded border border-primary/20">
              <div className="rusted-border overflow-hidden mb-5">
                <img
                  src={member.image}
                  alt={member.alt}
                  loading="lazy"
                  className="w-full h-auto object-contain block"
                />
              </div>
              <h2 className="text-primary text-2xl mb-2 uppercase tracking-widest border-b border-primary/20 pb-2">
                &gt; {member.name} — {member.role}
              </h2>
              <p className="text-white/90 leading-relaxed">{member.description}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
