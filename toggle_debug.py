import sqlite3
import sys

def toggle_debug():
    try:
        with open('app.py', 'r', encoding='utf-8') as file:
            lines = file.readlines()

        # 디버그 모드 라인 찾기
        for i, line in enumerate(lines):
            if 'app.debug' in line:
                # 현재 상태 확인
                current_state = 'True' if 'True' in line else 'False'
                new_state = 'True' if current_state == 'False' else 'False'
                
                # 라인 업데이트
                lines[i] = f"    app.debug = {new_state}\n"
                print(f"디버그 모드가 {current_state}에서 {new_state}로 변경되었습니다.")
                break

        # 파일 저장
        with open('app.py', 'w', encoding='utf-8') as file:
            file.writelines(lines)

        return True

    except Exception as e:
        print(f"오류 발생: {str(e)}")
        return False

if __name__ == "__main__":
    if toggle_debug():
        print("디버그 모드가 성공적으로 토글되었습니다.")
    else:
        print("디버그 모드 토글 실패") 