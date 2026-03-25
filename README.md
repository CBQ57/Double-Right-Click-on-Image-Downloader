# iOS Icon Downloader (Double Click on Image DL)

[English](#english) | [日本語](#japanese)

---

<a id="english"></a>
## English

### Overview
A Chrome extension that allows you to easily download images from websites with customized aspect ratios, sizes, and border radii. Originally designed to download images as iOS-style app icons, it has evolved to support various formats like SNS round icons, square crops, and standard aspect ratios.

### Features
*   **Two Ways to Download**:
    *   **Double Right-Click**: Instantly download using your saved settings (default: 1:1 with 22.5% radius).
    *   **Context Menu**: Right-click an image > "Download Image" > Select a specific ratio (Original, 1:1, 4:3, 3:4, 16:9, 9:16) to process and download on the fly.
*   **Flexible Cropping & Styling**:
    *   Current Presets: 1:1 (iOS/SNS/Square), 4:3, 3:4, 16:9, 9:16, and Original.
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
1.  **Preparation**: Click the extension icon in the toolbar to configure your preferred default settings (aspect ratio, base size, corner radius).
2.  **Quick Download**: Hover over an image and **Double Right-Click**. The image will be processed with your saved settings and downloaded as a PNG.
3.  **Specific Ratio Download**: Right-click an image, hover over **"Download Image"**, and select your desired aspect ratio from the sub-menu.

---

<a id="japanese"></a>
## 日本語

### 概要
ウェブ上の画像を、指定したアスペクト比・サイズ・角丸で簡単にダウンロードできるChrome拡張機能です。元々は画像をiPhoneなどのiOSアプリアイコン風に保存する用途で作成されましたが、現在ではSNS用の丸アイコンや任意の縦横比（16:9など）での切り抜きにも対応した汎用的な画像ダウンローダーとなっています。

### 主な機能
*   **2通りのダウンロード方法**:
    *   **ダブル右クリック**: ポップアップで保存した設定（比率・サイズ・角丸）で即座にダウンロードします。
    *   **コンテキストメニュー**: 画像を右クリック > 「画像をダウンロード」から、その場でアスペクト比（オリジナル、1:1、4:3、3:4、16:9、9:16）を選択してダウンロードできます。
*   **多彩な切り抜きフォーマット**:
    *   プリセット: 1:1 (iOS/SNS/正方形), 4:3, 3:4, 16:9, 9:16, オリジナル。
*   **サイズ指定**: 長辺のピクセル数を自由に指定、または元の画像サイズのまま保存可能です。
*   **自由な角丸設定**: 画像の角丸を0〜50%の間で手動・自由に調整可能です。
*   **幅広い画像要素に対応**: 通常の `<img>` 要素にくわえ、`<picture>`、CSSの `background-image`、`<video>` のポスター画像、`<canvas>`、SVGの `<image>` からも画像を抽出できます。
*   **視覚的なフィードバック**: ダウンロード時に画像が光るエフェクトと、状態を知らせる通知を表示します。
*   **多言語対応**: 設定画面は日本語・英語の表示に対応しています。

### インストール方法
1. このリポジトリをダウンロード（またはクローン）してフォルダを解凍します。
2. Google Chromeを開き、アドレスバーに `chrome://extensions/` と入力して拡張機能管理ページを開きます。
3. 画面右上の **デベロッパー モード** のスイッチをオンにします。
4. 左上の **パッケージ化されていない拡張機能を読み込む** をクリックし、解凍したフォルダを選択します。

### 使い方
1.  **事前設定**: ブラウザ右上の拡張機能アイコンをクリックし、デフォルトの比率やサイズ、角丸を設定します。
2.  **クイックダウンロード**: 画像にカーソルを合わせ、**ダブル右クリック**をします。現在の設定で自動処理され、PNGとして保存されます。
3.  **比率を指定してダウンロード**: 画像を右クリックし、メニューの**「画像をダウンロード」**から希望の比率を選択します。
