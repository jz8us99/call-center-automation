// 自定义Google OAuth实现（备选方案）
// 这个文件提供了不依赖Supabase OAuth的Google登录实现

export interface GoogleAuthConfig {
  clientId: string;
  redirectUri: string;
  scope?: string;
}

export class GoogleAuth {
  private config: GoogleAuthConfig;

  constructor(config: GoogleAuthConfig) {
    this.config = {
      scope: 'email profile',
      ...config,
    };
  }

  /**
   * 生成Google OAuth授权URL
   */
  generateAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope!,
      access_type: 'offline',
      prompt: 'consent',
      state: this.generateState(),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * 使用授权码交换访问令牌
   */
  async exchangeCodeForTokens(code: string, clientSecret: string) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    return response.json();
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(accessToken: string) {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  }

  /**
   * 生成随机state参数用于CSRF保护
   */
  private generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * 重定向到Google登录页面
   */
  redirectToGoogle(): void {
    const authUrl = this.generateAuthUrl();
    window.location.href = authUrl;
  }
}

// 工厂函数
export function createGoogleAuth(): GoogleAuth {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  return new GoogleAuth({
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    redirectUri: `${siteUrl}/auth/google/callback`,
  });
}

// 使用示例的hook
export function useGoogleAuth() {
  const googleAuth = createGoogleAuth();

  const signInWithGoogle = () => {
    try {
      googleAuth.redirectToGoogle();
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  return { signInWithGoogle };
}
