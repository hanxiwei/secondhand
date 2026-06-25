type TokenPayload = {
  userId: string;
  username: string;
  issuedAt: number;
};

const TOKEN_PREFIX = 'campus-auth';

export function createAuthToken(userId: string, username: string) {
  const payload: TokenPayload = {
    userId,
    username,
    issuedAt: Date.now(),
  };

  return Buffer.from(`${TOKEN_PREFIX}:${JSON.stringify(payload)}`).toString('base64');
}

export function parseAuthToken(token: string): TokenPayload | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');

    if (!decoded.startsWith(`${TOKEN_PREFIX}:`)) {
      return null;
    }

    return JSON.parse(decoded.slice(TOKEN_PREFIX.length + 1)) as TokenPayload;
  } catch {
    return null;
  }
}
