import { UserProfile, Project, ProjectStage, JobProgress, GitHubRepo } from '../types';

let authToken = localStorage.getItem('forgeflow_token') || '';

export function setAuthToken(token: string) {
  authToken = token;
  if (token) {
    localStorage.setItem('forgeflow_token', token);
  } else {
    localStorage.removeItem('forgeflow_token');
  }
}

export function getAuthToken() {
  return authToken;
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API Request failed');
  }

  return data as T;
}

// Auth API
export const api = {
  auth: {
    signup: (data: { email: string; password: string; name?: string }) =>
      fetchApi<{ user: UserProfile; token: string }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    signin: (data: { email: string; password: string }) =>
      fetchApi<{ user: UserProfile; token: string }>('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    signout: () =>
      fetchApi<{ success: boolean }>('/api/auth/signout', { method: 'POST' }),

    me: () => fetchApi<{ user: UserProfile }>('/api/auth/me'),

    updateProfile: (profile: Partial<UserProfile>) =>
      fetchApi<{ user: UserProfile }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      }),

    forgotPassword: (email: string) =>
      fetchApi<{ message: string; resetToken?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (data: { token: string; newPassword: string }) =>
      fetchApi<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    connectGithubToken: (token: string, username?: string) =>
      fetchApi<{ user: UserProfile }>('/api/github/connect-token', {
        method: 'POST',
        body: JSON.stringify({ token, username }),
      }),

    disconnectGithub: () =>
      fetchApi<{ user: UserProfile }>('/api/auth/disconnect-github', { method: 'POST' }),
  },

  projects: {
    list: () => fetchApi<{ projects: Project[] }>('/api/projects'),

    get: (id: string) => fetchApi<{ project: Project }>(`/api/projects/${id}`),

    create: (data: { name: string; description: string; idea: string; technologies?: string[]; githubRepo?: string }) =>
      fetchApi<{ project: Project }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateStage: (id: string, stage: ProjectStage) =>
      fetchApi<{ project: Project }>(`/api/projects/${id}/stage`, {
        method: 'PUT',
        body: JSON.stringify({ stage }),
      }),

    updateCode: (id: string, filePath: string, content: string) =>
      fetchApi<{ project: Project }>(`/api/projects/${id}/code`, {
        method: 'PUT',
        body: JSON.stringify({ filePath, content }),
      }),

    delete: (id: string) =>
      fetchApi<{ success: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),

    // AI Features
    generatePlan: (id: string) =>
      fetchApi<{ plan: any; project: Project }>(`/api/projects/${id}/plan`, { method: 'POST' }),

    savePlan: (id: string, plan: any) =>
      fetchApi<{ plan: any; project: Project }>(`/api/projects/${id}/plan`, {
        method: 'PUT',
        body: JSON.stringify({ plan }),
      }),

    buildCode: (id: string, prompt: string) =>
      fetchApi<{ project: Project; filesChanged: string[]; explanation: string }>(`/api/projects/${id}/build`, {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      }),

    understand: (id: string) =>
      fetchApi<{ deepAnalysis: any; project: Project }>(`/api/projects/${id}/understand`, { method: 'POST' }),

    grow: (id: string) =>
      fetchApi<{ growRecommendations: any; project: Project }>(`/api/projects/${id}/grow`, { method: 'POST' }),

    confirmGrowSkill: (id: string, skillToAdd: string, improvementId?: string) =>
      fetchApi<{ user: UserProfile; message: string }>(`/api/projects/${id}/grow/confirm`, {
        method: 'POST',
        body: JSON.stringify({ skillToAdd, improvementId }),
      }),

    interview: (id: string) =>
      fetchApi<{ interviewPrep: any; project: Project }>(`/api/projects/${id}/interview`, { method: 'POST' }),

    generateArtifact: (id: string, type: string) =>
      fetchApi<{ artifact: any; project: Project }>(`/api/projects/${id}/artifacts/generate`, {
        method: 'POST',
        body: JSON.stringify({ type }),
      }),

    updateArtifact: (id: string, artifactId: string, content: string, title?: string) =>
      fetchApi<{ project: Project }>(`/api/projects/${id}/artifacts/${artifactId}`, {
        method: 'PUT',
        body: JSON.stringify({ content, title }),
      }),

    generateLinkedInPost: (id: string) =>
      fetchApi<{ postText: string }>(`/api/projects/${id}/linkedin`, { method: 'POST' }),

    // Jobs & Pipelines
    githubPush: (id: string, owner?: string, repo?: string) =>
      fetchApi<{ jobId: string }>(`/api/projects/${id}/github-push`, {
        method: 'POST',
        body: JSON.stringify({ owner, repo }),
      }),

    deploy: (id: string) =>
      fetchApi<{ jobId: string }>(`/api/projects/${id}/deploy`, { method: 'POST' }),

    githubAndDeploy: (id: string, owner?: string, repo?: string) =>
      fetchApi<{ jobId: string }>(`/api/projects/${id}/github-and-deploy`, {
        method: 'POST',
        body: JSON.stringify({ owner, repo }),
      }),

    verify: (id: string, type: 'tests' | 'security' | 'performance' | 'codeQuality') =>
      fetchApi<{ jobId: string }>(`/api/projects/${id}/verify/${type}`, { method: 'POST' }),
  },

  github: {
    getAuthUrl: () => fetchApi<{ url: string; configured: boolean; callbackUrl: string; clientId?: string }>('/api/github/auth-url'),

    saveOauthConfig: (clientId: string, clientSecret: string) =>
      fetchApi<{ success: boolean; message: string }>('/api/admin/github-oauth-config', {
        method: 'POST',
        body: JSON.stringify({ clientId, clientSecret }),
      }),

    getRepos: () => fetchApi<{ repos: GitHubRepo[] }>('/api/github/repos'),

    createRepo: (data: { name: string; description?: string; isPrivate?: boolean }) =>
      fetchApi<{ repo: GitHubRepo }>('/api/github/create-repo', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  jobs: {
    get: (jobId: string) => fetchApi<{ job: JobProgress }>(`/api/jobs/${jobId}`),
  },
};
