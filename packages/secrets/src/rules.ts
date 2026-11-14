// Adapted from Gitleaks config/gitleaks.toml. MIT, Copyright (c) 2019 Zachary Rice.
// The full notice is in ../LICENSE. Capture `secret` excludes assignment/URL syntax.
export const rules = [
  {
    id: 'github-pat',
    label: 'GitHub token',
    pattern: /\b(?<secret>ghp_[a-zA-Z0-9]{36})(?![\w-])/g,
    keepPrefix: 4,
  },
  {
    id: 'github-fine-grained-pat',
    label: 'GitHub fine-grained token',
    pattern: /\b(?<secret>github_pat_\w{82})(?![\w-])/g,
    keepPrefix: 11,
  },
  {
    id: 'github-oauth',
    label: 'GitHub OAuth token',
    pattern: /\b(?<secret>gho_[a-zA-Z0-9]{36})(?![\w-])/g,
    keepPrefix: 4,
  },
  {
    id: 'github-app-token',
    label: 'GitHub app token',
    pattern: /\b(?<secret>gh[us]_[a-zA-Z0-9]{36})(?![\w-])/g,
    keepPrefix: 4,
  },
  {
    id: 'aws-access-token',
    label: 'AWS access token',
    pattern: /\b(?<secret>(?:A3T[A-Z0-9]|AKIA|ASIA|ABIA|ACCA)[A-Z2-7]{16})\b/g,
    keepPrefix: 4,
  },
  {
    id: 'stripe-access-token',
    label: 'Stripe token',
    pattern:
      /\b(?<secret>(?<prefix>(?:sk|rk)_(?:test|live|prod)_)[a-zA-Z0-9]{10,99})(?![\w-])/g,
    keepPrefix: 8,
  },
  {
    id: 'slack-bot-token',
    label: 'Slack bot token',
    pattern:
      /\b(?<secret>xoxb-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*)(?![\w-])/g,
    keepPrefix: 5,
  },
  {
    id: 'slack-user-token',
    label: 'Slack user token',
    pattern:
      /\b(?<secret>xox[pe](?:-[0-9]{10,13}){3}-[a-zA-Z0-9-]{28,34})(?![\w-])/g,
    keepPrefix: 5,
  },
  {
    id: 'openai-api-key',
    label: 'OpenAI API key',
    pattern:
      /\b(?=(?<prefix>sk-(?:(?:proj|svcacct|admin)-)?))(?<secret>sk-(?:proj|svcacct|admin)-(?:[A-Za-z0-9_-]{74}|[A-Za-z0-9_-]{58})T3BlbkFJ(?:[A-Za-z0-9_-]{74}|[A-Za-z0-9_-]{58})|sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20})(?![\w-])/g,
    keepPrefix: 3,
  },
  {
    id: 'anthropic-api-key',
    label: 'Anthropic API key',
    pattern: /\b(?<secret>sk-ant-api03-[a-zA-Z0-9_-]{93}AA)(?![\w-])/g,
    keepPrefix: 13,
  },
  {
    id: 'gcp-api-key',
    label: 'Google Cloud API key',
    pattern: /\b(?<secret>AIza[\w-]{35})(?![\w-])/g,
    keepPrefix: 4,
  },
  {
    id: 'jwt',
    label: 'JSON Web Token',
    pattern:
      /\b(?<secret>ey[a-zA-Z0-9]{17,}\.ey[a-zA-Z0-9/\\_-]{17,}\.(?:[a-zA-Z0-9/\\_-]{10,}={0,2})?)(?![\w/\\=-])/g,
    keepPrefix: 0,
  },
  {
    id: 'private-key',
    label: 'private key',
    pattern:
      /(?<secret>-----BEGIN[ A-Z0-9_-]{0,100}PRIVATE KEY(?: BLOCK)?-----[\s\S-]{64,}?KEY(?: BLOCK)?-----)/gi,
    keepPrefix: 0,
  },
  {
    id: 'connection-url-password',
    label: 'connection password',
    pattern: /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:(?<secret>[^\s/@]+)@[^\s/]+/gi,
    keepPrefix: 0,
  },
  {
    id: 'generic-assignment',
    label: 'secret value',
    pattern:
      /(?:^|[^\w])(?:[\w.-]*(?:secret|token|password|passwd|api_key|apikey|private_key|client_secret)[\w.-]*)["']?[ \t]*(?:=|:)[ \t]*(?:(["'`])(?<literal>(?:\\[^\r\n]|(?!\1)[^\\\r\n])*)\1|(?<env>[^\s;,'"`#]+))/gim,
    keepPrefix: 0,
  },
] as const satisfies readonly {
  id: string;
  label: string;
  pattern: RegExp;
  keepPrefix: number;
}[];

export type SecretRuleId = (typeof rules)[number]['id'];
