import { useEffect } from 'react';

/**
 * Toggles a command palette when the platform shortcut is pressed.
 *
 * @param onToggle - Callback invoked for the Cmd/Ctrl+K shortcut
 * @param enabled - Whether the shortcut listener should be active
 * @returns Nothing; installs and cleans up a keyboard listener
 */
export function useCommandPalette(onToggle: () => void, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return undefined;

    const handleKeyDown = (event: KeyboardEvent): void => {
      // [WHY] Cmd is the expected shortcut on macOS, while other platforms use Ctrl.
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const modifierPressed = isMac ? event.metaKey : event.ctrlKey;
      if (modifierPressed && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onToggle]);
}
