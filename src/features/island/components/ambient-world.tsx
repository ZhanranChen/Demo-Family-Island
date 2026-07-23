"use client";

import { useEffect, useState } from "react";

export function AmbientWorld() {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const sync = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return (
    <div className="ambient-world" data-paused={paused || undefined} aria-hidden="true">
      <div className="island-cloud island-cloud-one" />
      <div className="island-cloud island-cloud-two" />
      <div className="island-cloud island-cloud-three" />
      <div className="ambient-cloud-shadow" />
      <div className="shore-foam shore-foam-left" />
      <div className="shore-foam shore-foam-right" />
      <div className="shore-foam shore-foam-front" />
      <div className="chimney-smoke"><i /><i /><i /></div>
      <div className="pond-ripple pond-ripple-one" />
      <div className="pond-ripple pond-ripple-two" />
      <div className="ambient-fireflies"><i /><i /><i /><i /></div>
      <div className="ambient-butterflies"><i /><i /><i /></div>
      <div className="falling-leaves"><i /><i /><i /></div>
      <div className="grass-details">
        {Array.from({ length: 14 }, (_, index) => <i key={index} />)}
      </div>
      <div className="distant-bird" />
    </div>
  );
}
