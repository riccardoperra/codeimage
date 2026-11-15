import {describe, expect, it} from 'vitest';
import {createSignature, parseSignature} from './model';
import {
  avatarSource,
  changeProfileSource,
  defaultAvatarPlatform,
  displayHandle,
  githubLogin,
  initials,
  parseProfile,
  readProfile,
  writeProfile,
} from './signature';

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
      profile: 'github.com/octocat',
      savedId: 'sig-1',
    } as const;
    expect(parseSignature(signature)).toEqual(signature);
  });

  it("reads the first styles' GitHub avatar as the profile avatar", () => {
    expect(
      parseSignature({
        handle: 'octocat',
        position: 'bottom-right',
        avatar: 'github',
      })?.avatar,
    ).toBe('profile');
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

describe('profile field', () => {
  it.each(['github', 'bluesky', 'mastodon'] as const)(
    'defaults to the %s icon when it supports avatars',
    platform => expect(defaultAvatarPlatform(platform)).toBe(platform),
  );

  it.each(['x', 'linkedin', null] as const)(
    'defaults to GitHub for the %s icon',
    platform => expect(defaultAvatarPlatform(platform)).toBe('github'),
  );

  it('keeps the account text when changing sources without detecting it again', () => {
    const profile = changeProfileSource('x.com/octocat', 'github');
    expect(profile).toBe('github.com/octocat');
    expect(avatarSource({handle: 'other', platform: 'x', profile})).toEqual({
      provider: 'github',
      login: 'octocat',
    });
    expect(changeProfileSource('@ada@hachyderm.io', 'bluesky')).toBe(
      'bsky.app/profile/ada@hachyderm.io',
    );
    expect(changeProfileSource('linkedin.com/in/ada', 'github')).toBe(
      'github.com/ada',
    );
  });

  it('keeps an empty source selection and uses the signature handle', () => {
    const profile = changeProfileSource(null, 'bluesky');
    expect(readProfile(profile)).toEqual({platform: 'bluesky', account: ''});
    expect(avatarSource({handle: 'ada.dev', platform: 'x', profile})).toEqual({
      provider: 'bluesky',
      actor: 'ada.dev',
    });
    expect(readProfile(changeProfileSource(null, 'mastodon'))).toEqual({
      platform: 'mastodon',
      account: '',
    });
  });

  it('stores the account behind the platform prefix', () => {
    expect(writeProfile('octocat', 'github')).toBe('github.com/octocat');
    expect(writeProfile('ada.bsky.social', 'bluesky')).toBe(
      'bsky.app/profile/ada.bsky.social',
    );
    expect(writeProfile('ada@hachyderm.io', 'mastodon')).toBe(
      '@ada@hachyderm.io',
    );
    expect(writeProfile('ada', 'linkedin')).toBe('linkedin.com/in/ada');
    expect(writeProfile('  ', 'x')).toBeNull();
  });

  it('takes a pasted link on another platform as it is', () => {
    expect(writeProfile('https://github.com/octocat', 'x')).toBe(
      'github.com/octocat',
    );
    expect(writeProfile('https://bsky.app/profile/ada.dev', 'github')).toBe(
      'bsky.app/profile/ada.dev',
    );
    expect(writeProfile('https://mastodon.social/@ada', 'github')).toBe(
      '@ada@mastodon.social',
    );
    for (const link of ['https://x.com/ada', 'https://linkedin.com/in/ada']) {
      const profile = writeProfile(link, 'github');
      expect(
        avatarSource({handle: 'ada', platform: 'github', profile}),
      ).toBeNull();
    }
  });

  it('reads back the platform and the account', () => {
    expect(readProfile('bsky.app/profile/ada.dev')).toEqual({
      platform: 'bluesky',
      account: 'ada.dev',
    });
    expect(readProfile('@ada@hachyderm.io')).toEqual({
      platform: 'mastodon',
      account: 'ada@hachyderm.io',
    });
    expect(readProfile(null)).toBeNull();
  });
});

describe('avatarSource', () => {
  const base = {handle: 'octocat', platform: null, profile: null} as const;

  it('uses the handle as a GitHub login by default', () => {
    expect(avatarSource(base)).toEqual({provider: 'github', login: 'octocat'});
  });

  it('follows the platform of the handle', () => {
    expect(
      avatarSource({...base, handle: 'ada.bsky.social', platform: 'bluesky'}),
    ).toEqual({provider: 'bluesky', actor: 'ada.bsky.social'});
    expect(
      avatarSource({
        ...base,
        handle: '@ada@hachyderm.io',
        platform: 'mastodon',
      }),
    ).toEqual({provider: 'mastodon', user: 'ada', instance: 'hachyderm.io'});
  });

  it('uses GitHub when the icon has no public avatar', () => {
    expect(avatarSource({...base, platform: 'x'})).toEqual({
      provider: 'github',
      login: 'octocat',
    });
    expect(avatarSource({...base, platform: 'linkedin'})).toEqual({
      provider: 'github',
      login: 'octocat',
    });
  });

  it('updates the avatar for a new account on the chosen source', () => {
    const profile = writeProfile('monalisa', 'github');
    expect(avatarSource({...base, platform: 'x', profile})).toEqual({
      provider: 'github',
      login: 'monalisa',
    });
  });

  it('prefers the profile over the handle', () => {
    expect(
      avatarSource({...base, platform: 'x', profile: 'github.com/monalisa'}),
    ).toEqual({provider: 'github', login: 'monalisa'});
    expect(
      avatarSource({...base, platform: 'github', profile: 'x.com/octocat'}),
    ).toBeNull();
  });
});
