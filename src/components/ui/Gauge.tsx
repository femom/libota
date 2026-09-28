type GaugeProps = {
  /** 0–100 */
  value: number;
  size?: number;
};

/**
 * Jauge en arc (demi-cercle), inspirée du cadran de la référence
 * "neumorphique claire" — piste en creux, progression en ambre.
 */
export default function Gauge({ value, size = 168 }: GaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const stroke = 14;
  const radius = size / 2 - stroke;
  const circumference = Math.PI * radius; // demi-cercle
  const offset = circumference * (1 - clamped / 100);
  const height = size / 2 + stroke;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={height}
        viewBox={`0 0 ${size} ${height}`}
        className="overflow-visible"
      >
        <path
          d={`M ${stroke} ${height} A ${radius} ${radius} 0 0 1 ${size - stroke} ${height}`}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d={`M ${stroke} ${height} A ${radius} ${radius} 0 0 1 ${size - stroke} ${height}`}
          fill="none"
          stroke="var(--accent-warm)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 500ms ease" }}
        />
      </svg>
      <div className="-mt-9 text-3xl font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>
        {clamped}%
      </div>
    </div>
  );
}
