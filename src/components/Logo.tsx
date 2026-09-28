import { useId } from "react";

type LogoProps = {
  /** Hauteur du glyphe en pixels ; la largeur suit le ratio du SVG source. */
  size?: number;
  /** Affiche le mot "Libota" à côté du symbole. */
  withWordmark?: boolean;
  className?: string;
};

/**
 * Logo officiel Libota. Le symbole reste toujours en dégradé orange
 * (marque), tandis que le texte du mot-symbole utilise `currentColor`
 * pour suivre le thème clair/sombre de la page qui l'affiche.
 *
 * L'id du dégradé est généré par instance (useId) : plusieurs <Logo>
 * peuvent être montés en même temps sur la page (sidebar desktop +
 * header mobile, par ex.) sans collision d'id SVG. Deux éléments avec
 * le même id="..." dans le DOM, même si l'un est display:none, peuvent
 * faire perdre le remplissage `url(#id)` de l'autre sur Safari/iOS —
 * c'est exactement ce qui rendait l'icône invisible sur mobile.
 */
export default function Logo({ size = 32, withWordmark = true, className = "" }: LogoProps) {
  const gradientId = `libotaGradient-${useId()}`;
  const width = withWordmark ? (size * 280) / 100 : size;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={withWordmark ? "0 0 280 100" : "0 0 100 100"}
      width={width}
      height={size}
      className={className}
      role="img"
      aria-label="Libota"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B00" />
          <stop offset="100%" stopColor="#FF3D00" />
        </linearGradient>
      </defs>
      <g transform="translate(0, 0)">
        <circle cx="50" cy="50" r="45" fill={`url(#${gradientId})`} opacity="0.12" />
        <path
          d="M 50 12 A 38 38 0 1 1 12 50"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="50" cy="38" r="8" fill={`url(#${gradientId})`} />
        <path d="M 34 68 C 34 54, 66 54, 66 68 Z" fill={`url(#${gradientId})`} />
        <circle cx="33" cy="46" r="6.5" fill={`url(#${gradientId})`} opacity="0.85" />
        <path d="M 20 70 C 20 58, 46 58, 46 70 Z" fill={`url(#${gradientId})`} opacity="0.85" />
        <circle cx="67" cy="46" r="6.5" fill={`url(#${gradientId})`} opacity="0.85" />
        <path d="M 54 70 C 54 58, 80 58, 80 70 Z" fill={`url(#${gradientId})`} opacity="0.85" />
      </g>
      {withWordmark && (
        <>
          <text
            x="115"
            y="65"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="800"
            fontSize="44"
            fill="currentColor"
            letterSpacing="-0.5"
          >
            Libota
          </text>
          <circle cx="252" cy="59" r="5" fill={`url(#${gradientId})`} />
        </>
      )}
    </svg>
  );
}
