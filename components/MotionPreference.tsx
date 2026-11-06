"use client";

import { useEffect, useState } from "react";
import { MOTION_STORAGE_KEY } from "@/lib/types";

function applyMotion(reduced: boolean) {
  if (reduced) document.documentElement.setAttribute("data-motion", "reduced");
  else document.documentElement.removeAttribute("data-motion");
}

export function MotionPreference() {
  const [systemReduced, setSystemReduced] = useState(false);
  const [localReduced, setLocalReduced] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const system = media.matches;
      let stored = false;
      try {
        stored = window.localStorage.getItem(MOTION_STORAGE_KEY) === "reduced";
      } catch {
        stored = false;
      }
      setSystemReduced(system);
      setLocalReduced(stored);
      applyMotion(system || stored);
      setReady(true);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  function onToggle() {
    if (systemReduced) return;
    const next = !localReduced;
    setLocalReduced(next);
    try {
      if (next) window.localStorage.setItem(MOTION_STORAGE_KEY, "reduced");
      else window.localStorage.removeItem(MOTION_STORAGE_KEY);
    } catch {
      // La preferencia queda aplicada en memoria si el almacenamiento falla.
    }
    applyMotion(next);
  }

  const reduced = systemReduced || localReduced;
  const label = systemReduced
    ? "El sistema pide menos animación"
    : reduced
      ? "Reducida en este navegador"
      : "Según el sistema";

  return (
    <div className="motion-pref">
      <p id="motion-label">Animación de la interfaz</p>
      <button
        type="button"
        className="button"
        aria-pressed={reduced}
        aria-describedby="motion-help"
        disabled={!ready || systemReduced}
        onClick={onToggle}
      >
        {label}
      </button>
      <p id="motion-help" className="caption">
        {systemReduced
          ? "La preferencia del sistema no se puede anular desde esta página."
          : "Guarda la elección en este navegador. El contenido se lee igual sin animación."}
      </p>
    </div>
  );
}
