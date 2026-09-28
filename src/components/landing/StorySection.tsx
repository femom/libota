import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

type StoryStep = {
  number: string;
  kicker: string;
  title: string;
  recit: string;
  citation: string;
  image: string;
  /** Classe d'animation continue dédiée à l'étape (voir index.css). */
  animationClass?: string;
};

const steps: StoryStep[] = [
  {
    number: "01",
    kicker: "Le problème",
    title: "La galère des comptes",
    recit:
      "Des reçus éparpillés, des factures volantes, des calculatrices qui chauffent et des feuilles de calcul interminables. Gérer la caisse ou la tontine familiale sur papier devient vite un casse-tête épuisant.",
    citation: "« Qui a le reçu du dernier paiement ? »",
    image: "/assets/stories/step-1-galere.jpg",
    animationClass: "story-anim-shake",
  },
  {
    number: "02",
    kicker: "La pression",
    title: "Le stress et les loupes",
    recit:
      "Quand les chiffres manquent de clarté, la méfiance s'installe. Le gestionnaire se retrouve constamment sollicité, devant justifier chaque dépense sous le regard scrutateur des membres de la famille.",
    citation: "« On aimerait comprendre où va l'argent exactement... »",
    image: "/assets/stories/step-2-loupes.jpg",
    animationClass: "story-anim-pulse",
  },
  {
    number: "03",
    kicker: "L'impact",
    title: "L'événement raté",
    recit:
      "Des cotisations en retard, des oublis de calendrier et des appels d'urgence manqués. Sans rappel automatique, les projets familiaux prennent du retard ou tombent à l'eau.",
    citation: "« Mince, la date limite était hier... »",
    image: "/assets/stories/step-3-evenement-rate.jpg",
    animationClass: "story-anim-alert",
  },
  {
    number: "04",
    kicker: "La solution",
    title: "La solution Libota",
    recit:
      "Toute la famille connectée et synchronisée en temps réel. Suivi transparent des cotisations, validations automatiques et gestion dans la joie et la sérénité totale.",
    citation: "« Tout est clair, sécurisé et accessible en un clic ! »",
    image: "/assets/stories/step-4-solution.jpg",
    animationClass: "story-anim-solution",
  },
];

/** Petites étincelles SVG qui montent doucement — réservées à l'étape 4. */
function Sparkles4() {
  const dots = [
    { left: "8%", delay: "0s", size: 8 },
    { left: "22%", delay: "0.6s", size: 5 },
    { left: "78%", delay: "1.1s", size: 7 },
    { left: "90%", delay: "0.3s", size: 5 },
    { left: "50%", delay: "1.6s", size: 6 },
    { left: "65%", delay: "2.1s", size: 4 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      {dots.map((dot, i) => (
        <span
          key={i}
          className="story-sparkle absolute bottom-6"
          style={{ left: dot.left, animationDelay: dot.delay }}
        >
          <Sparkles
            size={dot.size * 2}
            className="text-[var(--accent)]"
            fill="currentColor"
            strokeWidth={0}
          />
        </span>
      ))}
    </div>
  );
}

function StoryCard({ step, index }: { step: StoryStep; index: number }) {
  const imageFirst = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="grid items-center gap-8 py-14 md:grid-cols-2 md:gap-12 md:py-20"
    >
      <div
        className={`relative ${imageFirst ? "md:order-1" : "md:order-2"}`}
      >
        <div
          className={`relative overflow-hidden rounded-3xl border border-[var(--border)] bg-white p-4 shadow-2xl ${
            step.number === "04" ? "story-anim-solution" : ""
          } ${
            step.number === "03" ? "story-anim-alert" : ""
          }`}
        >
          <img
            src={step.image}
            alt={step.title}
            className={`w-full rounded-2xl ${
              step.number === "01" ? "story-anim-shake" : ""
            } ${step.number === "02" ? "story-anim-pulse" : ""}`}
          />
          {step.number === "04" && <Sparkles4 />}
        </div>
      </div>

      <div className={imageFirst ? "md:order-2" : "md:order-1"}>
        <div className="flex items-center gap-3">
          <span
            className="font-display text-4xl font-bold"
            style={{
              backgroundImage: "linear-gradient(135deg, #FF6B00, #FF3D00)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {step.number}
          </span>
          <span className="page-kicker">{step.kicker}</span>
        </div>
        <h3 className="font-display mt-3 text-2xl font-semibold text-[var(--text)] sm:text-3xl">
          {step.title}
        </h3>
        <p className="mt-4 text-base leading-relaxed text-[var(--text-soft)]">
          {step.recit}
        </p>
        <p className="mt-4 border-l-2 border-[var(--accent)] pl-4 text-sm italic text-[var(--muted)]">
          {step.citation}
        </p>
      </div>
    </motion.div>
  );
}

export default function StorySection() {
  return (
    <section className="bg-[var(--bg)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="divide-y divide-[var(--border)]">
          {steps.map((step, index) => (
            <StoryCard key={step.number} step={step} index={index} />
          ))}
        </div>

        {/* CTA final */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mt-8 overflow-hidden rounded-3xl border border-[var(--accent)]/30 p-10 text-center sm:p-14"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(255,107,0,0.16), transparent 60%), var(--surface)",
          }}
        >
          <h3 className="font-display mx-auto max-w-2xl text-3xl font-bold text-[var(--text)] sm:text-4xl">
            Ne laissez plus les comptes gâcher l'harmonie familiale
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-[var(--text-soft)]">
            Rejoignez les familles qui gèrent déjà leurs cotisations et leurs
            événements en toute sérénité avec Libota.
          </p>
          <Link
            to="/login?mode=create"
            className="btn-primary mx-auto mt-8 inline-flex w-fit px-7 py-3.5 text-base"
          >
            Créer un compte gratuitement
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
