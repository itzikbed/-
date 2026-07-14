/**
 * Utility to check if video elements should be disabled
 * based on user accessibility preferences and network status.
 */
interface NetworkConnection {
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkConnection;
  mozConnection?: NetworkConnection;
  webkitConnection?: NetworkConnection;
}

export function shouldDisableVideo(): boolean {
  if (typeof window === 'undefined') return true;
  
  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Check Data Saver status (connection.saveData)
  const nav = navigator as NavigatorWithConnection;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  const saveData = !!connection?.saveData;
  
  return prefersReducedMotion || saveData;
}

export function hasExtension(path: string | null | undefined): boolean {
  if (!path) return false;
  return /\.[a-zA-Z0-9]+$/.test(path);
}

