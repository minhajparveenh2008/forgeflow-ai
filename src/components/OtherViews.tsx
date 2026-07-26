import React, { useState } from 'react';
import { Project, UserProfile } from '../types';
import { OtherTab } from './Sidebar';
import { api } from '../lib/api';
import {
  FolderGit2,
  Github,
  FileCode2,
  Activity,
  Settings,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Shield,
  Code2,
  Terminal,
  RefreshCw,
  User,
  Check,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';

interface OtherViewsProps {
  activeTab: OtherTab;
  user: UserProfile;
  projects: Project[];
  activeProject: Project | null;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onSelectProject: (project: Project) => void;
  onNewProjectClick: () => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onUpdateProject: (updatedProject: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export const OtherViews: React.FC<OtherViewsProps> = ({
  activeTab,
  user,
  projects,
  activeProject,
  theme = 'light',
  onToggleTheme,
  onSelectProject,
  onNewProjectClick,
  onUpdateUser,
  onUpdateProject,
  onDeleteProject,
}) => {
  // GitHub Connect URL / Username State
  const [githubInput, setGithubInput] = useState<string>(
    user.githubConnected && user.githubUsername ? `https://github.com/${user.githubUsername}` : ''
  );
  const [githubLoading, setGithubLoading] = useState<boolean>(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubSuccess, setGithubSuccess] = useState<string | null>(null);

  const handleConnectGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubInput.trim()) return;

    setGithubLoading(true);
    setGithubError(null);
    setGithubSuccess(null);

    try {
      // Clean input URL or username
      let username = githubInput.trim().replace(/^@/, '');
      if (username.startsWith('http://') || username.startsWith('https://')) {
        try {
          const url = new URL(username);
          const parts = url.pathname.split('/').filter(Boolean);
          if (parts.length > 0) {
            username = parts[0];
          }
        } catch (e) {
          // ignore
        }
      }

      const res = await api.auth.connectGithubToken('gho_simulated_token', username);
      onUpdateUser(res.user);
      setGithubSuccess(`Successfully connected to GitHub account @${res.user.githubUsername}`);
    } catch (err: any) {
      setGithubError(err.message || 'Failed to connect GitHub account.');
    } finally {
      setGithubLoading(false);
    }
  };

  const handleDisconnectGithub = async () => {
    try {
      const res = await api.auth.disconnectGithub();
      onUpdateUser(res.user);
      setGithubSuccess('GitHub account disconnected.');
      setGithubInput('');
    } catch (err: any) {
      setGithubError(err.message || 'Failed to disconnect GitHub.');
    }
  };

  if (activeTab === 'projects') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your Projects</h2>
            <p className="text-xs text-slate-500 mt-1">
              Private isolated developer workspace projects. Manage, switch, or create new projects.
            </p>
          </div>
          <button
            onClick={onNewProjectClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No Projects Created Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Turn your first software idea into a complete production project across all 9 workflow stages.
              </p>
            </div>
            <button
              onClick={onNewProjectClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => {
              const isSelected = activeProject?.id === p.id;
              return (
                <div
                  key={p.id}
                  className={`bg-white border rounded-2xl p-5 space-y-4 transition shadow-2xs flex flex-col justify-between ${
                    isSelected ? 'border-indigo-600 ring-2 ring-indigo-600/10' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900">{p.name}</h3>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Stage: {p.currentStage || 'IDEA'}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                          Active
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {p.description || p.idea}
                    </p>

                    {p.technologies && p.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {p.technologies.map((t, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] font-mono px-2 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {(p.deployment?.liveUrl || p.deploymentUrl) && !p.deployment?.noPublicUrlReturned && (
                      <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-emerald-950 text-[11px] truncate">
                            Live App
                          </span>
                        </div>
                        <a
                          href={p.deployment?.liveUrl || p.deploymentUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] flex items-center gap-1 shrink-0"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => onSelectProject(p)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                        isSelected
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {isSelected ? 'Currently Active' : 'Open Workspace'}
                    </button>

                    <button
                      onClick={() => onDeleteProject(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'github') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">GitHub Integration</h2>
          <p className="text-xs text-slate-500 mt-1">
            Connect your GitHub profile or repository URL to push project source code and verify commits.
          </p>
        </div>

        {githubError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{githubError}</span>
          </div>
        )}

        {githubSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{githubSuccess}</span>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">GitHub Account Connection</h3>
                <p className="text-xs text-slate-500">Simple URL or username connection</p>
              </div>
            </div>

            {user.githubConnected ? (
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Connected @{user.githubUsername}</span>
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Disconnected</span>
              </span>
            )}
          </div>

          <form onSubmit={handleConnectGithub} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter GitHub Profile or Repository URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="https://github.com/username or @username"
                  value={githubInput}
                  onChange={(e) => setGithubInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                />
                <button
                  type="submit"
                  disabled={githubLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  {githubLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{user.githubConnected ? 'Update Connection' : 'Connect GitHub'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Example: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">https://github.com/developer</code> or <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">@developer</code>
              </p>
            </div>
          </form>

          {user.githubConnected && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-600 font-mono">
                <span>Account: @{user.githubUsername}</span>
                <a
                  href={`https://github.com/${user.githubUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Open Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <button
                onClick={handleDisconnectGithub}
                className="text-rose-600 hover:text-rose-700 font-semibold"
              >
                Disconnect GitHub Account
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'artifacts') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Project Artifacts</h2>
          <p className="text-xs text-slate-500 mt-1">
            Generated documentation, architectural specs, test reports, and resume bullet points.
          </p>
        </div>

        {!activeProject ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
            Select an active project to view or generate artifacts.
          </div>
        ) : !activeProject.artifacts || activeProject.artifacts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
            <FileCode2 className="w-8 h-8 text-indigo-600 mx-auto" />
            <h3 className="font-bold text-sm text-slate-900">No Artifacts Generated Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Artifacts are created during Stage 7 (Prepare) & Stage 8 (Showcase) as you develop your project.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeProject.artifacts.map((art) => (
              <div key={art.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-sm text-slate-900">{art.title}</span>
                  <span className="bg-indigo-50 text-indigo-700 font-mono text-[10px] font-semibold px-2 py-0.5 rounded border border-indigo-200">
                    {art.type}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-800 max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {art.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'activity') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Workspace Activity & Execution Logs</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time pipeline logs for test verification, security audits, GitHub sync, and Cloud deployment.
          </p>
        </div>

        {!activeProject ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
            Select an active project to view real-time logs.
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 font-mono text-xs text-slate-200 space-y-3 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Live System Activity Stream — {activeProject.name}</span>
              </div>
              <span className="text-emerald-400 font-bold">Active</span>
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto leading-relaxed">
              <div className="text-slate-400">[System] Initialized user-isolated workspace for user {user.email}</div>
              <div className="text-slate-400">[Project] Active project: {activeProject.name} (Stage: {activeProject.currentStage})</div>
              {activeProject.githubSync?.connected && (
                <div className="text-emerald-400">
                  [GitHub] Synced repo: {activeProject.githubSync.repoOwner}/{activeProject.githubSync.repoName} (Commit SHA: {activeProject.githubSync.lastCommitSha?.slice(0, 7)})
                </div>
              )}
              {activeProject.deployment?.liveUrl && (
                <div className="text-indigo-400">
                  [Deploy] Verified Cloud Run URL: {activeProject.deployment.liveUrl}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'settings') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Developer Settings</h2>
          <p className="text-xs text-slate-500 mt-1">
            Account preferences, security isolation mode, and environment configuration.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-2xs">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">{user.name}</h3>
              <p className="text-xs text-slate-500 font-mono">{user.email}</p>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Strict User Data Isolation Active</span>
            </div>
            <p className="text-emerald-800 leading-relaxed">
              Your account operates within a completely separate database space. Zero shared mock data, zero public access to project source code.
            </p>
          </div>

          <div className="space-y-2 text-xs pt-4 border-t border-slate-100">
            <span className="font-semibold text-slate-700 block">Appearance & Workspace Theme</span>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
              <div>
                <span className="font-bold text-slate-900 text-xs block">Interface Style</span>
                <span className="text-[11px] text-slate-500">Toggle between light and dark visual themes</span>
              </div>
              <button
                onClick={onToggleTheme}
                className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800 transition shadow-2xs"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Dark Mode Active</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-600" />
                    <span>Light Mode Active</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <span className="font-semibold text-slate-700 block">Developer Skills & Interests</span>
            <div className="flex flex-wrap gap-1.5">
              {user.skills.map((s, idx) => (
                <span key={idx} className="bg-slate-100 text-slate-700 font-mono px-2.5 py-1 rounded-lg border border-slate-200">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
