import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface KeyboardShortcutsOptions {
  onNewDeal?: () => void;
  onNewPipeline?: () => void;
  onSearch?: () => void;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const { onNewDeal, onNewPipeline, onSearch } = options;
  const navigate = useNavigate();
  const location = useLocation();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // N - New Deal (if on pipelines page with a selected pipeline)
      if (event.key === 'n' || event.key === 'N') {
        if (onNewDeal) {
          event.preventDefault();
          onNewDeal();
        }
      }

      // P - New Pipeline (if on pipelines page)
      if (event.key === 'p' || event.key === 'P') {
        if (location.pathname === '/pipelines' && onNewPipeline) {
          event.preventDefault();
          onNewPipeline();
        } else if (location.pathname !== '/pipelines') {
          event.preventDefault();
          navigate('/pipelines');
        }
      }

      // / - Focus search
      if (event.key === '/') {
        event.preventDefault();
        if (onSearch) {
          onSearch();
        } else {
          // Try to focus the first search input on the page
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[placeholder*="Buscar"], input[placeholder*="buscar"]'
          );
          if (searchInput) {
            searchInput.focus();
          }
        }
      }

      // Escape - Close modals (handled by radix)
    },
    [onNewDeal, onNewPipeline, onSearch, location.pathname, navigate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Component that shows keyboard shortcuts hint
export function KeyboardShortcutsHint() {
  return (
    <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">N</kbd>
        <span>Novo Negócio</span>
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">P</kbd>
        <span>Pipelines</span>
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">/</kbd>
        <span>Buscar</span>
      </span>
    </div>
  );
}
