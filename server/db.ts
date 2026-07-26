import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UserProfile, Project, JobProgress } from '../src/types';
import { getWorkspaceCodeFiles } from './github';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DbSchema {
  users: Record<string, UserProfile & { passwordHash: string; passwordSalt: string; githubToken?: string }>;
  sessions: Record<string, { userId: string; createdAt: string; expiresAt: string }>;
  resetTokens: Record<string, { userId: string; token: string; expiresAt: string }>;
  projects: Record<string, Project>;
  jobs: Record<string, JobProgress>;
}

function ensureDbExists(): DbSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialDb: DbSchema = {
      users: {},
      sessions: {},
      resetTokens: {},
      projects: {},
      jobs: {},
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    const initialDb: DbSchema = {
      users: {},
      sessions: {},
      resetTokens: {},
      projects: {},
      jobs: {},
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
}

function saveDb(data: DbSchema) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

export function hashPassword(password: string, salt?: string) {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: actualSalt };
}

// User CRUD
export function createUser(email: string, password: string, name: string) {
  const db = ensureDbExists();
  const existing = Object.values(db.users).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const userId = crypto.randomUUID();
  const { hash, salt } = hashPassword(password);

  const newUser = {
    id: userId,
    name: name.trim() || email.split('@')[0],
    email: email.toLowerCase(),
    skills: [],
    experience: '',
    careerGoal: '',
    developerType: '',
    programmingLanguages: [],
    interests: [],
    githubConnected: false,
    createdAt: new Date().toISOString(),
    passwordHash: hash,
    passwordSalt: salt,
  };

  db.users[userId] = newUser;
  saveDb(db);

  return sanitizeUser(newUser);
}

export function verifyUserCredentials(email: string, password: string) {
  const db = ensureDbExists();
  const user = Object.values(db.users).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return null;
  }
  const { hash } = hashPassword(password, user.passwordSalt);
  if (hash !== user.passwordHash) {
    return null;
  }
  return sanitizeUser(user);
}

export function getUserById(userId: string) {
  const db = ensureDbExists();
  const user = db.users[userId];
  if (!user) return null;
  return sanitizeUser(user);
}

export function getUserRecordById(userId: string) {
  const db = ensureDbExists();
  return db.users[userId] || null;
}

export function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const db = ensureDbExists();
  const user = db.users[userId];
  if (!user) throw new Error('User not found.');

  if (updates.name !== undefined) user.name = updates.name;
  if (updates.skills !== undefined) user.skills = updates.skills;
  if (updates.experience !== undefined) user.experience = updates.experience;
  if (updates.careerGoal !== undefined) user.careerGoal = updates.careerGoal;
  if (updates.developerType !== undefined) user.developerType = updates.developerType;
  if (updates.programmingLanguages !== undefined) user.programmingLanguages = updates.programmingLanguages;
  if (updates.interests !== undefined) user.interests = updates.interests;

  saveDb(db);
  return sanitizeUser(user);
}

export function updateGithubCredentials(userId: string, githubUsername: string, token: string, avatarUrl?: string) {
  const db = ensureDbExists();
  const user = db.users[userId];
  if (!user) throw new Error('User not found.');

  user.githubConnected = true;
  user.githubUsername = githubUsername;
  user.githubToken = token;
  if (avatarUrl) user.githubAvatarUrl = avatarUrl;

  saveDb(db);
  return sanitizeUser(user);
}

export function disconnectGithub(userId: string) {
  const db = ensureDbExists();
  const user = db.users[userId];
  if (!user) throw new Error('User not found.');

  user.githubConnected = false;
  delete user.githubUsername;
  delete user.githubToken;
  delete user.githubAvatarUrl;

  saveDb(db);
  return sanitizeUser(user);
}

function sanitizeUser(userRecord: DbSchema['users'][string]): UserProfile {
  const { passwordHash, passwordSalt, githubToken, ...safeUser } = userRecord;
  return safeUser;
}

// Session Management
export function createSession(userId: string): string {
  const db = ensureDbExists();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  db.sessions[token] = { userId, createdAt: new Date().toISOString(), expiresAt };
  saveDb(db);
  return token;
}

export function getUserIdFromSession(token: string): string | null {
  if (!token) return null;
  const db = ensureDbExists();
  const session = db.sessions[token];
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    delete db.sessions[token];
    saveDb(db);
    return null;
  }
  return session.userId;
}

export function destroySession(token: string) {
  const db = ensureDbExists();
  delete db.sessions[token];
  saveDb(db);
}

// Password Reset
export function createResetToken(email: string) {
  const db = ensureDbExists();
  const user = Object.values(db.users).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;

  const token = crypto.randomBytes(20).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
  db.resetTokens[token] = { userId: user.id, token, expiresAt };
  saveDb(db);
  return token;
}

export function resetPasswordWithToken(token: string, newPassword: string) {
  const db = ensureDbExists();
  const reset = db.resetTokens[token];
  if (!reset) throw new Error('Invalid or expired reset token.');
  if (new Date(reset.expiresAt) < new Date()) {
    delete db.resetTokens[token];
    saveDb(db);
    throw new Error('Reset token has expired.');
  }

  const user = db.users[reset.userId];
  if (!user) throw new Error('User not found.');

  const { hash, salt } = hashPassword(newPassword);
  user.passwordHash = hash;
  user.passwordSalt = salt;

  delete db.resetTokens[token];
  saveDb(db);
  return true;
}

// Projects (strictly user isolated)
export function getUserProjects(userId: string): Project[] {
  const db = ensureDbExists();
  const workspaceFiles = getWorkspaceCodeFiles();
  return Object.values(db.projects)
    .filter(p => p.userId === userId)
    .map(p => {
      p.codeFiles = workspaceFiles;
      return p;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getProjectById(userId: string, projectId: string): Project | null {
  const db = ensureDbExists();
  const project = db.projects[projectId];
  if (!project || project.userId !== userId) {
    return null;
  }
  const workspaceFiles = getWorkspaceCodeFiles();
  if (Object.keys(workspaceFiles).length > 0) {
    project.codeFiles = workspaceFiles;
  }
  return project;
}

export function createProject(userId: string, data: { name: string; description: string; idea: string; technologies?: string[]; githubRepo?: string }): Project {
  const db = ensureDbExists();
  const projectId = crypto.randomUUID();
  const now = new Date().toISOString();

  const workspaceFiles = getWorkspaceCodeFiles();

  const newProject: Project = {
    id: projectId,
    userId,
    name: data.name,
    description: data.description,
    idea: data.idea,
    technologies: data.technologies || [],
    githubRepo: data.githubRepo,
    currentStage: 'IDEA',
    createdAt: now,
    updatedAt: now,
    plan: null,
    codeFiles: workspaceFiles,
    githubSync: null,
    deployment: null,
    verifications: {
      tests: { status: 'idle', logs: [], total: 0, passed: 0, failed: 0 },
      security: { status: 'idle', logs: [], score: 100, vulnerabilities: [] },
      performance: { status: 'idle', logs: [], score: 100, metrics: { bundleSize: '120 KB', loadTime: '0.4s', score: 98, issues: [] } },
      codeQuality: { status: 'idle', logs: [], score: 95, maintainability: 'A', duplication: '0%', issues: [] },
    },
    deepAnalysis: null,
    growRecommendations: null,
    interviewPrep: null,
    artifacts: [],
  };

  db.projects[projectId] = newProject;
  saveDb(db);
  return newProject;
}

export function updateProject(userId: string, projectId: string, updates: Partial<Project>): Project {
  const db = ensureDbExists();
  const project = db.projects[projectId];
  if (!project || project.userId !== userId) {
    throw new Error('Project not found or access denied.');
  }

  const updatedProject = {
    ...project,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  db.projects[projectId] = updatedProject;
  saveDb(db);
  return updatedProject;
}

export function deleteProject(userId: string, projectId: string) {
  const db = ensureDbExists();
  const project = db.projects[projectId];
  if (!project || project.userId !== userId) {
    throw new Error('Project not found or access denied.');
  }

  delete db.projects[projectId];
  saveDb(db);
  return true;
}

// Background Jobs
export function createJob(userId: string, projectId: string, type: JobProgress['type']): JobProgress {
  const db = ensureDbExists();
  const jobId = crypto.randomUUID();
  const now = new Date().toISOString();

  const newJob: JobProgress = {
    jobId,
    userId,
    projectId,
    type,
    status: 'QUEUED',
    progressPercent: 0,
    currentStep: 'Initializing job',
    logs: [`[${new.target ? 'SYS' : 'INIT'}] Job queued`],
    createdAt: now,
    updatedAt: now,
  };

  db.jobs[jobId] = newJob;
  saveDb(db);
  return newJob;
}

export function updateJob(jobId: string, updates: Partial<JobProgress>): JobProgress {
  const db = ensureDbExists();
  const job = db.jobs[jobId];
  if (!job) throw new Error('Job not found.');

  const updated = {
    ...job,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (updates.logs) {
    updated.logs = updates.logs;
  }

  db.jobs[jobId] = updated;
  saveDb(db);
  return updated;
}

export function getJob(jobId: string, userId: string): JobProgress | null {
  const db = ensureDbExists();
  const job = db.jobs[jobId];
  if (!job || job.userId !== userId) return null;
  return job;
}
