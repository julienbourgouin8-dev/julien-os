type StitchUnderlineProps = {
  color?: string;
  className?: string;
  width?: number;
};

export default function StitchUnderline({
  color = "var(--color-rust)",
  className = "",
  width = 180,
}: StitchUnderlineProps) {
  return (
    <svg
      viewBox="0 0 200 12"
      width={width}
      height={Math.round((width / 200) * 12)}
      className={className}
      aria-hidden="true"
    >
      <path
        className="stitch-path"
        d="M2,6 C 30,-1 45,13 70,6 C 95,-1 110,13 135,6 C 155,0 170,10 198,6"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
