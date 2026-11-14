import {describe, expect, it} from 'vitest';
import {createSignature, parseSignature} from './model';
import {displayHandle, githubLogin, initials, parseProfile} from './signature';

describe('parseSignature', () => {
  it('fills the new fields of a signature saved by P7', () => {
    expect(parseSignature({handle: '@me', position: 'bottom-left'})).toEqual({
      ...createSignature('@me'),
      position: 'bottom-left',
    });
  });

  it('drops values it does not know and empty handles', () => {
    expect(
      parseSignature({
        handle: 'me',
        position: 'top-left',
        style: 'neon',
        platform: 'myspace',
        name: '  ',
        avatar: 'https://example.com/me.png',
      }),
    ).toEqual(createSignature('me'));
    expect(parseSignature({handle: '  ', position: 'bottom-left'})).toBeNull();
    expect(parseSignature(null)).toBeNull();
  });

  it('keeps a full signature and an uploaded avatar', () => {
    const signature = {
      handle: 'octocat',
      position: 'bottom-center',
      style: 'card',
      platform: 'github',
      name: 'The Octocat',
      avatar: 'asset:abc',
    } as const;
    expect(parseSignature(signature)).toEqual(signature);
  });
});

describe('displayHandle', () => {
  it('adds @ once, and leaves LinkedIn paths alone', () => {
    expect(displayHandle({handle: 'octocat', platform: 'x'})).toBe('@octocat');
    expect(displayHandle({handle: '@octocat', platform: null})).toBe(
      '@octocat',
    );
    expect(displayHandle({handle: 'in/octocat', platform: 'linkedin'})).toBe(
      'in/octocat',
    );
  });
});

describe('parseProfile', () => {
  it.each([
    ['https://x.com/octocat', 'octocat', 'x'],
    ['twitter.com/octocat?s=20', 'octocat', 'x'],
    ['https://bsky.app/profile/ada.bsky.social', 'ada.bsky.social', 'bluesky'],
    ['https://github.com/octocat/codeimage', 'octocat', 'github'],
    ['https://www.linkedin.com/in/octocat/', 'in/octocat', 'linkedin'],
    [
      'https://mastodon.social/@octocat',
      '@octocat@mastodon.social',
      'mastodon',
    ],
    ['octocat@hachyderm.io', '@octocat@hachyderm.io', 'mastodon'],
  ])('reads %s', (input, handle, platform) => {
    expect(parseProfile(input)).toEqual({handle, platform});
  });

  it('leaves plain handles and other links alone', () => {
    expect(parseProfile('octocat')).toBeNull();
    expect(parseProfile('@octocat')).toBeNull();
    expect(parseProfile('https://x.com/home')).toBeNull();
    expect(parseProfile('https://example.com/about')).toBeNull();
  });
});

describe('avatar helpers', () => {
  it('derives a GitHub login and initials', () => {
    expect(githubLogin('@octocat')).toBe('octocat');
    expect(githubLogin('in/octocat')).toBeNull();
    expect(initials({handle: 'ada.bsky.social', name: 'Ada Lovelace'})).toBe(
      'AL',
    );
    expect(initials({handle: '@octocat', name: null})).toBe('O');
  });
});
