import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import Logo from "./Logo";
import FamilySwitcher from "./FamilySwitcher";
import HeaderShareButton from "./HeaderShareButton";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MoonStar,
  Search,
  SunMedium,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import GlobalSearch from "./GlobalSearch";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Accueil" },
  { to: "/membres", icon: Users, label: "Membres" },
  { to: "/cotisations", icon: Wallet, label: "Cotisations" },
  { to: "/evenements", icon: Calendar, label: "Événements" },
  { to: "/profil", icon: UserRound, label: "Profil" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut, isAdmin } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div
        className={`flex border-b border-[var(--border)] px-4 py-4 ${
          sidebarCollapsed
            ? "flex-col items-center gap-4"
            : "items-center justify-between gap-3"
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Logo
            size={sidebarCollapsed ? 32 : 28}
            withWordmark={!sidebarCollapsed}
            className="shrink-0 text-[var(--text)]"
          />
        </div>
        {!sidebarCollapsed && (
          <button
            type="button"
            onClick={() => setSidebarCollapsed(true)}
            className="icon-btn hidden h-8 w-8 lg:flex"
            aria-label="Réduire le menu"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        {sidebarCollapsed && (
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            className="icon-btn hidden h-8 w-8 lg:flex"
            aria-label="Déplier le menu"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {!sidebarCollapsed && <FamilySwitcher />}

      <nav className="mt-4 flex flex-1 flex-col gap-1 px-2 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--accent)] text-[var(--accent-ink)] shadow-[var(--shadow-soft)]"
                  : "text-(--text-soft) hover:bg-(--surface-2) hover:text-(--text)"
              } ${sidebarCollapsed ? "justify-center px-2" : ""}`
            }
            aria-label={label}
          >
            <Icon size={18} />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[var(--border)] p-3">
        <div
          className={`flex items-center gap-3 ${sidebarCollapsed ? "justify-center" : "px-2 py-1"}`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--surface-2) font-semibold text-(--text)">
            {(user?.user_metadata?.full_name || user?.email || "U")
              .charAt(0)
              .toUpperCase()}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-(--text)">
                {user?.user_metadata?.full_name || user?.email || "Utilisateur"}
              </p>
              <span className="mt-1 inline-flex rounded-full bg-(--surface-2) px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-(--muted)">
                {isAdmin ? "Admin" : "Membre"}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => void signOut()}
          className={`mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-(--danger) transition hover:bg-red-500/10 ${sidebarCollapsed ? "justify-center" : ""}`}
        >
          <LogOut size={17} />
          {!sidebarCollapsed && "Se déconnecter"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <div className="flex min-h-screen">
        <motion.aside
          animate={{ width: sidebarCollapsed ? 88 : 256 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="hidden border-r border-(--border) bg-(--surface) lg:flex lg:flex-col"
        >
          <SidebarContent />
        </motion.aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-(--border) bg-(--bg)/90 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-6">
              <div className="flex items-center gap-2.5 lg:hidden">
                <Logo size={26} withWordmark={false} className="shrink-0 text-[var(--accent)]" />
                <div>
                  <p className="page-kicker">Libota</p>
                  <FamilySwitcher compact />
                </div>
              </div>

              <div className="hidden flex-1 items-center justify-center lg:flex">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex w-full max-w-xl items-center gap-3 rounded-xl border border-(--border) bg-(--surface) px-3 py-2.5 text-left hover:border-(--accent)"
                >
                  <Search size={17} className="text-(--muted)" />
                  <span className="flex-1 text-sm text-(--muted)">
                    Rechercher un membre, un événement…
                  </span>
                  <kbd className="rounded-md border border-(--border) px-1.5 py-0.5 text-[10px] text-(--muted)">
                    ⌘ K
                  </kbd>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="icon-btn lg:hidden"
                  aria-label="Rechercher"
                >
                  <Search size={17} />
                </button>
                <HeaderShareButton />
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="icon-btn"
                  aria-label={
                    darkMode
                      ? "Passer en thème clair"
                      : "Passer en thème sombre"
                  }
                >
                  {darkMode ? <SunMedium size={17} /> : <MoonStar size={17} />}
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-4 pb-24 sm:px-5 lg:px-6 lg:pb-4">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
}

/**
 * Navigation mobile façon Instagram : barre fixe en bas d'écran avec
 * les 5 sections principales, icône + libellé, état actif coloré.
 * Remplace le tiroir latéral sur mobile — la sidebar desktop reste
 * inchangée au-dessus du breakpoint `lg`.
 */
function BottomTabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-(--border) bg-(--surface)/95 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch justify-around">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                isActive ? "text-[var(--accent)]" : "text-(--muted)"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
