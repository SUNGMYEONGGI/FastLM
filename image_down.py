import requests
import os

# static/images 디렉토리가 없다면 생성
os.makedirs('static/images', exist_ok=True)

# 이미지 URL
logo_url = "https://media.fastcampus.co.kr/wp-content/uploads/2021/02/1_fastcampus_logo_positive_horizontal1_eng@2x.png"

# 이미지 다운로드
response = requests.get(logo_url)
if response.status_code == 200:
    # 이미지를 logo.png로 저장
    with open('static/images/logo.png', 'wb') as f:
        f.write(response.content)
    print("로고 이미지가 성공적으로 다운로드되었습니다.")
else:
    print("이미지 다운로드 실패")