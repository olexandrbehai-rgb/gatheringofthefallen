import type { IconType } from "react-icons";
import { SiBandcamp, SiInstagram, SiSuno, SiSpotify, SiSoundcloud, SiTiktok, SiYoutube, SiYoutubemusic } from "react-icons/si";
import { Globe2, Link2, Music2 } from "lucide-react";

export type PlatformKey = "website" | "spotify" | "suno" | "youtube-music" | "youtube" | "instagram" | "tiktok" | "bandcamp" | "soundcloud" | "audio" | "other";

export type PlatformOption = {
  value: PlatformKey;
  label: string;
  placeholder: string;
  icon: IconType;
  color: string;
};

export const PLATFORM_OPTIONS: PlatformOption[] = [
  { value: "website", label: "Сайт / портфоліо", placeholder: "https://твій-сайт.com", icon: Globe2, color: "#b9f7ff" },
  { value: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/artist/...", icon: SiSpotify, color: "#1ed760" },
  { value: "suno", label: "Suno", placeholder: "https://suno.com/song/...", icon: SiSuno, color: "#ff6bba" },
  { value: "youtube-music", label: "YouTube Music", placeholder: "https://music.youtube.com/channel/...", icon: SiYoutubemusic, color: "#ff0033" },
  { value: "youtube", label: "YouTube", placeholder: "https://youtube.com/@твій-канал", icon: SiYoutube, color: "#ff0033" },
  { value: "instagram", label: "Instagram", placeholder: "https://instagram.com/твій-профіль", icon: SiInstagram, color: "#e4405f" },
  { value: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@твій-профіль", icon: SiTiktok, color: "#69c9d0" },
  { value: "bandcamp", label: "Bandcamp", placeholder: "https://твій-лейбл.bandcamp.com", icon: SiBandcamp, color: "#629aa9" },
  { value: "soundcloud", label: "SoundCloud", placeholder: "https://soundcloud.com/твій-профіль", icon: SiSoundcloud, color: "#ff5500" },
  { value: "audio", label: "MP3 / авторська музика", placeholder: "", icon: Music2, color: "#b9f7ff" },
  { value: "other", label: "Інший майданчик", placeholder: "https://посилання-на-профіль.com", icon: Link2, color: "#d7b6ff" },
];