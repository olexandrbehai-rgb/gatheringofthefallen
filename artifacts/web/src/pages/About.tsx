import { motion } from "framer-motion";
import { useT } from "@/i18n/LanguageContext";
import topPhoto1 from "@assets/photo_2026-06-07_20-29-09_1781050027752.jpg";
import topPhoto2 from "@assets/photo_2026-06-07_20-29-09_1781050027752.jpg";

const IMAGES = ["/band/oleksandr.jpg", "/band/tetiana.jpg", "/band/yaroslav.jpg", "/band/daryna.jpg"];

type Member = { name: string; role: string; description: string };

export default function About() {
  const { t, tArr, tObj } = useT();
  const members = tArr<Member>("about.members");
  const photoTitles = tObj<{ group: string; daryna: string }>("about.photoTitles");

  const photos = [
    { src: topPhoto1, alt: t("home.groupAlt"), title: photoTitles.group },
    { src: topPhoto2, alt: members[3]?.name ?? "", title: photoTitles.daryna },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-12 md:py-24 max-w-6xl"
    >
      <h1 className="glitch-text font-creepster text-5xl md:text-7xl text-primary mb-12 text-center">{t("about.title")}</h1>

      <div className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {photos.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: i === 0 ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2, duration: 0.6 }}
            className={`hover-image overflow-hidden group${i === 0 ? " no-scanlines" : ""}`}
          >
            <div className="w-full aspect-[3/4] overflow-hidden bg-black">
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                className="w-full h-full object-cover block group-hover:scale-[1.03] transition-transform duration-700"
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-8 font-mono text-lg text-muted-foreground leading-relaxed">
        <div className="apoc-card bg-black/50 backdrop-blur-sm p-8 relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-secondary"></div>
          <p className="text-xl md:text-2xl text-white font-bold italic pl-4">
            {t("about.quote")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {members.map((member, i) => (
            <div key={member.name} className="apoc-card bg-black/35 backdrop-blur-sm p-6 border border-primary/20">
              <div className="hover-image overflow-hidden mb-5">
                <img
                  src={IMAGES[i]}
                  alt={member.name}
                  loading="lazy"
                  className="w-full h-auto object-contain block"
                />
              </div>
              <h2 className="glitch-text text-primary text-2xl mb-2 uppercase tracking-widest border-b border-primary/20 pb-2">
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
