import React, { useState } from 'react';
import { Project } from '../../types';
import { api } from '../../lib/api';
import { TrendingUp, RefreshCw, CheckCircle2, Plus, ArrowRight, ShieldAlert, BookOpen, Target } from 'lucide-react';

interface GrowViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onProceedToPrepare: () => void;
}

export const GrowView: React.FC<GrowViewProps> = ({ project, onUpdateProject, onProceedToPrepare }) => {
  const [loading, setLoading] = useState(false);
  const [confirmSkillModal, setConfirmSkillModal] = useState<{ open: boolean; skill: string; impId?: string }>({
    open: false,
    skill: '',
  });
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const grow = project.growRecommendations;

  const handleGenerateGrow = async () => {
    setLoading(true);
    try {
      const res = await api.projects.grow(project.id);
      onUpdateProject(res.project);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSkillAdd = async () => {
    if (!confirmSkillModal.skill) return;
    setAdding(true);
    try {
      const res = await api.projects.confirmGrowSkill(project.id, confirmSkillModal.skill, confirmSkillModal.impId);
      setMsg(res.message);
      setConfirmSkillModal({ open: false, skill: '' });

      const projRes = await api.projects.get(project.id);
      onUpdateProject(projRes.project);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Stage 6: Developer Improvement & Project Growth</h2>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Identify knowledge gaps, security weaknesses, and recommended engineering challenges. AI recommendations require explicit user confirmation before updating your profile.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleGenerateGrow}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{grow ? 'Re-evaluate Growth' : 'Evaluate Growth Areas'}</span>
          </button>

          {grow && (
            <button
              onClick={onProceedToPrepare}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition"
            >
              <span>Proceed to Stage 7: Prepare</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {!grow && !loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-2xs">
          <TrendingUp className="w-10 h-10 text-indigo-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No Growth Recommendations Evaluated Yet</h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto">
            Click "Evaluate Growth Areas" to analyze knowledge gaps, weak technical areas, and proposed implementation challenges.
          </p>
          <button
            onClick={handleGenerateGrow}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs shadow-2xs"
          >
            Evaluate Growth Areas
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-slate-900 font-bold text-sm">Gemini AI is analyzing project code for technical gaps...</p>
        </div>
      )}

      {grow && !loading && (
        <div className="space-y-6">
          {/* Section 1: Gaps & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-600" />
                <span>Identified Knowledge Gaps & Weak Areas</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {grow.knowledgeGaps.map((gap, idx) => (
                  <li key={idx} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span>{gap}</span>
                    <button
                      onClick={() => setConfirmSkillModal({ open: true, skill: gap })}
                      className="bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-indigo-200 transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Skill</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Security & Performance Bottlenecks</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {grow.securityWeaknesses.map((sec, idx) => (
                  <li key={idx} className="bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-rose-800">
                    {sec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 2: Proposed Project Improvements */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Proposed Project Improvements</span>
            </h4>

            <div className="space-y-3 text-xs">
              {grow.projectImprovements.map((imp) => (
                <div key={imp.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{imp.title}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">{imp.complexity}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{imp.description}</p>
                  </div>

                  {imp.status === 'accepted' ? (
                    <span className="text-emerald-700 text-xs font-bold flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Accepted</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmSkillModal({ open: true, skill: imp.title, impId: imp.id })}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3.5 py-1.5 rounded-xl text-xs transition shrink-0 shadow-2xs"
                    >
                      Accept Improvement
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Explicit User Confirmation Modal */}
      {confirmSkillModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md text-slate-900 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Confirm Skill / Recommendation Addition</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to explicitly add "<strong>{confirmSkillModal.skill}</strong>" to your personal developer profile and workspace history?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmSkillModal({ open: false, skill: '' })}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSkillAdd}
                disabled={adding}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition"
              >
                {adding ? 'Adding...' : 'Confirm & Add to Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
