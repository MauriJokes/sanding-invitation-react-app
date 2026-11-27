import { LanguageToggle } from "../../components/LanguageToggle";
import { Monogram } from "../../components/Monogram";
import { useI18n } from "../../i18n/I18nProvider";
import { useActiveSection } from "../../lib/useActiveSection";
import { useTextFieldFocus } from "../../lib/useTextFieldFocus";
import type { MusicPlayer } from "../music/useMusicPlayer";
import { MusicButton } from "./MusicButton";
import { NAV_ITEMS } from "./navItems";

interface NavigationProps {
  /** Ids of the sections that exist on the page; only these get a link. */
  sectionIds: readonly string[];
  player: MusicPlayer;
}

/** Bottom bar below 768 px, sticky top bar from 768 px (docs/DESIGN_SYSTEM.md 5b). */
export function Navigation({ sectionIds, player }: NavigationProps) {
  const { t } = useI18n();
  const items = NAV_ITEMS.filter((item) => sectionIds.includes(item.id));
  const active = useActiveSection(items.map((item) => item.id));
  const typing = useTextFieldFocus();

  return (
    <nav
      aria-label={t.navLabel}
      data-typing={typing ? "true" : undefined}
      className="border-gold bg-navy-deep fixed inset-x-0 bottom-0 z-20 flex items-stretch border-t pb-[env(safe-area-inset-bottom)] data-[typing=true]:max-md:hidden md:sticky md:inset-x-auto md:top-0 md:bottom-auto md:h-14 md:justify-between md:border-t-0 md:border-b md:px-3 md:pb-0"
    >
      {/* <Monogram className="hidden self-center pl-1 text-[1.25rem] md:flex" /> */}
      <ul className="m-0 flex min-w-0 flex-1 list-none p-0 md:justify-center md:gap-1">
        {items.map((item) => (
          <li key={item.id} className="flex flex-1 md:flex-none">
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "true" : undefined}
              className="hover:text-gold-bright aria-[current=true]:text-gold-bright md:aria-[current=true]:border-gold-bright relative flex min-h-14 flex-1 flex-col items-center justify-center gap-[3px] text-[0.7rem] font-semibold tracking-[0.06em] uppercase no-underline max-[359px]:tracking-[0.01em] max-md:aria-[current=true]:before:absolute max-md:aria-[current=true]:before:inset-x-[22%] max-md:aria-[current=true]:before:-top-px max-md:aria-[current=true]:before:h-0.5 max-md:aria-[current=true]:before:bg-current md:min-h-12 md:flex-none md:flex-row md:border-b-2 md:border-transparent md:px-2 md:text-[0.78rem] md:tracking-[0.12em]"
            >
              {item.icon}
              <span>{t[item.label]}</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="border-gold/55 flex items-center border-l pl-[0.15rem] md:border-l-0 md:pl-0">
        <LanguageToggle />
        <MusicButton player={player} />
      </div>
    </nav>
  );
}
