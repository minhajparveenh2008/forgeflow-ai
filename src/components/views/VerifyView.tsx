import React, { useState, useEffect } from 'react';
import { Project, JobProgress } from '../../types';
import { api } from '../../lib/api';
import { CheckCircle2, ShieldCheck, Zap, Play, RefreshCw, Terminal, ArrowRight, AlertTriangle } from 'lucide-react';

interface VerifyViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onProceedToUnderstand: () => void;
}

export const VerifyView: React.FC<VerifyViewProps> = ({ project, onUpdateProject, onProceedToUnderstand }) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'security' | 'performance' | 'codeQuality'>('tests');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobState, setJobState] = useState<JobProgress | null>(null);

  // Poll active background job
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

  const handleStartVerification = async (type: 'tests' | 'security' | 'performance' | 'codeQuality') => {
    try {
      const res = await api.projects.verify(project.id, type);
      setActiveJobId(res.jobId);
    } catch (err) {
      console.error(err);
    }
  };

  const verifications = project.verifications;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Stage 4: Verification & Automated Audits</h2>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Run automated unit tests, security audits, code quality checks, and bundle performance metrics. Each test runner operates with independent state and live terminal logging.
            </p>
          </div>
        </div>

        <button
          onClick={onProceedToUnderstand}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs shrink-0 transition"
        >
          <span>Proceed to Stage 5: Understand</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Verification Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('tests')}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition ${
            activeTab === 'tests' ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Automated Tests</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition ${
            activeTab === 'security' ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition ${
            activeTab === 'performance' ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Performance Analysis</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 capitalize">{activeTab} Execution Suite</h3>
            <p className="text-xs text-slate-500 mt-0.5">Isolated test worker for {project.name}</p>
          </div>

          <button
            onClick={() => handleStartVerification(activeTab)}
            disabled={jobState?.status === 'RUNNING'}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition disabled:opacity-50"
          >
            {jobState?.status === 'RUNNING' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Audit...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run {activeTab.toUpperCase()} Check</span>
              </>
            )}
          </button>
        </div>

        {/* Status Metrics */}
        {activeTab === 'tests' && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-2xl font-bold text-indigo-600">{verifications.tests.total}</span>
              <span className="block text-[11px] text-slate-600 font-medium mt-1">Total Tests Executed</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-2xl font-bold text-emerald-600">{verifications.tests.passed}</span>
              <span className="block text-[11px] text-slate-600 font-medium mt-1">Passed Tests</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-2xl font-bold text-rose-600">{verifications.tests.failed}</span>
              <span className="block text-[11px] text-slate-600 font-medium mt-1">Failed Tests</span>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-600 text-xs font-semibold">Security Health Score</span>
                <div className="text-2xl font-bold text-emerald-600 mt-1">{verifications.security.score} / 100</div>
              </div>
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>

            {verifications.security.vulnerabilities.map((vuln, idx) => (
              <div key={idx} className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>[{vuln.severity.toUpperCase()}] {vuln.title} ({vuln.file})</span>
                </div>
                <p className="text-amber-800">{vuln.description}</p>
                <p className="text-slate-600 font-mono text-[11px]">Remediation: {vuln.remediation}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xl font-bold text-indigo-600">{verifications.performance.metrics.bundleSize}</span>
              <span className="block text-[11px] text-slate-600 font-medium mt-1">Bundle Size</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xl font-bold text-emerald-600">{verifications.performance.metrics.loadTime}</span>
              <span className="block text-[11px] text-slate-600 font-medium mt-1">Estimated Load Time</span>
            </div>
          </div>
        )}

        {/* Asynchronous Live Terminal Logs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2 text-slate-100 shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Real-time Execution Output Stream</span>
            </div>
            {jobState && <span className="text-indigo-400 font-semibold">{jobState.progressPercent}% - {jobState.currentStep}</span>}
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto leading-relaxed text-slate-300">
            {jobState?.logs && jobState.logs.length > 0 ? (
              jobState.logs.map((log, idx) => (
                <div key={idx}>
                  {log}
                </div>
              ))
            ) : verifications[activeTab]?.logs?.length > 0 ? (
              verifications[activeTab].logs.map((log, idx) => (
                <div key={idx} className="text-slate-400">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic">No output logged yet. Click "Run Check" to begin.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
