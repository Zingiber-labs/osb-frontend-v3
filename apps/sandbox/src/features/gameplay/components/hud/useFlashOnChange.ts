import { useEffect, useRef, useState } from "react";

/** True for `ms` after `value` changes (not on mount). Drives the glow on score and counter changes. */
export function useFlashOnChange(value: unknown, ms = 300): boolean {
  const [flash, setFlash] = useState(false);
  const last = useRef(value);
  useEffect(() => {
    if (Object.is(last.current, value)) return;
    last.current = value;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return flash;
}
