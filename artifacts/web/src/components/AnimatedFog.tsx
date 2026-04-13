export function AnimatedFog() {
  return (
    <>
      <div className="fog-layer fog-1"></div>
      <div className="fog-layer fog-2"></div>
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="ash-particle"
            style={{
              left: `${Math.random() * 100}vw`,
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              animationDelay: `${Math.random() * 20}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}
