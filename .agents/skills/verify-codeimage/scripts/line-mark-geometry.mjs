import assert from 'node:assert/strict';

export async function pointGeometry(page, point) {
  return page.evaluate(point => {
    const editor = document.querySelector(
      '.cm-editor:has(.cm-content[contenteditable=true])',
    );
    const marker = document.querySelector('.cm-lineMarkMarker[data-active]');
    const index = Number(marker?.dataset.markLine);
    const row = [
      ...editor.querySelectorAll('.cm-content[contenteditable=true] .cm-line'),
    ].find(row => row.textContent === `const value${index} = ${index};`);
    const rect = element => {
      const box = element?.getBoundingClientRect();
      return (
        box && {
          left: box.left,
          top: box.top,
          right: box.right,
          bottom: box.bottom,
        }
      );
    };
    const own = row.getBoundingClientRect();
    return {
      lineNumber: index,
      clicked: document.elementFromPoint(point.x, point.y)?.closest('.cm-line')
        ?.textContent,
      line: rect(row),
      content: rect(editor.querySelector('.cm-content')),
      slot: rect(
        [...editor.querySelectorAll('.cm-lineMarkSlot')].find(slot => {
          const box = slot.getBoundingClientRect();
          const middle = (box.top + box.bottom) / 2;
          return middle >= own.top && middle <= own.bottom;
        }),
      ),
      viewport: {width: innerWidth, height: innerHeight},
      marker: rect(marker),
    };
  }, point);
}

export async function lineGeometry(page, line) {
  return page.evaluate(line => {
    const editor = document.querySelector(
      '.cm-editor:has(.cm-content[contenteditable=true])',
    );
    const row = editor.querySelectorAll('.cm-line')[line - 1];
    const marker = document.querySelector(
      `.cm-lineMarkMarker[data-mark-line="${line}"]`,
    );
    const rect = element => {
      const box = element?.getBoundingClientRect();
      return (
        box && {
          left: box.left,
          top: box.top,
          right: box.right,
          bottom: box.bottom,
        }
      );
    };
    return {
      scale: Number(
        document.querySelector('[data-fit-scale]')?.dataset.fitScale,
      ),
      line: rect(row),
      content: rect(editor.querySelector('.cm-content')),
      slot: rect(
        [...editor.querySelectorAll('.cm-lineMarkSlot')].find(slot => {
          const box = slot.getBoundingClientRect();
          const middle = (box.top + box.bottom) / 2;
          const own = row.getBoundingClientRect();
          return middle >= own.top && middle <= own.bottom;
        }),
      ),
      viewport: {width: innerWidth, height: innerHeight},
      marker: rect(marker),
      menu: rect(document.querySelector('.cm-lineMarkMenu')),
      toolbar: rect(document.querySelector('.cm-lineMarkToolbar')),
    };
  }, line);
}

export function assertPlaced(geometry, label, centred = true) {
  const {line, marker, content, slot, viewport} = geometry;
  assert.ok(marker, `${label}: marker shown`);
  assert.ok(
    marker.top >= 0 &&
      marker.bottom <= viewport.height &&
      marker.left >= 0 &&
      marker.right <= viewport.width,
    `${label}: marker on screen (${JSON.stringify(marker)})`,
  );
  assert.ok(slot, `${label}: gutter column rendered`);
  const middle = (line.top + line.bottom) / 2;
  assert.ok(
    !centred || Math.abs((marker.top + marker.bottom) / 2 - middle) <= 2,
    `${label}: marker centred on its line (${JSON.stringify({marker, line})})`,
  );
  assert.ok(
    Math.abs(marker.right - slot.right) <= 1 &&
      marker.right <= content.left + 1,
    `${label}: marker in the gutter column beside the code (${JSON.stringify({marker, slot, content})})`,
  );
}
