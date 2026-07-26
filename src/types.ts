export type ProjectStage = 
  | 'IDEA' 
  | 'PLAN' 
  | 'BUILD' 
  | 'VERIFY' 
  | 'UNDERSTAND' 
  | 'IMPROVE' 
  | 'PREPARE' 
  | 'SHOWCASE' 
  | 'DEPLOY';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  skills: string[];
  experience: string;
  careerGoal: string;
  developerType: string;
  programmingLanguages: string[];
  interests: string[];
  githubConnected: boolean;
  githubUsername?: string;
  githubAvatarUrl?: string;
  createdAt: string;
}

export interface ProjectPlan {
  problemStatement: string;
  targetUsers: string[];
  coreFeatures: string[];
  userRoles: string[];
  userFlows: string[];
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  techRecommendations: { name: string; category: string; rationale: string }[];
  databaseDesign: string;
  apiRequirements: string[];
  systemArchitecture: string;
  developmentRoadmap: { phase: string; title: string; tasks: string[] }[];
  taskBreakdown: { id: string; title: string; category: string; estimatedHours: number }[];
}

export interface VerificationState {
  tests: {
    status: 'idle' | 'running' | 'passed' | 'failed';
    logs: string[];
    total: number;
    passed: number;
    failed: number;
    lastRun?: string;
  };
  security: {
    status: 'idle' | 'running' | 'completed';
    logs: string[];
    score: number;
    vulnerabilities: { severity: 'low' | 'medium' | 'high' | 'critical'; title: string; file: string; description: string; remediation: string }[];
    lastRun?: string;
  };
  performance: {
    status: 'idle' | 'running' | 'completed';
    logs: string[];
    score: number;
    metrics: { bundleSize: string; loadTime: string; score: number; issues: string[] };
    lastRun?: string;
  };
  codeQuality: {
    status: 'idle' | 'running' | 'completed';
    logs: string[];
    score: number;
    maintainability: string;
    duplication: string;
    issues: string[];
    lastRun?: string;
  };
}

export interface DeepAnalysis {
  factsFromCode: string[];
  inferences: string[];
  recommendations: string[];
  plannedNotImplemented?: string[];
  overview: {
    problem: string;
    targetUsers: string;
    mainFeatures: string[];
    techStack: string[];
  };
  architecture: {
    frontend: string;
    backend: string;
    database: string;
    apis: string[];
    aiServices: string[];
    auth: string;
    externalServices: string[];
  };
  folderStructure: { path: string; description: string }[];
  fileAnalysis: {
    filePath: string;
    purpose: string;
    imports: string[];
    functions: string[];
    components: string[];
    dependencies: string[];
    apiCalls: string[];
    dbOps: string[];
    relatedFiles: string[];
  }[];
  functionAnalysis: {
    functionName: string;
    filePath: string;
    purpose: string;
    params: string;
    returnVal: string;
    logicSteps: string[];
    conditions: string[];
    errorHandling: string;
    callers: string[];
  }[];
  dataFlow: { step: number; title: string; description: string }[];
  executionFlow: string;
}

export interface GrowRecommendations {
  knowledgeGaps: string[];
  weakAreas: string[];
  securityWeaknesses: string[];
  performanceProblems: string[];
  missingTests: string[];
  learningPath: { topic: string; reason: string; resources: string[] }[];
  projectImprovements: { id: string; title: string; description: string; complexity: 'Easy' | 'Medium' | 'Hard'; status: 'suggested' | 'accepted' | 'dismissed' }[];
  implementationChallenges: { title: string; scenario: string; goal: string }[];
}

export interface InterviewPrep {
  pitches?: {
    sec30: string;
    min2: string;
    min5: string;
  };
  architecturalTradeoffs?: {
    decision: string;
    rationale: string;
    tradeoff: string;
  }[];
  interviewQa?: {
    category?: string;
    question: string;
    modelAnswer: string;
    keyPoints?: string[];
  }[];
  twoMinExplanation?: string;
  fiveMinExplanation?: string;
  techChoices?: { tech: string; justification: string }[];
  questions?: { category?: string; question: string; modelAnswer: string; keyPoints?: string[] }[];
}

export interface ProjectArtifact {
  id: string;
  type: 'README' | 'RESUME' | 'LINKEDIN' | 'PORTFOLIO' | 'ARCHITECTURE' | 'PROJECT_REPORT' | 'TEST_REPORT' | 'SECURITY_REPORT';
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubRepo {
  name: string;
  owner: string;
  fullName?: string;
  description: string;
  isPrivate: boolean;
  language: string;
  updatedAt: string;
  htmlUrl: string;
  cloneUrl: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  idea: string;
  technologies: string[];
  githubRepo?: string;
  deploymentUrl?: string;
  currentStage: ProjectStage;
  createdAt: string;
  updatedAt: string;
  plan: ProjectPlan | null;
  codeFiles: Record<string, string>;
  githubSync: {
    connected: boolean;
    repoOwner?: string;
    repoName?: string;
    repoUrl?: string;
    lastCommitSha?: string;
    lastPushedAt?: string;
    isPrivate?: boolean;
    verified?: boolean;
    filesPushed?: number;
    foldersPushed?: number;
    sourceSnapshotId?: string;
    sourceSnapshotFiles?: number;
  } | null;
  deployment: {
    status: 'idle' | 'building' | 'deploying' | 'live' | 'workspace_protected' | 'deployed_https_failed' | 'failed';
    provider?: string;
    deploymentId?: string;
    liveUrl?: string;
    canonicalUrl?: string;
    hostname?: string;
    dnsVerified?: boolean;
    tlsVerified?: boolean;
    tlsErrorMessage?: string;
    httpsVerified?: boolean;
    healthCheckPassed?: boolean;
    healthCheckStatus?: string;
    noPublicUrlReturned?: boolean;
    isWorkspaceProtected?: boolean;
    publicAccessMessage?: string;
    buildLogs: string[];
    deploymentLogs: string[];
    sourceSnapshotId?: string;
    sourceSnapshotFiles?: number;
    buildStatus?: string;
    updatedAt?: string;
  } | null;
  verifications: VerificationState;
  deepAnalysis: DeepAnalysis | null;
  growRecommendations: GrowRecommendations | null;
  interviewPrep: InterviewPrep | null;
  artifacts: ProjectArtifact[];
}

export interface JobProgress {
  jobId: string;
  userId: string;
  projectId: string;
  type: 'VERIFY_TESTS' | 'VERIFY_SECURITY' | 'VERIFY_PERF' | 'GITHUB_PUSH' | 'DEPLOY' | 'GITHUB_AND_DEPLOY';
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progressPercent: number;
  currentStep: string;
  logs: string[];
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
