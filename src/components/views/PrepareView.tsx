import React, { useState } from 'react';
import { Project } from '../../types';
import { api } from '../../lib/api';
import { GraduationCap, RefreshCw, MessageSquare, ArrowRight, HelpCircle, Lightbulb, Copy, Check } from 'lucide-react';

interface PrepareViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onProceedToShowcase: () => void;
}

export const PrepareView: React.FC<PrepareViewProps> = ({ project, onUpdateProject, onProceedToShowcase }) => {
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const prep = project.interviewPrep;

  const pitches = prep
    ? {
        sec30: prep.pitches?.sec30 || prep.twoMinExplanation || `${project.name} is a software platform designed to streamline full-stack web applications.`,
        min2: prep.pitches?.min2 || prep.twoMinExplanation || `${project.name} provides a complete end-to-end workspace for developer ideation, AI planning, verification, and automated Cloud Run deployment.`,
        min5: prep.pitches?.min5 || prep.fiveMinExplanation || `${project.name} leverages React, Express, TypeScript, and Google Gemini AI to provide a multi-stage engineering pipeline with automated unit testing, security analysis, and GitHub synchronization.`,
      }
    : null;

  const architecturalTradeoffs = prep
    ? prep.architecturalTradeoffs ||
      (prep.techChoices || []).map((tc) => ({
        decision: tc.tech,
        rationale: tc.justification,
        tradeoff: 'Considered alternative service and runtime architectures.',
      }))
    : [];

  const interviewQa = prep
    ? prep.interviewQa ||
      (prep.questions || []).map((q) => ({
        category: q.category || 'General Architecture',
        question: q.question,
        modelAnswer: q.modelAnswer,
        keyPoints: q.keyPoints || [],
      }))
    : [];

  const handleGeneratePrep = async () => {
    setLoading(true);
    try {
      const res = await api.projects.interview(project.id);
      onUpdateProject(res.project);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Stage 7: Technical Interview Preparation</h2>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Equip yourself with tailored elevator pitches, architectural tradeoff rationale, and real technical Q&A model answers based on your source code.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleGeneratePrep}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{prep ? 'Regenerate Interview Guide' : 'Generate Interview Prep'}</span>
          </button>

          {prep && (
            <button
              onClick={onProceedToShowcase}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition"
            >
              <span>Proceed to Stage 8: Showcase</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {!prep && !loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-2xs">
          <GraduationCap className="w-10 h-10 text-indigo-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No Interview Guide Generated Yet</h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto">
            Click "Generate Interview Prep" to create 30-sec, 2-min, and 5-min pitches alongside tech trade-off arguments and interview Q&A.
          </p>
          <button
            onClick={handleGeneratePrep}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs shadow-2xs"
          >
            Generate Interview Guide
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-slate-900 font-bold text-sm">Gemini AI is crafting pitches and technical interview answers...</p>
        </div>
      )}

      {prep && pitches && !loading && (
        <div className="space-y-6">
          {/* Section 1: Pitch Options */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Project Elevator Pitches</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 relative">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-indigo-700">30-Second Elevator Pitch</span>
                  <button
                    onClick={() => handleCopy(pitches.sec30, 'pitch30')}
                    className="p-1 text-slate-500 hover:text-slate-900"
                  >
                    {copiedKey === 'pitch30' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-slate-700 leading-relaxed">{pitches.sec30}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 relative">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-indigo-700">2-Minute Overview</span>
                  <button
                    onClick={() => handleCopy(pitches.min2, 'pitch2m')}
                    className="p-1 text-slate-500 hover:text-slate-900"
                  >
                    {copiedKey === 'pitch2m' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-slate-700 leading-relaxed">{pitches.min2}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 relative">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-indigo-700">5-Minute Deep Dive</span>
                  <button
                    onClick={() => handleCopy(pitches.min5, 'pitch5m')}
                    className="p-1 text-slate-500 hover:text-slate-900"
                  >
                    {copiedKey === 'pitch5m' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-slate-700 leading-relaxed">{pitches.min5}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Architectural Tradeoffs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-indigo-600" />
              <span>Technology & Architectural Trade-offs Rationale</span>
            </h4>

            <div className="space-y-3 text-xs">
              {architecturalTradeoffs.map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900">{item.decision}</span>
                  <p className="text-slate-700 leading-relaxed">{item.rationale}</p>
                  <p className="text-indigo-700 font-mono text-[11px] pt-1 font-semibold">Tradeoff Considered: {item.tradeoff}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Interview Q&A with Model Answers */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>Likely Interview Questions & Model Answers</span>
            </h4>

            <div className="space-y-4 text-xs">
              {interviewQa.map((qa, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-indigo-800">
                    <span>Q{idx + 1}:</span>
                    <span>{qa.question}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                    <span className="text-xs font-bold text-emerald-700 block mb-1">Model Answer:</span>
                    {qa.modelAnswer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
