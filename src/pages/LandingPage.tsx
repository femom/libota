import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Logo from "../components/Logo";
import StorySection from "../components/landing/StorySection";

/**
 * Page publique d'accueil (marketing). Pas encore branchée dans le
 * routing de l'app — voir les instructions d'intégration fournies
 * avec ce composant.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Logo size={30} className="text-[var(--text)]" />
        <Link to="/login" className="btn-ghost text-sm">
          Se connecter
        </Link>
      </header>

      <section className="mx-auto max-w-4xl px-4 pb-16 pt-8 text-center sm:px-6 lg:px-8">
        <p className="page-kicker mx-auto w-fit">Gestion familiale</p>
        <h1 className="font-display mt-4 text-4xl font-bold sm:text-5xl">
          Vos cotisations et événements familiaux, sans le chaos.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-[var(--text-soft)]">
          Libota réunit toute la famille autour d'un suivi transparent des
          cotisations, des membres et des événements — en temps réel.
        </p>
        <Link
          to="/login?mode=create"
          className="btn-primary mx-auto mt-8 inline-flex w-fit px-7 py-3.5 text-base"
        >
          Créer un compte gratuitement
          <ArrowRight size={18} />
        </Link>
      </section>

      <StorySection />

      <footer className="px-4 py-10 text-center text-sm text-[var(--muted)]">
        © {new Date().getFullYear()} Libota
      </footer>
    </div>
  );
}
