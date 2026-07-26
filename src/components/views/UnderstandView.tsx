import React, { useState } from 'react';
import { Project } from '../../types';
import { api } from '../../lib/api';
import { BrainCircuit, Sparkles, RefreshCw, Cpu, GitFork, ArrowRight, Layers, CheckCircle2 } from 'lucide-react';

interface UnderstandViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onProceedToGrow: () => void;
}

type Mode = 'Simple' | 'Detailed' | 'Technical' | 'Interview Mode';

export const UnderstandView: React.FC<UnderstandViewProps> = ({ project, onUpdateProject, onProceedToGrow }) => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('Technical');
  const [error, setError] = useState<string | null>(null);

  const analysis = project.deepAnalysis;

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.projects.understand(project.id);
      onUpdateProject(res.project);
    } catch (err: any) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Stage 5: Deep Project Intelligence</h2>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              In-depth code breakdown separating facts from code, inferences, architecture diagrams, file-level & function-level specs, and data flow execution walkthroughs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{analysis ? 'Re-analyze Codebase' : 'Analyze Codebase'}</span>
          </button>

          {analysis && (
            <button
              onClick={onProceedToGrow}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition"
            >
              <span>Proceed to Stage 6: Improve</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Explanation Mode Switcher */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 text-xs shadow-2xs">
        <span className="text-slate-600 font-semibold">Explanation Mode:</span>
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {(['Simple', 'Detailed', 'Technical', 'Interview Mode'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                mode === m ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {!analysis && !loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-2xs">
          <BrainCircuit className="w-10 h-10 text-indigo-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No Deep Code Analysis Generated</h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto">
            Click "Analyze Codebase" to extract architectural facts, folder maps, file specs, and data flows from actual project source code.
          </p>
          <button
            onClick={handleAnalyze}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs shadow-2xs"
          >
            Run Deep Analysis
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-slate-900 font-bold text-sm">Gemini AI is parsing source files and mapping call graphs...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6">
          {/* STRICT CATEGORIZATION: FACTS FROM CODE / INFERENCES / PLANNED / RECOMMENDATIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Facts from Code */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
              <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Facts Derived from Code</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {analysis.factsFromCode.map((fact, idx) => (
                  <li key={idx} className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 leading-relaxed">
                    {fact}
                  </li>
                ))}
              </ul>
            </div>

            {/* Inferences */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
              <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Design Inferences</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {analysis.inferences.map((inf, idx) => (
                  <li key={idx} className="bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-200 leading-relaxed">
                    {inf}
                  </li>
                ))}
              </ul>
            </div>

            {/* Planned / Not Implemented Features */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
              <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Planned / Not Implemented</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {(analysis.plannedNotImplemented && analysis.plannedNotImplemented.length > 0) ? (
                  analysis.plannedNotImplemented.map((item, idx) => (
                    <li key={idx} className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 leading-relaxed text-amber-950 font-medium">
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-500 italic">
                    All planned architectural features are verified in source code.
                  </li>
                )}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
              <h4 className="text-sm font-bold text-purple-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Recommendations</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="bg-purple-50/80 p-2.5 rounded-xl border border-purple-200 leading-relaxed">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* System Architecture Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>System Architecture Breakdown</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[11px]">Frontend</span>
                <span className="font-bold text-slate-900 mt-1 block">{analysis.architecture.frontend}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[11px]">Backend</span>
                <span className="font-bold text-slate-900 mt-1 block">{analysis.architecture.backend}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[11px]">Database</span>
                <span className="font-bold text-slate-900 mt-1 block">{analysis.architecture.database}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[11px]">AI Services</span>
                <span className="font-bold text-slate-900 mt-1 block">{analysis.architecture.aiServices.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Data Flow & Execution Walkthrough */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GitFork className="w-4 h-4 text-indigo-600" />
              <span>Data Flow Sequence & Execution Walkthrough</span>
            </h4>

            <div className="space-y-3">
              {analysis.dataFlow.map((flow) => (
                <div key={flow.step} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div className="bg-indigo-600 text-white w-6 h-6 rounded-full font-bold flex items-center justify-center shrink-0">
                    {flow.step}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">{flow.title}</span>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">{flow.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 space-y-1">
              <span className="text-indigo-400 font-bold block">Complete Execution Flow:</span>
              <p className="leading-relaxed font-mono text-[11px] text-slate-300">{analysis.executionFlow}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
