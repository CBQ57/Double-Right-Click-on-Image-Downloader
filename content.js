(() => {
  'use strict';

  const DOUBLE_CLICK_THRESHOLD = 500; // ms
  let lastRightClickTime = 0;
  let lastRightClickTarget = null;

  /**
   * Extract the image URL from an element.
   * Supports <img>, <picture> > <source>, <video poster>, and CSS background-image.
   */
  function getImageUrl(element) {
    // Walk up the DOM a few levels to find a relevant image element
    let el = element;
    for (let i = 0; i < 5 && el; i++) {
      // <img> element
      if (el.tagName === 'IMG' && el.src) {
        return el.currentSrc || el.src;
      }

      // <picture> > <source> (already handled via <img> inside <picture>)
      // <video poster>
      if (el.tagName === 'VIDEO' && el.poster) {
        return el.poster;
      }

      // SVG <image>
      if (el.tagName === 'image' || el.tagName === 'IMAGE') {
        const href = el.getAttribute('href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
        if (href) return href;
      }

      // CSS background-image
      const style = window.getComputedStyle(el);
      const bgImage = style.backgroundImage;
      if (bgImage && bgImage !== 'none') {
        const match = bgImage.match(/url\(["']?(.*?)["']?\)/);
        if (match && match[1]) {
          return match[1];
        }
      }

      // <canvas> — convert to data URL
      if (el.tagName === 'CANVAS') {
        try {
          return el.toDataURL('image/png');
        } catch (e) {
          // tainted canvas, skip
        }
      }

      el = el.parentElement;
    }

    return null;
  }

  /**
   * Show a brief toast notification at the cursor position.
   */
  function showToast(message, x, y, isError = false) {
    const toast = document.createElement('div');
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed',
      left: `${x}px`,
      top: `${y - 40}px`,
      background: isError
        ? 'linear-gradient(135deg, #e74c3c, #c0392b)'
        : 'linear-gradient(135deg, #2ecc71, #27ae60)',
      color: '#fff',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '13px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: '600',
      zIndex: '2147483647',
      pointerEvents: 'none',
      opacity: '0',
      transform: 'translateY(8px) scale(0.95)',
      transition: 'opacity 0.2s ease, transform 0.2s ease',
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      whiteSpace: 'nowrap',
    });

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0) scale(1)';
    });

    // Animate out and remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-8px) scale(0.95)';
      setTimeout(() => toast.remove(), 200);
    }, 1500);
  }

  /**
   * Add a quick flash effect on the image being downloaded.
   */
  function flashElement(element) {
    const overlay = document.createElement('div');
    const rect = element.getBoundingClientRect();
    Object.assign(overlay.style, {
      position: 'fixed',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      background: 'rgba(46, 204, 113, 0.35)',
      borderRadius: '4px',
      zIndex: '2147483646',
      pointerEvents: 'none',
      opacity: '1',
      transition: 'opacity 0.5s ease',
    });

    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 500);
    }, 200);
  }

  // ダウンロードトリガーはダブル右クリック固定
  let lang = 'en';

  chrome.storage.local.get({ lang: 'en' }, (res) => {
    lang = res.lang;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.lang) lang = changes.lang.newValue;
    }
  });

  function triggerDownload(target, x, y) {
    const imageUrl = getImageUrl(target);
    const isJp = lang === 'jp';

    if (imageUrl) {
      flashElement(target);
      showToast(isJp ? '⬇ ダウンロード中…' : '⬇ Downloading...', x, y);

      chrome.runtime.sendMessage(
        { action: 'downloadImage', url: imageUrl, pageUrl: window.location.href },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Extension context invalidated or error:', chrome.runtime.lastError.message);
            showToast(isJp ? '❌ 再読み込みしてください' : '❌ Reload page please', x, y, true);
            return;
          }
          if (response && response.error) {
            showToast(isJp ? '❌ エラー' : '❌ Error', x, y, true);
          }
        }
      );
    } else {
      showToast(isJp ? '🖼️ 画像が見つかりません' : '🖼️ No image found', x, y, true);
    }
  }

  // ダブル右クリックでダウンロード
  document.addEventListener('contextmenu', (event) => {
    const target = event.target;
    const now = Date.now();
    const timeDiff = now - lastRightClickTime;
    const sameTarget = (target === lastRightClickTarget);

    if (sameTarget && timeDiff < DOUBLE_CLICK_THRESHOLD) {
      event.preventDefault();
      event.stopPropagation();
      triggerDownload(target, event.clientX, event.clientY);
      lastRightClickTime = 0;
      lastRightClickTarget = null;
    } else {
      lastRightClickTime = now;
      lastRightClickTarget = target;
    }
  }, true);
})();
