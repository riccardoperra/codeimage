import {rules, type SecretRuleId} from './rules.js';

export interface SecretMatch {
  from: number;
  to: number;
  ruleId: SecretRuleId;
  keepPrefix: number;
}

export function shannonEntropy(value: string): number {
  const counts = new Map<string, number>();
  const characters = [...value];
  for (const char of characters) counts.set(char, (counts.get(char) ?? 0) + 1);
  let entropy = 0;
  for (const count of counts.values()) {
    const probability = count / characters.length;
    entropy -= probability * Math.log2(probability);
  }
  return entropy;
}

function isPlaceholder(value: string): boolean {
  return /•|x{3,}|your[-_ ]|<[^>]*>|changeme|example|process\.env\.|\$\{/i.test(
    value,
  );
}

export function detectSecrets(text: string): SecretMatch[] {
  const matches: SecretMatch[] = [];
  for (const rule of rules) {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags + 'd');
    for (const match of text.matchAll(pattern)) {
      const group =
        match.groups?.secret !== undefined
          ? 'secret'
          : match.groups?.literal !== undefined
            ? 'literal'
            : 'env';
      const value = match.groups?.[group];
      const range = match.indices?.groups?.[group];
      if (!value || !range || value.includes('•')) continue;
      if (rule.id === 'generic-assignment') {
        if (
          isPlaceholder(value) ||
          value.length < 12 ||
          shannonEntropy(value) < 3.5
        )
          continue;
        if (
          group === 'env' &&
          !/^\s*(?:export\s+)?[\w.-]+\s*=\s*$/.test(
            text.slice(text.lastIndexOf('\n', range[0] - 1) + 1, range[0]),
          )
        )
          continue;
      }
      matches.push({
        from: range[0],
        to: range[1],
        ruleId: rule.id,
        keepPrefix: match.groups?.prefix?.length ?? rule.keepPrefix,
      });
    }
  }
  const priority = (match: SecretMatch) =>
    match.ruleId === 'generic-assignment'
      ? 2
      : match.ruleId === 'private-key' ||
          match.ruleId === 'connection-url-password'
        ? 0
        : 1;
  matches.sort(
    (a, b) => priority(a) - priority(b) || a.from - b.from || b.to - a.to,
  );
  const result: SecretMatch[] = [];
  for (const match of matches) {
    if (result.some(other => match.from < other.to && match.to > other.from))
      continue;
    result.push(match);
  }
  return result.sort((a, b) => a.from - b.from);
}

export function redactSecrets(
  text: string,
  matches = detectSecrets(text),
): string {
  let result = text;
  for (const match of [...matches].reverse()) {
    const from = match.from + match.keepPrefix;
    result =
      result.slice(0, from) +
      result.slice(from, match.to).replace(/[^\r\n]/g, '•') +
      result.slice(match.to);
  }
  return result;
}
