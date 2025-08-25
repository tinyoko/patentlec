# 特許制度学習アプリ

Django フレームワークを使用した特許制度インタラクティブ学習アプリケーション。音声プレイヤーとAIチャットボットが連携して、効率的な学習体験を提供します。

## 🎯 主要機能

### 🎵 音声プレイヤー（左側）
- **Wavesurfer.js** による波形表示
- ドラッグによる再生区間指定・ハイライト表示
- 区間ループ再生機能
- 直感的な再生/一時停止・再開操作

### 💬 AIチャットボット（右側）
- **Dify API** 連携による特許制度Q&A
- 回答に含まれる時間情報の自動解析
- 音声プレイヤーとの自動連携

### 🔗 連携機能
- チャット回答の時間情報を音声区間に自動反映
- 複数質問での区間自動更新
- 自動シーク・ハイライト機能

## 🚀 セットアップ手順

### 1. リポジトリのクローン
```bash
git clone https://github.com/tinyoko/patentlec.git
cd patentlec
```

### 2. Python仮想環境の作成とアクティベート
```bash
python -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows
venv\\Scripts\\activate
```

### 3. 依存関係のインストール
```bash
pip install -r requirements.txt
```

### 4. 環境変数の設定
```bash
# .env.example をコピーして .env ファイルを作成
cp .env.example .env

# .env ファイルを編集して必要な設定を入力
```

**.env** ファイルの設定例：
```env
# Django設定
SECRET_KEY=your-secret-key-here
DEBUG=True

# Dify API設定
DIFY_API_URL=https://djartipy.com/v1/workflows/run
DIFY_API_KEY=your-dify-api-key-here

# データベース設定
DATABASE_URL=sqlite:///db.sqlite3
```

### 5. 音声ファイルの配置
講義音声ファイル（`lecture.mp3`）を以下の場所に配置してください：
```
chat_app/static/chat_app/lecture.mp3
```

### 6. データベースのマイグレーション
```bash
python manage.py migrate
```

### 7. 開発サーバーの起動
```bash
python manage.py runserver 127.0.0.1:8001
```

アプリケーションは http://127.0.0.1:8001/ でアクセスできます。

## 📁 プロジェクト構成

```
django_dify_chat/
├── manage.py                    # Django管理コマンド
├── requirements.txt             # Python依存関係
├── .env                        # 環境変数（要設定）
├── .env.example               # 環境変数テンプレート
├── .gitignore                 # Git除外ファイル
├── README.md                  # このファイル
├── django_dify_chat/          # Djangoプロジェクト設定
│   ├── settings.py           # Django設定
│   ├── urls.py              # URLルーティング
│   └── wsgi.py              # WSGIアプリケーション
└── chat_app/                  # メインアプリケーション
    ├── views.py              # ビューロジック
    ├── urls.py              # アプリURLs
    ├── static/chat_app/     # 静的ファイル
    │   ├── main.js         # JavaScript
    │   ├── styles.css      # スタイルシート
    │   └── lecture.mp3     # 音声ファイル（要配置）
    └── templates/chat_app/  # テンプレート
        └── index.html      # メインページ
```

## 🛠 技術仕様

### バックエンド
- **Django 5.2.5** - Webフレームワーク
- **Python 3.13** - プログラミング言語
- **SQLite** - データベース（開発環境）

### フロントエンド
- **Wavesurfer.js 6.6.4** - 音声可視化
- **Vanilla JavaScript** - フロントエンドロジック
- **CSS3** - スタイリング

### API連携
- **Dify API** - AIチャットボット機能
- **requests** - HTTP通信

## 🎮 操作方法

### 音声プレイヤー操作

**再生ボタン**：
- ポインタがリージョン内: リージョン最初から再生
- ポインタがリージョン外/なし: 音声先頭から再生

**一時停止・再開ボタン**：
- 再生中: 現在位置で一時停止
- 停止中: 現在位置から再生再開

**リージョン（区間）操作**：
- ドラッグで区間選択
- クリックでシーク（再生状態維持）
- ループ再生チェックボックスで区間ループ

### チャットボット操作
1. 右側の入力欄に特許制度に関する質問を入力
2. 「送信」ボタンまたはEnterキーで送信
3. AI回答に時間情報が含まれる場合、自動的に音声プレイヤーに区間が作成される

## 🔧 開発者向け情報

### 環境変数
| 変数名 | 説明 | 必須 |
|--------|------|------|
| `SECRET_KEY` | Django秘密キー | ✓ |
| `DEBUG` | デバッグモード | - |
| `DIFY_API_URL` | Dify APIエンドポイント | ✓ |
| `DIFY_API_KEY` | Dify APIキー | ✓ |

### 時間情報抽出
AIの回答から以下の正規表現パターンで時間情報を抽出：
```python
time_pattern = r'参考箇所: \[(\d{1,2}:\d{2})-(\d{1,2}:\d{2})\]'
```

例：`参考箇所: [4:44-5:33]` → 4分44秒から5分33秒の区間

### APIエンドポイント
- `GET /` - メインページ
- `POST /chat/` - チャットAPI

## 🐛 トラブルシューティング

### 音声ファイルが読み込まれない
- `chat_app/static/chat_app/lecture.mp3` に音声ファイルが配置されているか確認
- ファイル形式が対応形式（MP3）であることを確認

### チャットボットが応答しない
- `.env` ファイルで `DIFY_API_KEY` が正しく設定されているか確認
- Dify APIサービスが利用可能であることを確認

### 環境変数が読み込まれない
- `.env` ファイルがプロジェクトルートに配置されているか確認
- `python-dotenv` がインストールされているか確認

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 コントリビューション

プルリクエストやイシューの投稿を歓迎します。大きな変更を行う前に、まずイシューを作成して議論することをお勧めします。

## 📞 サポート

質問や問題がある場合は、GitHubのIssuesページでお知らせください。