/**
 * Background service worker for Double Click Image DL.
 * Receives download requests from the content script and
 * initiates file downloads via the chrome.downloads API.
 */

/**
 * Extract a clean filename from a URL.
 */
function getFilenameFromUrl(url) {
  try {
    // Handle data URLs
    if (url.startsWith('data:')) {
      const mimeMatch = url.match(/^data:(image\/\w+)/);
      const ext = mimeMatch ? mimeMatch[1].split('/')[1].replace('jpeg', 'jpg') : 'png';
      return `image_${Date.now()}.${ext}`;
    }

    const urlObj = new URL(url);
    let pathname = urlObj.pathname;

    // Remove trailing slash
    if (pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    // Get the last segment
    let filename = pathname.split('/').pop();

    // Remove query-like fragments from filename
    filename = filename.split('?')[0].split('#')[0];

    // Decode URI components
    try {
      filename = decodeURIComponent(filename);
    } catch (e) {
      // leave as-is
    }

    // If no extension or empty, generate a name
    if (!filename || !filename.includes('.')) {
      filename = `image_${Date.now()}.jpg`;
    }

    return filename;
  } catch (e) {
    return `image_${Date.now()}.jpg`;
  }
}

async function processImageToIOSIcon(url, settings) {
  const res = await fetch(url);
  const blob = await res.blob();

  const bitmap = await createImageBitmap(blob);

  const sw = bitmap.width;
  const sh = bitmap.height;

  let ratioW = 1;
  let ratioH = 1;

  if (settings.aspectRatio === '16:9') {
    ratioW = 16; ratioH = 9;
  } else if (settings.aspectRatio === '4:3') {
    ratioW = 4; ratioH = 3;
  } else if (settings.aspectRatio === '3:4') {
    ratioW = 3; ratioH = 4;
  } else if (settings.aspectRatio === '9:16') {
    ratioW = 9; ratioH = 16;
  } else if (settings.aspectRatio === 'original') {
    ratioW = sw; ratioH = sh;
  }

  // Determine base size (longest side)
  let baseSize = settings.iconSize || 1024;
  if (settings.useOriginalSize) {
    baseSize = Math.max(sw, sh);
  }

  let outW = baseSize;
  let outH = baseSize;

  if (ratioW > ratioH) {
    outW = baseSize;
    outH = Math.round(baseSize * (ratioH / ratioW));
  } else if (ratioH > ratioW) {
    outH = baseSize;
    outW = Math.round(baseSize * (ratioW / ratioH));
  } else {
    outW = baseSize;
    outH = baseSize;
  }

  const canvas = new OffscreenCanvas(outW, outH);
  const ctx = canvas.getContext('2d');

  // border radius
  const radiusPercent = settings.borderRadius !== undefined ? settings.borderRadius : 22.5;
  const minSide = Math.min(outW, outH);
  const radius = minSide * (radiusPercent / 100);

  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(0, 0, outW, outH, radius);
  } else {
    ctx.moveTo(radius, 0);
    ctx.lineTo(outW - radius, 0);
    ctx.quadraticCurveTo(outW, 0, outW, radius);
    ctx.lineTo(outW, outH - radius);
    ctx.quadraticCurveTo(outW, outH, outW - radius, outH);
    ctx.lineTo(radius, outH);
    ctx.quadraticCurveTo(0, outH, 0, outH - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
  }
  ctx.clip();

  // Determine source crop (cover mode)
  const targetRatio = outW / outH;
  const sourceRatio = sw / sh;

  let sx = 0, sy = 0, sWidth = sw, sHeight = sh;

  if (sourceRatio > targetRatio) {
    // Source is wider than target -> crop horizontally
    sWidth = sh * targetRatio;
    sx = (sw - sWidth) / 2;
  } else if (sourceRatio < targetRatio) {
    // Source is taller than target -> crop vertically
    sHeight = sw / targetRatio;
    sy = (sh - sHeight) / 2;
  }

  ctx.drawImage(bitmap, sx, sy, sWidth, sHeight, 0, 0, outW, outH);

  const outBlob = await canvas.convertToBlob({ type: 'image/png' });

  return new Promise((resolve, reject) => {
    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(outBlob);
    } else {
      outBlob.arrayBuffer().then(buffer => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        resolve(`data:image/png;base64,${btoa(binary)}`);
      }).catch(reject);
    }
  });
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'downloadImage' && message.url) {
    const url = message.url;
    let originalFilename = getFilenameFromUrl(url);

    // Force PNG extension
    let baseName = originalFilename;
    if (originalFilename.includes('.')) {
      baseName = originalFilename.substring(0, originalFilename.lastIndexOf('.'));
    }
    const filename = `${baseName}.png`;

    chrome.storage.local.get({
      aspectRatio: '1:1',
      iconSize: 1024,
      useOriginalSize: false,
      borderRadius: 22.5
    }, (settings) => {
      processImageToIOSIcon(url, settings).then(dataUrl => {
        chrome.downloads.download({
          url: dataUrl,
          filename: filename,
          saveAs: false,
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error('Download failed:', chrome.runtime.lastError.message);
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            console.log(`Download started: ${filename} (ID: ${downloadId})`);
            sendResponse({ success: true, downloadId: downloadId });
          }
        });
      }).catch(err => {
        console.error('Image processing failed:', err);
        // Fallback to original
        chrome.downloads.download({
          url: url,
          filename: originalFilename,
          saveAs: false,
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true, downloadId: downloadId });
          }
        });
      });
    });

    // Return true to indicate we'll call sendResponse asynchronously
    return true;
  }
});
