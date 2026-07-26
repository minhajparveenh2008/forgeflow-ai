import React, { useState, useEffect } from 'react';
import { UserProfile, Project, ProjectStage } from './types';
import { api, getAuthToken, setAuthToken } from './lib/api';

import { Header } from './components/Header';
import { Sidebar, OtherTab } from './components/Sidebar';
import { OtherViews } from './components/OtherViews';
import { AuthModal } from './components/AuthModal';
import { OnboardingModal } from './components/OnboardingModal';
import { StageNavigator } from './components/StageNavigator';

import { IdeaView } from './components/views/IdeaView';
import { PlanView } from './components/views/PlanView';
import { BuildView } from './components/views/BuildView';
import { VerifyView } from './components/views/VerifyView';
import { UnderstandView } from './components/views/UnderstandView';
import { GrowView } from './components/views/GrowView';
import { PrepareView } from './components/views/PrepareView';
import { ShowcaseView } from './components/views/ShowcaseView';
import { DeployView } from './components/views/DeployView';

import { Terminal, Plus, FolderGit2, Shield, Lock, AlertCircle } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeStage, setActiveStage] = useState<ProjectStage>('IDEA');
  const [activeOtherTab, setActiveOtherTab] = useState<OtherTab | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('forgeflow_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('forgeflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Initialize Auth & Projects
  useEffect(() => {
    async function init() {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const meRes = await api.auth.me();
        setUser(meRes.user);

        const projRes = await api.projects.list();
        setProjects(projRes.projects || []);
        if (projRes.projects && projRes.projects.length > 0) {
          setActiveProject(projRes.projects[0]);
          setActiveStage(projRes.projects[0].currentStage || 'IDEA');
        }
      } catch (err) {
        console.error('Session restore failed:', err);
        setAuthToken('');
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const handleAuthSuccess = async (authUser: UserProfile) => {
    setUser(authUser);
    try {
      const projRes = await api.projects.list();
      setProjects(projRes.projects || []);
      if (projRes.projects && projRes.projects.length > 0) {
        setActiveProject(projRes.projects[0]);
        setActiveStage(projRes.projects[0].currentStage || 'IDEA');
      } else {
        setActiveProject(null);
        setActiveStage('IDEA');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    try {
      await api.auth.signout();
    } catch (e) {
      // ignore
    }
    setAuthToken('');
    setUser(null);
    setProjects([]);
    setActiveProject(null);
  };

  const handleSelectProject = (project: Project) => {
    setActiveProject(project);
    setActiveStage(project.currentStage || 'IDEA');
    setActiveOtherTab(null);
  };

  const handleSelectStage = async (stage: ProjectStage) => {
    setActiveStage(stage);
    setActiveOtherTab(null);
    if (activeProject) {
      try {
        const res = await api.projects.updateStage(activeProject.id, stage);
        setActiveProject(res.project);
        setProjects((prev) => prev.map((p) => (p.id === res.project.id ? res.project : p)));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    setActiveProject(newProject);
    setActiveStage('PLAN');
    setActiveOtherTab(null);
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setActiveProject(updatedProject);
    setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await api.projects.delete(projectId);
      const remaining = projects.filter((p) => p.id !== projectId);
      setProjects(remaining);
      if (activeProject?.id === projectId) {
        if (remaining.length > 0) {
          setActiveProject(remaining[0]);
          setActiveStage(remaining[0].currentStage || 'IDEA');
        } else {
          setActiveProject(null);
          setActiveStage('IDEA');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl border border-indigo-100 mb-3 animate-pulse">
          <Terminal className="w-8 h-8" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Loading Developer Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Header */}
      <Header
        user={user}
        projects={projects}
        activeProject={activeProject}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSelectProject={handleSelectProject}
        onNewProjectClick={() => {
          setActiveProject(null);
          setActiveStage('IDEA');
          setActiveOtherTab(null);
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenOnboarding={() => setOnboardingOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Auth Modal & Developer Onboarding Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <OnboardingModal
        isOpen={onboardingOpen}
        user={user}
        onClose={() => setOnboardingOpen(false)}
        onUpdate={(updatedUser) => setUser(updatedUser)}
      />

      {/* Unauthenticated Landing View */}
      {!user ? (
        <main className="flex-1 max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center space-y-6">
          <div className="bg-indigo-50 text-indigo-600 p-5 rounded-3xl border border-indigo-100 shadow-2xs">
            <Terminal className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              ForgeFlow <span className="text-indigo-600">AI Developer Workspace</span>
            </h1>
            <p className="text-slate-600 text-sm max-w-lg mx-auto leading-relaxed">
              Private AI software workspace. Build, test, and deploy software across all 9 workflow stages.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-md w-full shadow-2xs space-y-4 text-xs text-left">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Strict User Data Isolation</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Every authenticated account operates within a completely separate private database space with zero shared projects, mock data, or pre-seeded accounts.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-2xs flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In / Create Private Account</span>
            </button>
          </div>
        </main>
      ) : (
        /* Authenticated Workspace Layout: Left Sidebar + Main Content */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Sidebar */}
          <Sidebar
            user={user}
            projects={projects}
            activeProject={activeProject}
            activeStage={activeStage}
            activeOtherTab={activeOtherTab}
            onSelectProject={handleSelectProject}
            onSelectStage={handleSelectStage}
            onSelectOtherTab={(tab) => setActiveOtherTab(tab)}
            onNewProjectClick={() => {
              setActiveProject(null);
              setActiveStage('IDEA');
              setActiveOtherTab(null);
            }}
          />

          {/* Main Workspace Canvas */}
          <main className="flex-1 overflow-y-auto flex flex-col bg-slate-50/50">
            {/* Top Stage Navigator for Active Stage View */}
            {activeOtherTab === null && (
              <StageNavigator
                currentStage={activeStage}
                onSelectStage={handleSelectStage}
              />
            )}

            <div className="flex-1 p-4 sm:p-6 lg:p-8">
              {activeOtherTab !== null ? (
                /* OTHER Tab Views: Projects, GitHub, Artifacts, Activity, Settings */
                <OtherViews
                  activeTab={activeOtherTab}
                  user={user}
                  projects={projects}
                  activeProject={activeProject}
                  theme={theme}
                  onToggleTheme={toggleTheme}
                  onSelectProject={handleSelectProject}
                  onNewProjectClick={() => {
                    setActiveProject(null);
                    setActiveStage('IDEA');
                    setActiveOtherTab(null);
                  }}
                  onUpdateUser={(updatedUser) => setUser(updatedUser)}
                  onUpdateProject={handleProjectUpdated}
                  onDeleteProject={handleDeleteProject}
                />
              ) : !activeProject && activeStage !== 'IDEA' ? (
                /* Prompt to Select or Create Project */
                <div className="max-w-md mx-auto text-center py-16 space-y-4 bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs">
                  <FolderGit2 className="w-10 h-10 text-indigo-600 mx-auto" />
                  <h2 className="text-lg font-bold text-slate-900">No Active Project Selected</h2>
                  <p className="text-slate-500 text-xs">
                    Create a new project or select an existing project from the left sidebar.
                  </p>
                  <button
                    onClick={() => {
                      setActiveStage('IDEA');
                      setActiveOtherTab(null);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Project in Stage 1</span>
                  </button>
                </div>
              ) : (
                /* Active Stage View */
                <>
                  {activeStage === 'IDEA' && (
                    <IdeaView
                      project={activeProject}
                      onProjectCreated={handleProjectCreated}
                      onProceedToPlan={() => handleSelectStage('PLAN')}
                    />
                  )}

                  {activeStage === 'PLAN' && activeProject && (
                    <PlanView
                      project={activeProject}
                      onUpdateProject={handleProjectUpdated}
                      onProceedToBuild={() => handleSelectStage('BUILD')}
                    />
                  )}

                  {activeStage === 'BUILD' && activeProject && (
                    <BuildView
                      project={activeProject}
                      onUpdateProject={handleProjectUpdated}
                      onProceedToVerify={() => handleSelectStage('VERIFY')}
                    />
                  )}

                  {activeStage === 'VERIFY' && activeProject && (
                    <VerifyView
                      project={activeProject}
                      onUpdateProject={handleProjectUpdated}
                      onProceedToUnderstand={() => handleSelectStage('UNDERSTAND')}
                    />
                  )}

                  {activeStage === 'UNDERSTAND' && activeProject && (
                    <UnderstandView
                      project={activeProject}
                      onUpdateProject={handleProjectUpdated}
                      onProceedToGrow={() => handleSelectStage('IMPROVE')}
                    />
                  )}

                  {activeStage === 'IMPROVE' && activeProject && (
                    <GrowView
                      project={activeProject}
                      onUpdateProject={handleProjectUpdated}
                      onProceedToPrepare={() => handleSelectStage('PREPARE')}
                    />
                  )}

                  {activeStage === 'PREPARE' && activeProject && (
                    <PrepareView
                      project={activeProject}
                      onUpdateProject={handleProjectUpdated}
                      onProceedToShowcase={() => handleSelectStage('SHOWCASE')}
                    />
                  )}

                  {activeStage === 'SHOWCASE' && activeProject && (
                    <ShowcaseView
                      project={activeProject}
                      onUpdateProject={handleProjectUpdated}
                      onProceedToDeploy={() => handleSelectStage('DEPLOY')}
                    />
                  )}

                  {activeStage === 'DEPLOY' && activeProject && (
                    <DeployView
                      project={activeProject}
                      user={user}
                      onUpdateUser={(updatedUser) => setUser(updatedUser)}
                      onUpdateProject={handleProjectUpdated}
                    />
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-center text-xs text-slate-500 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>ForgeFlow AI — Developer Workspace</span>
          <span className="font-mono text-[11px]">User Isolation Active • Powered by Google Gemini AI</span>
        </div>
      </footer>
    </div>
  );
}
export default App;
