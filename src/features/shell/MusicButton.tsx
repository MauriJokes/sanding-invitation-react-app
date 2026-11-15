import { useI18n } from "../../i18n/I18nProvider";
import type { MusicPlayer } from "../music/useMusicPlayer";

/** Playing is shown by colour and by the icon (a slash through the note means off), never by colour alone. */
export function MusicButton({ player }: { player: MusicPlayer }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      aria-label={player.unavailable ? t.musicUnavailable : player.playing ? t.musicPause : t.musicPlay}
      aria-disabled={player.unavailable ? true : undefined}
      onClick={player.unavailable ? undefined : player.toggle}
      className={`grid min-h-12 min-w-12 place-items-center hover:text-gold-bright ${player.playing ? "text-gold-bright" : ""} ${player.unavailable ? "opacity-50" : ""}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="size-5 fill-none stroke-current stroke-[1.6]">
        <path d="M9 18V5l11-2v13" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="17.5" cy="16" r="2.5" />
        {!player.playing && <path d="M3 3l18 18" className="stroke-2" />}
      </svg>
    </button>
  );
}
