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
    const lectureVideo = document.getElementById('lectureVideo');

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

        // 動画ファイルの読み込み
        wavesurfer.load('/video/lecture.mp4');

        // イベントリスナーの設定
        wavesurfer.on('ready', function() {
            console.log('Wavesurfer is ready');
            console.log('Duration:', wavesurfer.getDuration());
            console.log('Backend:', wavesurfer.backend);
        });

        // Wavesurferの再生位置変更時にビデオも同期
        wavesurfer.on('seek', function(progress) {
            const currentTime = progress * wavesurfer.getDuration();
            const wsCurrentTime = wavesurfer.getCurrentTime();
            console.log('=== WAVESURFER SEEK EVENT ===');
            console.log('Seek progress:', progress);
            console.log('Calculated time:', currentTime);
            console.log('Wavesurfer getCurrentTime():', wsCurrentTime);
            console.log('Wavesurfer duration:', wavesurfer.getDuration());
            
            // 複数の同期アプローチを試行
            if (lectureVideo && lectureVideo.readyState >= 1) {
                // 即座に同期
                lectureVideo.currentTime = currentTime;
                console.log('Immediate video sync to:', currentTime);
                
                // 少し遅延してから再度確認・同期
                setTimeout(() => {
                    const actualWsTime = wavesurfer.getCurrentTime();
                    if (Math.abs(lectureVideo.currentTime - actualWsTime) > 0.3) {
                        console.log('Re-syncing video. WS:', actualWsTime, 'Video:', lectureVideo.currentTime);
                        lectureVideo.currentTime = actualWsTime;
                    }
                }, 100);
                
                // さらに遅延して最終確認
                setTimeout(() => {
                    const finalWsTime = wavesurfer.getCurrentTime();
                    const finalVidTime = lectureVideo.currentTime;
                    console.log('Final sync check - WS:', finalWsTime, 'Video:', finalVidTime);
                    if (Math.abs(finalVidTime - finalWsTime) > 0.3) {
                        console.log('Final correction needed');
                        lectureVideo.currentTime = finalWsTime;
                    }
                }, 200);
            }
        });

        // Wavesurfer再生時にビデオも再生
        wavesurfer.on('play', function() {
            console.log('Wavesurfer play - syncing video');
            if (lectureVideo && lectureVideo.readyState >= 1) {
                // 現在の時間に同期してから再生
                const currentTime = wavesurfer.getCurrentTime();
                console.log('Syncing video to wavesurfer time:', currentTime);
                
                // 動画時間を強制的に同期
                lectureVideo.currentTime = currentTime;
                
                if (lectureVideo.paused) {
                    lectureVideo.play().catch(e => console.log('Video play error:', e));
                }
                
                // 同期確認
                setTimeout(() => {
                    console.log('After sync - Wavesurfer time:', wavesurfer.getCurrentTime());
                    console.log('After sync - Video time:', lectureVideo.currentTime);
                }, 100);
            }
        });

        // Wavesurfer一時停止時にビデオも一時停止
        wavesurfer.on('pause', function() {
            console.log('Wavesurfer pause - pausing video');
            if (lectureVideo && !lectureVideo.paused) {
                lectureVideo.pause();
            }
        });

        // 再生完了時のイベント
        wavesurfer.on('finish', function() {
            console.log('Playback finished');
            if (loopCheckbox.checked && currentRegion) {
                console.log('Looping to region start:', currentRegion.start);
                wavesurfer.seekTo(currentRegion.start / wavesurfer.getDuration());
                syncVideoWithWavesurfer(currentRegion.start);
                wavesurfer.play();
            }
        });

        // 再生位置の監視（ループ再生のため）
        let monitoringInterval;
        wavesurfer.on('play', function() {
            console.log('Wavesurfer play event fired');
            if (monitoringInterval) clearInterval(monitoringInterval);
            
            // 再生中の継続的な同期処理
            monitoringInterval = setInterval(function() {
                if (wavesurfer.isPlaying() && lectureVideo && lectureVideo.readyState >= 1) {
                    const wsTime = wavesurfer.getCurrentTime();
                    const vidTime = lectureVideo.currentTime;
                    
                    // 時間のズレが0.5秒以上の場合は同期
                    if (Math.abs(wsTime - vidTime) > 0.5) {
                        console.log('Sync drift detected - WS:', wsTime, 'Video:', vidTime);
                        lectureVideo.currentTime = wsTime;
                    }
                    
                    // ループ処理
                    if (currentRegion && loopCheckbox.checked && wsTime >= currentRegion.end) {
                        console.log('Loop: Seeking from', wsTime, 'to', currentRegion.start);
                        wavesurfer.seekTo(currentRegion.start / wavesurfer.getDuration());
                        syncVideoWithWavesurfer(currentRegion.start);
                    }
                }
            }, 200); // 200ms間隔で監視
        });
        
        wavesurfer.on('pause', function() {
            if (monitoringInterval) {
                clearInterval(monitoringInterval);
                monitoringInterval = null;
            }
        });
        
        // Fallback: audioprocess event for audio files
        wavesurfer.on('audioprocess', function() {
            if (currentRegion && loopCheckbox.checked && wavesurfer.isPlaying()) {
                const currentTime = wavesurfer.getCurrentTime();
                if (currentTime >= currentRegion.end) {
                    wavesurfer.seekTo(currentRegion.start / wavesurfer.getDuration());
                    syncVideoWithWavesurfer(currentRegion.start);
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
            console.log('Region clicked:', region);
            // 現在の再生状態を記録
            const wasPlaying = wavesurfer.isPlaying();
            
            // クリックされた位置にシークするだけ（自動再生しない）
            const clickX = e.layerX / e.target.offsetWidth;
            const seekTime = clickX * wavesurfer.getDuration();
            console.log('Seeking to time:', seekTime);
            
            wavesurfer.seekTo(clickX);
            syncVideoWithWavesurfer(seekTime);
            
            // 元々再生中だった場合のみ再生を継続
            if (wasPlaying) {
                wavesurfer.play();
            }
        });

        // 波形クリックでシーク、ダブルクリックで新しいリージョン作成
        let clickTimeout;
        wavesurfer.on('click', function(relativeX) {
            console.log('=== WAVESURFER CLICK EVENT ===');
            console.log('RelativeX:', relativeX);
            
            if (wavesurfer.isReady) {
                if (clickTimeout) {
                    // ダブルクリック: リージョン作成
                    console.log('Double click detected - creating region');
                    clearTimeout(clickTimeout);
                    clickTimeout = null;
                    
                    const duration = wavesurfer.getDuration();
                    const startTime = relativeX * duration;
                    const endTime = Math.min(startTime + 30, duration);
                    console.log('Creating region:', startTime, 'to', endTime);
                    
                    createRegion(startTime, endTime);
                } else {
                    // シングルクリック: シーク（遅延実行で判定）
                    clickTimeout = setTimeout(() => {
                        console.log('Single click confirmed - seeking');
                        const wasPlaying = wavesurfer.isPlaying();
                        const seekTime = relativeX * wavesurfer.getDuration();
                        
                        console.log('Was playing:', wasPlaying);
                        console.log('Seek target time:', seekTime);
                        console.log('Before seek - Wavesurfer time:', wavesurfer.getCurrentTime());
                        console.log('Before seek - Video time:', lectureVideo.currentTime);
                        
                        // 動画を先に目標時間に設定（Wavesurferより先に）
                        if (lectureVideo && lectureVideo.readyState >= 1) {
                            console.log('Setting video time BEFORE wavesurfer seek:', seekTime);
                            lectureVideo.currentTime = seekTime;
                            console.log('Video time immediately after setting:', lectureVideo.currentTime);
                        }
                        
                        // その後でWavesurferのシーク
                        wavesurfer.seekTo(relativeX);
                        
                        // 複数回の確認・修正
                        setTimeout(() => {
                            if (lectureVideo && lectureVideo.readyState >= 1) {
                                const actualWsTime = wavesurfer.getCurrentTime();
                                const actualVidTime = lectureVideo.currentTime;
                                console.log('First check - WS:', actualWsTime, 'Video:', actualVidTime);
                                
                                if (Math.abs(actualVidTime - actualWsTime) > 0.5) {
                                    console.log('First correction needed - setting video to:', actualWsTime);
                                    lectureVideo.currentTime = actualWsTime;
                                }
                            }
                        }, 100);
                        
                        setTimeout(() => {
                            if (lectureVideo && lectureVideo.readyState >= 1) {
                                const finalWsTime = wavesurfer.getCurrentTime();
                                const finalVidTime = lectureVideo.currentTime;
                                console.log('Final check - WS:', finalWsTime, 'Video:', finalVidTime);
                                
                                if (Math.abs(finalVidTime - finalWsTime) > 0.5) {
                                    console.log('Final correction needed - setting video to:', finalWsTime);
                                    lectureVideo.currentTime = finalWsTime;
                                    
                                    // 最終手段: seeking/seekedイベントを強制発火
                                    lectureVideo.dispatchEvent(new Event('seeking'));
                                    setTimeout(() => {
                                        lectureVideo.dispatchEvent(new Event('seeked'));
                                    }, 10);
                                }
                            }
                        }, 300);
                        
                        // 再生状態の復元
                        if (wasPlaying) {
                            setTimeout(() => {
                                wavesurfer.play();
                            }, 400);
                        }
                        
                        clickTimeout = null;
                    }, 300);
                }
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

    // ビデオとWavesurferの同期関数
    function syncVideoWithWavesurfer(time) {
        if (!lectureVideo || isNaN(time)) {
            console.log('syncVideoWithWavesurfer: Invalid parameters', { lectureVideo: !!lectureVideo, time });
            return;
        }
        
        console.log('=== SYNC VIDEO WITH WAVESURFER ===');
        console.log('Target time:', time);
        console.log('Video current time before sync:', lectureVideo.currentTime);
        console.log('Video readyState:', lectureVideo.readyState);
        console.log('Video duration:', lectureVideo.duration);
        console.log('Video paused:', lectureVideo.paused);
        
        // より強力な時間設定関数
        function forceSetVideoTime(targetTime) {
            try {
                console.log('Force setting video time to:', targetTime);
                
                // 方法1: 直接設定
                lectureVideo.currentTime = targetTime;
                
                // 方法2: 一時的に再生/停止（ブラウザに時間変更を強制認識させる）
                const wasPlaying = !lectureVideo.paused;
                if (!wasPlaying) {
                    lectureVideo.play().then(() => {
                        lectureVideo.currentTime = targetTime;
                        lectureVideo.pause();
                    }).catch(() => {
                        lectureVideo.currentTime = targetTime;
                    });
                } else {
                    lectureVideo.currentTime = targetTime;
                }
                
                // 複数回の確認と再設定
                const checkAndRetry = (attempt) => {
                    setTimeout(() => {
                        console.log(`Video time check attempt ${attempt}:`, lectureVideo.currentTime);
                        if (Math.abs(lectureVideo.currentTime - targetTime) > 0.3 && attempt < 3) {
                            console.log(`Retry ${attempt}: setting video time to`, targetTime);
                            lectureVideo.currentTime = targetTime;
                            checkAndRetry(attempt + 1);
                        }
                        updateVideoDebugInfo();
                    }, 50 * attempt);
                };
                
                checkAndRetry(1);
                
            } catch (error) {
                console.error('Error in forceSetVideoTime:', error);
            }
        }
        
        if (lectureVideo.readyState >= 1) {
            // メタデータが読み込まれている場合
            forceSetVideoTime(time);
        } else {
            // メタデータが読み込まれていない場合
            console.log('Video not ready, waiting for loadedmetadata');
            lectureVideo.addEventListener('loadedmetadata', function() {
                console.log('Video metadata loaded, setting time to:', time);
                forceSetVideoTime(time);
            }, { once: true });
            
            // フォールバック
            setTimeout(() => {
                if (lectureVideo.readyState >= 1) {
                    console.log('Fallback: trying to set time after delay');
                    forceSetVideoTime(time);
                }
            }, 1000);
        }
    }

    // 再生ボタンの処理（ポインタ位置に応じて動作変更）
    playButton.addEventListener('click', function() {
        console.log('Play button clicked');
        if (wavesurfer && wavesurfer.isReady) {
            const currentTime = wavesurfer.getCurrentTime();
            console.log('Current time:', currentTime);
            console.log('Current region:', currentRegion);
            console.log('Is in region:', isCurrentPositionInRegion());
            
            if (currentRegion && isCurrentPositionInRegion()) {
                // ポインタがリージョン内にある場合：リージョンの最初から再生
                console.log('Playing from region start:', currentRegion.start);
                wavesurfer.seekTo(currentRegion.start / wavesurfer.getDuration());
                syncVideoWithWavesurfer(currentRegion.start);
            } else {
                // ポインタがリージョン外にある場合（またはリージョンがない場合）：先頭から再生
                console.log('Playing from beginning');
                wavesurfer.seekTo(0);
                syncVideoWithWavesurfer(0);
            }
            wavesurfer.play();
        }
    });

    // 一時停止・再開ボタンの処理
    pauseButton.addEventListener('click', function() {
        console.log('=== PAUSE/RESUME BUTTON CLICKED ===');
        if (wavesurfer && wavesurfer.isReady) {
            const isPlaying = wavesurfer.isPlaying();
            const currentTime = wavesurfer.getCurrentTime();
            const duration = wavesurfer.getDuration();
            
            console.log('Currently playing:', isPlaying);
            console.log('Current time:', currentTime);
            console.log('Duration:', duration);
            console.log('Current region:', currentRegion);
            console.log('Is in region:', currentRegion ? isCurrentPositionInRegion() : 'No region');
            
            if (isPlaying) {
                // 再生中の場合：一時停止
                console.log('PAUSING playback at position:', currentTime);
                wavesurfer.pause();
            } else {
                // 停止中の場合：現在位置から再生再開
                console.log('RESUMING playback from position:', currentTime);
                console.log('Video currentTime before resume:', lectureVideo ? lectureVideo.currentTime : 'No video');
                
                // 動画を現在位置に同期してから再生
                if (lectureVideo && lectureVideo.readyState >= 1) {
                    lectureVideo.currentTime = currentTime;
                    console.log('Video synced to:', currentTime);
                }
                
                // Wavesurferから再生開始（シークせずに現在位置から）
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
                                syncVideoWithWavesurfer(data.start_time);
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

    // 動画要素の詳細な状態調査
    if (lectureVideo) {
        console.log('=== VIDEO ELEMENT INVESTIGATION ===');
        console.log('Video element exists:', !!lectureVideo);
        console.log('Video src:', lectureVideo.src);
        console.log('Video readyState:', lectureVideo.readyState);
        console.log('Video duration:', lectureVideo.duration);
        console.log('Video currentTime:', lectureVideo.currentTime);
        console.log('Video paused:', lectureVideo.paused);
        console.log('Video muted:', lectureVideo.muted);
        console.log('Video preload:', lectureVideo.preload);
        console.log('Video networkState:', lectureVideo.networkState);
        console.log('Video buffered ranges:', lectureVideo.buffered.length);
        console.log('Video videoWidth:', lectureVideo.videoWidth);
        console.log('Video videoHeight:', lectureVideo.videoHeight);
        
        // ネットワーク状態の詳細
        const networkStates = {
            0: 'NETWORK_EMPTY',
            1: 'NETWORK_IDLE', 
            2: 'NETWORK_LOADING',
            3: 'NETWORK_NO_SOURCE'
        };
        console.log('Network state meaning:', networkStates[lectureVideo.networkState]);
        
        // Ready state の詳細
        const readyStates = {
            0: 'HAVE_NOTHING',
            1: 'HAVE_METADATA',
            2: 'HAVE_CURRENT_DATA',
            3: 'HAVE_FUTURE_DATA',
            4: 'HAVE_ENOUGH_DATA'
        };
        console.log('Ready state meaning:', readyStates[lectureVideo.readyState]);
        
        // 右クリックメニューのみ無効化
        lectureVideo.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
        
        // 動画の状態変化を詳細ログ
        lectureVideo.addEventListener('loadstart', () => console.log('Video: loadstart'));
        lectureVideo.addEventListener('loadedmetadata', function() {
            console.log('Video: loadedmetadata - duration:', lectureVideo.duration);
            console.log('Video readyState after metadata:', lectureVideo.readyState);
            console.log('Video dimensions:', lectureVideo.videoWidth, 'x', lectureVideo.videoHeight);
        });
        lectureVideo.addEventListener('loadeddata', () => console.log('Video: loadeddata'));
        lectureVideo.addEventListener('canplay', () => {
            console.log('Video: canplay');
            console.log('Video is now ready for seeking');
        });
        lectureVideo.addEventListener('canplaythrough', () => console.log('Video: canplaythrough'));
        lectureVideo.addEventListener('error', (e) => {
            console.error('Video error:', e);
            console.error('Video error code:', lectureVideo.error?.code);
            console.error('Video error message:', lectureVideo.error?.message);
        });
        lectureVideo.addEventListener('stalled', () => console.log('Video: stalled'));
        lectureVideo.addEventListener('waiting', () => console.log('Video: waiting'));
        lectureVideo.addEventListener('progress', () => {
            if (lectureVideo.buffered.length > 0) {
                console.log('Video: progress - buffered:', lectureVideo.buffered.end(0));
            }
        });
        
        // 強制的に動画をロード
        console.log('Forcing video load...');
        lectureVideo.load();
        
        // 動画の独立操作を完全に無効化
        lectureVideo.addEventListener('play', function(e) {
            console.log('Video play event detected - checking if initiated by wavesurfer');
            // Wavesurferから来ていない場合は停止
            if (!wavesurfer.isPlaying()) {
                console.log('Video play not from wavesurfer - pausing');
                lectureVideo.pause();
            }
        });
        
        lectureVideo.addEventListener('pause', function(e) {
            console.log('Video pause event detected - checking if initiated by wavesurfer');
            // Wavesurferが再生中なのに動画が停止された場合は再開
            if (wavesurfer.isPlaying()) {
                console.log('Video paused while wavesurfer playing - resuming');
                lectureVideo.play().catch(e => console.log('Resume error:', e));
            }
        });
        
        lectureVideo.addEventListener('seeked', function(e) {
            console.log('Video seeked to:', lectureVideo.currentTime);
            console.log('Wavesurfer time:', wavesurfer.getCurrentTime());
            // 大きなズレがある場合はWavesurferに合わせる
            if (Math.abs(lectureVideo.currentTime - wavesurfer.getCurrentTime()) > 1) {
                console.log('Large time difference detected - syncing to wavesurfer');
                lectureVideo.currentTime = wavesurfer.getCurrentTime();
            }
        });
        
        lectureVideo.addEventListener('seeking', () => console.log('Video: seeking to', lectureVideo.currentTime));
        
        // 時間更新ログを制限（毎秒1回程度）
        let lastLogTime = 0;
        lectureVideo.addEventListener('timeupdate', function() {
            const now = Date.now();
            if (now - lastLogTime > 1000) {
                console.log('Video time updated:', lectureVideo.currentTime);
                lastLogTime = now;
            }
        });
    }


    // 初期化実行
    initWavesurfer();

    // 初期メッセージを表示
    addMessageToChat('特許制度について質問してください。関連する講義音声の箇所も自動的に表示されます。', false);
});