# iOS Icon Downloader (Double Click on Image DL)

[English](#english) | [日本語](#japanese)

---

<a id="english"></a>
## English

### Overview
A Chrome extension that allows you to easily download images from websites with customized aspect ratios, sizes, and border radii. Originally designed to download images as iOS-style app icons, it has evolved to support various formats like SNS round icons, square crops, and standard aspect ratios.

### Features
*   **Multiple Triggers**: Download images using Double Right-Click (default), Single Right-Click, or Double Left-Click.
*   **Flexible Cropping & Styling**:
    *   1:1 (iOS App Icon) - default 22.5% corner radius
    *   1:1 (SNS Round Icon) - 50% corner radius
    *   1:1 (Square)
    *   16:9, 4:3 (Landscape)
    *   3:4, 9:16 (Portrait)
    *   Original (No Crop)
*   **Custom Scaling**: Specify the pixel size for the longest side or keep the original image size.
*   **Custom Corner Radius**: Fine-tune the roundness of the image corners (0-50%).
*   **Wide Compatibility**: Seamlessly extracts images from `<img>`, `<picture>`, CSS `background-image`, `<video>` poster images, `<canvas>`, and SVG `<image>`.
*   **Visual Feedback**: Beautiful toast notifications and a subtle flash effect upon successful image capture.
*   **Bilingual UI**: The settings popup fully supports both English and Japanese.

### Installation
1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the directory containing this extension.

### Usage
1. Click the extension icon in the toolbar to open the Settings popup.
2. Configure your preferred download trigger, aspect ratio, base size, and corner radius.
3. Hover over an image on any website and perform your specified click action (e.g., double right-click).
4. The image will be processed and downloaded automatically as a PNG file.

---

<a id="japanese"></a>
## 日本語

### 概要
ウェブ上の画像を、指定したアスペクト比・サイズ・角丸で簡単にダウンロードできるChrome拡張機能です。元々は画像をiPhoneなどのiOSアプリアイコン風に保存する用途で作成されましたが、現在ではSNS用の丸アイコンや任意の縦横比（16:9など）での切り抜きにも対応した汎用的な画像ダウンローダーとなっています。

### 主な機能
*   **選べるダウンロードトリガー**: 「ダブル右クリック」「シングル右クリック」「ダブル左クリック」から操作を選択できます。（デフォルトはダブル右クリック）
*   **多彩な切り抜きフォーマット**:
    *   1:1 (iOSアプリアイコン風 - デフォルト角丸22.5%)
    *   1:1 (SNS丸アイコン - デフォルト角丸50%)
    *   1:1 (正方形)
    *   16:9, 4:3 (横長)
    *   3:4, 9:16 (縦長)
    *   オリジナル (切り抜きなし)
*   **サイズ指定**: 長辺のピクセル数を自由に指定、または元の画像サイズのまま保存可能です（最大解像度対応）。
*   **自由な角丸設定**: 画像の角丸を0〜50%の間で手動・自由に調整可能です。
*   **幅広い画像要素に対応**: 通常の `<img>` 要素にくわえ、`<picture>`、CSSの `background-image`、`<video>` のポスター画像、`<canvas>`、SVGの `<image>` からも画像を抽出できます。
*   **視覚的なフィードバック**: ダウンロード時に画像が光るエフェクトと、状態を知らせる美しいトースト通知を表示します。
*   **多言語対応**: 設定画面は日本語・英語の表示に対応しています。

### インストール方法
1. このリポジトリをダウンロード（またはクローン）してフォルダを解凍します。
2. Google Chromeを開き、アドレスバーに `chrome://extensions/` と入力して拡張機能管理ページを開きます。
3. 画面右上の **デベロッパー モード** のスイッチをオンにします。
4. 左上の **パッケージ化されていない拡張機能を読み込む** をクリックし、解凍したフォルダを選択します。

### 使い方
1. ブラウザ右上の拡張機能アイコンをクリックして設定画面を開きます。
2. トリガーとなるクリック操作、アスペクト比、サイズ、角丸の割合などを用途に合わせて設定します。
3. ウェブサイト上の画像にカーソルを合わせ、設定した操作（例：ダブル右クリック）を行います。
4. 画像が自動的に切り抜かれ、PNG形式でダウンロードディレクトリに保存されます。
```
