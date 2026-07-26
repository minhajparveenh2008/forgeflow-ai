import React, { useState } from 'react';
import { Project } from '../../types';
import { api } from '../../lib/api';
import { Lightbulb, Sparkles, FolderPlus, ArrowRight } from 'lucide-react';

interface IdeaViewProps {
  project: Project | null;
  onProjectCreated: (project: Project) => void;
  onProceedToPlan: () => void;
}

export const IdeaView: React.FC<IdeaViewProps> = ({ project, onProjectCreated, onProceedToPlan }) => {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [idea, setIdea] = useState(project?.idea || '');
  const [techString, setTechString] = useState(project?.technologies?.join(', ') || '');
  const [githubRepo, setGithubRepo] = useState(project?.githubRepo || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const technologies = techString.split(',').map(t => t.trim()).filter(Boolean);
      const res = await api.projects.create({
        name,
        description: description || idea,
        idea: idea || description,
        technologies,
        githubRepo: githubRepo || undefined,
      });
      onProjectCreated(res.project);
    } catch (err: any) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Stage 1: Project Ideation & Concept</h2>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Define your software concept or enter a natural language prompt. ForgeFlow AI creates a real isolated project record in your private workspace.
            </p>
          </div>
        </div>
      </div>

      {project ? (
        /* Active Project Overview */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                Active Project
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{project.name}</h3>
            </div>
            <button
              onClick={onProceedToPlan}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-2xs"
            >
              <span>Proceed to Stage 2: Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-semibold block mb-1">Core Description</span>
              <p className="text-slate-800 leading-relaxed">{project.description}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-semibold block mb-1">Initial Idea / Prompt</span>
              <p className="text-slate-800 leading-relaxed">{project.idea}</p>
            </div>
          </div>

          {project.technologies && project.technologies.length > 0 && (
            <div>
              <span className="text-slate-500 text-xs font-semibold block mb-2">Target Technologies</span>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 rounded-lg text-xs font-mono">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Create New Project Form */
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5 text-xs">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-indigo-600" />
            <span>Create New Project</span>
          </h3>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Project Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. EcoCity Telemetry Platform"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Project Concept / Idea Prompt *</label>
            <textarea
              required
              rows={4}
              placeholder='e.g. "Build an AI-powered waste management platform that predicts waste hotspots using historical city telemetry data and displays them on an interactive map."'
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition text-xs leading-relaxed font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Optional Technologies (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. React, Express, TypeScript, Gemini AI, Tailwind CSS"
              value={techString}
              onChange={(e) => setTechString(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition text-xs font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50 text-xs"
          >
            {loading ? (
              <span>Creating Project Record...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Initialize Project Workspace</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
