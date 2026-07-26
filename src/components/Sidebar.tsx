import React from 'react';
import { Project, ProjectStage, UserProfile } from '../types';
import {
  Lightbulb,
  FileText,
  Code2,
  CheckCircle2,
  BrainCircuit,
  TrendingUp,
  GraduationCap,
  Sparkles,
  Rocket,
  FolderGit2,
  Github,
  FileCode2,
  Activity,
  Settings,
  Plus,
  ChevronDown,
  Layers,
} from 'lucide-react';

export type OtherTab = 'projects' | 'github' | 'artifacts' | 'activity' | 'settings';

interface SidebarProps {
  user: UserProfile | null;
  projects: Project[];
  activeProject: Project | null;
  activeStage: ProjectStage;
  activeOtherTab: OtherTab | null;
  onSelectProject: (project: Project) => void;
  onSelectStage: (stage: ProjectStage) => void;
  onSelectOtherTab: (tab: OtherTab) => void;
  onNewProjectClick: () => void;
}

const STAGES: { id: ProjectStage; num: number; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'IDEA', num: 1, label: 'Idea', icon: Lightbulb },
  { id: 'PLAN', num: 2, label: 'Plan', icon: FileText },
  { id: 'BUILD', num: 3, label: 'Build', icon: Code2 },
  { id: 'VERIFY', num: 4, label: 'Verify', icon: CheckCircle2 },
  { id: 'UNDERSTAND', num: 5, label: 'Understand', icon: BrainCircuit },
  { id: 'IMPROVE', num: 6, label: 'Improve', icon: TrendingUp },
  { id: 'PREPARE', num: 7, label: 'Prepare', icon: GraduationCap },
  { id: 'SHOWCASE', num: 8, label: 'Showcase', icon: Sparkles },
  { id: 'DEPLOY', num: 9, label: 'Deploy', icon: Rocket },
];

const OTHER_ITEMS: { id: OtherTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'github', label: 'GitHub', icon: Github },
  { id: 'artifacts', label: 'Artifacts', icon: FileCode2 },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  projects,
  activeProject,
  activeStage,
  activeOtherTab,
  onSelectProject,
  onSelectStage,
  onSelectOtherTab,
  onNewProjectClick,
}) => {
  const currentStageIndex = STAGES.findIndex((s) => s.id === activeStage);

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-[calc(100vh-57px)] sticky top-[57px] overflow-y-auto select-none transition-colors">
      <div className="p-4 space-y-6 flex-1">
        {/* SECTION 1: PROJECT */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase px-2">
            <span>Project</span>
            {activeProject && (
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900">
                Active
              </span>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {activeProject ? activeProject.name.slice(0, 2).toUpperCase() : 'FF'}
                </div>
                <div className="min-w-0 flex-1">
                  <select
                    value={activeProject?.id || ''}
                    onChange={(e) => {
                      if (e.target.value === 'NEW') {
                        onNewProjectClick();
                      } else {
                        const found = projects.find((p) => p.id === e.target.value);
                        if (found) onSelectProject(found);
                      }
                    }}
                    className="w-full bg-transparent font-semibold text-xs text-slate-900 dark:text-slate-100 outline-none cursor-pointer truncate"
                  >
                    {projects.length === 0 ? (
                      <option value="" disabled className="dark:bg-slate-900">No Projects Yet</option>
                    ) : (
                      projects.map((p) => (
                        <option key={p.id} value={p.id} className="dark:bg-slate-900">
                          {p.name}
                        </option>
                      ))
                    )}
                    <option value="NEW" className="text-indigo-600 font-bold dark:bg-slate-900">+ Create New Project...</option>
                  </select>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {activeProject ? activeProject.description : 'Select or create a project'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onNewProjectClick}
              className="w-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold text-xs py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: WORKFLOW */}
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase px-2 mb-2">
            Workflow
          </div>

          <div className="space-y-0.5">
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isActive = activeOtherTab === null && stage.id === activeStage;
              const isPassed = idx < currentStageIndex;

              return (
                <button
                  key={stage.id}
                  onClick={() => onSelectStage(stage.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition text-left ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-900 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span className="truncate">{stage.label}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {isPassed && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 animate-pulse" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: OTHER */}
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase px-2 mb-2">
            Other
          </div>

          <div className="space-y-0.5">
            {OTHER_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeOtherTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectOtherTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition text-left ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-900 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer status indicator in sidebar */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
        <span className="font-medium text-slate-700 dark:text-slate-300">ForgeFlow AI</span>
        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Ready
        </span>
      </div>
    </aside>
  );
};
