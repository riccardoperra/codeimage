self.addEventListener('message', evt => {
  const groupedArray = evt.data.groupedArray;
  const height = evt.data.height;
  const scrollTop = evt.data.scrollTop;
  const scrollBottom = evt.data.scrollBottom;

  let start: number | undefined;
  let end: number | undefined;

  function calculateVisibility(index: number, height: number) {
    const top = index * height;
    const bottom = top + height;
    return top <= scrollTop
      ? scrollTop - top <= height
      : bottom - scrollBottom <= height;
  }

  outerLoop: for (let i = 0; i < groupedArray.length; i++) {
    const el = groupedArray[i];
    for (let y = 0; y < el.length; y++) {
      if (start !== undefined && end !== undefined) {
        break outerLoop;
      }
      const visible = calculateVisibility(i, height);
      if (start === undefined && visible) {
        start = el[y];
        continue;
      }
      if (start !== undefined && !visible) {
        end = el[y];
        break outerLoop;
      }
    }
  }

  self.postMessage({
    start,
    end,
  });
});
