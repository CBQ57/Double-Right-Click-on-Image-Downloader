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

      const fallbackDownload = () => {
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = `image_${Date.now()}.png`; // default fallback name
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast(isJp ? '✅ 保存しました（※最新の設定を利用するにはページを更新してください）' : '✅ Saved (Reload page for newest settings)', x, y);
      };

      try {
        if (!chrome.runtime || !chrome.runtime.id) {
          throw new Error('Extension context disconnected');
        }

        chrome.runtime.sendMessage(
          { action: 'downloadImage', url: imageUrl, pageUrl: window.location.href },
          (response) => {
            if (chrome.runtime.lastError) {
              fallbackDownload();
              return;
            }
            if (response && response.error) {
              showToast(isJp ? '❌ エラー' : '❌ Error', x, y, true);
            }
          }
        );
      } catch (e) {
        fallbackDownload();
      }
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

  // ─── 画像クロップ用モーダル UI ───
  let activeCropModal = null;

  function openCropUI(srcUrl) {
    if (activeCropModal) activeCropModal.remove();

    chrome.storage.local.get({ aspectRatio: '1:1', borderRadius: 22.5, lang: 'en', useOriginalSize: false }, (settings) => {
      let isBypassed = settings.useOriginalSize || settings.aspectRatio === 'original';
      let effectiveRadius = isBypassed ? 0 : settings.borderRadius;

      let targetRatio = null;
      if (!isBypassed) {
        if (settings.aspectRatio && settings.aspectRatio.startsWith('1:1')) targetRatio = 1;
        else if (settings.aspectRatio === '16:9') targetRatio = 16/9;
        else if (settings.aspectRatio === '4:3') targetRatio = 4/3;
        else if (settings.aspectRatio === '3:4') targetRatio = 3/4;
        else if (settings.aspectRatio === '9:16') targetRatio = 9/16;
      }

      const isJp = settings.lang === 'jp';

      const modal = document.createElement('div');
      activeCropModal = modal;
      Object.assign(modal.style, {
        position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
        backgroundColor: 'rgba(0,0,0,0.85)', zIndex: '2147483647',
        display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif',
        backdropFilter: 'blur(5px)'
      });

      const header = document.createElement('div');
      Object.assign(header.style, {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px', backgroundColor: '#1a1a1a', color: '#fff',
        borderBottom: '1px solid #333'
      });

      const title = document.createElement('div');
      title.textContent = isJp ? '画像のトリミング' : 'Crop Image';
      title.style.fontSize = '16px';
      title.style.fontWeight = 'bold';
      header.appendChild(title);

      const btnContainer = document.createElement('div');
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = isJp ? 'キャンセル' : 'Cancel';
      Object.assign(cancelBtn.style, {
        padding: '8px 16px', marginRight: '12px', cursor: 'pointer',
        background: 'transparent', color: '#fff', border: '1px solid #666', 
        borderRadius: '6px', fontSize: '14px'
      });
      
      const saveBtn = document.createElement('button');
      saveBtn.textContent = isJp ? 'ダウンロード' : 'Download';
      Object.assign(saveBtn.style, {
        padding: '8px 20px', cursor: 'pointer',
        background: '#3498db', color: '#fff', border: 'none', 
        borderRadius: '6px', fontWeight: 'bold', fontSize: '14px'
      });

      btnContainer.appendChild(cancelBtn);
      btnContainer.appendChild(saveBtn);
      header.appendChild(btnContainer);
      modal.appendChild(header);

      const body = document.createElement('div');
      Object.assign(body.style, {
        flex: '1', display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '32px', position: 'relative', overflow: 'hidden',
        minHeight: '0', minWidth: '0', boxSizing: 'border-box'
      });
      modal.appendChild(body);

      const imgWrapper = document.createElement('div');
      Object.assign(imgWrapper.style, {
        position: 'relative', maxWidth: '100%', maxHeight: '100%',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '0', minWidth: '0'
      });
      body.appendChild(imgWrapper);

      const img = document.createElement('img');
      img.src = srcUrl;
      Object.assign(img.style, {
        display: 'block', maxWidth: '100%', maxHeight: '100%',
        userSelect: 'none', WebkitUserDrag: 'none', objectFit: 'contain'
      });
      imgWrapper.appendChild(img);

      const overlay = document.createElement('div');
      Object.assign(overlay.style, {
        position: 'absolute', top: '0', left: '0', right: '0', bottom: '0',
        overflow: 'hidden', pointerEvents: 'none'
      });
      // Append overlay after image is loaded to have proper alignment. Wait, no, position relative to wrapper is enough.

      const cropBox = document.createElement('div');
      Object.assign(cropBox.style, {
        position: 'absolute', border: '2px solid #3498db',
        outline: '9999px solid rgba(0,0,0,0.6)',
        pointerEvents: 'auto', cursor: 'move', boxSizing: 'border-box',
        borderRadius: effectiveRadius ? effectiveRadius + '%' : '0'
      });
      overlay.appendChild(cropBox);

      const handles = ['nw', 'ne', 'sw', 'se'];
      handles.forEach(pos => {
        const handle = document.createElement('div');
        handle.dataset.pos = pos;
        Object.assign(handle.style, {
          position: 'absolute', width: '16px', height: '16px',
          backgroundColor: '#3498db', borderRadius: '50%',
          border: '2px solid #fff', pointerEvents: 'auto',
          boxSizing: 'border-box', boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        });
        if (pos.includes('n')) handle.style.top = '-8px';
        if (pos.includes('s')) handle.style.bottom = '-8px';
        if (pos.includes('w')) handle.style.left = '-8px';
        if (pos.includes('e')) handle.style.right = '-8px';
        
        if (pos === 'nw' || pos === 'se') handle.style.cursor = 'nwse-resize';
        if (pos === 'ne' || pos === 'sw') handle.style.cursor = 'nesw-resize';

        cropBox.appendChild(handle);
      });

      document.body.appendChild(modal);

      let naturalW, naturalH, renderedW, renderedH;
      let imgOffsetX = 0, imgOffsetY = 0;
      let crop = { x: 0, y: 0, w: 1, h: 1 };

      function updateDOM() {
        cropBox.style.left = (imgOffsetX + crop.x * renderedW) + 'px';
        cropBox.style.top = (imgOffsetY + crop.y * renderedH) + 'px';
        cropBox.style.width = (crop.w * renderedW) + 'px';
        cropBox.style.height = (crop.h * renderedH) + 'px';
      }

      function adjustImageSize() {
        if (!naturalW || !naturalH) return;
        const bodyRect = body.getBoundingClientRect();
        const availableW = Math.max(1, bodyRect.width - 64);
        const availableH = Math.max(1, bodyRect.height - 64);

        const availableRatio = availableW / availableH;
        const imgRatio = naturalW / naturalH;

        if (availableRatio > imgRatio) {
          renderedH = availableH;
          renderedW = availableH * imgRatio;
        } else {
          renderedW = availableW;
          renderedH = availableW / imgRatio;
        }

        imgWrapper.style.width = renderedW + 'px';
        imgWrapper.style.height = renderedH + 'px';
        imgWrapper.style.maxWidth = 'none';
        imgWrapper.style.maxHeight = 'none';
        img.style.width = '100%';
        img.style.height = '100%';

        imgOffsetX = 0;
        imgOffsetY = 0;
        updateDOM();
      }

      const ac = new AbortController();
      const signal = ac.signal;

      window.addEventListener('resize', adjustImageSize, { signal });

      img.onload = () => {
        imgWrapper.appendChild(overlay); // now append after dimensions
        naturalW = img.naturalWidth || 1;
        naturalH = img.naturalHeight || 1;
        
        if (!targetRatio) {
          targetRatio = naturalW / naturalH;
        }

        adjustImageSize();

        if (targetRatio) {
          const imgRatio = naturalW / naturalH;
          if (imgRatio > targetRatio) {
            crop.h = 1; crop.w = (naturalH * targetRatio) / naturalW;
            crop.y = 0; crop.x = (1 - crop.w) / 2;
          } else {
            crop.w = 1; crop.h = (naturalW / targetRatio) / naturalH;
            crop.x = 0; crop.y = (1 - crop.h) / 2;
          }
        }
        updateDOM();
      };

      let isDragging = false, isResizing = false;
      let resizePos = null, startX, startY, startCrop;

      cropBox.addEventListener('mousedown', e => {
        if (e.target.dataset.pos) {
          isResizing = true; resizePos = e.target.dataset.pos;
        } else {
          isDragging = true;
        }
        startX = e.clientX; startY = e.clientY;
        startCrop = { ...crop };
        e.preventDefault();
      });

      window.addEventListener('mousemove', e => {
        if (!isDragging && !isResizing) return;
        if (!renderedW || !renderedH) return;

        const dx = (e.clientX - startX) / renderedW;
        const dy = (e.clientY - startY) / renderedH;

        if (isDragging) {
          let nx = startCrop.x + dx;
          let ny = startCrop.y + dy;
          if (nx < 0) nx = 0; if (ny < 0) ny = 0;
          if (nx + crop.w > 1) nx = 1 - crop.w;
          if (ny + crop.h > 1) ny = 1 - crop.h;
          crop.x = nx; crop.y = ny;
        } else if (isResizing) {
          let { x, y, w, h } = startCrop;
          let dw = 0, dh = 0;
          if (resizePos.includes('e')) dw = dx;
          if (resizePos.includes('w')) { dw = -dx; x += dx; }
          if (resizePos.includes('s')) dh = dy;
          if (resizePos.includes('n')) { dh = -dy; y += dy; }
          
          w += dw; h += dh;

          if (targetRatio) {
            if (Math.abs(dw) > Math.abs(dh)) {
              const reqH = w * (naturalW / naturalH) / targetRatio;
              dh = reqH - startCrop.h;
              h = reqH;
              if (resizePos.includes('n')) y = startCrop.y - dh;
            } else {
              const reqW = h * (naturalH / naturalW) * targetRatio;
              dw = reqW - startCrop.w;
              w = reqW;
              if (resizePos.includes('w')) x = startCrop.x - dw;
            }
          }

          if (w < 0.05) w = 0.05; if (h < 0.05) h = 0.05;

          // Simple bounds check - if resizing pushes out of bounds, revert entirely
          if (x < 0 || y < 0 || x + w > 1 || y + h > 1) {
            // Revert state
          } else {
            crop.x = x; crop.y = y; crop.w = w; crop.h = h;
          }
        }
        updateDOM();
      }, { signal });

      window.addEventListener('mouseup', () => { isDragging = false; isResizing = false; }, { signal });

      cancelBtn.addEventListener('click', () => { 
        ac.abort();
        modal.remove(); 
        activeCropModal = null; 
      });
      saveBtn.addEventListener('click', () => {
        const sx = Math.round(crop.x * naturalW);
        const sy = Math.round(crop.y * naturalH);
        const sw = Math.round(crop.w * naturalW);
        const sh = Math.round(crop.h * naturalH);

        saveBtn.textContent = '...'; saveBtn.disabled = true;
        chrome.runtime.sendMessage({ action: 'downloadCroppedImage', url: srcUrl, crop: { sx, sy, sw, sh } }, (res) => {
          ac.abort();
          modal.remove(); activeCropModal = null;
          if (res && res.success) showToast(isJp ? '✅ 保存しました' : '✅ Saved', window.innerWidth/2, window.innerHeight/2);
          else showToast(isJp ? '❌ エラーが発生しました' : '❌ Error occurred', window.innerWidth/2, window.innerHeight/2, true);
        });
      });
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'openCropModal' && msg.srcUrl) {
      openCropUI(msg.srcUrl);
      sendResponse({ success: true });
    }
  });

})();
