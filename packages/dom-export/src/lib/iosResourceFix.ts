function createIframe() {
  const iframe = document.createElement('iframe');
  iframe.scrolling = 'no'; // ios won't scroll without it
  document.body.appendChild(iframe);

  if (!iframe.contentWindow) {
    throw new Error(`Unable to find iframe window`);
  }
  return iframe;
}

const imageReady = (img: HTMLImageElement): Promise<Event | void | string> => {
  return new Promise(resolve => {
    img.decoding = 'sync';
    img.loading = 'eager';
    if (img.complete) {
      resolve();
      return;
    }
    if (!img.src) {
      resolve();
      return;
    }
    img.onload = () => {
      resolve();
    };
    img.onerror = resolve;
  });
};

export function toIframe(clonedNodeForCanvas: HTMLImageElement) {
  const iframe = createIframe();
  if (!iframe.contentWindow) {
    return Promise.reject(`Unable to find iframe window`);
  }
  const cloneWindow = iframe.contentWindow;
  const documentClone = cloneWindow.document;
  const iframeLoad = iframeLoader(iframe).then(async () => {
    if (documentClone.fonts && documentClone.fonts.ready) {
      await documentClone.fonts.ready;
    }
    await Promise.all([].slice.call(document.images, 0).map(imageReady));
    return iframe;
  });

  documentClone.open();
  documentClone.write(
    '<!DOCTYPE html><meta charset="UTF-8"><title>sandbox</title><body><</body>',
  );
  documentClone.body.appendChild(clonedNodeForCanvas);
  documentClone.close();

  return iframeLoad;
}

const iframeLoader = (
  iframe: HTMLIFrameElement,
): Promise<HTMLIFrameElement> => {
  return new Promise((resolve, reject) => {
    const cloneWindow = iframe.contentWindow;

    if (!cloneWindow) {
      return reject(`No window assigned for iframe`);
    }

    const documentClone = cloneWindow.document;

    const interval = setInterval(() => {
      if (
        documentClone.body.childNodes.length > 0 &&
        documentClone.readyState === 'complete'
      ) {
        clearInterval(interval);
        resolve(iframe);
      }
    }, 50);
  });
};
