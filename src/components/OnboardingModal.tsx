import React, { useState } from 'react';
import { api } from '../lib/api';
import { UserProfile } from '../types';
import { UserCheck, Sparkles, Check, X } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onUpdate: (user: UserProfile) => void;
}

const SKILL_OPTIONS = [
  'React', 'TypeScript', 'Node.js', 'Express', 'Python',
  'PostgreSQL', 'Docker', 'Google Cloud', 'GraphQL', 'Tailwind CSS',
  'Next.js', 'AI / Gemini API', 'System Architecture', 'CI/CD'
];

const DEV_TYPES = [
  'Full-Stack Developer',
  'Frontend Engineer',
  'Backend Engineer',
  'AI / ML Engineer',
  'DevOps / Cloud Engineer',
  'Software Architect'
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, user, onClose, onUpdate }) => {
  const [developerType, setDeveloperType] = useState(user?.developerType || '');
  const [experience, setExperience] = useState(user?.experience || '');
  const [careerGoal, setCareerGoal] = useState(user?.careerGoal || '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(user?.skills || []);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.auth.updateProfile({
        developerType,
        experience,
        careerGoal,
        skills: selectedSkills,
      });
      onUpdate(res.user);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 w-full max-w-xl shadow-xl text-slate-900 relative my-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl border border-indigo-100">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Developer Profile & Preferences</h2>
            <p className="text-xs text-slate-500">
              Customize your profile or leave blank. Options are entirely optional.
            </p>
          </div>
        </div>

        <div className="space-y-5 text-xs">
          {/* Developer Role */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Primary Role / Developer Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEV_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDeveloperType(type)}
                  className={`px-3 py-2 rounded-xl text-left font-semibold border transition ${
                    developerType === type
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Years of Experience</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
            >
              <option value="">Not selected</option>
              <option value="Junior (0-2 years)">Junior (0-2 years)</option>
              <option value="Mid-Level (2-5 years)">Mid-Level (2-5 years)</option>
              <option value="Senior (5+ years)">Senior (5+ years)</option>
              <option value="Lead / Principal Architect">Lead / Principal Architect</option>
            </select>
          </div>

          {/* Career Goal */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Primary Objective / Career Goal</label>
            <input
              type="text"
              placeholder="e.g. Build production SaaS apps, prepare for Senior Staff interviews"
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
            />
          </div>

          {/* Skills Selection */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Technical Skills & Technologies</label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map(skill => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-8 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 text-xs font-semibold px-4 py-2 rounded-xl"
          >
            Skip for now
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
