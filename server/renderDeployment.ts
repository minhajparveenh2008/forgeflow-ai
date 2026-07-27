import https from 'https';

interface RenderService {
  id: string;
  name: string;
  serviceDetails?: {
    url?: string;
  };
  suspended?: string;
}

interface RenderDeploymentResult {
  serviceId: string;
  serviceName: string;
  serviceUrl: string;
  deploymentId?: string;
  status: string;
}

function renderRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.RENDER_API_KEY;

    if (!apiKey) {
      reject(new Error('RENDER_API_KEY is not configured.'));
      return;
    }

    const payload = body ? JSON.stringify(body) : undefined;

    const req = https.request(
      {
        hostname: 'api.render.com',
        path,
        method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(payload
            ? { 'Content-Length': Buffer.byteLength(payload) }
            : {}),
        },
      },
      (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk.toString();
        });

        res.on('end', () => {
          if ((res.statusCode || 500) >= 400) {
            reject(
              new Error(
                `Render API error ${res.statusCode}: ${data}`
              )
            );
            return;
          }

          try {
            resolve(JSON.parse(data) as T);
          } catch {
            reject(
              new Error(
                `Invalid response from Render API: ${data}`
              )
            );
          }
        });
      }
    );

    req.on('error', reject);

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
}

export async function createRenderWebService(
  serviceName: string,
  repoUrl: string
): Promise<RenderService> {
 

  return renderRequest<RenderService>(
    'POST',
    '/v1/services',
    {
      type: 'web_service',
      name: serviceName,
      ownerId,
      repo: repoUrl,
      branch: 'main',
      autoDeploy: 'yes',
      serviceDetails: {
        env: 'node',
        plan: 'free',
        region: 'singapore',
        buildCommand: 'npm install && npm run build',
        startCommand: 'npm start',
      },
    }
  );
}

export async function waitForRenderService(
  serviceId: string,
  timeoutMs = 10 * 60 * 1000
): Promise<RenderDeploymentResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const service = await renderRequest<RenderService>(
      'GET',
      `/v1/services/${serviceId}`
    );

    const serviceUrl =
      service.serviceDetails?.url ||
      `https://${service.name}.onrender.com`;

    if (service.suspended === 'suspended') {
      throw new Error('Render service was suspended.');
    }

    if (serviceUrl) {
      return {
        serviceId: service.id,
        serviceName: service.name,
        serviceUrl,
        status: 'live',
      };
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 10_000)
    );
  }

  throw new Error(
    'Render deployment timed out after 10 minutes.'
  );
}