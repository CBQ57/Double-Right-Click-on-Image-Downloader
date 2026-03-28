# Double Click on Image DL

[English](#english) | [日本語](#japanese)

---

<a id="english"></a>
## English

### Overview
A Chrome extension that allows you to easily download and process images from websites with customized aspect ratios, sizes, and corner radii. Originally designed to download images as iOS-style app icons, it has evolved into a versatile image downloader supporting various formats like SNS round icons, landscape/portrait crops, and original quality bypass.

### Key Features
*   **Quick Download (Double Right-Click / Context Menu)**: Instantly download images using your saved settings (default: 1:1 with 22.5% radius). Easily trigger via double right-click or the "Download Image" context menu.
*   **Flexible Styling**:
    *   **Aspect Ratios**: 1:1 (iOS/SNS/Square), 4:3, 3:4, 16:9, 9:16, and Original.
    *   **Custom Scaling**: Set the pixel size for the longest side or keep the original resolution.
    *   **Corner Radius**: Adjust from 0% to 50% (perfect for round icons).
*   **Modern UI & UX**:
    *   **Dark Mode**: Automatic and manual toggle for a sleek look.
    *   **Live Preview**: Real-time visual feedback of your crop and radius settings in the popup.
    *   **Mouse Wheel Interaction**: Quickly adjust numbers and selections by scrolling over inputs.
    *   **Toast Notifications**: Elegant status alerts for downloads and errors.
*   **Multiple Save Formats**: Support for PNG, JPG, WebP, and "Original" (removes processing for maximum speed/quality).
*   **Interactive Image Cropping**:
    *   **Context Menu Integration**: Right-click any image and select **"Crop and Save"** to open the interactive modal.
    *   **Real-time UI**: Drag and resize the crop box to get the perfect frame. Supports all preset aspect ratios including a locked **"Original"** ratio mode.
    *   **High-Res Optimization**: Mathematical bounding ensures the UI stays perfectly within your browser window, even for ultra-high-resolution images.
*   **Broad Compatibility**: Extracts images from `<img>`, `<picture>`, CSS `background-image`, `<video>` posters, `<canvas>`, and SVG.

### Installation
1. Clone or download this repository.
2. Open Google Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the folder.

### Usage
1.  **Configure**: Click the extension icon to set your preferred defaults (ratio, size, radius, format).
2.  **Quick Save**: Hover over an image and **Double Right-Click**, or right-click and select **"Download Image"**. Both methods use your saved settings!
3.  **Manual Crop**: Right-click an image and choose **"Crop and Save"**. This opens the crop UI where you can manually adjust the frame before downloading.
4.  **Pro Tip**: Use the mouse wheel over the settings in the popup to change values instantly!

---

<a id="japanese"></a>
## 日本語

### 概要
ウェブ上の画像を、指定したアスペクト比・サイズ・角丸で瞬時に加工・ダウンロードできるChrome拡張機能です。iOSアプリアイコン風の書き出しはもちろん、SNS用の丸アイコン、16:9などのレターボックス切り抜き、あるいは加工なしのオリジナル保存など、幅広い用途に対応しています。

### 主な機能
*   **クイック保存 (ダブル右クリック / 右クリックメニュー)**: 画像をダブル右クリック、または右クリックメニューの「画像をダウンロード」から、保存済みの設定（比率・サイズ・角丸）で即座にダウンロードします。
*   **インタラクティブな画像クロップ**:
    *   **右クリックメニューから起動**: 画像を右クリックして **「トリミングして保存」** を選択すると、専用の編集画面が開きます。
    *   **リアルタイム操作**: ドラッグ＆ドロップで切り抜き位置を調整。各アスペクト比に加え、元の比率を維持したまま拡大縮小できる **「オリジナル」** モードも搭載。
    *   **高解像度対応**: 超高画質な画像でも、数学的なバウンディング処理により、画面からはみ出さず常に最適なサイズで快適に編集可能です。
*   **自由なスタイリング**:
    *   **アスペクト比**: 1:1 (iOS/SNS/正方形), 4:3, 3:4, 16:9, 9:16, オリジナルに対応。
    *   **サイズ指定**: 長辺のピクセル数を自由に指定、または元の解像度を維持。
    *   **角丸調整**: 0〜50%の間で自由に調整可能（SNS用丸アイコンも一発設定）。
*   **洗練されたUI/UX**:
    *   **ダークモード対応**: システム設定との連動および手動切り替えが可能。
    *   **リアルタイムプレビュー**: 設定中の比率や角丸をポップアップ内で視覚的に確認。
    *   **マウスホイール操作**: 入力フォーム上でスクロールするだけで、数値や選択肢を素早く変更。
    *   **トースト通知**: ダウンロード状況やエラーを美しい通知でお知らせ。
*   **多彩な保存形式**: PNG, JPG, WebP, および「オリジナル」（加工を介さず最速・最高画質で保存）に対応。
*   **高い互換性**: 通常の `<img>` はもちろん、`<picture>`、CSS `background-image`、`<video>` のポスター、`<canvas>`、SVG `<image>` からも抽出可能です。

### インストール方法
1. このリポジトリをダウンロード（またはクローン）して解凍します。
2. Chromeの `chrome://extensions/` を開きます。
3. 右上の **デベロッパー モード** をオンにします。
4. **パッケージ化されていない拡張機能を読み込む** をクリックし、解凍したフォルダを選択します。

### 使い方
1.  **設定**: 拡張機能アイコンをクリックし、デフォルトの比率、サイズ、角丸、フォーマットを設定します。
2.  **クイックダウンロード**: 画像の上で **ダブル右クリック** を実行するか、右クリックメニューから **「画像をダウンロード」** を選択します。どちらも現在のポップアップの設定で実行されます。
3.  **手動トリミング**: 画像を右クリックして **「トリミングして保存」** を選択。好みの範囲を選んでから保存できます。
4.  **Tips**: ポップアップの設定項目は、マウスホイールでスクロールすると値をサクサク変更できます！
