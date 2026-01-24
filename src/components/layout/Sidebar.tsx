import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GitBranch, 
  Archive, 
  BarChart3, 
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Moon,
  Sun,
  Settings,
  Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { KeyboardShortcutsHint } from '@/hooks/use-keyboard-shortcuts';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const menuItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Pipelines', path: '/pipelines', icon: GitBranch },
  { name: 'Leads Arquivados', path: '/archived', icon: Archive },
  { name: 'Relatórios', path: '/reports', icon: BarChart3 },
  { name: 'Integrações', path: '/integrations', icon: Link2 },
  { name: 'Configurações', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside
      className={cn(
        'sidebar-gradient h-screen flex flex-col transition-all duration-300 ease-in-out fixed left-0 top-0 z-50',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 bg-sidebar-foreground/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-5 h-5 text-sidebar-foreground" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg text-sidebar-foreground whitespace-nowrap animate-fade-in">
              Simply CRM
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          const linkContent = (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-sidebar-foreground/20 text-sidebar-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-sidebar-foreground')} />
              {!collapsed && (
                <span className="font-medium text-sm whitespace-nowrap">{item.name}</span>
              )}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* Theme Toggle & Shortcuts */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'default'}
              onClick={toggleTheme}
              className={cn(
                'text-sidebar-foreground hover:bg-sidebar-accent w-full',
                collapsed ? 'justify-center' : 'justify-start gap-3'
              )}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 flex-shrink-0" />
              ) : (
                <Sun className="w-5 h-5 flex-shrink-0" />
              )}
              {!collapsed && (
                <span className="font-medium text-sm">
                  {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">
              {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </TooltipContent>
          )}
        </Tooltip>

        {/* Keyboard Shortcuts Hint */}
        {!collapsed && (
          <div className="pt-2">
            <KeyboardShortcutsHint />
          </div>
        )}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/50 text-center">
            © 2024 Simply CRM
          </p>
        </div>
      )}
    </aside>
  );
}
