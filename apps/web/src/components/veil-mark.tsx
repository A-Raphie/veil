/**
 * VeilMark — the brand mark. The same V/veil gradient used in the favicon,
 * as an inline SVG so it inherits className and stays crisp at any size.
 *
 * A solid "V" stroke (the revealed shape) over a dashed echo (the hidden layer).
 */
export function VeilMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Veil"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="veil-mark-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      {/* solid V — "revealed" */}
      <path
        d="M16 18 L32 46 L48 18"
        stroke="url(#veil-mark-grad)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* dashed echo — "the hidden layer" */}
      <path
        d="M20 24 L32 42 L44 24"
        stroke="#34d399"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="3 4"
        opacity="0.5"
      />
    </svg>
  );
}
