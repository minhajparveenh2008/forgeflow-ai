import React, { useState } from 'react';
import { Project } from '../../types';
import { api } from '../../lib/api';
import { Sparkles, FileText, Copy, Download, Save, RefreshCw, ArrowRight, Check } from 'lucide-react';

interface ShowcaseViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onProceedToDeploy: () => void;
}

const ARTIFACT_TYPES = [
  { id: 'readme', label: 'GitHub README.md' },
  { id: 'portfolio', label: 'Portfolio Description' },
  { id: 'resume', label: 'Resume Bullet Points' },
  { id: 'linkedin', label: 'LinkedIn Post' },
  { id: 'blog', label: 'Technical Blog Post' },
  { id: 'executive', label: 'Executive Summary' },
];

export const ShowcaseView: React.FC<ShowcaseViewProps> = ({ project, onUpdateProject, onProceedToDeploy }) => {
  const [selectedType, setSelectedType] = useState<string>('readme');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeArtifactContent, setActiveArtifactContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const artifacts = project.artifacts || [];
  const currentArtifact = artifacts.find(a => a.type === selectedType);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.projects.generateArtifact(project.id, selectedType);
      onUpdateProject(res.project);
      setActiveArtifactContent(res.artifact.content);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!currentArtifact) return;
    try {
      const res = await api.projects.updateArtifact(project.id, currentArtifact.id, activeArtifactContent);
      onUpdateProject(res.project);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = () => {
    const textToCopy = isEditing ? activeArtifactContent : (currentArtifact?.content || '');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = isEditing ? activeArtifactContent : (currentArtifact?.content || '');
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-${selectedType}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Stage 8: Portfolio Showcase Artifacts</h2>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Generate markdown READMEs, LinkedIn release announcements, resume bullet points, and portfolio descriptions. Edit, copy, or download instantly.
            </p>
          </div>
        </div>

        <button
          onClick={onProceedToDeploy}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs shrink-0 transition"
        >
          <span>Proceed to Stage 9: Deploy</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Artifact Type Selector */}
      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
        {ARTIFACT_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => {
              setSelectedType(type.id);
              const found = artifacts.find(a => a.type === type.id);
              setActiveArtifactContent(found?.content || '');
              setIsEditing(false);
            }}
            className={`flex-1 py-2.5 px-3 rounded-lg whitespace-nowrap transition ${
              selectedType === type.id ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Main Artifact Workspace */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {ARTIFACT_TYPES.find(t => t.id === selectedType)?.label} Generator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Custom artifact for {project.name}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-semibold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{currentArtifact ? 'Regenerate' : 'Generate'}</span>
            </button>

            {currentArtifact && (
              <>
                <button
                  onClick={handleCopy}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                  title="Download .md file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </>
            )}
          </div>
        </div>

        {!currentArtifact && !loading && (
          <div className="py-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-indigo-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">No Artifact Generated Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click "Generate" to construct a tailor-made markdown artifact for {selectedType}.
            </p>
            <button
              onClick={handleGenerate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-2xs"
            >
              Generate Artifact
            </button>
          </div>
        )}

        {loading && (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-sm text-slate-900 font-bold">Gemini AI is formatting your {selectedType} artifact...</p>
          </div>
        )}

        {currentArtifact && !loading && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-semibold">Content Preview:</span>
              <button
                onClick={() => {
                  if (isEditing) handleSaveEdit();
                  else setIsEditing(true);
                }}
                className="text-indigo-600 hover:underline font-bold flex items-center gap-1"
              >
                {isEditing ? (
                  <>
                    <Save className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Save Edit</span>
                  </>
                ) : (
                  <span>Edit Content</span>
                )}
              </button>
            </div>

            {isEditing ? (
              <textarea
                rows={16}
                value={activeArtifactContent}
                onChange={(e) => setActiveArtifactContent(e.target.value)}
                className="w-full bg-slate-900 p-4 font-mono text-xs text-slate-100 border border-slate-800 rounded-xl outline-none"
              />
            ) : (
              <pre className="bg-slate-50 p-5 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[500px]">
                {currentArtifact.content}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
