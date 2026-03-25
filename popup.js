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

  // Load current settings from storage
  chrome.storage.local.get({
    lang: 'en',
    theme: 'dark',
    aspectRatio: '1:1',
    iconSize: 1024,
    useOriginalSize: false,
    borderRadius: 22.5
  }, (items) => {
    applyTheme(items.theme);
    langSelect.value = items.lang;
    aspectSelect.value = items.aspectRatio;
    sizeInput.value = items.iconSize;
    originalSizeCheckbox.checked = items.useOriginalSize;
    radiusInput.value = items.borderRadius;

    // Initial UI state
    sizeInput.disabled = items.useOriginalSize;
    updateLanguage(items.lang);
  });

  function saveSettings() {
    const lang = langSelect.value;
    const aspectRatio = aspectSelect.value;
    const iconSize = parseInt(sizeInput.value, 10) || 1024;
    const useOriginalSize = originalSizeCheckbox.checked;
    const borderRadius = parseFloat(radiusInput.value) || 0;

    // Update UI state based on constraints
    sizeInput.disabled = useOriginalSize;
    updateLanguage(lang);

    chrome.storage.local.set({
      lang,
      aspectRatio,
      iconSize,
      useOriginalSize,
      borderRadius
    }, () => {
      // Show saved toast msg
      statusDiv.classList.add('show');
      setTimeout(() => statusDiv.classList.remove('show'), 1500);
    });
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

  // Debounced input handlers for number inputs
  let timeout;
  const handleInput = () => {
    clearTimeout(timeout);
    timeout = setTimeout(saveSettings, 500);
  };
  
  sizeInput.addEventListener('input', handleInput);
  radiusInput.addEventListener('input', handleInput);
});
