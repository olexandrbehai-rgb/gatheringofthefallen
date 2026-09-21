export function PortalHelper({
  left,
  top,
}: {
  left: number;
  top: number;
}) {
  return (
    <div
      aria-hidden="true"
      className="authors-world-portal-helper pointer-events-none absolute"
      style={{ left: `${left}px`, top: `${top}px` }}
    >
      <span className="authors-world-portal-helper-trail authors-world-portal-helper-trail-one" />
      <span className="authors-world-portal-helper-trail authors-world-portal-helper-trail-two" />
      <span className="authors-world-portal-helper-wing authors-world-portal-helper-wing-left" />
      <span className="authors-world-portal-helper-wing authors-world-portal-helper-wing-right" />
      <span className="authors-world-portal-helper-body">
        <span className="authors-world-portal-helper-eye authors-world-portal-helper-eye-left" />
        <span className="authors-world-portal-helper-eye authors-world-portal-helper-eye-right" />
        <span className="authors-world-portal-helper-smile" />
      </span>
      <span className="authors-world-portal-helper-spark authors-world-portal-helper-spark-one">✦</span>
      <span className="authors-world-portal-helper-spark authors-world-portal-helper-spark-two">·</span>
    </div>
  );
}