const dict = {
  en: {
    title: "Download Settings",
    lblAspect: "Crop Aspect Ratio & Style",
    optIos: "1:1 (iOS App Icon)",
    optSns: "1:1 (SNS Round Icon)",
    optSq: "1:1 (Square)",
    opt169: "16:9 (Landscape)",
    opt43: "4:3 (Landscape)",
    opt34: "3:4 (Portrait)",
    opt916: "9:16 (Portrait)",
    optOrig: "Original (No Crop)",
    lblSize: "Base Size / Longest Side (px)",
    lblOrigSize: "Original Size",
    lblRadius: "Corner Radius (%)",
    lblHint: "Hint: iOS icon is ~22.5%, SNS round icon is 50%",
    lblFormat: "Save Format",
    optFmtOrig: "Original (No Change)",
    saved: "Saved!"
  },
  jp: {
    title: "ダウンロード設定",
    lblAspect: "切り抜きのアスペクト比・スタイル",
    optIos: "1:1 (iOSアプリアイコン)",
    optSns: "1:1 (SNS丸アイコン)",
    optSq: "1:1 (正方形)",
    opt169: "16:9 (横長)",
    opt43: "4:3 (横長)",
    opt34: "3:4 (縦長)",
    opt916: "9:16 (縦長)",
    optOrig: "オリジナル (切り抜きなし)",
    lblSize: "サイズ (長辺px)",
    lblOrigSize: "元のサイズ",
    lblRadius: "角丸の割合 (%)",
    lblHint: "※iOS風は22.5、SNS用丸アイコンは50",
    lblFormat: "保存形式",
    optFmtOrig: "オリジナル (フォーマット変更なし)",
    saved: "保存しました!"
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const langSelect = document.getElementById('langSelect');
  const aspectSelect = document.getElementById('aspectRatio');
  const sizeInput = document.getElementById('iconSize');
  const originalSizeCheckbox = document.getElementById('originalSize');
  const radiusInput = document.getElementById('borderRadius');
  const statusDiv = document.getElementById('status');
  const themeToggle = document.getElementById('themeToggle');

  const formatSelect = document.getElementById('saveFormat');

  // ── テーマ管理 ──
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark');
      themeToggle.textContent = '☀️';
      themeToggle.title = 'Switch to Light mode';
    } else {
      document.body.classList.remove('dark');
      themeToggle.textContent = '🌙';
      themeToggle.title = 'Switch to Dark mode';
    }
  }

  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
    chrome.storage.local.set({ theme: newTheme });
  });

  function updateLanguage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[lang][key]) {
        if (el.tagName === 'OPTION') {
          el.textContent = dict[lang][key];
        } else {
          el.innerText = dict[lang][key];
        }
      }
    });
  }

  // ブラウザ言語に基づくデフォルト言語を判定
  function detectDefaultLang() {
    const uiLang = (chrome.i18n && chrome.i18n.getUILanguage)
      ? chrome.i18n.getUILanguage()
      : (navigator.language || 'en');
    return uiLang.toLowerCase().startsWith('ja') ? 'jp' : 'en';
  }

  // Load current settings from storage
  chrome.storage.local.get({
    lang: detectDefaultLang(),
    theme: 'dark',
    aspectRatio: '1:1',
    iconSize: 1024,
    useOriginalSize: false,
    borderRadius: 22.5,
    saveFormat: 'png'
  }, (items) => {
    applyTheme(items.theme);
    langSelect.value = items.lang;
    aspectSelect.value = items.aspectRatio;
    sizeInput.value = items.iconSize;
    originalSizeCheckbox.checked = items.useOriginalSize;
    radiusInput.value = items.borderRadius;
    formatSelect.value = items.saveFormat;

    // Initial UI state
    sizeInput.disabled = items.useOriginalSize;
    aspectSelect.disabled = items.useOriginalSize;
    radiusInput.disabled = items.useOriginalSize;
    updateLanguage(items.lang);
    updatePreview();
  });

  function saveSettings() {
    const lang = langSelect.value;
    const aspectRatio = aspectSelect.value;
    const iconSize = parseInt(sizeInput.value, 10) || 1024;
    const useOriginalSize = originalSizeCheckbox.checked;
    const borderRadius = parseFloat(radiusInput.value) || 0;
    const saveFormat = formatSelect.value;

    // Update UI state based on constraints
    sizeInput.disabled = useOriginalSize;
    aspectSelect.disabled = useOriginalSize;
    radiusInput.disabled = useOriginalSize;

    updateLanguage(lang);
    updatePreview();

    chrome.storage.local.set({
      lang,
      aspectRatio,
      iconSize,
      useOriginalSize,
      borderRadius,
      saveFormat
    }, () => {
      // Show saved toast msg
      statusDiv.classList.add('show');
      setTimeout(() => statusDiv.classList.remove('show'), 1500);
    });
  }

  function updatePreview() {
    const useOriginalSize = originalSizeCheckbox.checked;
    const ratioVal = useOriginalSize ? 'original' : aspectSelect.value;
    const radPercent = useOriginalSize ? 0 : (parseFloat(radiusInput.value) || 0);
    const sizeVal = parseInt(sizeInput.value, 10) || 1024;
    
    const previewBox = document.getElementById('previewBox');
    const previewText = document.getElementById('previewText');
    const lang = langSelect.value;
    
    // px入力値に応じてプレビューボックスの基準サイズをスケールさせる
    const uiMaxSize = 72;
    let maxSize = uiMaxSize;
    if (!useOriginalSize) {
      maxSize = Math.max(24, Math.min(uiMaxSize, (sizeVal / 1024) * uiMaxSize));
    }
    
    let boxW = 0, boxH = 0;
    let isBypassed = useOriginalSize; // 「元のサイズ」にチェックがある場合のみ完全バイパス表示
    let textLabel = "";
    
    if (ratioVal.includes('16:9')) {
      boxW = maxSize; boxH = maxSize * (9/16); textLabel = "16:9";
    } else if (ratioVal.includes('4:3')) {
      boxW = maxSize; boxH = maxSize * (3/4); textLabel = "4:3";
    } else if (ratioVal.includes('3:4')) {
      boxH = maxSize; boxW = maxSize * (3/4); textLabel = "3:4";
    } else if (ratioVal.includes('9:16')) {
      boxH = maxSize; boxW = maxSize * (9/16); textLabel = "9:16";
    } else if (ratioVal.includes('1:1')) {
      boxW = maxSize; boxH = maxSize; textLabel = "1:1";
    } else {
      // 比率がオリジナル（切り抜きなし）の場合は汎用の図形(4:3)を使って角丸を表現
      boxW = maxSize; boxH = maxSize * (3/4);
      textLabel = dict[lang]?.optOrig || "Original";
    }
    
    if (isBypassed) {
      previewBox.style.width = '80%';
      previewBox.style.height = '60%';
      previewBox.style.background = 'transparent';
      previewBox.style.border = '2px dashed var(--hint)';
      previewBox.style.borderRadius = '4px';
      previewText.textContent = textLabel;
      previewText.style.color = 'var(--text)';
      previewText.style.textShadow = 'none';
      previewText.style.fontSize = '12px';
    } else {
      previewBox.style.width = boxW + 'px';
      previewBox.style.height = boxH + 'px';
      previewBox.style.background = 'var(--accent)';
      previewBox.style.border = 'none';
      
      // 角丸適用
      const minSide = Math.min(boxW, boxH);
      const radPx = minSide * (radPercent / 100);
      previewBox.style.borderRadius = radPx + 'px';
      
      previewText.textContent = textLabel;
      previewText.style.color = '#fff';
      previewText.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
      
      // サイズが小さすぎるときは文字を小さくする
      if (maxSize < 40) {
        previewText.style.fontSize = '9px';
      } else {
        previewText.style.fontSize = '12px';
      }
    }
  }

  // Handle preset combinations
  aspectSelect.addEventListener('change', (e) => {
    if (e.target.value === '1:1_sns') {
      radiusInput.value = 50;
      sizeInput.value = 400; // typical default size for SNS
      originalSizeCheckbox.checked = false;
    } else if (e.target.value === '1:1' /* iOS */) {
      radiusInput.value = 22.5;
      sizeInput.value = 1024;
      originalSizeCheckbox.checked = false;
    } else {
      // 角丸なし（正方形・各アスペクト比・オリジナルなど）
      radiusInput.value = 0;
    }
    saveSettings();
  });

  // Handle immediate change events (for select/checkbox)
  langSelect.addEventListener('change', saveSettings);
  originalSizeCheckbox.addEventListener('change', saveSettings);
  formatSelect.addEventListener('change', saveSettings);

  // マウススクロールによる値の変更機能
  const scrollElements = [langSelect, aspectSelect, sizeInput, radiusInput, formatSelect];
  scrollElements.forEach(el => {
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (el.disabled) return;

      if (el.tagName === 'SELECT') {
        const idx = el.selectedIndex;
        const maxIdx = el.options.length - 1;
        let newIdx = idx;
        if (e.deltaY > 0) newIdx = Math.min(idx + 1, maxIdx);
        else if (e.deltaY < 0) newIdx = Math.max(idx - 1, 0);
        
        if (newIdx !== idx) {
          el.selectedIndex = newIdx;
          el.dispatchEvent(new Event('change'));
        }
      } else if (el.tagName === 'INPUT' && el.type === 'number') {
        let val = parseFloat(el.value);
        let step = parseFloat(el.getAttribute('step')) || 1;
        const min = parseFloat(el.getAttribute('min')) || 0;
        const max = parseFloat(el.getAttribute('max')) || Infinity;
        
        // iconSizeの場合は1スクロールで大きく変化させる
        if (el.id === 'iconSize') step = 32;

        if (e.deltaY > 0) val -= step;
        else if (e.deltaY < 0) val += step;
        
        // 小数点の誤差補正
        val = Math.round(val * 1000) / 1000;
        
        // min/max制限
        if (val < min) val = min;
        if (val > max) val = max;
        
        el.value = val;
        el.dispatchEvent(new Event('input'));
      }
    });
  });

  // Debounced input handlers for number inputs
  let timeout;
  const handleInput = () => {
    clearTimeout(timeout);
    timeout = setTimeout(saveSettings, 500);
  };
  
  sizeInput.addEventListener('input', handleInput);
  radiusInput.addEventListener('input', handleInput);
});
