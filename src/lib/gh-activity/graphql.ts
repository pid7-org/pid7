import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface GraphQLOptions {
  token?: string;
  org?: string;
  maxRetries?: number;
  retryDelayMs?: number;
}

export function getGHToken(): string {
  if (process.env.GH_TOKEN && process.env.GH_TOKEN.trim() !== '') {
    return process.env.GH_TOKEN.trim();
  }
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim() !== '') {
    return process.env.GITHUB_TOKEN.trim();
  }
  try {
    const tokenFromCLI = execFileSync('gh', ['auth', 'token'], { encoding: 'utf-8' }).trim();
    if (tokenFromCLI) {
      return tokenFromCLI;
    }
  } catch {
    // Ignore CLI auth fallback failure
  }
  throw new Error('Missing required environment variable: GH_TOKEN (or authenticate via "gh auth login")');
}

export function validateEnv(): { token: string; org: string } {
  const token = getGHToken();
  const org = process.env.GITHUB_ORG;

  if (!org || org.trim() === '') {
    throw new Error('Missing required environment variable: GITHUB_ORG');
  }

  return { token, org: org.trim() };
}

export async function runGraphQLAsync<T>(
  query: string,
  variables: Record<string, unknown> = {},
  options?: GraphQLOptions
): Promise<T> {
  const token = options?.token || getGHToken();

  const cliArgs = ['api', 'graphql', '-f', `query=${query}`];
  for (const [key, val] of Object.entries(variables)) {
    if (val !== undefined && val !== null) {
      cliArgs.push('-F', `${key}=${val}`);
    }
  }

  const maxRetries = options?.maxRetries ?? 3;
  let delayMs = options?.retryDelayMs ?? 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { stdout } = await execFileAsync('gh', cliArgs, {
        encoding: 'utf-8',
        env: {
          ...process.env,
          GH_TOKEN: token,
        },
        maxBuffer: 50 * 1024 * 1024,
      });

      const parsed = JSON.parse(stdout);

      if (parsed.errors && Array.isArray(parsed.errors) && parsed.errors.length > 0) {
        const errorMsgs = parsed.errors.map((e: { message: string }) => e.message).join('; ');
        throw new Error(`GraphQL response contained errors: ${errorMsgs}`);
      }

      if (!parsed.data) {
        throw new Error('GraphQL response missing "data" payload.');
      }

      return parsed.data as T;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const isTransient =
        message.includes('HTTP 499') ||
        message.includes('HTTP 502') ||
        message.includes('HTTP 503') ||
        message.includes('HTTP 403') ||
        message.includes('ETIMEDOUT') ||
        message.includes('ECONNRESET');

      if (isTransient && attempt < maxRetries) {
        console.warn(`[GraphQL Retry] Attempt ${attempt}/${maxRetries} failed. Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
        continue;
      }

      const sanitizedMsg = token ? message.replace(new RegExp(token, 'g'), '[REDACTED]') : message;
      throw new Error(`GraphQL request failed: ${sanitizedMsg}`);
    }
  }

  throw new Error('GraphQL request failed after retries.');
}
