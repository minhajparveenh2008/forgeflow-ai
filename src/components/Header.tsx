import React from 'react';
import { UserProfile, Project } from '../types';
import { Terminal, Github, User, LogOut, Settings, Plus, FolderGit2, CheckCircle2, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  user: UserProfile | null;
  projects: Project[];
  activeProject: Project | null;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onSelectProject: (project: Project) => void;
  onNewProjectClick: () => void;
  onOpenAuth: () => void;
  onOpenOnboarding: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  projects,
  activeProject,
  theme = 'light',
  onToggleTheme,
  onSelectProject,
  onNewProjectClick,
  onOpenAuth,
  onOpenOnboarding,
  onSignOut,
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 sticky top-0 z-30 px-4 py-2.5 shadow-2xs transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Workspace Name */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-xs">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                ForgeFlow <span className="text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900">Developer Workspace</span>
              </h1>
            </div>
          </div>

          {user && activeProject && (
            <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-400 font-medium">Active:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[160px]">{activeProject.name}</span>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono px-1.5 py-0.5 rounded">
                Stage {activeProject.currentStage || 'IDEA'}
              </span>
            </div>
          )}
        </div>

        {/* Right User Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-2.5">
              {/* GitHub Status Badge */}
              <div
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium transition ${
                  user.githubConnected
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
                title={user.githubConnected ? `Connected as @${user.githubUsername}` : 'GitHub Disconnected'}
              >
                <Github className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-mono">
                  {user.githubConnected ? `@${user.githubUsername}` : 'Connect GitHub'}
                </span>
                {user.githubConnected && <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-0.5" />}
              </div>

              {/* Developer Profile */}
              <button
                onClick={onOpenOnboarding}
                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold transition"
                title="Developer Profile & Preferences"
              >
                {user.githubAvatarUrl ? (
                  <img src={user.githubAvatarUrl} alt={user.name} className="w-4 h-4 rounded-full" />
                ) : (
                  <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                )}
                <span className="max-w-[120px] truncate">{user.name}</span>
                <Settings className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>

              {/* Sign Out */}
              <button
                onClick={onSignOut}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition shadow-2xs"
            >
              Sign In / Create Account
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
