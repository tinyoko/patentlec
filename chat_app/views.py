from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import requests
import re
import os

def index(request):
    return render(request, 'chat_app/index.html')

@csrf_exempt
def chat_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            query = data.get('query', '')
            
            # Dify APIの設定
            api_key = os.getenv('DIFY_API_KEY')
            url = os.getenv('DIFY_API_URL', 'https://djartipy.com/v1/workflows/run')
            
            if not api_key:
                return JsonResponse({"error": "DIFY_API_KEYが設定されていません"}, status=500)
            
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            # Dify APIへのリクエスト
            api_data = {
                "inputs": {"query": query},
                "response_mode": "blocking",
                "user": "web-user"
            }
            
            response = requests.post(url, headers=headers, json=api_data)
            result = response.json()
            
            # レスポンスから回答を取得
            response_text = result['data']['outputs']['output']
            
            # 参考箇所の時間情報を抽出（1-2桁の分に対応）
            time_pattern = r'参考箇所: \[(\d{1,2}:\d{2})-(\d{1,2}:\d{2})\]'
            time_match = re.search(time_pattern, response_text)
            
            response_data = {
                "response_text": response_text
            }
            
            if time_match:
                start_time_str = time_match.group(1)
                end_time_str = time_match.group(2)
                
                # MM:SS形式を秒に変換
                def time_to_seconds(time_str):
                    minutes, seconds = map(int, time_str.split(':'))
                    return minutes * 60 + seconds
                
                response_data["start_time"] = time_to_seconds(start_time_str)
                response_data["end_time"] = time_to_seconds(end_time_str)
            
            return JsonResponse(response_data)
        
        except Exception as e:
            return JsonResponse({"error": f"エラーが発生しました: {str(e)}"}, status=500)
    
    return JsonResponse({"error": "POSTリクエストが必要です"}, status=405)
