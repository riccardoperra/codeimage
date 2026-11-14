// @vitest-environment happy-dom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const renderer = vi.hoisted(() => ({
  init: vi.fn(),
  registerFont: vi.fn(),
  prepare: vi.fn(async (html: string, _options: unknown) => html),
  render: vi.fn<(html: string, options: unknown) => Uint8Array>(
    () => new Uint8Array([137, 80, 78, 71]),
  ),
  renderSvg: vi.fn<(html: string, options: unknown) => string>(
    () => '<svg xmlns="http://www.w3.org/2000/svg"/>',
  ),
}));

vi.mock('@takumi-rs/wasm', () => ({
  default: renderer.init,
  Renderer: class {
    registerFont = renderer.registerFont;
    prepare = renderer.prepare;
    render = renderer.render;
    renderSvg = renderer.renderSvg;
  },
}));
vi.mock('@takumi-rs/wasm/wasm-url', () => ({default: '/takumi.wasm'}));

const options = {format: 'png', pixelRatio: 2, quality: 0.8} as const;

function exportNode(html: string) {
  const node = document.createElement('div');
  node.style.fontFamily = 'Inter var';
  node.innerHTML = html;
  document.body.append(node);
  vi.spyOn(node, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 300, 200),
  );
  return node;
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(new Uint8Array([0, 1, 2]))),
  );
});

afterEach(() => {
  document.body.replaceChildren();
  document.head.replaceChildren();
  delete window.queryLocalFonts;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Takumi export', () => {
  it('keeps the measured frame width as a minimum and lets the widest line fit', async () => {
    const {takumi} = await import('./takumi');
    const node = exportNode('a line that must not wrap');
    vi.mocked(node.getBoundingClientRect).mockReturnValue(
      new DOMRect(0, 0, 300.25, 200),
    );
    await takumi(node, options);
    expect(renderer.prepare.mock.calls[0][0]).toContain(
      'width: max-content; min-width: 300.25px',
    );
    expect(renderer.prepare.mock.calls[0][1]).toMatchObject({width: 600});
    expect(node.style.width).toBe('');
  });

  it('writes corner gradients in the keyword order Takumi draws without changing the live background', async () => {
    const {takumi} = await import('./takumi');
    const node = exportNode('code');
    node.style.backgroundImage = 'linear-gradient(to right bottom, red, blue)';
    await takumi(node, options);
    expect(renderer.prepare.mock.calls[0][0]).toContain(
      'background-image: linear-gradient(to bottom right, red, blue)',
    );
    expect(node.style.backgroundImage).toContain('to right bottom');
  });

  it('passes exact CodeMirror gutter row heights that outerHTML would round', async () => {
    const {takumi} = await import('./takumi');
    const node = exportNode(
      '<div class="cm-gutterElement" style="height: 22.3984px; margin-top: 4px">1</div>',
    );
    const row = node.querySelector('.cm-gutterElement');
    if (!row) throw new Error('Expected a gutter row.');
    vi.spyOn(row, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 40, 22.3984375),
    );
    await takumi(node, options);
    const html = renderer.prepare.mock.calls[0][0];
    expect(html).toContain('height: 22.3984375px');
    expect(html).toContain('margin-top: 4px');
    expect(row.getAttribute('style')).toBe(
      'height: 22.3984px; margin-top: 4px',
    );
  });

  it('omits excluded subtrees without changing the live node', async () => {
    const {takumi} = await import('./takumi');
    const node = exportNode(
      '<span>code</span><div data-export-exclude="true"><span>controls</span></div><span data-export-exclude="false">keep</span>',
    );
    const original = node.outerHTML;
    await takumi(node, options);
    expect(renderer.render.mock.calls[0][0]).toContain('code');
    expect(renderer.render.mock.calls[0][0]).toContain('keep');
    expect(renderer.render.mock.calls[0][0]).not.toContain('controls');
    expect(node.outerHTML).toBe(original);
  });

  it('keeps rendering with the UI font when a code font cannot load', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.mocked(fetch).mockImplementation(async input => {
      if (String(input).includes('missing.woff2'))
        return new Response(null, {status: 404});
      return new Response(new Uint8Array([0, 1, 2]));
    });
    const style = document.createElement('style');
    style.textContent =
      '@font-face { font-family: "JetBrains Mono"; src: url("https://example.test/missing.woff2"); }';
    document.head.append(style);
    const node = exportNode(
      '<span style="font-family: JetBrains Mono">code</span>',
    );
    const {takumi} = await import('./takumi');
    await expect(takumi(node, options)).resolves.toBeInstanceOf(Blob);
    expect(warn).toHaveBeenCalled();
    expect(renderer.render).toHaveBeenCalledOnce();
  });

  it('registers fonts in stylesheet order when downloads finish out of order', async () => {
    vi.mocked(fetch).mockImplementation(async input => {
      if (String(input).includes('slow.woff2'))
        await new Promise(resolve => setTimeout(resolve, 20));
      return new Response(new Uint8Array([0, 1, 2]));
    });
    const style = document.createElement('style');
    style.textContent =
      '@font-face { font-family: "Slow Mono"; src: url("https://example.test/slow.woff2"); } @font-face { font-family: "Fast Mono"; src: url("https://example.test/fast.woff2"); }';
    document.head.append(style);
    const node = exportNode(
      '<span style="font-family: Slow Mono, Fast Mono">code</span>',
    );
    const {takumi} = await import('./takumi');
    await takumi(node, options);
    expect(renderer.registerFont.mock.calls.map(([font]) => font.name)).toEqual(
      ['Slow Mono', 'Fast Mono', 'Inter', 'Inter var'],
    );
  });

  it('carries the inherited UI font into the exported document', async () => {
    document.body.style.fontFamily = 'Inter var, system-ui, sans-serif';
    const node = exportNode('index.tsx');
    node.style.removeProperty('font-family');
    const {takumi} = await import('./takumi');
    await takumi(node, options);
    expect(renderer.render.mock.calls[0][0]).toContain('Inter var');
    expect(renderer.render.mock.calls[0][0]).toContain('<body');
  });

  it('uses FontData.blob bytes for a selected local font', async () => {
    const blob = vi.fn(async () => new Blob([new Uint8Array([7, 8, 9])]));
    window.queryLocalFonts = vi.fn(async () => [
      {
        family: 'Local Mono',
        fullName: 'Local Mono Regular',
        postscriptName: 'LocalMono-Regular',
        style: 'Regular',
        blob,
      },
    ]);
    const node = exportNode(
      '<span style="font-family: Local Mono">code</span>',
    );
    const {takumi} = await import('./takumi');
    await takumi(node, options);
    expect(blob).toHaveBeenCalledOnce();
    expect(renderer.registerFont).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Local Mono',
        data: new Uint8Array([7, 8, 9]),
      }),
    );
  });

  it('reuses one initialized renderer and registered fonts for the session', async () => {
    const {takumi} = await import('./takumi');
    const node = exportNode('code');
    await takumi(node, options);
    await takumi(node, {...options, format: 'jpeg'});
    expect(renderer.init).toHaveBeenCalledOnce();
    expect(renderer.registerFont).toHaveBeenCalledTimes(2);
    expect(renderer.prepare).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({width: 600, height: 400, devicePixelRatio: 2}),
    );
    expect(renderer.render).toHaveBeenLastCalledWith(expect.any(String), {
      format: 'jpeg',
      quality: 80,
    });
  });

  it('exports SVG through the vector renderer', async () => {
    const {takumi} = await import('./takumi');
    const result = await takumi(exportNode('code'), {
      ...options,
      format: 'svg',
    });
    expect(result).toBeInstanceOf(Blob);
    expect(renderer.renderSvg).toHaveBeenCalledOnce();
    expect(renderer.render).not.toHaveBeenCalled();
  });
});
