/**
 * Background service worker for Double Click Image DL.
 * Receives download requests from the content script and
 * initiates file downloads via the chrome.downloads API.
 */

// コンテキストメニュー用 i18n 辞書
const menuDict = {
  en: {
    title: 'Crop Image',
  },
  jp: {
    title: '画像をトリミング',
  },
};

// ブラウザ言語に基づくデフォルト言語を判定
function detectDefaultLang() {
  const uiLang = (chrome.i18n && chrome.i18n.getUILanguage)
    ? chrome.i18n.getUILanguage()
    : (navigator.language || 'en');
  return uiLang.toLowerCase().startsWith('ja') ? 'jp' : 'en';
}

// 右クリックメニューの登録（言語対応）
function setupContextMenu(lang) {
  const t = menuDict[lang] || menuDict.en;
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'downloadImage',
      title: t.title,
      contexts: ['image'],
    });
  });
}

// 初回・起動時にストレージから言語を取得してメニュー構築
function initContextMenu() {
  const defaultLang = detectDefaultLang();
  chrome.storage.local.get({ lang: defaultLang }, (items) => {
    setupContextMenu(items.lang);
  });
}

chrome.runtime.onInstalled.addListener(initContextMenu);
chrome.runtime.onStartup.addListener(initContextMenu);

// ポップアップで言語が変更されたらメニューを再構築
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.lang) {
    setupContextMenu(changes.lang.newValue);
  }
});

// 画像のダウンロード処理本体（コンテキストメニュー＆ダブルクリック共通）
function generateTimeBaseName() {
  const d = new Date();
  const pad = n => n.toString().padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function downloadImageWithSettings(url, sendResponse = null) {
  let originalFilename = getFilenameFromUrl(url);

  let origExt = 'png';
  if (originalFilename.includes('.')) {
    origExt = originalFilename.split('.').pop().toLowerCase();
  }
  let baseName = generateTimeBaseName();

  chrome.storage.local.get({
    aspectRatio: '1:1',
    iconSize: 1024,
    useOriginalSize: false,
    borderRadius: 22.5,
    saveFormat: 'png'
  }, (settings) => {
    if (settings.useOriginalSize) {
      settings.aspectRatio = 'original';
      settings.borderRadius = 0;
    }

    settings.originalExt = origExt;
    const ext = settings.saveFormat === 'original' ? origExt : 
                (settings.saveFormat === 'jpeg' ? 'jpg' : (settings.saveFormat || 'png'));
    const filename = `${baseName}.${ext}`;

    if (settings.aspectRatio === 'original' && settings.borderRadius === 0 && settings.saveFormat === 'original') {
      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: false,
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Download failed:', chrome.runtime.lastError.message);
          if (sendResponse) sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          console.log(`Bypass canvas download: ${filename} (ID: ${downloadId})`);
          if (sendResponse) sendResponse({ success: true, downloadId: downloadId });
        }
      });
      return;
    }

    processImageToIOSIcon(url, settings).then(dataUrl => {
      chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: false,
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Download failed:', chrome.runtime.lastError.message);
          if (sendResponse) sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          console.log(`Download started: ${filename} (ID: ${downloadId})`);
          if (sendResponse) sendResponse({ success: true, downloadId: downloadId });
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
          if (sendResponse) sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          if (sendResponse) sendResponse({ success: true, downloadId: downloadId });
        }
      });
    });
  });
}

// 右クリックメニュークリック時の処理
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'downloadImage' && info.srcUrl) {
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'openCropModal',
        srcUrl: info.srcUrl
      }, (resp) => {
        // If content script is not loaded or error, fallback to normal download
        if (chrome.runtime.lastError) {
          downloadImageWithSettings(info.srcUrl);
        }
      });
    } else {
      downloadImageWithSettings(info.srcUrl);
    }
  }
});

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
    if (settings.crop) {
      ratioW = settings.crop.sw; ratioH = settings.crop.sh;
    } else {
      ratioW = sw; ratioH = sh;
    }
  }

  // Determine base size (longest side)
  let baseSize = settings.iconSize || 1024;
  if (settings.useOriginalSize) {
    baseSize = settings.crop ? Math.max(settings.crop.sw, settings.crop.sh) : Math.max(sw, sh);
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

  if (settings.crop) {
    sx = settings.crop.sx;
    sy = settings.crop.sy;
    sWidth = settings.crop.sw;
    sHeight = settings.crop.sh;
  } else {
    if (sourceRatio > targetRatio) {
      // Source is wider than target -> crop horizontally
      sWidth = sh * targetRatio;
      sx = (sw - sWidth) / 2;
    } else if (sourceRatio < targetRatio) {
      // Source is taller than target -> crop vertically
      sHeight = sw / targetRatio;
      sy = (sh - sHeight) / 2;
    }
  }

  ctx.drawImage(bitmap, sx, sy, sWidth, sHeight, 0, 0, outW, outH);

  let mimeType = 'image/png';
  if (settings.saveFormat === 'original' && settings.originalExt) {
    if (settings.originalExt === 'jpg' || settings.originalExt === 'jpeg') mimeType = 'image/jpeg';
    else if (settings.originalExt === 'webp') mimeType = 'image/webp';
  } else if (settings.saveFormat !== 'original') {
    mimeType = settings.saveFormat === 'jpeg' ? 'image/jpeg' : 
               settings.saveFormat === 'webp' ? 'image/webp' : 'image/png';
  }
  const outBlob = await canvas.convertToBlob({ type: mimeType });

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
        resolve(`data:${mimeType};base64,${btoa(binary)}`);
      }).catch(reject);
    }
  });
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'downloadImage' && message.url) {
    downloadImageWithSettings(message.url, sendResponse);
    return true;
  }

  if (message.action === 'downloadCroppedImage' && message.url && message.crop) {
    const url = message.url;
    let originalFilename = getFilenameFromUrl(url);

    let origExt = 'png';
    if (originalFilename.includes('.')) {
      origExt = originalFilename.split('.').pop().toLowerCase();
    }
    let baseName = generateTimeBaseName();

    chrome.storage.local.get({
      aspectRatio: '1:1',
      iconSize: 1024,
      useOriginalSize: false,
      borderRadius: 22.5,
      saveFormat: 'png'
    }, (settings) => {
      if (settings.useOriginalSize) {
        settings.aspectRatio = 'original';
        settings.borderRadius = 0;
      }
      
      settings.crop = message.crop; 
      settings.originalExt = origExt;
      const ext = settings.saveFormat === 'original' ? origExt : 
                  (settings.saveFormat === 'jpeg' ? 'jpg' : (settings.saveFormat || 'png'));
      const filename = `${baseName}_cropped.${ext}`;

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
            console.log(`Cropped download started: ${filename} (ID: ${downloadId})`);
            sendResponse({ success: true, downloadId: downloadId });
          }
        });
      }).catch(err => {
        console.error('Image crop processing failed:', err);
        sendResponse({ error: err.toString() });
      });
    });

    return true;
  }
});
