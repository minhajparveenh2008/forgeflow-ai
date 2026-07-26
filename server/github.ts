import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { GitHubRepo } from '../src/types';

export function getWorkspaceCodeFiles(): Record<string, string> {
  const rootDir = process.cwd();
  const codeFiles: Record<string, string> = {};

  const ignoreDirs = new Set(['.git', 'node_modules', 'dist', '.cache', '.vite', 'data', '.idea', '.vscode']);
  const ignoreFiles = new Set(['.env', '.DS_Store']);

  function scan(dir: string, relativePath = '') {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') && entry.name !== '.env.example') {
          if (entry.isDirectory() || ignoreFiles.has(entry.name)) continue;
        }
        if (ignoreDirs.has(entry.name) || ignoreFiles.has(entry.name)) continue;

        const fullPath = path.join(dir, entry.name);
        const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          scan(fullPath, relPath);
        } else if (entry.isFile()) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            codeFiles[relPath] = content;
          } catch {
            // Skip unreadable or binary files
          }
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  scan(rootDir);
  return codeFiles;
}

export interface ProjectSourceFile {
  path: string;
  content: string;
}

export interface WorkspaceSourceSnapshot {
  snapshotId: string;
  codeFiles: Record<string, string>;
  fileList: ProjectSourceFile[];
  fileCount: number;
  folderCount: number;
  totalSizeBytes: number;
}

export function collectCompleteProjectSource(): WorkspaceSourceSnapshot {
  const codeFiles = getWorkspaceCodeFiles();
  const fileList: ProjectSourceFile[] = Object.entries(codeFiles)
    .map(([filePath, content]) => ({ path: filePath, content }))
    .sort((a, b) => a.path.localeCompare(b.path));

  const fileCount = fileList.length;
  const folderSet = new Set<string>();
  let totalSizeBytes = 0;

  const hasher = crypto.createHash('sha256');
  for (const file of fileList) {
    totalSizeBytes += Buffer.byteLength(file.content, 'utf-8');
    hasher.update(`${file.path}:${crypto.createHash('sha256').update(file.content).digest('hex')}\n`);

    const dir = path.dirname(file.path);
    if (dir && dir !== '.' && dir !== '') {
      const parts = dir.split('/');
      let currentPath = '';
      for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        folderSet.add(currentPath);
      }
    }
  }

  const snapshotHash = hasher.digest('hex').slice(0, 16);
  const snapshotId = `snap-${snapshotHash}`;

  return {
    snapshotId,
    codeFiles,
    fileList,
    fileCount,
    folderCount: folderSet.size,
    totalSizeBytes,
  };
}

export function getWorkspaceSourceSnapshot(): WorkspaceSourceSnapshot {
  return collectCompleteProjectSource();
}

let runtimeClientId = process.env.GITHUB_CLIENT_ID || '';
let runtimeClientSecret = process.env.GITHUB_CLIENT_SECRET || '';

export function getEffectiveGithubToken(userToken?: string): string {
  if (userToken && userToken.trim()) {
    return userToken.trim();
  }
  return (
    process.env.GITHUB_TOKEN ||
    process.env.GITHUB_PAT ||
    process.env.GITHUB_ACCESS_TOKEN ||
    ''
  ).trim();
}

export function getGithubCredentials() {
  return {
    clientId: process.env.GITHUB_CLIENT_ID || runtimeClientId,
    clientSecret: process.env.GITHUB_CLIENT_SECRET || runtimeClientSecret,
  };
}

export function setRuntimeGithubCredentials(clientId: string, clientSecret: string) {
  runtimeClientId = clientId;
  runtimeClientSecret = clientSecret;
}

export function getGithubAuthUrl(origin: string): { url: string; configured: boolean; callbackUrl: string; clientId?: string } {
  const { clientId } = getGithubCredentials();
  const redirectUri = `${origin}/auth/callback/github`;

  if (!clientId) {
    return { url: '', configured: false, callbackUrl: redirectUri };
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo user read:user',
  });

  return {
    url: `https://github.com/login/oauth/authorize?${params.toString()}`,
    configured: true,
    callbackUrl: redirectUri,
    clientId,
  };
}

export async function exchangeCodeForToken(code: string, origin: string): Promise<string> {
  const { clientId, clientSecret } = getGithubCredentials();
  const redirectUri = `${origin}/auth/callback/github`;

  if (!clientId || !clientSecret) {
    throw new Error('GitHub OAuth credentials (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET) are missing.');
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await response.json();
  if (data.error || !data.access_token) {
    throw new Error(data.error_description || 'Failed to exchange OAuth code for access token.');
  }

  return data.access_token;
}

export async function getGithubUser(token: string): Promise<{ login: string; avatarUrl: string; name: string }> {
  if (!token) {
    throw new Error('GitHub token is required to fetch user identity.');
  }

  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'ForgeFlow-AI',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to retrieve user identity from GitHub API (Status ${response.status}).`);
  }

  const data = await response.json();
  return {
    login: data.login,
    avatarUrl: data.avatar_url,
    name: data.name || data.login,
  };
}

export async function getGithubUserByUsername(username: string): Promise<{ login: string; avatarUrl: string; name: string }> {
  if (!username) {
    throw new Error('GitHub username is required.');
  }

  const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
    headers: {
      'User-Agent': 'ForgeFlow-AI',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub user "@${username}" was not found on GitHub API.`);
  }

  const data = await response.json();
  return {
    login: data.login,
    avatarUrl: data.avatar_url,
    name: data.name || data.login,
  };
}

export async function getGithubRepos(token?: string, username?: string): Promise<GitHubRepo[]> {
  const effectiveToken = getEffectiveGithubToken(token);
  let url = 'https://api.github.com/user/repos?sort=updated&per_page=50';
  const headers: Record<string, string> = {
    'User-Agent': 'ForgeFlow-AI',
  };

  if (effectiveToken) {
    headers['Authorization'] = `Bearer ${effectiveToken}`;
  } else if (username) {
    url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=50`;
  } else {
    throw new Error('GitHub authentication token or username is required to fetch repositories.');
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch repositories from GitHub REST API.');
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((repo: any) => ({
    name: repo.name,
    owner: repo.owner.login,
    description: repo.description || 'No description provided.',
    isPrivate: !!repo.private,
    language: repo.language || 'TypeScript',
    updatedAt: repo.updated_at,
    htmlUrl: repo.html_url,
    cloneUrl: repo.clone_url,
  }));
}

export async function createGithubRepo(
  token: string,
  name: string,
  description: string,
  isPrivate: boolean
): Promise<GitHubRepo> {
  const effectiveToken = getEffectiveGithubToken(token);
  if (!effectiveToken) {
    throw new Error('A valid GitHub Personal Access Token or OAuth connection is required to create a repository on GitHub.');
  }

  const response = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${effectiveToken}`,
      'User-Agent': 'ForgeFlow-AI',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      private: isPrivate,
      auto_init: true,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create new repository on GitHub.');
  }

  const repo = await response.json();
  return {
    name: repo.name,
    owner: repo.owner.login,
    description: repo.description || '',
    isPrivate: repo.private,
    language: repo.language || 'TypeScript',
    updatedAt: repo.updated_at,
    htmlUrl: repo.html_url,
    cloneUrl: repo.clone_url,
  };
}

export interface VerifiedPushResult {
  verified: boolean;
  authenticatedUsername: string;
  repoOwner: string;
  repoName: string;
  repoUrl: string;
  commitSha: string;
  commitUrl: string;
  filesExpected: number;
  filesPushed: number;
  filesVerified: number;
  foldersPushed: number;
}

export async function pushCodeToGithub(
  providedToken: string,
  targetOwner: string,
  targetRepo: string,
  codeFiles: Record<string, string>,
  commitMessage: string
): Promise<VerifiedPushResult> {
  const token = getEffectiveGithubToken(providedToken);
  if (!token) {
    throw new Error('GitHub Push Configuration Required: No server-side GitHub credential (GITHUB_TOKEN) found and no user OAuth connection established. Please configure GITHUB_TOKEN in environment settings or click "Connect GitHub".');
  }

  // 1. Get authenticated username from GitHub API
  let authenticatedUsername = '';
  try {
    const ghUser = await getGithubUser(token);
    authenticatedUsername = ghUser.login;
  } catch (err: any) {
    throw new Error(`GitHub Push Verification Failed: Could not authenticate credential with GitHub API (${err.message}).`);
  }

  const owner = targetOwner || authenticatedUsername;
  const repo = targetRepo;

  // 2. Get actual repository details from GitHub API
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'ForgeFlow-AI',
    },
  });

  if (!repoRes.ok) {
    const errorData = await repoRes.json().catch(() => ({}));
    throw new Error(
      `GitHub push verification failed. Reason: Repository "${owner}/${repo}" was not found on GitHub API or access was denied (${errorData.message || repoRes.statusText}).`
    );
  }

  const repoData = await repoRes.json();
  const actualRepoOwner = repoData.owner.login;
  const actualRepoName = repoData.name;
  const actualRepoHtmlUrl = repoData.html_url;
  const defaultBranch = repoData.default_branch || 'main';

  // 3. Git Data API push pipeline:
  // a. Fetch branch ref
  let refRes = await fetch(`https://api.github.com/repos/${actualRepoOwner}/${actualRepoName}/git/ref/heads/${defaultBranch}`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ForgeFlow-AI' },
  });

  let latestCommitSha = '';
  let baseTreeSha = '';

  if (refRes.ok) {
    const refData = await refRes.json();
    latestCommitSha = refData.object.sha;

    const commitRes = await fetch(`https://api.github.com/repos/${actualRepoOwner}/${actualRepoName}/git/commits/${latestCommitSha}`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ForgeFlow-AI' },
    });
    if (commitRes.ok) {
      const commitData = await commitRes.json();
      baseTreeSha = commitData.tree.sha;
    }
  }

  // b. Create Blobs
  const treeItems = [];
  for (const [filePath, content] of Object.entries(codeFiles)) {
    const blobRes = await fetch(`https://api.github.com/repos/${actualRepoOwner}/${actualRepoName}/git/blobs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'ForgeFlow-AI',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        encoding: 'utf-8',
      }),
    });

    if (!blobRes.ok) {
      const blobError = await blobRes.json().catch(() => ({}));
      throw new Error(`GitHub push verification failed. Reason: Failed to create blob for file "${filePath}" (${blobError.message || blobRes.statusText}).`);
    }

    const blobData = await blobRes.json();
    treeItems.push({
      path: filePath,
      mode: '100644',
      type: 'blob',
      sha: blobData.sha,
    });
  }

  // c. Create Tree
  const treeBody: any = { tree: treeItems };
  if (baseTreeSha) treeBody.base_tree = baseTreeSha;

  const createTreeRes = await fetch(`https://api.github.com/repos/${actualRepoOwner}/${actualRepoName}/git/trees`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'ForgeFlow-AI',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(treeBody),
  });

  if (!createTreeRes.ok) {
    const treeError = await createTreeRes.json().catch(() => ({}));
    throw new Error(`GitHub push verification failed. Reason: Failed to create Git Tree on GitHub (${treeError.message || createTreeRes.statusText}).`);
  }

  const newTreeData = await createTreeRes.json();

  // d. Create Commit
  const commitBody: any = {
    message: commitMessage || 'ForgeFlow AI: Sync project source code',
    tree: newTreeData.sha,
  };
  if (latestCommitSha) {
    commitBody.parents = [latestCommitSha];
  }

  const newCommitRes = await fetch(`https://api.github.com/repos/${actualRepoOwner}/${actualRepoName}/git/commits`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'ForgeFlow-AI',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commitBody),
  });

  if (!newCommitRes.ok) {
    const commitErr = await newCommitRes.json().catch(() => ({}));
    throw new Error(`GitHub push verification failed. Reason: Failed to create commit on GitHub (${commitErr.message || newCommitRes.statusText}).`);
  }

  const newCommitData = await newCommitRes.json();
  const newCommitSha = newCommitData.sha;

  // e. Update Reference
  const updateRefRes = await fetch(`https://api.github.com/repos/${actualRepoOwner}/${actualRepoName}/git/refs/heads/${defaultBranch}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'ForgeFlow-AI',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sha: newCommitSha,
      force: true,
    }),
  });

  if (!updateRefRes.ok) {
    const createRefRes = await fetch(`https://api.github.com/repos/${actualRepoOwner}/${actualRepoName}/git/refs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'ForgeFlow-AI',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: `refs/heads/${defaultBranch}`,
        sha: newCommitSha,
      }),
    });

    if (!createRefRes.ok) {
      const refErr = await createRefRes.json().catch(() => ({}));
      throw new Error(`GitHub push verification failed. Reason: Failed to update branch reference on GitHub (${refErr.message || createRefRes.statusText}).`);
    }
  }

  // ==================== VERIFICATION OF PUSHED ARTIFACTS ====================
  // Step 5: Verify Repository exists via GitHub API
  const verifyRepoRes = await fetch(`https://api.github.com/repos/${actualRepoOwner}/${actualRepoName}`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ForgeFlow-AI' },
  });
  if (!verifyRepoRes.ok) {
    throw new Error(`GitHub push verification failed. Reason: Repository ${actualRepoOwner}/${actualRepoName} could not be verified on GitHub API.`);
  }

  // Step 6: Verify Commit exists via GitHub API
  const verifyCommitRes = await fetch(`https://api.github.com/repos/${actualRepoOwner}/${actualRepoName}/git/commits/${newCommitSha}`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ForgeFlow-AI' },
  });
  if (!verifyCommitRes.ok) {
    throw new Error(`GitHub push verification failed. Reason: Commit SHA ${newCommitSha} could not be verified on GitHub API.`);
  }

  // Step 7: Retrieve and recursively verify complete tree from GitHub API
  const verifyTreeRes = await fetch(
    `https://api.github.com/repos/${actualRepoOwner}/${actualRepoName}/git/trees/${newCommitSha}?recursive=1`,
    {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ForgeFlow-AI' },
    }
  );

  if (!verifyTreeRes.ok) {
    throw new Error(`GitHub push verification failed. Reason: Pushed recursive file tree could not be retrieved from GitHub API.`);
  }

  const remoteTreeData = await verifyTreeRes.json();
  const remoteItems: any[] = remoteTreeData.tree || [];

  const remoteBlobs = remoteItems.filter((item) => item.type === 'blob');
  const remoteTrees = remoteItems.filter((item) => item.type === 'tree');

  const localFileCount = Object.keys(codeFiles).length;
  const remoteFileCount = remoteBlobs.length;

  if (localFileCount > 0 && remoteFileCount < localFileCount) {
    throw new Error(
      `✕ Source synchronization failed: Expected ${localFileCount} files but only ${remoteFileCount} files were found on GitHub.`
    );
  }

  // Verify key essential files in remote tree
  const remotePaths = new Set(remoteBlobs.map((item: any) => item.path));
  const expectedKeyFiles = ['package.json', 'index.html', 'src/App.tsx', 'src/main.tsx', 'server.ts'];
  for (const keyFile of expectedKeyFiles) {
    if (codeFiles[keyFile] && !remotePaths.has(keyFile)) {
      throw new Error(`✕ Source synchronization failed: Essential workspace file "${keyFile}" is missing from verified remote GitHub tree.`);
    }
  }

  const folderSet = new Set<string>();
  let totalSizeBytes = 0;
  for (const [filePath, content] of Object.entries(codeFiles)) {
    totalSizeBytes += Buffer.byteLength(content, 'utf-8');
    const dir = path.dirname(filePath);
    if (dir && dir !== '.' && dir !== '') {
      const parts = dir.split('/');
      let currentPath = '';
      for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        folderSet.add(currentPath);
      }
    }
  }

  // Step 8: Return verified details
  return {
    verified: true,
    authenticatedUsername,
    repoOwner: actualRepoOwner,
    repoName: actualRepoName,
    repoUrl: actualRepoHtmlUrl,
    commitSha: newCommitSha,
    commitUrl: `${actualRepoHtmlUrl}/commit/${newCommitSha}`,
    filesExpected: localFileCount,
    filesPushed: localFileCount,
    filesVerified: remoteFileCount,
    foldersPushed: Math.max(remoteTrees.length, folderSet.size),
  };
}
