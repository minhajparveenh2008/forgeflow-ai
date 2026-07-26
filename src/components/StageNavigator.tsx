import React from 'react';
import { ProjectStage } from '../types';
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
} from 'lucide-react';

interface StageNavigatorProps {
  currentStage: ProjectStage;
  onSelectStage: (stage: ProjectStage) => void;
}

const STAGES: { id: ProjectStage; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'IDEA', label: '1. Idea', icon: Lightbulb },
  { id: 'PLAN', label: '2. Plan', icon: FileText },
  { id: 'BUILD', label: '3. Build', icon: Code2 },
  { id: 'VERIFY', label: '4. Verify', icon: CheckCircle2 },
  { id: 'UNDERSTAND', label: '5. Understand', icon: BrainCircuit },
  { id: 'IMPROVE', label: '6. Improve', icon: TrendingUp },
  { id: 'PREPARE', label: '7. Prepare', icon: GraduationCap },
  { id: 'SHOWCASE', label: '8. Showcase', icon: Sparkles },
  { id: 'DEPLOY', label: '9. Deploy', icon: Rocket },
];

export const StageNavigator: React.FC<StageNavigatorProps> = ({ currentStage, onSelectStage }) => {
  const currentIndex = STAGES.findIndex(s => s.id === currentStage);

  return (
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 overflow-x-auto select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 min-w-[850px]">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = stage.id === currentStage;
          const isPassed = idx < currentIndex;

          return (
            <React.Fragment key={stage.id}>
              <button
                onClick={() => onSelectStage(stage.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition whitespace-nowrap border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : isPassed
                    ? 'bg-white text-emerald-800 border-emerald-200 hover:bg-slate-100'
                    : 'bg-white text-slate-500 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : isPassed ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{stage.label}</span>
              </button>

              {idx < STAGES.length - 1 && (
                <div className={`h-0.5 w-3 rounded-full shrink-0 ${idx < currentIndex ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
