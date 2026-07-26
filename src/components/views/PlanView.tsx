import React, { useState } from 'react';
import { Project, ProjectPlan } from '../../types';
import { api } from '../../lib/api';
import { FileText, Sparkles, RefreshCw, Check, ArrowRight, Edit3, Database, Layers, CheckSquare } from 'lucide-react';

interface PlanViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onProceedToBuild: () => void;
}

export const PlanView: React.FC<PlanViewProps> = ({ project, onUpdateProject, onProceedToBuild }) => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [planData, setPlanData] = useState<ProjectPlan | null>(project.plan);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.projects.generatePlan(project.id);
      setPlanData(res.plan);
      onUpdateProject(res.project);
    } catch (err: any) {
      setError(err.message || 'Failed to generate plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!planData) return;
    setLoading(true);
    try {
      const res = await api.projects.savePlan(project.id, planData);
      onUpdateProject(res.project);
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Stage 2: AI Project Planning</h2>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Google Gemini AI analyzes your project prompt to generate comprehensive architecture specifications, database schemas, roadmap, and task breakdown.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{planData ? 'Regenerate Plan' : 'Generate AI Plan'}</span>
          </button>

          {planData && (
            <button
              onClick={onProceedToBuild}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition"
            >
              <span>Proceed to Build</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      {!planData && !loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-2xs">
          <Sparkles className="w-10 h-10 text-indigo-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No AI Plan Generated Yet</h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto">
            Click "Generate AI Plan" above to create an architectural specification for "{project.name}".
          </p>
          <button
            onClick={handleGeneratePlan}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs shadow-2xs"
          >
            Generate AI Project Plan
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-slate-900 font-bold text-sm">Gemini AI is analyzing project requirements...</p>
          <p className="text-slate-500 text-xs">Building system architecture, database design, and task breakdown.</p>
        </div>
      )}

      {planData && !loading && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-600">Architecture Plan active for <strong>{project.name}</strong></span>
            {editing ? (
              <button
                onClick={handleSavePlan}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 border border-slate-200 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Plan</span>
              </button>
            )}
          </div>

          {/* Section 1: Problem & Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Problem Statement</span>
              </h4>
              {editing ? (
                <textarea
                  rows={3}
                  value={planData.problemStatement}
                  onChange={(e) => setPlanData({ ...planData, problemStatement: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none"
                />
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {planData.problemStatement}
                </p>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                <span>Core Features</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {planData.coreFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 2: Database & Tech Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Database Design</span>
              </h4>
              <pre className="text-xs text-slate-800 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 whitespace-pre-wrap">
                {planData.databaseDesign}
              </pre>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Technology Recommendations</span>
              </h4>
              <div className="space-y-2">
                {planData.techRecommendations.map((tech, idx) => (
                  <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>{tech.name}</span>
                      <span className="text-indigo-600 text-[11px] font-mono">{tech.category}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1">{tech.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Roadmap & Tasks */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Development Roadmap & Task Breakdown</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {planData.developmentRoadmap.map((phase, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                  <span className="text-indigo-700 font-bold block">{phase.phase}: {phase.title}</span>
                  <ul className="space-y-1 text-slate-700 pl-3 list-disc">
                    {phase.tasks.map((t, tidx) => (
                      <li key={tidx}>{t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
