# Django特許制度学習アプリ開発指示書 (改訂版 3)

## プロジェクト概要

Djangoフレームワークを使用した特許制度インタラクティブ学習アプリケーション。
左右2分割の単一ページアプリで、音声プレイヤーとAI チャットボットが完全に連携。

## 🎯 最新の達成状況

### ✅ 完全実装済み機能

1. **左側：講義音声プレイヤー（Wavesurfer.js）**
   - `lecture.mp3`の波形表示と自動ロード
   - ドラッグによる再生区間指定・ハイライト表示
   - 区間ループ再生機能
   - 分離された再生ボタンと一時停止・再開ボタン
   - 直感的な操作性とポインタ位置ベースの動作制御

2. **右側：特許制度チャットボット（Dify API連携）**
   - 特許制度Q&A機能
   - 回答に含まれる時間情報の自動解析
   - 音声プレイヤーとの自動連携
   - 美しいチャットUI（左右配置メッセージ）

3. **連携機能**
   - チャット回答の時間情報を音声区間に自動反映
   - 複数質問での区間更新機能
   - 自動シーク・ハイライト機能
   - 完璧な時間情報抽出（1-2桁分対応）

4. **🎨 モダンデザインシステム**
   - CSS変数による統一デザインシステム
   - 完璧な左右分割レイアウト（CSS Grid）
   - 洗練されたボタンデザイン（ホバーエフェクト付き）
   - 美しいカードデザイン（シャドウ・角丸）
   - チャットメッセージの左右配置
   - レスポンシブデザイン完全対応

## 🛠 技術仕様

### バックエンド
- **Django 5.2.5** - Webフレームワーク
- **Python 3.13** - プログラミング言語
- **SQLite** - データベース（開発環境）
- **python-dotenv 1.1.1** - 環境変数管理

### フロントエンド
- **Wavesurfer.js 6.6.4** - 音声可視化
- **Vanilla JavaScript** - フロントエンドロジック
- **CSS3** - モダンデザインシステム

### API・セキュリティ
- **Dify API** - AIチャットボット機能
- **requests** - HTTP通信
- **環境変数管理** - APIキーの安全な管理

## 📁 プロジェクト構造

```
django_dify_chat/
├── manage.py                    # Django管理コマンド
├── requirements.txt             # Python依存関係
├── .env                        # 環境変数（Git除外）
├── .env.example               # 環境変数テンプレート
├── .gitignore                 # Git除外ファイル
├── README.md                  # プロジェクトドキュメント
├── instruction_3.md           # 最新仕様書（このファイル）
├── css_instruction_3.md       # 最新CSSデザイン仕様
├── django_dify_chat/          # Djangoプロジェクト設定
│   ├── settings.py           # Django設定（環境変数対応）
│   ├── urls.py              # URLルーティング
│   └── wsgi.py              # WSGIアプリケーション
└── chat_app/                  # メインアプリケーション
    ├── views.py              # ビューロジック（Dify API連携）
    ├── urls.py              # アプリURLs
    ├── static/chat_app/     # 静的ファイル
    │   ├── main.js         # JavaScript（完全機能）
    │   ├── styles.css      # 外部CSS（参考用）
    │   └── lecture.mp3     # 音声ファイル
    └── templates/chat_app/  # テンプレート
        └── index.html      # メインページ（インラインCSS統合）
```

## 🎮 操作方法（完成版）

### 音声プレイヤー操作

**再生ボタン（青色）**：
- ポインタがリージョン内: リージョン最初から再生
- ポインタがリージョン外/なし: 音声先頭から再生

**一時停止・再開ボタン（赤色）**：
- 再生中: 現在位置で一時停止
- 停止中: 現在位置から再生再開

**リージョン（区間）操作**：
- ドラッグで区間選択
- クリックでシーク（再生状態維持）
- ループ再生チェックボックスで区間ループ

**時間表示**：
- 美しいグリッドレイアウト
- モノスペースフォントで見やすく表示

### チャットボット操作
1. 右側の入力欄に特許制度に関する質問を入力
2. 「送信」ボタン（緑色グラデーション）またはEnterキーで送信
3. AI回答に時間情報が含まれる場合、自動的に音声プレイヤーに区間が作成される
4. チャットメッセージは左右に美しく配置される

## 🔧 開発環境設定

### 環境変数
| 変数名 | 説明 | 必須 | デフォルト値 |
|--------|------|------|-------------|
| `SECRET_KEY` | Django秘密キー | ✓ | 開発用キー |
| `DEBUG` | デバッグモード | - | True |
| `DIFY_API_URL` | Dify APIエンドポイント | ✓ | https://djartipy.com/v1/workflows/run |
| `DIFY_API_KEY` | Dify APIキー | ✓ | - |

### セットアップ手順
```bash
# リポジトリクローン
git clone https://github.com/tinyoko/patentlec.git
cd patentlec

# Python仮想環境
python -m venv venv
source venv/bin/activate  # macOS/Linux

# 依存関係インストール
pip install -r requirements.txt

# 環境変数設定
cp .env.example .env
# .env ファイルを編集してAPIキー等を設定

# 音声ファイル配置
# chat_app/static/chat_app/lecture.mp3 に音声ファイルを配置

# データベース初期化
python manage.py migrate

# 開発サーバー起動
python manage.py runserver 127.0.0.1:8001
```

## 📊 技術的詳細

### 時間情報抽出
```python
# 1-2桁分対応の正規表現パターン
time_pattern = r'参考箇所: \[(\d{1,2}:\d{2})-(\d{1,2}:\d{2})\]'

# 時間変換関数
def time_to_seconds(time_str):
    minutes, seconds = map(int, time_str.split(':'))
    return minutes * 60 + seconds
```

### リージョン管理
```javascript
// リージョンクリック時の動作（再生状態維持）
wavesurfer.on('region-click', function(region, e) {
    const wasPlaying = wavesurfer.isPlaying();
    const clickX = e.layerX / e.target.offsetWidth;
    wavesurfer.seekTo(clickX);
    if (wasPlaying) {
        wavesurfer.play();
    }
});
```

### ループ再生実装
```javascript
// audioprocessイベントでリアルタイム監視
wavesurfer.on('audioprocess', function() {
    if (currentRegion && loopCheckbox.checked && wavesurfer.isPlaying()) {
        const currentTime = wavesurfer.getCurrentTime();
        if (currentTime >= currentRegion.end) {
            wavesurfer.seekTo(currentRegion.start / wavesurfer.getDuration());
        }
    }
});
```

## 🎨 デザインシステム

### カラーパレット
- **プライマリ**: #3498db (青) - メインボタン、リンク
- **セカンダリ**: #e74c3c (赤) - 一時停止ボタン
- **成功**: #27ae60 (緑) - 送信ボタン
- **警告**: #f39c12 (オレンジ) - ローディング状態

### レスポンシブブレークポイント
- **デスクトップ (769px+)**: 左右分割レイアウト
- **タブレット (768px以下)**: 上下配置レイアウト
- **スマートフォン (575px以下)**: 単列レイアウト

### CSS実装方式
現在は**インラインCSS方式**を採用：
- 静的ファイル配信問題を回避
- キャッシュ問題なし
- すべてのスタイルが確実に適用される

## 🚀 パフォーマンス・セキュリティ

### セキュリティ機能
- ✅ APIキーの環境変数管理
- ✅ .gitignoreによる機密情報除外
- ✅ CSRF対応
- ✅ 適切なHTTPヘッダー設定

### パフォーマンス
- ✅ CDN配信のWavesurfer.js
- ✅ 効率的な時間情報抽出
- ✅ リアルタイム音声制御
- ✅ レスポンシブデザイン最適化

## 📋 動作確認済み項目

### ✅ 基本機能
- [x] 音声ファイル自動ロード・波形表示
- [x] チャットボット質問応答
- [x] 時間情報自動抽出・区間作成
- [x] 区間ハイライト表示

### ✅ 高度な音声制御
- [x] 再生ボタン（条件別動作）
- [x] 一時停止・再開ボタン
- [x] ループ再生機能
- [x] 区間クリック時の適切な動作

### ✅ 連携機能
- [x] 複数質問での区間自動更新
- [x] 時間表示自動更新（MM:SS形式）
- [x] 自動シーク機能

### ✅ デザイン・UI
- [x] 完璧な左右分割レイアウト
- [x] モダンなボタンデザイン
- [x] 美しいチャットメッセージレイアウト
- [x] レスポンシブデザイン
- [x] ホバーエフェクト・アニメーション

## 🎯 開発状況

### ✅ 完了したフェーズ
1. **Phase 1**: 基本機能実装
2. **Phase 2**: 高度な音声制御
3. **Phase 3**: UI/UX改善
4. **Phase 4**: セキュリティ・環境設定
5. **Phase 5**: Git管理・ドキュメント
6. **Phase 6**: CSSデザイン完全実装

### 🔍 今後の改善可能性
- 静的ファイル配信問題の根本解決
- インラインCSSの外部ファイル化
- 追加的なアニメーション効果
- PWA対応
- モバイル最適化の更なる向上

## 📞 サポート・開発情報

**リポジトリ**: https://github.com/tinyoko/patentlec.git  
**開発環境**: Python 3.13, Django 5.2.5, Wavesurfer.js 6.6.4  
**最終更新**: 2025年8月25日  
**動作確認**: 完了（全機能・デザイン）  
**現在の状態**: 本番運用可能

---

**注意**: この指示書は完全に動作する本番レベルのアプリケーションの仕様書です。すべての機能が完璧に動作し、美しいデザインも適用されています。