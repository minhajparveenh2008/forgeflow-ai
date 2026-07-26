import React, { useState } from 'react';
import { Project } from '../../types';
import { api } from '../../lib/api';
import { Code2, FileCode, Sparkles, Send, Check, FilePlus, ArrowRight } from 'lucide-react';

interface BuildViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onProceedToVerify: () => void;
}

export const BuildView: React.FC<BuildViewProps> = ({ project, onUpdateProject, onProceedToVerify }) => {
  const [selectedFile, setSelectedFile] = useState<string>(Object.keys(project.codeFiles)[0] || 'README.md');
  const [editorContent, setEditorContent] = useState<string>(project.codeFiles[selectedFile] || '');
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [lastExplanation, setLastExplanation] = useState<string | null>(null);
  const [filesChanged, setFilesChanged] = useState<string[]>([]);
  const [newFileName, setNewFileName] = useState<string>('');
  const [showAddFile, setShowAddFile] = useState<boolean>(false);

  const handleSelectFile = (file: string) => {
    setSelectedFile(file);
    setEditorContent(project.codeFiles[file] || '');
  };

  const handleSaveCurrentFile = async () => {
    try {
      const res = await api.projects.updateCode(project.id, selectedFile, editorContent);
      onUpdateProject(res.project);
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  };

  const handleCreateNewFile = async () => {
    if (!newFileName.trim()) return;
    const cleanPath = newFileName.trim();
    try {
      const res = await api.projects.updateCode(project.id, cleanPath, `// ${cleanPath}\n`);
      onUpdateProject(res.project);
      setSelectedFile(cleanPath);
      setEditorContent(`// ${cleanPath}\n`);
      setNewFileName('');
      setShowAddFile(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setLastExplanation(null);

    try {
      const res = await api.projects.buildCode(project.id, prompt);
      onUpdateProject(res.project);
      setFilesChanged(res.filesChanged || []);
      setLastExplanation(res.explanation || 'Code changes generated.');

      if (res.filesChanged && res.filesChanged.length > 0) {
        const firstChanged = res.filesChanged[0];
        if (res.project.codeFiles[firstChanged]) {
          setSelectedFile(firstChanged);
          setEditorContent(res.project.codeFiles[firstChanged]);
        }
      }
      setPrompt('');
    } catch (err) {
      console.error('Build error:', err);
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
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Stage 3: AI Code Development</h2>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Generate new feature code, edit files directly, or ask Gemini AI to refactor and fix issues using your project's full code context.
            </p>
          </div>
        </div>

        <button
          onClick={onProceedToVerify}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs shrink-0 transition"
        >
          <span>Proceed to Stage 4: Verify</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main IDE Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: File Tree Explorer */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900">Project Files</span>
            <button
              onClick={() => setShowAddFile(!showAddFile)}
              className="p-1 text-indigo-600 hover:bg-slate-100 rounded transition"
              title="Add File"
            >
              <FilePlus className="w-4 h-4" />
            </button>
          </div>

          {showAddFile && (
            <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <input
                type="text"
                placeholder="src/components/MyView.tsx"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 outline-none"
              />
              <button
                onClick={handleCreateNewFile}
                className="w-full bg-indigo-600 text-white py-1 rounded font-semibold text-[11px]"
              >
                Create File
              </button>
            </div>
          )}

          <div className="space-y-1 overflow-y-auto max-h-[400px]">
            {Object.keys(project.codeFiles).map((filePath) => {
              const isSelected = selectedFile === filePath;
              const isChanged = filesChanged.includes(filePath);
              return (
                <button
                  key={filePath}
                  onClick={() => handleSelectFile(filePath)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                    <span className="truncate">{filePath}</span>
                  </div>
                  {isChanged && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" title="Recently modified" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Code Editor & AI Generator */}
        <div className="lg:col-span-3 space-y-4">
          {/* AI Code Generator Input */}
          <form onSubmit={handleAiBuild} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Ask Gemini AI to Add Features or Modify Code</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder='e.g. "Add a search filter input to the telemetry map component" or "Fix error handling in authentication route"'
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs outline-none focus:bg-white focus:border-indigo-600 font-medium"
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shrink-0 shadow-2xs"
              >
                {loading ? (
                  <span>Generating Code...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {lastExplanation && (
            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl text-xs text-indigo-900 space-y-1">
              <span className="font-bold block text-indigo-700">AI Changes Explanation:</span>
              <p className="leading-relaxed">{lastExplanation}</p>
            </div>
          )}

          {/* Code Editor */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-indigo-700">{selectedFile}</span>
              <button
                onClick={handleSaveCurrentFile}
                className="bg-white hover:bg-slate-100 text-slate-800 px-3 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 flex items-center gap-1 transition shadow-2xs"
              >
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Save Code</span>
              </button>
            </div>

            <textarea
              rows={18}
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              className="w-full bg-slate-900 p-4 font-mono text-xs text-slate-100 leading-relaxed outline-none resize-y"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
