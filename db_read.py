import sqlite3
from tabulate import tabulate

conn = sqlite3.connect('certificates.db')
cursor = conn.cursor()

# 컬럼명 가져오기
cursor.execute('SELECT * FROM certificates')
columns = [description[0] for description in cursor.description]

# 전체 데이터 조회
rows = cursor.fetchall()

# 결과를 테이블 형식으로 예쁘게 출력
print(tabulate(rows, headers=columns, tablefmt='grid'))

conn.close()