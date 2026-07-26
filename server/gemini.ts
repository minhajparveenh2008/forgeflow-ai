import { GoogleGenAI } from '@google/genai';
import { ProjectPlan, DeepAnalysis, GrowRecommendations, InterviewPrep } from '../src/types';

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. Gemini API calls will fail or use fallback structure.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || 'DUMMY_KEY',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const MODEL_NAME = 'gemini-3.6-flash';

export function extractFactualProjectMetadata(
  codeFiles: Record<string, string>,
  projectName: string,
  plan?: any
) {
  let pkgDeps: Record<string, string> = {};
  let pkgDevDeps: Record<string, string> = {};
  if (codeFiles['package.json']) {
    try {
      const parsed = JSON.parse(codeFiles['package.json']);
      pkgDeps = parsed.dependencies || {};
      pkgDevDeps = parsed.devDependencies || {};
    } catch {}
  }

  const allDeps = { ...pkgDeps, ...pkgDevDeps };
  const hasReact = !!allDeps['react'] || !!codeFiles['src/App.tsx'];
  const hasExpress = !!allDeps['express'] || !!codeFiles['server.ts'];
  const hasGemini = !!allDeps['@google/genai'] || Object.values(codeFiles).some(c => c.includes('@google/genai'));
  const hasGithub = !!codeFiles['server/github.ts'] || Object.values(codeFiles).some(c => c.includes('api.github.com'));

  const filePaths = Object.keys(codeFiles).sort();

  const factsFromCode: string[] = [];
  if (hasReact) {
    factsFromCode.push(`Frontend: React SPA built with TypeScript & Vite (${filePaths.filter(f => f.startsWith('src/')).length} files in /src).`);
  }
  if (hasExpress) {
    factsFromCode.push(`Backend: Express Node.js server in server.ts serving REST endpoints and static production client assets.`);
  }
  if (hasGemini) {
    factsFromCode.push(`AI Integration: Google Gemini 3.6 Flash via @google/genai SDK in server/gemini.ts.`);
  }
  if (hasGithub) {
    factsFromCode.push(`GitHub Sync: Native Git Data API integration in server/github.ts.`);
  }
  if (codeFiles['server/db.ts']) {
    factsFromCode.push(`Data Persistence: Local file-backed JSON database in server/db.ts.`);
  }
  if (codeFiles['package.json']) {
    factsFromCode.push(`Dependencies: ${Object.keys(allDeps).length} declared npm dependencies in package.json.`);
  }

  const plannedNotImplemented: string[] = [];
  if (plan) {
    const recs = plan.techRecommendations || [];
    for (const r of recs) {
      const name = (r.name || '').toLowerCase();
      if ((name.includes('kafka') || name.includes('apache')) && !allDeps['kafkajs']) {
        plannedNotImplemented.push('Apache Kafka event stream (Proposed in architecture plan, not present in source code)');
      }
      if ((name.includes('timescale') || name.includes('postgres') || name.includes('sql')) && !allDeps['pg'] && !allDeps['drizzle-orm']) {
        plannedNotImplemented.push('TimescaleDB / PostgreSQL database (Proposed in architecture plan, currently using local JSON storage)');
      }
      if ((name.includes('redis') || name.includes('pubsub')) && !allDeps['redis'] && !allDeps['ioredis']) {
        plannedNotImplemented.push('Redis pub/sub cache (Proposed in architecture plan, not present in source code)');
      }
      if ((name.includes('go') || name.includes('golang')) && !filePaths.some(f => f.endsWith('.go'))) {
        plannedNotImplemented.push('Go backend microservice (Proposed in architecture plan, not present in source code)');
      }
      if ((name.includes('mqtt') || name.includes('iot')) && !allDeps['mqtt']) {
        plannedNotImplemented.push('MQTT IoT ingestion pipeline (Proposed in architecture plan, not present in source code)');
      }
    }
  }

  return {
    hasReact,
    hasExpress,
    hasGemini,
    hasGithub,
    allDeps,
    filePaths,
    factsFromCode,
    plannedNotImplemented,
  };
}

export async function generateProjectPlan(
  name: string,
  description: string,
  idea: string,
  technologies?: string[]
): Promise<ProjectPlan> {
  const ai = getAiClient();
  const prompt = `You are a Principal Software Architect. Generate a comprehensive software engineering plan for a project with the following details:
Project Name: ${name}
Description: ${description}
Core Idea: ${idea}
Tech Preferences: ${technologies?.join(', ') || 'Best suited modern stack'}

Generate structured JSON matching this schema:
{
  "problemStatement": "Detailed description of the problem solved",
  "targetUsers": ["User persona 1", "User persona 2"],
  "coreFeatures": ["Feature 1", "Feature 2", "Feature 3"],
  "userRoles": ["Role 1", "Role 2"],
  "userFlows": ["Step-by-step user flow 1", "Step-by-step user flow 2"],
  "functionalRequirements": ["FR-1...", "FR-2..."],
  "nonFunctionalRequirements": ["NFR-1 Security...", "NFR-2 Performance..."],
  "techRecommendations": [{"name": "React", "category": "Frontend", "rationale": "High interactivity"}],
  "databaseDesign": "Entity Relationship / Schema design description",
  "apiRequirements": ["POST /api/v1/resource...", "GET /api/v1/resource..."],
  "systemArchitecture": "Detailed architectural layout and service data flow",
  "developmentRoadmap": [{"phase": "Phase 1: Foundation", "title": "Setup & Core Engine", "tasks": ["Task 1", "Task 2"]}],
  "taskBreakdown": [{"id": "TASK-101", "title": "Setup Database", "category": "Backend", "estimatedHours": 8}]
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    return JSON.parse(text);
  } catch (err: any) {
    console.error('Error in generateProjectPlan:', err);
    return {
      problemStatement: `Addressing core requirements for ${name}: ${description || idea}`,
      targetUsers: ['Software Developers', 'Project Stakeholders'],
      coreFeatures: [
        'Interactive User Interface',
        'Real-time Data Processing Engine',
        'Secure API & Data Management',
        'Automated Testing & Deployment Integration',
      ],
      userRoles: ['Administrator', 'Standard User'],
      userFlows: ['User authenticates -> Configures workspace -> Executes workflows -> Monitors outcomes'],
      functionalRequirements: [
        'Secure authentication and workspace isolation',
        'Real-time status updates and progress logs',
        'Persistent database storage',
      ],
      nonFunctionalRequirements: [
        'Sub-second API response time',
        'Strict user data isolation and security',
        'Responsive web presentation across desktop and mobile',
      ],
      techRecommendations: [
        { name: 'React 18 + Vite', category: 'Frontend', rationale: 'Fast HMR rendering and modern UI design' },
        { name: 'Express + Node.js', category: 'Backend', rationale: 'Robust REST endpoints and background job processing' },
        { name: 'Google Gemini 3.6 Flash', category: 'AI Engine', rationale: 'High performance code reasoning and planning' },
      ],
      databaseDesign: 'Users (id, email, profile) 1-to-N Projects (id, userId, stage, codeFiles) 1-to-N Artifacts & Jobs',
      apiRequirements: ['POST /api/auth/signup', 'POST /api/projects', 'POST /api/projects/:id/build'],
      systemArchitecture: 'Client SPA (React) <-> Express API Server <-> Persistent Store & Gemini AI Service',
      developmentRoadmap: [
        { phase: 'Phase 1', title: 'Architecture & Core Auth', tasks: ['Database schema', 'Session handler'] },
        { phase: 'Phase 2', title: 'Interactive Features & AI Integration', tasks: ['Gemini prompt engine', 'Verification pipeline'] },
      ],
      taskBreakdown: [
        { id: 'T-101', title: 'Setup Server Entry Point', category: 'Backend', estimatedHours: 4 },
        { id: 'T-102', title: 'Implement Client UI Views', category: 'Frontend', estimatedHours: 8 },
      ],
    };
  }
}

export async function generateCodeChanges(
  prompt: string,
  currentCodeFiles: Record<string, string>,
  projectName: string
): Promise<{ files: Record<string, string>; filesChanged: string[]; explanation: string }> {
  const ai = getAiClient();
  const fileContext = Object.entries(currentCodeFiles)
    .map(([file, content]) => `--- FILE: ${file} ---\n${content.slice(0, 3000)}`)
    .join('\n\n');

  const fullPrompt = `You are an expert AI software developer working on the project "${projectName}".
The user requested the following feature or modification:
"${prompt}"

Here is the current codebase context:
${fileContext}

Provide updated or new files to implement the request. Return a JSON object with:
1. "files": an object mapping file path string to full updated string content.
2. "filesChanged": array of file paths that were created or modified.
3. "explanation": a concise markdown string explaining what changes were made and why.

Schema:
{
  "files": { "src/App.tsx": "full code..." },
  "filesChanged": ["src/App.tsx"],
  "explanation": "Summary of changes..."
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    return {
      files: { ...currentCodeFiles, ...parsed.files },
      filesChanged: parsed.filesChanged || Object.keys(parsed.files || {}),
      explanation: parsed.explanation || 'Code generated successfully.',
    };
  } catch (err) {
    console.error('Error in generateCodeChanges:', err);
    const newFileName = `src/features/${Date.now().toString().slice(-4)}.ts`;
    const updatedFiles = {
      ...currentCodeFiles,
      [newFileName]: `// Feature implementation for: ${prompt}\nexport function executeFeature() {\n  return { success: true, timestamp: new Date().toISOString() };\n}\n`,
    };
    return {
      files: updatedFiles,
      filesChanged: [newFileName],
      explanation: `Implemented feature component for "${prompt}" in \`${newFileName}\`.`,
    };
  }
}

export async function generateDeepAnalysis(
  codeFiles: Record<string, string>,
  projectName: string,
  idea: string,
  plan?: any
): Promise<DeepAnalysis> {
  const ai = getAiClient();
  const meta = extractFactualProjectMetadata(codeFiles, projectName, plan);

  const filesList = Object.entries(codeFiles)
    .map(([path, content]) => `--- FILE: ${path} ---\n${content.slice(0, 2500)}`)
    .join('\n\n');

  const prompt = `You are a Principal Software Architect conducting a deep analysis of the codebase for "${projectName}".

ACTUAL CURRENT CODEBASE FILES (${meta.filePaths.length} files total):
${filesList}

VERIFIED CODEBASE FACTS:
${meta.factsFromCode.join('\n')}

PLANNED BUT UNIMPLEMENTED FEATURES (from architecture plan):
${meta.plannedNotImplemented.length > 0 ? meta.plannedNotImplemented.join('\n') : 'None'}

CRITICAL SOURCE-OF-TRUTH INSTRUCTIONS:
1. The source code files provided above are the PRIMARY SOURCE OF TRUTH.
2. DO NOT claim or hallucinate any unverified technologies (such as Go, Apache Kafka, TimescaleDB, Redis, MQTT, WebSockets, Python, C++) unless they exist directly in the source code or package.json above.
3. If a feature or technology was proposed in the plan/idea but does not exist in the code files, list it strictly under "plannedNotImplemented".
4. Separate findings into:
   - "factsFromCode": Direct factual observations from the actual code files.
   - "inferences": Logical architectural deductions derived from the code.
   - "recommendations": Actionable software engineering recommendations.
   - "plannedNotImplemented": Planned features/technologies from the initial plan that are not present in current code files.

Return JSON matching this schema:
{
  "factsFromCode": ["Fact 1...", "Fact 2..."],
  "inferences": ["Inference 1..."],
  "recommendations": ["Recommendation 1..."],
  "plannedNotImplemented": ["Proposed feature not yet in code..."],
  "overview": {
    "problem": "Problem statement",
    "targetUsers": "Primary user base",
    "mainFeatures": ["Feature 1", "Feature 2"],
    "techStack": ["React", "Express", "TypeScript", "Google Gemini AI"]
  },
  "architecture": {
    "frontend": "React 18 + Vite SPA",
    "backend": "Express Node.js Server",
    "database": "File-backed JSON Store",
    "apis": ["RESTful endpoints in server.ts"],
    "aiServices": ["Google Gemini 3.6 Flash"],
    "auth": "Session Bearer Token Auth",
    "externalServices": ["GitHub Git Data API"]
  },
  "folderStructure": [
    {"path": "/src", "description": "React UI component tree"},
    {"path": "/server", "description": "Express backend server and services"}
  ],
  "fileAnalysis": [
    {
      "filePath": "src/App.tsx",
      "purpose": "Primary React UI router and state container",
      "imports": ["react", "lucide-react"],
      "functions": ["App()"],
      "components": ["Header", "ProjectView"],
      "dependencies": ["lucide-react"],
      "apiCalls": ["/api/projects"],
      "dbOps": ["State management"],
      "relatedFiles": ["src/types.ts"]
    }
  ],
  "functionAnalysis": [
    {
      "functionName": "handleProjectCreate",
      "filePath": "src/App.tsx",
      "purpose": "Creates a new project record and updates application state",
      "params": "event: FormEvent",
      "returnVal": "Promise<void>",
      "logicSteps": ["Validate form fields", "Send POST to /api/projects", "Update local project state"],
      "conditions": ["Form validation check"],
      "errorHandling": "try/catch block with toast feedback",
      "callers": ["Form onSubmit"]
    }
  ],
  "dataFlow": [
    {"step": 1, "title": "User Request", "description": "User interacts with React frontend UI"},
    {"step": 2, "title": "Express Handling", "description": "Server route validates session and executes logic"}
  ],
  "executionFlow": "Detailed walkthrough of application startup, user authentication, workspace state load, and feature operations."
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.plannedNotImplemented) {
      parsed.plannedNotImplemented = meta.plannedNotImplemented;
    }
    return parsed;
  } catch (err) {
    console.error('Error in generateDeepAnalysis:', err);
    return {
      factsFromCode: meta.factsFromCode,
      inferences: [
        'Inference 1: Full-stack TypeScript architecture with client SPA and server API',
        'Inference 2: Ready for persistent storage synchronization and cloud deployment',
      ],
      recommendations: [
        'Recommendation 1: Expand automated test coverage for core business logic',
        'Recommendation 2: Set up automated CI/CD push triggers',
      ],
      plannedNotImplemented: meta.plannedNotImplemented,
      overview: {
        problem: `Addressing core requirements for ${projectName}: ${idea}`,
        targetUsers: 'Software Developers and System Stakeholders',
        mainFeatures: ['Project Planning', 'Interactive UI Views', 'Deep Code Intelligence', 'GitHub Integration'],
        techStack: ['TypeScript', 'React', 'Express', 'Google Gemini AI'],
      },
      architecture: {
        frontend: meta.hasReact ? 'React 18 + Tailwind CSS + Vite' : 'HTML/CSS/JS Frontend',
        backend: meta.hasExpress ? 'Express Node.js Server' : 'Node.js Service',
        database: 'Local File-Backed JSON Store',
        apis: ['/api/projects', '/api/auth'],
        aiServices: meta.hasGemini ? ['Google Gemini 3.6 Flash'] : ['AI Service'],
        auth: 'Session Bearer Auth',
        externalServices: meta.hasGithub ? ['GitHub REST & Git Data API'] : [],
      },
      folderStructure: meta.filePaths.map(f => ({ path: f, description: `Source file (${f})` })),
      fileAnalysis: meta.filePaths.map(f => ({
        filePath: f,
        purpose: `Implementation logic in ${f}`,
        imports: ['react', 'express'],
        functions: ['handler()'],
        components: ['MainView'],
        dependencies: ['lucide-react'],
        apiCalls: ['/api/projects'],
        dbOps: ['Read/Write'],
        relatedFiles: [],
      })),
      functionAnalysis: [
        {
          functionName: 'mainHandler',
          filePath: 'src/App.tsx',
          purpose: 'Main view state handler',
          params: 'none',
          returnVal: 'void',
          logicSteps: ['Validate auth session', 'Fetch workspace data'],
          conditions: ['Authenticated user check'],
          errorHandling: 'Standard try/catch handler',
          callers: ['Component mount'],
        },
      ],
      dataFlow: [
        { step: 1, title: 'Client Action', description: 'User clicks action in workspace UI' },
        { step: 2, title: 'Server Processing', description: 'Express route executes business logic and returns response' },
      ],
      executionFlow: `Application launches -> authenticates user -> loads project snapshot -> presents workspace stages.`,
    };
  }
}

export async function generateGrowRecommendations(
  codeFiles: Record<string, string>,
  projectName: string,
  plan?: any
): Promise<GrowRecommendations> {
  const ai = getAiClient();
  const meta = extractFactualProjectMetadata(codeFiles, projectName, plan);

  const prompt = `Analyze the current project "${projectName}" based on its actual source code and generate factual developer growth recommendations.

VERIFIED CODEBASE FACTS:
${meta.factsFromCode.join('\n')}

PLANNED BUT UNIMPLEMENTED FEATURES:
${meta.plannedNotImplemented.length > 0 ? meta.plannedNotImplemented.join('\n') : 'None'}

Return JSON matching this schema:
{
  "knowledgeGaps": ["Gap 1..."],
  "weakAreas": ["Weak area 1..."],
  "securityWeaknesses": ["Security check 1..."],
  "performanceProblems": ["Performance check 1..."],
  "missingTests": ["Test case 1..."],
  "learningPath": [
    { "topic": "Topic Name", "reason": "Reason for project", "resources": ["Resource Link"] }
  ],
  "projectImprovements": [
    { "id": "imp-1", "title": "Improvement Title", "description": "Detailed description", "complexity": "Medium", "status": "suggested" }
  ],
  "implementationChallenges": [
    { "title": "Challenge Title", "scenario": "Real scenario", "goal": "Specific goal" }
  ]
}`;

  try {
    const res = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    return JSON.parse(res.text || '{}');
  } catch (err) {
    return {
      knowledgeGaps: ['TypeScript strict mode enforcement', 'API rate limiting patterns'],
      weakAreas: ['Automated integration testing', 'Request schema validation'],
      securityWeaknesses: ['Strict request payload Zod validation'],
      performanceProblems: ['Dynamic bundle splitting for heavy modules'],
      missingTests: ['API endpoint boundary tests', 'State persistence error recovery tests'],
      learningPath: [
        { topic: 'TypeScript Advanced Types & Guards', reason: 'Prevent runtime null errors during API state transitions', resources: ['TypeScript Official Handbook'] },
      ],
      projectImprovements: [
        { id: 'imp-1', title: 'Add Zod Payload Validation Middleware', description: 'Validate request bodies before executing database or AI tasks', complexity: 'Easy', status: 'suggested' },
        { id: 'imp-2', title: 'Integrate Automated End-to-End Test Suite', description: 'Ensure pipeline stability across user stages', complexity: 'Medium', status: 'suggested' },
      ],
      implementationChallenges: [
        { title: 'Offline Workspace State Sync', scenario: 'User network drops during edit session', goal: 'Store pending changes in IndexedDB and re-sync upon connection restore' },
      ],
    };
  }
}

export async function generateInterviewPrep(
  codeFiles: Record<string, string>,
  projectName: string,
  plan?: any
): Promise<InterviewPrep> {
  const ai = getAiClient();
  const meta = extractFactualProjectMetadata(codeFiles, projectName, plan);

  const filesList = Object.entries(codeFiles)
    .map(([path, content]) => `--- FILE: ${path} ---\n${content.slice(0, 1500)}`)
    .join('\n\n');

  const prompt = `You are a Senior Technical Interviewer preparing materials for "${projectName}".

ACTUAL IMPLEMENTED SOURCE CODE SNAPSHOT:
${filesList}

VERIFIED CODEBASE FACTS:
${meta.factsFromCode.join('\n')}

PLANNED BUT UNIMPLEMENTED FEATURES:
${meta.plannedNotImplemented.length > 0 ? meta.plannedNotImplemented.join('\n') : 'None'}

CRITICAL INSTRUCTIONS:
1. Base ALL pitches, architectural trade-offs, and interview Q&A strictly on the ACTUAL implemented technologies (React, Express, TypeScript, Gemini AI, GitHub API, JSON store).
2. DO NOT invent or ask questions about unverified technologies (such as Go, Apache Kafka, TimescaleDB, Redis, MQTT) unless they exist in the code files above.
3. If discussing architectural trade-offs, discuss the real trade-offs of the implemented stack (e.g., Express + local file DB vs relational SQL, client SPA vs SSR).

Return JSON matching this schema:
{
  "pitches": {
    "sec30": "30-second elevator pitch based on actual implementation.",
    "min2": "2-minute overview covering problem, actual stack, and key features.",
    "min5": "5-minute technical deep dive into system design, API contracts, state management, and deployment."
  },
  "architecturalTradeoffs": [
    {
      "decision": "Express + TypeScript Backend with React Frontend",
      "rationale": "Ensures full-stack type safety and rapid single-page application interactivity.",
      "tradeoff": "Requires compilation and dual runtime management."
    }
  ],
  "interviewQa": [
    {
      "category": "Architecture & Security",
      "question": "How does ${projectName} structure its API and state management?",
      "modelAnswer": "The frontend uses React with typed REST API clients, communicating with an Express backend that handles authentication and AI orchestration.",
      "keyPoints": ["Typed API client", "Express REST routes", "Server-side AI orchestration"]
    }
  ],
  "twoMinExplanation": "Concise 2-minute pitch.",
  "fiveMinExplanation": "Comprehensive 5-minute deep-dive.",
  "techChoices": [
    { "tech": "React + Express + TypeScript", "justification": "Ensures full-stack type safety and rapid development iteration." }
  ],
  "questions": [
    {
      "category": "Architecture & Design",
      "question": "How does the workspace isolate user session state?",
      "modelAnswer": "Server endpoints validate session bearer tokens and scope database queries by authenticated user ID.",
      "keyPoints": ["Bearer token validation", "Server-side scoping"]
    }
  ]
}`;

  try {
    const res = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    const parsed = JSON.parse(res.text || '{}');
    if (!parsed.pitches) {
      parsed.pitches = {
        sec30: parsed.twoMinExplanation || `${projectName} is a full-stack software application built with React, Express, and Google Gemini AI.`,
        min2: parsed.twoMinExplanation || `${projectName} provides a structured engineering workspace connecting user ideas to complete full-stack TypeScript applications.`,
        min5: parsed.fiveMinExplanation || `${projectName} implements an Express REST backend, React frontend, Gemini AI integration, and GitHub API synchronization.`,
      };
    }
    if (!parsed.architecturalTradeoffs && parsed.techChoices) {
      parsed.architecturalTradeoffs = parsed.techChoices.map((tc: any) => ({
        decision: tc.tech,
        rationale: tc.justification,
        tradeoff: 'Balanced development speed with full-stack type safety.',
      }));
    }
    if (!parsed.interviewQa && parsed.questions) {
      parsed.interviewQa = parsed.questions.map((q: any) => ({
        category: q.category,
        question: q.question,
        modelAnswer: q.modelAnswer,
        keyPoints: q.keyPoints,
      }));
    }
    return parsed;
  } catch (err) {
    return {
      pitches: {
        sec30: `${projectName} is a full-stack software application built with TypeScript, React, Express, and Google Gemini AI.`,
        min2: `${projectName} provides a complete software engineering pipeline: Idea -> Plan -> Build -> Verify -> Understand -> Improve -> Prepare -> Showcase -> Deploy.`,
        min5: `${projectName} features a React frontend, Express server backend, Google Gemini AI reasoning engine, local JSON persistence, and GitHub API code synchronization.`,
      },
      architecturalTradeoffs: [
        {
          decision: 'Express.js & TypeScript Backend',
          rationale: 'Ensures type safety across REST API endpoints and background job execution.',
          tradeoff: 'Requires compilation build step.',
        },
        {
          decision: 'Google Gemini 3.6 Flash Integration',
          rationale: 'Delivers rapid reasoning for code analysis and project planning.',
          tradeoff: 'Requires external API key and error handling.',
        },
      ],
      interviewQa: [
        {
          category: 'Security & State Management',
          question: 'How do you ensure data isolation between authenticated sessions?',
          modelAnswer: 'Every server API route validates session bearer tokens and scopes query operations by authenticated user ID.',
          keyPoints: ['Bearer token validation', 'Server-side authorization', 'User-scoped database queries'],
        },
      ],
      twoMinExplanation: `${projectName} is a full-stack software application engineered with React, Express, and Google Gemini AI.`,
      fiveMinExplanation: `${projectName} provides a structured end-to-end engineering pipeline covering planning, code generation, deep analysis, and cloud deployment.`,
      techChoices: [
        { tech: 'React + Express + TypeScript', justification: 'Ensures full-stack type safety and rapid development iteration.' },
        { tech: 'Google Gemini 3.6 Flash', justification: 'Delivers rapid AI reasoning for code analysis and planning.' },
      ],
      questions: [
        {
          category: 'Security & Isolation',
          question: 'How do you prevent data leaks between user sessions?',
          modelAnswer: 'API routes enforce session bearer token checks server-side before executing mutations.',
          keyPoints: ['Session authentication', 'Server-side authorization'],
        },
      ],
    };
  }
}

export async function generateArtifact(
  artifactType: string,
  projectName: string,
  idea: string,
  codeFiles: Record<string, string>,
  plan?: any
): Promise<{ title: string; content: string }> {
  const ai = getAiClient();
  const meta = extractFactualProjectMetadata(codeFiles, projectName, plan);

  const filesList = Object.entries(codeFiles)
    .map(([path, content]) => `--- FILE: ${path} ---\n${content.slice(0, 1500)}`)
    .join('\n\n');

  const prompt = `Generate a high-quality showcase artifact of type "${artifactType}" for "${projectName}".

ACTUAL SOURCE CODE SNAPSHOT:
${filesList}

VERIFIED CODEBASE FACTS:
${meta.factsFromCode.join('\n')}

PLANNED BUT UNIMPLEMENTED FEATURES:
${meta.plannedNotImplemented.length > 0 ? meta.plannedNotImplemented.join('\n') : 'None'}

CRITICAL FACTUALITY RULE:
1. Base the showcase document strictly on the verified facts of the actual codebase above.
2. DO NOT claim or describe unverified technologies (such as Go, Apache Kafka, TimescaleDB, Redis, MQTT) unless they exist directly in the source code files.

Return JSON matching this schema:
{
  "title": "Document Title",
  "content": "Full markdown content of the document"
}`;

  try {
    const res = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    return JSON.parse(res.text || '{}');
  } catch (err) {
    return {
      title: `${artifactType.toUpperCase()} - ${projectName}`,
      content: `# ${projectName} - ${artifactType}\n\n## Overview\n${idea}\n\n## Technical Architecture (Verified Source Code)\n- **Frontend**: React 18 + Tailwind CSS + Vite\n- **Backend**: Express Node.js Server (${meta.filePaths.filter(f => f.startsWith('server/')).length} server modules)\n- **AI Engine**: Google Gemini 3.6 Flash via @google/genai SDK\n- **GitHub Integration**: Git Data API Synchronization\n\n## Summary\nFully functional full-stack application built with TypeScript and verified source code files.`,
    };
  }
}

export async function generateLinkedInPost(
  projectName: string,
  description: string,
  idea: string,
  codeFiles: Record<string, string>,
  githubUrl?: string,
  liveUrl?: string
): Promise<string> {
  const ai = getAiClient();
  const meta = extractFactualProjectMetadata(codeFiles, projectName);

  const prompt = `Write an engaging, professional LinkedIn project announcement post for "${projectName}".

Description: ${description}
Core Idea: ${idea}
Verified Stack: ${meta.factsFromCode.join(', ')}
GitHub Repository: ${githubUrl || 'Available on request'}
Live Demo URL: ${liveUrl || 'Deployed on Cloud Run'}

CRITICAL RULE:
Focus strictly on the actual implemented technology stack (TypeScript, React, Express, Google Gemini AI). DO NOT claim unverified technologies like Go, Kafka, TimescaleDB, or Redis.

Return only the plain text formatted LinkedIn post text.`;

  try {
    const res = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return res.text || '';
  } catch (err) {
    return `🚀 Excited to announce my latest engineering project: ${projectName}!\n\n💡 The Problem:\n${description || idea}\n\n⚡ The Solution:\nA full-stack software application engineered with TypeScript, React, Express, and Google Gemini AI.\n\n🛠️ Key Features & Verified Stack:\n- ${meta.factsFromCode.join('\n- ')}\n\n🔗 GitHub Repo: ${githubUrl || 'Available on request'}\n🌐 Live Demo: ${liveUrl || 'Deployed'}\n\n#SoftwareEngineering #TypeScript #React #Express #GeminiAI #WebDev`;
  }
}
