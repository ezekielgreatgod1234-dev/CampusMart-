// Meta-style green verified badge (CampusMart)
function VerifiedBadge({ size = 16, className = "", title = "Verified seller" }) {
  const s = Number(size) || 16;
  return (
    <span
      className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
      title={title}
      aria-label={title}
    >
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="12" fill="#008236" />
        <path
          d="M7.2 12.3l2.7 2.7 6.5-6.5"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default VerifiedBadge;