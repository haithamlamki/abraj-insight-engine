import { useEffect } from 'react';

interface ShortcutHandlers {
  onOpen?: () => void;
  onClose?: () => void;
  onVoiceStart?: () => void;
  onHelp?: () => void;
}

export const useKeyboardShortcuts = (handlers: ShortcutHandlers, enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to open filter
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handlers.onOpen?.();
      }

      // Escape to close
      if (e.key === 'Escape') {
        handlers.onClose?.();
      }

      // Ctrl/Cmd + Space to start voice input
      if ((e.ctrlKey || e.metaKey) && e.key === ' ') {
        e.preventDefault();
        handlers.onVoiceStart?.();
      }

      // ? to show help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handlers.onHelp?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, enabled]);
};
