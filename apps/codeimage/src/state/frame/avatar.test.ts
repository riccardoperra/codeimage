import {afterEach, describe, expect, it, vi} from 'vitest';
import {avatarImageUrl} from './avatar';

afterEach(() => vi.restoreAllMocks());

describe('avatarImageUrl', () => {
  it('uses the bundled GitHub URL recipe without discovery', async () => {
    expect(await avatarImageUrl({provider: 'github', login: 'octocat'})).toBe(
      'https://avatars.githubusercontent.com/octocat?s=192',
    );
  });
  it('passes the same deadline through Mastodon discovery', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({avatar_static: 'https://fixture.test/avatar.png'}),
        ),
      );
    const signal = AbortSignal.timeout(3000);
    expect(
      await avatarImageUrl(
        {provider: 'mastodon', user: 'me', instance: 'social.test'},
        signal,
      ),
    ).toBe('https://fixture.test/avatar.png');
    expect(fetch).toHaveBeenCalledWith(
      'https://social.test/api/v1/accounts/lookup?acct=me',
      expect.objectContaining({signal}),
    );
  });
  it('passes the same deadline through Bluesky and PDS discovery', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            did: 'did:plc:fixture',
            avatar: 'https://cdn.bsky.app/img/avatar/cid123@jpeg',
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            service: [
              {id: '#atproto_pds', serviceEndpoint: 'https://pds.test/'},
            ],
          }),
        ),
      );
    const signal = AbortSignal.timeout(3000);
    expect(
      await avatarImageUrl({provider: 'bluesky', actor: 'me.test'}, signal),
    ).toBe(
      'https://pds.test/xrpc/com.atproto.sync.getBlob?did=did%3Aplc%3Afixture&cid=cid123',
    );
    expect(fetch.mock.calls).toHaveLength(2);
    expect(fetch.mock.calls.every(([, init]) => init?.signal === signal)).toBe(
      true,
    );
  });
});
