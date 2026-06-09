import { motion } from "framer-motion";
import { Youtube, Instagram, Facebook, Mail, TerminalSquare } from "lucide-react";
import { FaTiktok } from "react-icons/fa";
import { GlitchText } from "@/components/GlitchText";
import { GlitchButton } from "@/components/GlitchButton";
import { useT } from "@/i18n/LanguageContext";

export default function Contacts() {
  const { t } = useT();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-12 md:py-24 max-w-5xl"
    >
      <h1 className="glitch-text font-creepster text-5xl md:text-7xl text-primary mb-12 text-center">{t("contacts.title")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="apoc-card p-8 bg-black/40 backdrop-blur-sm font-mono">
          <div className="flex items-center gap-3 mb-8 text-primary border-b border-primary/20 pb-4">
            <TerminalSquare size={28} />
            <h2 className="glitch-text font-bold text-2xl uppercase tracking-widest">{t("contacts.terminalHeading")}</h2>
          </div>

          <div className="space-y-6">
            <a href="https://youtube.com/@gathering-of-the-fallen" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-muted-foreground hover:text-white transition-colors group p-4 border border-border/50 hover:border-red-500/50 bg-black/30">
              <Youtube className="group-hover:text-red-500 text-2xl" />
              <div className="flex flex-col">
                <span className="text-xs text-red-500/70 mb-1">{t("contacts.labels.videoArchive")}</span>
                <GlitchText>@gathering-of-the-fallen</GlitchText>
              </div>
            </a>

            <a href="https://www.instagram.com/alexats2025?igsh=bjQzZWc4ZzQ3OHc=" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-muted-foreground hover:text-white transition-colors group p-4 border border-border/50 hover:border-pink-500/50 bg-black/30">
              <Instagram className="group-hover:text-pink-500 text-2xl" />
              <div className="flex flex-col">
                <span className="text-xs text-pink-500/70 mb-1">{t("contacts.labels.photo")}</span>
                <GlitchText>Gathering Of The Fallen</GlitchText>
              </div>
            </a>

            <a href="https://www.tiktok.com/@kobzar25" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-muted-foreground hover:text-white transition-colors group p-4 border border-border/50 hover:border-cyan-400/50 bg-black/30">
              <FaTiktok className="text-2xl group-hover:text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-xs text-cyan-400/70 mb-1">{t("contacts.labels.shortMsg")}</span>
                <GlitchText>@kobzar25</GlitchText>
              </div>
            </a>

            <a href="https://www.facebook.com/share/1CYJR7yWJz/" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-muted-foreground hover:text-white transition-colors group p-4 border border-border/50 hover:border-blue-500/50 bg-black/30">
              <Facebook className="group-hover:text-blue-500 text-2xl" />
              <div className="flex flex-col">
                <span className="text-xs text-blue-500/70 mb-1">{t("contacts.labels.survivors")}</span>
                <GlitchText>{t("contacts.labels.facebookCommunity")}</GlitchText>
              </div>
            </a>

            <a href="mailto:gatheringofthefallen@gmail.com" className="flex items-center gap-4 text-muted-foreground hover:text-white transition-colors group p-4 border border-border/50 hover:border-primary/50 bg-black/30">
              <Mail className="group-hover:text-primary text-2xl" />
              <div className="flex flex-col">
                <span className="text-xs text-primary/70 mb-1">{t("contacts.labels.directLink")}</span>
                <GlitchText>gatheringofthefallen@gmail.com</GlitchText>
              </div>
            </a>
          </div>
        </div>

        <div className="apoc-card p-8 bg-black/40 backdrop-blur-sm font-mono flex flex-col">
          <div className="flex items-center gap-3 mb-8 text-secondary border-b border-secondary/20 pb-4">
            <span className="w-3 h-3 bg-secondary rounded-full animate-pulse"></span>
            <h2 className="glitch-text font-bold text-2xl uppercase tracking-widest">{t("contacts.sendHeading")}</h2>
          </div>

          <form className="flex-1 flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground">{t("contacts.form.name")}</label>
              <input
                type="text"
                className="bg-black/30 border border-border/50 focus:border-secondary p-3 text-white outline-none font-mono"
                placeholder="..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground">{t("contacts.form.email")}</label>
              <input
                type="email"
                className="bg-black/30 border border-border/50 focus:border-secondary p-3 text-white outline-none font-mono"
                placeholder="..."
              />
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <label className="text-xs text-muted-foreground">{t("contacts.form.message")}</label>
              <textarea
                className="bg-black/30 border border-border/50 focus:border-secondary p-3 text-white outline-none font-mono flex-1 resize-none min-h-[150px]"
                placeholder={t("contacts.form.placeholderMsg")}
              ></textarea>
            </div>

            <GlitchButton className="w-full py-4 mt-auto border-secondary text-secondary hover:bg-secondary/20 hover:border-secondary">
              {t("contacts.form.submit")}
            </GlitchButton>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
