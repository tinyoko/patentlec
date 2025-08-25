document.addEventListener('DOMContentLoaded', function() {
    // Wavesurfer.jsの初期化
    let wavesurfer = null;
    let currentRegion = null;
    
    // DOM要素の取得
    const playButton = document.getElementById('playButton');
    const pauseButton = document.getElementById('pauseButton');
    const loopCheckbox = document.getElementById('loopCheckbox');
    const startTimeDisplay = document.getElementById('startTimeDisplay');
    const endTimeDisplay = document.getElementById('endTimeDisplay');
    const chatHistory = document.getElementById('chatHistory');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    // 時間を MM:SS 形式に変換
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Wavesurfer.jsの初期化
    function initWavesurfer() {
        wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#3498db',
            progressColor: '#2c3e50',
            cursorColor: '#e74c3c',
            height: 60,
            normalize: true,
            backend: 'WebAudio',
            interact: true,
            plugins: [
                WaveSurfer.regions.create({
                    regions: [],
                    dragSelection: {
                        slop: 5
                    }
                })
            ]
        });

        // 音声ファイルの読み込み
        wavesurfer.load('/static/chat_app/lecture.mp3');

        // イベントリスナーの設定
        wavesurfer.on('ready', function() {
            console.log('Wavesurfer is ready');
        });

        // 再生完了時のイベント
        wavesurfer.on('finish', function() {
            if (loopCheckbox.checked && currentRegion) {
                wavesurfer.seekTo(currentRegion.start / wavesurfer.getDuration());
                wavesurfer.play();
            }
        });

        // 再生位置の監視（ループ再生のため）
        wavesurfer.on('audioprocess', function() {
            if (currentRegion && loopCheckbox.checked && wavesurfer.isPlaying()) {
                const currentTime = wavesurfer.getCurrentTime();
                if (currentTime >= currentRegion.end) {
                    wavesurfer.seekTo(currentRegion.start / wavesurfer.getDuration());
                }
            }
        });

        // リージョン（区間）作成イベント
        wavesurfer.on('region-created', function(region) {
            currentRegion = region;
            updateTimeDisplay(region.start, region.end);
        });

        // リージョン更新イベント
        wavesurfer.on('region-update-end', function(region) {
            currentRegion = region;
            updateTimeDisplay(region.start, region.end);
        });

        // リージョンクリック時の動作（再生状態を維持）
        wavesurfer.on('region-click', function(region, e) {
            // 現在の再生状態を記録
            const wasPlaying = wavesurfer.isPlaying();
            
            // クリックされた位置にシークするだけ（自動再生しない）
            const clickX = e.layerX / e.target.offsetWidth;
            wavesurfer.seekTo(clickX);
            
            // 元々再生中だった場合のみ再生を継続
            if (wasPlaying) {
                wavesurfer.play();
            }
        });

        // 波形をダブルクリックで新しいリージョン作成
        wavesurfer.on('click', function(relativeX) {
            if (wavesurfer.isReady) {
                const duration = wavesurfer.getDuration();
                const startTime = relativeX * duration;
                const endTime = Math.min(startTime + 30, duration); // デフォルト30秒の区間
                
                createRegion(startTime, endTime);
            }
        });
    }

    // リージョンの作成
    function createRegion(start, end) {
        if (!wavesurfer || !wavesurfer.isReady) {
            console.error('Wavesurfer not ready for region creation');
            return;
        }
        
        // 既存のリージョンをクリア
        if (wavesurfer.regions) {
            wavesurfer.regions.clear();
        }
        
        // 新しいリージョンを作成
        const region = wavesurfer.addRegion({
            start: start,
            end: end,
            color: 'rgba(52, 152, 219, 0.3)',
            drag: true,
            resize: true
        });
        
        currentRegion = region;
        updateTimeDisplay(start, end);
    }

    // 時間表示の更新
    function updateTimeDisplay(start, end) {
        startTimeDisplay.textContent = formatTime(start);
        endTimeDisplay.textContent = formatTime(end);
    }

    // 現在のポインタ位置がリージョン内にあるかチェック
    function isCurrentPositionInRegion() {
        if (!currentRegion || !wavesurfer) return false;
        const currentTime = wavesurfer.getCurrentTime();
        return currentTime >= currentRegion.start && currentTime <= currentRegion.end;
    }

    // 再生ボタンの処理（ポインタ位置に応じて動作変更）
    playButton.addEventListener('click', function() {
        if (wavesurfer) {
            if (currentRegion && isCurrentPositionInRegion()) {
                // ポインタがリージョン内にある場合：リージョンの最初から再生
                wavesurfer.seekTo(currentRegion.start / wavesurfer.getDuration());
                wavesurfer.play();
            } else {
                // ポインタがリージョン外にある場合（またはリージョンがない場合）：先頭から再生
                wavesurfer.seekTo(0);
                wavesurfer.play();
            }
        }
    });

    // 一時停止・再開ボタンの処理
    pauseButton.addEventListener('click', function() {
        if (wavesurfer) {
            if (wavesurfer.isPlaying()) {
                // 再生中の場合：一時停止
                wavesurfer.pause();
            } else {
                // 停止中の場合：現在位置から再生再開
                wavesurfer.play();
            }
        }
    });

    // チャット機能
    function addMessageToChat(message, isUser = false, isLoading = false) {
        const messageDiv = document.createElement('div');
        
        if (isLoading) {
            messageDiv.className = 'loading-message';
        } else if (isUser) {
            messageDiv.className = 'user-message';
        } else {
            messageDiv.className = 'bot-message';
        }
        
        messageDiv.textContent = message;
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        
        return messageDiv;
    }

    // チャットメッセージ送信
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        // ユーザーメッセージを追加
        addMessageToChat(message, true);
        
        // 入力フィールドをクリア
        messageInput.value = '';
        
        // ローディングメッセージを表示
        const loadingMessage = addMessageToChat('回答を生成中...', false, true);

        try {
            // Django APIエンドポイントに送信
            const response = await fetch('/chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: message })
            });

            const data = await response.json();

            // ローディングメッセージを削除
            loadingMessage.remove();

            if (data.error) {
                addMessageToChat(`エラー: ${data.error}`, false);
            } else {
                // ボットの回答を表示
                addMessageToChat(data.response_text, false);

                // 時間情報がある場合は、リージョンを作成
                if (data.start_time !== undefined && data.end_time !== undefined) {
                    const createRegionWithRetry = (retryCount = 0) => {
                        if (wavesurfer && wavesurfer.isReady) {
                            createRegion(data.start_time, data.end_time);
                            
                            // 少し遅延を置いてから該当箇所にジャンプ
                            setTimeout(() => {
                                wavesurfer.seekTo(data.start_time / wavesurfer.getDuration());
                            }, 200);
                        } else if (retryCount < 10) {
                            setTimeout(() => createRegionWithRetry(retryCount + 1), 500);
                        }
                    };
                    
                    createRegionWithRetry();
                }
            }
        } catch (error) {
            loadingMessage.remove();
            addMessageToChat(`通信エラーが発生しました: ${error.message}`, false);
        }
    }

    // 送信ボタンのイベントリスナー
    sendButton.addEventListener('click', sendMessage);

    // Enterキーでメッセージ送信
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // 初期化実行
    initWavesurfer();

    // 初期メッセージを表示
    addMessageToChat('特許制度について質問してください。関連する講義音声の箇所も自動的に表示されます。', false);
});