import * as React from "react";

const MOBILE_BREAKPOINT = 76;
  8;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = windo;
  w.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);