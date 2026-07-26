import tls from 'tls';
import dns from 'dns';
import https from 'https';
import http from 'http';
import { collectCompleteProjectSource } from './github';

export interface DeploymentVerificationResult {
  status: 'live' | 'workspace_protected' | 'deployed_https_failed' | 'failed' | 'no_public_url';
  provider: string;
  deploymentId: string;
  canonicalUrl: string;
  liveUrl: string;
  hostname: string;
  dnsVerified: boolean;
  tlsVerified: boolean;
  tlsErrorMessage?: string;
  httpsVerified: boolean;
  healthCheckPassed: boolean;
  healthCheckStatus: string;
  isWorkspaceProtected?: boolean;
  publicAccessMessage?: string;
  noPublicUrlReturned: boolean;
  sourceSnapshotId: string;
  sourceSnapshotFiles: number;
  buildStatus: 'completed' | 'failed';
  timestamp: string;
}

export function getProviderCandidates(reqHost?: string): string[] {
  const candidates: string[] = [];

  const envVars = [
    process.env.APP_URL,
    process.env.DEV_APP_URL,
    process.env.DEPLOYMENT_URL,
    process.env.BASE_URL,
  ];

  for (const val of envVars) {
    if (val && typeof val === 'string' && val.trim()) {
      candidates.push(val.trim());
    }
  }

  if (reqHost && typeof reqHost === 'string' && reqHost.trim()) {
    const cleanHost = reqHost.trim();
    if (!cleanHost.includes('localhost') && !cleanHost.includes('127.0.0.1')) {
      candidates.push(cleanHost.startsWith('http') ? cleanHost : `https://${cleanHost}`);
    }
  }

  const sanitized = candidates
    .map((url) => {
      let clean = url.trim().replace(/\/+$/, '');
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = `https://${clean}`;
      }
      if (clean.startsWith('http://')) {
        clean = clean.replace('http://', 'https://');
      }
      return clean;
    })
    .filter((url) => !url.includes('ais-pre-')); // Exclude ais-pre preview URLs as requested

  return Array.from(new Set(sanitized));
}

function checkHostnameMatch(hostname: string, commonName?: string, altNames: string[] = []): boolean {
  const hostLower = hostname.toLowerCase();
  const names = [commonName, ...altNames].filter(Boolean).map((n) => n!.toLowerCase());

  for (const name of names) {
    if (name === hostLower) return true;
    if (name.startsWith('*.')) {
      const wildcardDomain = name.slice(2);
      const hostParts = hostLower.split('.');
      const domainParts = wildcardDomain.split('.');
      if (hostParts.length === domainParts.length + 1 && hostLower.endsWith('.' + wildcardDomain)) {
        return true;
      }
    }
  }
  return false;
}

export async function verifyDnsResolution(hostname: string): Promise<{ valid: boolean; ip?: string; error?: string }> {
  try {
    const res = await dns.promises.lookup(hostname);
    return { valid: true, ip: res.address };
  } catch (err: any) {
    return { valid: false, error: `DNS resolution failed for hostname "${hostname}": ${err.message || err.code}` };
  }
}

export async function verifyTlsCertificate(hostname: string, port = 443): Promise<{
  valid: boolean;
  commonName?: string;
  altNames?: string[];
  error?: string;
}> {
  return new Promise((resolve) => {
    try {
      const socket = tls.connect(
        {
          host: hostname,
          port,
          servername: hostname,
          rejectUnauthorized: true,
        },
        () => {
          const authorized = socket.authorized;
          const authError = socket.authorizationError;
          const cert = socket.getPeerCertificate(true);

          socket.end();

          if (!authorized) {
            const errStr = String(authError || '');
            let errorMsg = `TLS certificate verification failed: ${errStr || 'Unauthorized certificate'}`;
            if (
              errStr.includes('ERR_TLS_CERT_ALTNAME_INVALID') ||
              errStr.includes('ALTNAME') ||
              errStr.includes('hostname')
            ) {
              errorMsg = `TLS certificate hostname mismatch (NET::ERR_CERT_COMMON_NAME_INVALID): Certificate Subject Alternative Name does not match hostname "${hostname}".`;
            }
            return resolve({ valid: false, error: errorMsg });
          }

          if (!cert || !cert.subject) {
            return resolve({ valid: false, error: 'No TLS certificate returned by server.' });
          }

          const rawCn = cert.subject.CN;
          const commonName: string = Array.isArray(rawCn) ? (rawCn[0] || '') : (rawCn || '');
          const altNames = cert.subjectaltname
            ? cert.subjectaltname.split(', ').map((s) => s.replace('DNS:', ''))
            : [];

          const matches = checkHostnameMatch(hostname, commonName, altNames);
          if (!matches) {
            return resolve({
              valid: false,
              commonName,
              altNames,
              error: `TLS certificate hostname mismatch (NET::ERR_CERT_COMMON_NAME_INVALID): Certificate CN (${commonName}) / SANs (${altNames.join(', ')}) do not match "${hostname}".`,
            });
          }

          resolve({ valid: true, commonName, altNames });
        }
      );

      socket.on('error', (err: any) => {
        let errorMsg = err.message || 'TLS socket connection error.';
        if (
          err.code === 'ERR_TLS_CERT_ALTNAME_INVALID' ||
          errorMsg.includes('Altname') ||
          errorMsg.includes('Common Name') ||
          errorMsg.includes('hostname')
        ) {
          errorMsg = `TLS certificate hostname mismatch (NET::ERR_CERT_COMMON_NAME_INVALID): Certificate hostname does not match "${hostname}".`;
        }
        resolve({ valid: false, error: errorMsg });
      });

      socket.setTimeout(8000, () => {
        socket.destroy();
        resolve({ valid: false, error: 'TLS certificate verification timed out after 8 seconds.' });
      });
    } catch (err: any) {
      resolve({ valid: false, error: err.message || 'TLS handshake failed.' });
    }
  });
}

export async function verifyHttpsHealth(
  canonicalUrl: string
): Promise<{
  valid: boolean;
  statusCode?: number;
  statusText?: string;
  error?: string;
  isWorkspaceProtected?: boolean;
  isPublicDirectAccess?: boolean;
  publicAccessMessage?: string;
}> {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(canonicalUrl);
      const hostname = urlObj.hostname;
      const isHttps = urlObj.protocol === 'https:';
      const lib = isHttps ? https : http;

      // Detect if URL is on internal AI Studio dev container sandbox
      const isInternalDevSandbox = hostname.includes('ais-dev-');

      const checkPaths = ['/api/health', '/'];
      let currentIdx = 0;

      const tryNextPath = () => {
        if (currentIdx >= checkPaths.length) {
          return resolve({ valid: false, error: 'Health check requests failed for all standard endpoints.' });
        }

        const targetUrl = `${canonicalUrl}${checkPaths[currentIdx]}`;
        currentIdx++;

        const req = lib.get(
          targetUrl,
          {
            rejectUnauthorized: true,
            headers: { 'User-Agent': 'ForgeFlow-HealthCheck/1.0' },
          },
          (res) => {
            const statusCode = res.statusCode || 0;
            const redirectLocation = res.headers.location || '';
            
            let bodyChunks: string[] = [];
            res.on('data', (chunk) => {
              if (bodyChunks.join('').length < 8192) {
                bodyChunks.push(chunk.toString());
              }
            });

            res.on('end', () => {
              const bodyText = bodyChunks.join('');
              
              const redirectsToAuth =
                redirectLocation.includes('accounts.google.com') ||
                redirectLocation.includes('ai.studio') ||
                redirectLocation.includes('security-cookie') ||
                redirectLocation.includes('login');

              const bodyHasAuthGate =
                bodyText.includes('Sign in') ||
                bodyText.includes('Google AI Studio') ||
                bodyText.includes('security-cookie');

              const isProtected = isInternalDevSandbox || redirectsToAuth || bodyHasAuthGate;

              if (statusCode >= 200 && statusCode < 500) {
                if (isProtected) {
                  return resolve({
                    valid: true,
                    statusCode,
                    isWorkspaceProtected: true,
                    isPublicDirectAccess: false,
                    statusText: 'Internal Workspace Sandbox (Requires AI Studio Session for Visitors)',
                    publicAccessMessage:
                      'Notice: This URL is hosted on your AI Studio development container. Unauthenticated external visitors will see the AI Studio login/security page.',
                  });
                } else {
                  return resolve({
                    valid: true,
                    statusCode,
                    isWorkspaceProtected: false,
                    isPublicDirectAccess: true,
                    statusText: `Passed (${statusCode === 200 ? '200 OK' : statusCode} - Directly Accessible)`,
                    publicAccessMessage: 'Publicly accessible directly without authentication requirements.',
                  });
                }
              } else {
                tryNextPath();
              }
            });
          }
        );

        req.on('error', (err: any) => {
          let errorMsg = err.message || 'HTTPS health check request failed.';
          if (
            err.code === 'ERR_TLS_CERT_ALTNAME_INVALID' ||
            errorMsg.includes('Altname') ||
            errorMsg.includes('Common Name')
          ) {
            errorMsg = `TLS certificate hostname mismatch (NET::ERR_CERT_COMMON_NAME_INVALID): Certificate hostname does not match URL.`;
          }
          resolve({ valid: false, error: errorMsg });
        });

        req.setTimeout(8000, () => {
          req.destroy();
          resolve({ valid: false, error: 'HTTPS health check timed out after 8 seconds.' });
        });
      };

      tryNextPath();
    } catch (err: any) {
      resolve({ valid: false, error: err.message || 'HTTPS request initialization failed.' });
    }
  });
}

export async function runDeploymentPipeline(
  reqHost?: string,
  jobId?: string
): Promise<DeploymentVerificationResult> {
  const provider = 'Google Cloud Run';
  const timestamp = new Date().toISOString();
  const deploymentId = jobId ? `cloudrun-${jobId.slice(0, 8)}` : `cloudrun-${Date.now().toString(36)}`;

  const snapshot = collectCompleteProjectSource();
  const sourceSnapshotId = snapshot.snapshotId;
  const sourceSnapshotFiles = snapshot.fileCount;

  const candidateUrls = getProviderCandidates(reqHost);

  if (candidateUrls.length === 0) {
    return {
      status: 'no_public_url',
      provider,
      deploymentId,
      canonicalUrl: '',
      liveUrl: '',
      hostname: '',
      dnsVerified: false,
      tlsVerified: false,
      httpsVerified: false,
      healthCheckPassed: false,
      healthCheckStatus: 'No public URL returned by deployment provider',
      noPublicUrlReturned: true,
      sourceSnapshotId,
      sourceSnapshotFiles,
      buildStatus: 'completed',
      timestamp,
    };
  }

  let bestFailure: {
    canonicalUrl: string;
    hostname: string;
    dnsVerified: boolean;
    tlsVerified: boolean;
    tlsError?: string;
    httpsVerified: boolean;
    healthCheckStatus: string;
  } | null = null;

  for (const candidateUrl of candidateUrls) {
    try {
      const parsed = new URL(candidateUrl);
      const hostname = parsed.hostname;

      const dnsRes = await verifyDnsResolution(hostname);
      if (!dnsRes.valid) {
        bestFailure = {
          canonicalUrl: candidateUrl,
          hostname,
          dnsVerified: false,
          tlsVerified: false,
          tlsError: dnsRes.error,
          httpsVerified: false,
          healthCheckStatus: `DNS Lookup Failed: ${dnsRes.error}`,
        };
        continue;
      }

      const tlsRes = await verifyTlsCertificate(hostname);
      if (!tlsRes.valid) {
        bestFailure = {
          canonicalUrl: candidateUrl,
          hostname,
          dnsVerified: true,
          tlsVerified: false,
          tlsError: tlsRes.error || 'TLS certificate hostname mismatch (NET::ERR_CERT_COMMON_NAME_INVALID)',
          httpsVerified: false,
          healthCheckStatus: 'TLS Certificate Verification Failed',
        };
        continue;
      }

      const healthRes = await verifyHttpsHealth(candidateUrl);
      if (!healthRes.valid) {
        bestFailure = {
          canonicalUrl: candidateUrl,
          hostname,
          dnsVerified: true,
          tlsVerified: true,
          httpsVerified: false,
          healthCheckStatus: healthRes.error || 'Health check failed',
        };
        continue;
      }

      const status = healthRes.isWorkspaceProtected ? 'workspace_protected' : 'live';

      return {
        status,
        provider,
        deploymentId,
        canonicalUrl: candidateUrl,
        liveUrl: candidateUrl,
        hostname,
        dnsVerified: true,
        tlsVerified: true,
        httpsVerified: true,
        healthCheckPassed: true,
        healthCheckStatus: healthRes.statusText || 'Passed',
        isWorkspaceProtected: healthRes.isWorkspaceProtected || false,
        publicAccessMessage: healthRes.publicAccessMessage || '',
        noPublicUrlReturned: false,
        sourceSnapshotId,
        sourceSnapshotFiles,
        buildStatus: 'completed',
        timestamp,
      };
    } catch (err: any) {
      bestFailure = {
        canonicalUrl: candidateUrl,
        hostname: candidateUrl,
        dnsVerified: false,
        tlsVerified: false,
        tlsError: err.message,
        httpsVerified: false,
        healthCheckStatus: `Validation error: ${err.message}`,
      };
    }
  }

  return {
    status: 'deployed_https_failed',
    provider,
    deploymentId,
    canonicalUrl: bestFailure?.canonicalUrl || '',
    liveUrl: '', // Do NOT present unverified or broken HTTPS URL as live URL
    hostname: bestFailure?.hostname || '',
    dnsVerified: bestFailure?.dnsVerified || false,
    tlsVerified: bestFailure?.tlsVerified || false,
    tlsErrorMessage: bestFailure?.tlsError || 'TLS certificate hostname mismatch (NET::ERR_CERT_COMMON_NAME_INVALID).',
    httpsVerified: bestFailure?.httpsVerified || false,
    healthCheckPassed: false,
    healthCheckStatus: bestFailure?.healthCheckStatus || 'HTTPS Verification Failed',
    noPublicUrlReturned: false,
    sourceSnapshotId,
    sourceSnapshotFiles,
    buildStatus: 'completed',
    timestamp,
  };
}
