import React, { useState, useEffect } from 'react';
import { Project, UserProfile, JobProgress, GitHubRepo } from '../../types';
import { api } from '../../lib/api';
import {
  Rocket,
  Github,
  Terminal,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Globe,
  FolderGit2,
  Play,
  ExternalLink,
  Check,
  Zap,
  Copy,
} from 'lucide-react';

interface DeployViewProps {
  project: Project;
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onUpdateProject: (project: Project) => void;
}

export const DeployView: React.FC<DeployViewProps> = ({
  project,
  user,
  onUpdateUser,
  onUpdateProject,
}) => {
  const [tokenInput, setTokenInput] = useState<string>('');
  const [showManualToken, setShowManualToken] = useState<boolean>(false);
  const [showOauthConfig, setShowOauthConfig] = useState<boolean>(false);
  const [appClientId, setAppClientId] = useState<string>('');
  const [appClientSecret, setAppClientSecret] = useState<string>('');
  const [callbackUrlInfo, setCallbackUrlInfo] = useState<string>('');
  const [copiedCallback, setCopiedCallback] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>(project.githubRepo || '');
  const [newRepoName, setNewRepoName] = useState<string>(
    project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
  );
  const [newRepoDesc, setNewRepoDesc] = useState<string>(
    `Repository for ${project.name}`
  );
  const [isRepoPrivate, setIsRepoPrivate] = useState<boolean>(false);
  const [showCreateRepo, setShowCreateRepo] = useState<boolean>(false);

  // Active Job & Pipeline state
  const [activeTab, setActiveTab] = useState<'push' | 'deploy' | 'pushAndDeploy'>('pushAndDeploy');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobState, setJobState] = useState<JobProgress | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch GitHub repos if user connected
  useEffect(() => {
    if (user.githubConnected) {
      api.github
        .getRepos()
        .then((res) => {
          setRepos(res.repos || []);
          if (!selectedRepo && res.repos && res.repos.length > 0) {
            setSelectedRepo(res.repos[0].fullName || `${res.repos[0].owner}/${res.repos[0].name}`);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [user.githubConnected]);

  // Poll job status
  useEffect(() => {
    if (!activeJobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.jobs.get(activeJobId);
        setJobState(res.job);

        if (res.job.status === 'COMPLETED' || res.job.status === 'FAILED') {
          clearInterval(interval);
          const projRes = await api.projects.get(project.id);
          onUpdateProject(projRes.project);
        }
      } catch (err) {
        console.error(err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeJobId, project.id]);

  // 1-Click GitHub OAuth Flow
  const handleConnectGithubOAuth = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const authInfo = await api.github.getAuthUrl();
      setCallbackUrlInfo(authInfo.callbackUrl);

      if (authInfo.configured && authInfo.url) {
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;

        const popup = window.open(
          authInfo.url,
          'github_oauth',
          `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
        );

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          window.location.href = authInfo.url;
          return;
        }

        const handleMessage = async (event: MessageEvent) => {
          if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.username) {
            window.removeEventListener('message', handleMessage);
            try {
              const userRes = await api.auth.connectGithubToken(event.data.token, event.data.username);
              onUpdateUser(userRes.user);
              setSuccessMsg(`✓ Connected to GitHub as @${userRes.user.githubUsername}`);
              const repoRes = await api.github.getRepos();
              setRepos(repoRes.repos || []);
            } catch (err: any) {
              setError(err.message || 'Failed to save GitHub authorization.');
            } finally {
              setLoading(false);
            }
          } else if (event.data?.type === 'OAUTH_AUTH_FAILURE') {
            window.removeEventListener('message', handleMessage);
            setError(event.data.error || 'GitHub authorization failed.');
            setLoading(false);
          }
        };

        window.addEventListener('message', handleMessage);
      } else {
        setShowOauthConfig(true);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch GitHub authorization URL.');
      setLoading(false);
    }
  };

  // App Owner saves OAuth Credentials
  const handleSaveOauthCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appClientId.trim() || !appClientSecret.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await api.github.saveOauthConfig(appClientId.trim(), appClientSecret.trim());
      setSuccessMsg('✓ GitHub OAuth credentials saved! Redirecting to GitHub authorization...');
      setShowOauthConfig(false);
      handleConnectGithubOAuth();
    } catch (err: any) {
      setError(err.message || 'Failed to save GitHub OAuth credentials.');
      setLoading(false);
    }
  };

  // Manual Token Option (Advanced/Testing)
  const handleConnectManualToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const userRes = await api.auth.connectGithubToken(tokenInput.trim());
      onUpdateUser(userRes.user);
      setSuccessMsg(`✓ Connected to GitHub as @${userRes.user.githubUsername}`);
      const repoRes = await api.github.getRepos();
      setRepos(repoRes.repos || []);
    } catch (err: any) {
      setError(err.message || 'Failed to connect with Personal Access Token.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectGithub = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.disconnectGithub();
      onUpdateUser(res.user);
      setRepos([]);
      setSelectedRepo('');
      setSuccessMsg('Disconnected GitHub account.');
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect GitHub account.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRepo = async () => {
    if (!newRepoName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.github.createRepo({
        name: newRepoName.trim(),
        description: newRepoDesc.trim(),
        isPrivate: isRepoPrivate,
      });
      const fullName = `${res.repo.owner}/${res.repo.name}`;
      setSelectedRepo(fullName);
      setShowCreateRepo(false);
      setRepos((prev) => [res.repo, ...prev]);
      setSuccessMsg(`✓ Created repository on GitHub: ${fullName}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create repository on GitHub.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartJob = async (type: 'push' | 'deploy' | 'pushAndDeploy') => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let owner: string | undefined;
      let repo: string | undefined;

      if (selectedRepo.includes('/')) {
        [owner, repo] = selectedRepo.split('/');
      }

      let resJobId = '';
      if (type === 'push') {
        const res = await api.projects.githubPush(project.id, owner, repo);
        resJobId = res.jobId;
      } else if (type === 'deploy') {
        const res = await api.projects.deploy(project.id);
        resJobId = res.jobId;
      } else if (type === 'pushAndDeploy') {
        const res = await api.projects.githubAndDeploy(project.id, owner, repo);
        resJobId = res.jobId;
      }

      setActiveJobId(resJobId);
    } catch (err: any) {
      setError(err.message || 'Pipeline trigger failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner Dashboard Context */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{project.name}</h2>
              <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
                Stage 9: Deploy
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
              Push your project source code to GitHub and launch a live Cloud Run deployment.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (!user.githubConnected) {
              handleConnectGithubOAuth();
            } else {
              handleStartJob('pushAndDeploy');
            }
          }}
          disabled={jobState?.status === 'RUNNING'}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-2xs shrink-0 self-start md:self-auto disabled:opacity-50 cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          <span>Push & Deploy Project</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STEP 1: GITHUB CONNECTION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">1. GitHub Connection</h3>
          </div>

          {user.githubConnected ? (
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Connected: @{user.githubUsername}</span>
            </span>
          ) : (
            <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Not Connected</span>
            </span>
          )}
        </div>

        {!user.githubConnected ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Authorize ForgeFlow AI with 1-click to connect your GitHub account, list your repositories, and push source code directly.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleConnectGithubOAuth}
                disabled={loading}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-xs disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                <span>Connect GitHub</span>
              </button>

              {!showOauthConfig && (
                <button
                  type="button"
                  onClick={() => {
                    setShowOauthConfig(true);
                    api.github.getAuthUrl().then((res) => setCallbackUrlInfo(res.callbackUrl)).catch(() => {});
                  }}
                  className="text-[11px] text-slate-500 hover:text-indigo-600 underline font-medium"
                >
                  App Owner One-Time Setup Info
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowManualToken(!showManualToken)}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline ml-auto"
              >
                {showManualToken ? 'Hide Personal Token Option' : 'Developer Personal Access Token Option'}
              </button>
            </div>

            {/* MANUAL TOKEN OPTION (DEVELOPER ONLY) */}
            {showManualToken && (
              <form onSubmit={handleConnectManualToken} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <span className="font-bold text-slate-900 block">Personal Access Token (Developer Option)</span>
                <input
                  type="password"
                  required
                  placeholder="ghp_xxxxxxxxxxxx or github_pat_..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 outline-none focus:border-indigo-600"
                />
                <button
                  type="submit"
                  disabled={loading || !tokenInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs"
                >
                  Connect with Token
                </button>
              </form>
            )}

            {/* ONE-TIME APP OWNER CONFIGURATION CARD */}
            {showOauthConfig && (
              <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Github className="w-4 h-4 text-indigo-600" />
                    <span>App Owner One-Time OAuth Setup</span>
                  </div>
                  <button
                    onClick={() => setShowOauthConfig(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕ Close
                  </button>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  To enable 1-click GitHub authorization for yourself and all app users, register a free OAuth Application in <strong className="text-slate-900">GitHub Settings → Developer Settings → OAuth Apps</strong> with the callback URL below:
                </p>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                  <code className="text-[11px] font-mono text-indigo-700 truncate">{callbackUrlInfo || `${window.location.origin}/auth/callback/github`}</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(callbackUrlInfo || `${window.location.origin}/auth/callback/github`);
                      setCopiedCallback(true);
                      setTimeout(() => setCopiedCallback(false), 2000);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shrink-0"
                  >
                    {copiedCallback ? '✓ Copied' : 'Copy Callback URL'}
                  </button>
                </div>

                <form onSubmit={handleSaveOauthCredentials} className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">GitHub Client ID</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ov23..."
                        value={appClientId}
                        onChange={(e) => setAppClientId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-900 outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">GitHub Client Secret</label>
                      <input
                        type="password"
                        required
                        placeholder="e.g. 7f8a9b..."
                        value={appClientSecret}
                        onChange={(e) => setAppClientSecret(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-900 outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={loading || !appClientId.trim() || !appClientSecret.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-2xs disabled:opacity-50"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>Save Credentials & Launch OAuth</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* CONNECTED STATE & REPOSITORY SELECTION */
          <div className="space-y-4 text-xs">
            {/* Connected User Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                {user.githubAvatarUrl ? (
                  <img src={user.githubAvatarUrl} alt={user.githubUsername} className="w-9 h-9 rounded-full border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                    <Github className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                    <span>@{user.githubUsername}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-[11px] text-slate-500 block">Connected to GitHub REST API</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDisconnectGithub}
                disabled={loading}
                className="bg-white border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition self-start sm:self-auto"
              >
                Disconnect Account
              </button>
            </div>

            {/* STEP 2: REPOSITORY SELECTION OR CREATION */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-slate-900 font-bold text-sm">2. Target GitHub Repository</label>
                <button
                  type="button"
                  onClick={() => setShowCreateRepo(!showCreateRepo)}
                  className="text-indigo-600 hover:underline font-semibold flex items-center gap-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Repository</span>
                </button>
              </div>

              {showCreateRepo ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="font-bold text-slate-900 block text-xs">Create New Repository on GitHub</span>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="repository-name"
                      value={newRepoName}
                      onChange={(e) => setNewRepoName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs outline-none focus:border-indigo-600"
                    />
                    <input
                      type="text"
                      placeholder="Repository description"
                      value={newRepoDesc}
                      onChange={(e) => setNewRepoDesc(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-indigo-600"
                    />
                    <label className="flex items-center gap-2 text-slate-700 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={isRepoPrivate}
                        onChange={(e) => setIsRepoPrivate(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600"
                      />
                      <span>Make repository private</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCreateRepo(false)}
                      className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateRepo}
                      disabled={loading || !newRepoName.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-xl text-xs disabled:opacity-50"
                    >
                      Create & Select Repository
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono text-xs outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="">-- Choose Repository from @{user.githubUsername} --</option>
                    {repos.map((r) => {
                      const fullName = r.fullName || `${r.owner}/${r.name}`;
                      return (
                        <option key={fullName} value={fullName}>
                          {fullName} ({r.isPrivate ? 'Private' : 'Public'})
                        </option>
                      );
                    })}
                    {project.githubRepo &&
                      !repos.some((r) => (r.fullName || `${r.owner}/${r.name}`) === project.githubRepo) && (
                        <option value={project.githubRepo}>{project.githubRepo}</option>
                      )}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* WORKFLOW LAUNCHER & INDEPENDENT CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-2xs">
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pushAndDeploy')}
            className={`flex-1 py-2.5 rounded-lg transition ${
              activeTab === 'pushAndDeploy'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Push & Deploy Pipeline
          </button>
          <button
            onClick={() => setActiveTab('push')}
            className={`flex-1 py-2.5 rounded-lg transition ${
              activeTab === 'push'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Push to GitHub
          </button>
          <button
            onClick={() => setActiveTab('deploy')}
            className={`flex-1 py-2.5 rounded-lg transition ${
              activeTab === 'deploy'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Deploy Application
          </button>
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {activeTab === 'pushAndDeploy' && 'Push Project Source Code & Deploy Application'}
              {activeTab === 'push' && 'Push Project Source Code to GitHub'}
              {activeTab === 'deploy' && 'Deploy Application'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'pushAndDeploy' &&
                'Pushes actual source code, creates commit, and deploys live Cloud Run application.'}
              {activeTab === 'push' &&
                'Packages project source files, creates Git commit, and verifies on GitHub repository.'}
              {activeTab === 'deploy' &&
                'Builds production bundle and provisions live Google Cloud Run URL.'}
            </p>
          </div>

          <button
            onClick={() => {
              if (activeTab !== 'deploy' && !user.githubConnected) {
                handleConnectGithubOAuth();
              } else {
                handleStartJob(activeTab);
              }
            }}
            disabled={
              jobState?.status === 'RUNNING' ||
              (activeTab !== 'deploy' && user.githubConnected && !selectedRepo)
            }
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {jobState?.status === 'RUNNING' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing Pipeline...</span>
              </>
            ) : !user.githubConnected && activeTab !== 'deploy' ? (
              <>
                <Github className="w-4 h-4" />
                <span>Connect GitHub</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>
                  {activeTab === 'pushAndDeploy' && 'Start Push & Deploy'}
                  {activeTab === 'push' && 'Push to GitHub'}
                  {activeTab === 'deploy' && 'Deploy Application'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Real-time Job Progress Indicator */}
        {jobState && (
          <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-900">{jobState.currentStep}</span>
              <span className="text-indigo-600 font-bold">{jobState.progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${jobState.progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* VERIFIED GITHUB REPOSITORY RESULT */}
        {project.githubSync?.verified && project.githubSync?.repoUrl ? (
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <span className="text-emerald-950 font-bold text-sm block">✓ Complete GitHub Push Successful</span>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-emerald-900 font-mono text-[11px] pt-1">
                  <div>
                    <span className="text-emerald-700 block text-[10px] uppercase tracking-wider font-semibold">Repository</span>
                    <span className="font-bold text-emerald-950">@{project.githubSync.repoOwner}/{project.githubSync.repoName}</span>
                  </div>

                  {project.githubSync.filesPushed !== undefined && (
                    <div>
                      <span className="text-emerald-700 block text-[10px] uppercase tracking-wider font-semibold">Files Pushed</span>
                      <span className="font-bold text-emerald-950">{project.githubSync.filesPushed}</span>
                    </div>
                  )}

                  {project.githubSync.foldersPushed !== undefined && (
                    <div>
                      <span className="text-emerald-700 block text-[10px] uppercase tracking-wider font-semibold">Folders Pushed</span>
                      <span className="font-bold text-emerald-950">{project.githubSync.foldersPushed}</span>
                    </div>
                  )}

                  {project.githubSync.lastCommitSha && (
                    <div>
                      <span className="text-emerald-700 block text-[10px] uppercase tracking-wider font-semibold">Commit SHA</span>
                      <span className="font-semibold text-emerald-950">{project.githubSync.lastCommitSha}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <a
              href={project.githubSync.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl transition inline-flex items-center justify-center gap-1.5 text-xs shrink-0 shadow-2xs"
            >
              <span>Open Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : jobState?.status === 'FAILED' && activeTab !== 'deploy' ? (
          <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl space-y-3 text-xs">
            <div className="flex items-center gap-2 text-rose-950 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>GitHub push verification failed.</span>
            </div>
            <div className="text-rose-900 font-mono text-[11px] pl-7 space-y-2">
              <span className="font-semibold block text-rose-700">Reason:</span>
              <div className="bg-rose-100/60 p-2.5 rounded-lg border border-rose-200 text-rose-900 leading-relaxed font-mono">
                {jobState.error || 'A valid GitHub connection is required.'}
              </div>
              
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleConnectGithubOAuth}
                  disabled={loading}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-2xs cursor-pointer"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                  <span>Connect GitHub</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* SINGLE LIVE DEPLOYMENT CARD */}
        <div className="bg-slate-900 text-white border border-slate-800 p-6 rounded-2xl space-y-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                <span>LIVE DEPLOYMENT</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Google Cloud Run deployment status and verified live application URL
              </p>
            </div>

            {(() => {
              const isProtected =
                project.deployment?.status === 'workspace_protected' ||
                project.deployment?.isWorkspaceProtected ||
                project.deployment?.canonicalUrl?.includes('ais-dev-');

              const isLive = project.deployment?.status === 'live' && !isProtected;
              const isDeploying = project.deployment?.status === 'building' || project.deployment?.status === 'deploying';

              return (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    isLive
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : isProtected
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : isDeploying
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isLive
                    ? 'PUBLIC LIVE (VERIFIED)'
                    : isProtected
                    ? 'DEV SANDBOX (AI STUDIO AUTH REQUIRED)'
                    : isDeploying
                    ? 'DEPLOYING'
                    : 'NOT DEPLOYED'}
                </span>
              );
            })()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block font-sans">Provider</span>
              <strong className="text-slate-200 text-sm font-sans">{project.deployment?.provider || 'Google Cloud Run'}</strong>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block font-sans">Deployment ID</span>
              <strong className="text-indigo-300 text-xs font-mono block truncate">{project.deployment?.deploymentId || 'N/A'}</strong>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl space-y-1 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block font-sans">
                  {project.deployment?.isWorkspaceProtected || project.deployment?.canonicalUrl?.includes('ais-dev-')
                    ? 'Live Application URL (Internal Workspace Sandbox)'
                    : 'Live Application URL'}
                </span>
                {(project.deployment?.canonicalUrl || project.deployment?.liveUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      const url = project.deployment?.canonicalUrl || project.deployment?.liveUrl || '';
                      navigator.clipboard.writeText(url);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 font-sans cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copied URL!' : 'Copy URL'}</span>
                  </button>
                )}
              </div>
              {project.deployment?.canonicalUrl || project.deployment?.liveUrl ? (
                <a
                  href={project.deployment?.canonicalUrl || project.deployment?.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline font-bold text-sm truncate block mt-1"
                >
                  {project.deployment?.canonicalUrl || project.deployment?.liveUrl}
                </a>
              ) : (
                <span className="text-slate-500 italic text-xs block mt-1 font-sans">
                  Click [Deploy] or [Push & Deploy] above to deploy and get your live URL.
                </span>
              )}
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl space-y-1 md:col-span-2">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block font-sans">Health Check Verification</span>
              <div className="flex items-center gap-2 mt-1 font-sans">
                {project.deployment?.healthCheckPassed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-emerald-400 font-bold text-xs font-mono">
                      {project.deployment?.healthCheckStatus || 'PASSED (200 OK)'}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-slate-300 font-semibold text-xs font-mono">
                      {project.deployment?.healthCheckStatus || 'PENDING DEPLOYMENT'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {(project.deployment?.isWorkspaceProtected || project.deployment?.canonicalUrl?.includes('ais-dev-')) && (
            <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-xl text-xs space-y-1.5 font-sans">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Internal AI Studio Sandbox Notice</span>
              </div>
              <p className="text-amber-200/90 leading-relaxed">
                This URL is hosted on your internal AI Studio dev container. It opens ForgeFlow AI directly for logged-in members of your AI Studio workspace. Unauthenticated external visitors opening this URL will be redirected to the Google AI Studio login/security cookie page.
              </p>
            </div>
          )}

          {(project.deployment?.canonicalUrl || project.deployment?.liveUrl) && (
            <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-slate-800">
              <a
                href={project.deployment?.canonicalUrl || project.deployment?.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl transition inline-flex items-center gap-2 text-xs shadow-md cursor-pointer font-sans"
              >
                <span>
                  {project.deployment?.isWorkspaceProtected || project.deployment?.canonicalUrl?.includes('ais-dev-')
                    ? 'Open Sandbox Application'
                    : 'Open Live Application'}
                </span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => {
                  const url = project.deployment?.canonicalUrl || project.deployment?.liveUrl || '';
                  navigator.clipboard.writeText(url);
                  setCopiedUrl(true);
                  setTimeout(() => setCopiedUrl(false), 2000);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-xl transition inline-flex items-center gap-2 text-xs border border-slate-700 cursor-pointer font-sans"
              >
                {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedUrl ? 'Copied!' : 'Copy URL'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Live Terminal Output */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2 text-slate-100 shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pipeline Logs</span>
            </div>
            {jobState && <span className="text-indigo-400 font-semibold">{jobState.status}</span>}
          </div>

          <div className="space-y-1 max-h-56 overflow-y-auto leading-relaxed text-slate-300">
            {jobState?.logs && jobState.logs.length > 0 ? (
              jobState.logs.map((log, idx) => <div key={idx}>{log}</div>)
            ) : (
              <div className="text-slate-500 italic">No output yet. Trigger pipeline above.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
