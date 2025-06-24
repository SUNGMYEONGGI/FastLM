# Pull Request (PR) 작성법 가이드

## 📋 프로젝트 개발 환경
- **레포지토리**: 하나의 공유 레포지토리
- **개발자**: 2명 (콜라보레이터)
- **브랜치 전략**: 
  - `master` (메인 브랜치)
  - `Myeonggi` (명기 개발 브랜치)
  - `Gijun` (기준 개발 브랜치)
- **PR 규칙**: 다른 개발자의 승인 후 merge 가능

---

## 🖥️ Windows 환경에서 PR 작성하기

### 1. 개발 브랜치로 이동 및 최신 코드 동기화

```cmd
# 현재 브랜치 확인
git branch

# 개발 브랜치로 이동 (본인 브랜치: Myeonggi 또는 Gijun)
git checkout Myeonggi
# 또는
git checkout Gijun

# master 브랜치의 최신 코드를 가져와서 동기화
git fetch origin
git merge origin/master
```

### 2. 기능 개발 및 커밋

```cmd
# 파일 수정 후 변경사항 확인
git status

# 변경된 파일 스테이징
git add .
# 또는 특정 파일만
git add 파일명.확장자

# 커밋 (의미있는 커밋 메시지 작성)
git commit -m "feat: 새로운 기능 추가"
# 또는
git commit -m "fix: 버그 수정"
# 또는
git commit -m "docs: 문서 업데이트"
```

### 3. 원격 저장소에 푸시

```cmd
# 개발 브랜치를 원격 저장소에 푸시
git push origin Myeonggi
# 또는
git push origin Gijun
```

### 4. GitHub에서 PR 생성

1. **GitHub 웹사이트 접속** → 해당 레포지토리로 이동
2. **"Compare & pull request"** 버튼 클릭 (푸시 후 자동으로 나타남)
3. **PR 정보 작성**:
   - **Base**: `master` ← **Compare**: `Myeonggi` 또는 `Gijun`
   - **Title**: 명확하고 간결한 제목
   - **Description**: 변경사항, 추가된 기능, 수정된 버그 등 상세 설명
4. **Reviewers 지정**: 다른 개발자를 리뷰어로 선택
5. **"Create pull request"** 클릭

---

## 🍎 macOS 환경에서 PR 작성하기

### 1. 개발 브랜치로 이동 및 최신 코드 동기화

```bash
# 현재 브랜치 확인
git branch

# 개발 브랜치로 이동 (본인 브랜치: Myeonggi 또는 Gijun)
git checkout Myeonggi
# 또는
git checkout Gijun

# master 브랜치의 최신 코드를 가져와서 동기화
git fetch origin
git merge origin/master
```

### 2. 기능 개발 및 커밋

```bash
# 파일 수정 후 변경사항 확인
git status

# 변경된 파일 스테이징
git add .
# 또는 특정 파일만
git add 파일명.확장자

# 커밋 (의미있는 커밋 메시지 작성)
git commit -m "feat: 새로운 기능 추가"
# 또는
git commit -m "fix: 버그 수정"
# 또는
git commit -m "docs: 문서 업데이트"
```

### 3. 원격 저장소에 푸시

```bash
# 개발 브랜치를 원격 저장소에 푸시
git push origin Myeonggi
# 또는
git push origin Gijun
```

### 4. GitHub에서 PR 생성

1. **GitHub 웹사이트 접속** → 해당 레포지토리로 이동
2. **"Compare & pull request"** 버튼 클릭 (푸시 후 자동으로 나타남)
3. **PR 정보 작성**:
   - **Base**: `master` ← **Compare**: `Myeonggi` 또는 `Gijun`
   - **Title**: 명확하고 간결한 제목
   - **Description**: 변경사항, 추가된 기능, 수정된 버그 등 상세 설명
4. **Reviewers 지정**: 다른 개발자를 리뷰어로 선택
5. **"Create pull request"** 클릭

---

## 🔍 PR 리뷰 및 Merge 프로세스

### PR을 받은 리뷰어의 역할

1. **코드 리뷰 수행**
   - 코드 품질 확인
   - 로직 검토
   - 스타일 가이드 준수 확인

2. **리뷰 결과 처리**
   - **승인**: "Approve" 선택 후 코멘트 작성
   - **수정 요청**: "Request changes" 선택 후 구체적인 피드백 제공
   - **일반 코멘트**: 단순 의견이나 질문

3. **승인 후 Merge**
   - 리뷰어가 승인하면 "Merge pull request" 버튼 활성화
   - Merge 옵션 선택:
     - **Create a merge commit**: 모든 커밋 히스토리 보존
     - **Squash and merge**: 여러 커밋을 하나로 합쳐서 merge
     - **Rebase and merge**: 커밋 히스토리를 선형으로 유지

---

## 📝 좋은 PR 작성을 위한 팁

### PR 제목 작성법
```
feat: 사용자 로그인 기능 추가
fix: 대시보드 로딩 오류 수정
docs: README 파일 업데이트
refactor: 코드 구조 개선
test: 단위 테스트 추가
```

### PR 설명 템플릿
```markdown
## 변경사항
- [ ] 새로운 기능 추가
- [ ] 버그 수정
- [ ] 문서 업데이트
- [ ] 리팩토링

## 상세 설명
이번 PR에서 수행한 작업에 대한 자세한 설명을 작성합니다.

## 테스트
- [ ] 로컬에서 테스트 완료
- [ ] 기존 기능에 영향 없음을 확인

## 스크린샷 (UI 변경시)
변경된 UI가 있다면 스크린샷을 첨부합니다.
```

---

## ⚠️ 주의사항

1. **반드시 본인의 개발 브랜치에서 작업**: `Myeonggi` 또는 `Gijun`
2. **master 브랜치에 직접 푸시 금지**: 항상 PR을 통해서만 merge
3. **PR 생성 전 master와 동기화**: 충돌 방지를 위해 최신 코드 반영
4. **의미있는 커밋 메시지 작성**: 나중에 히스토리 추적이 용이하도록
5. **리뷰 완료 후 merge**: 반드시 다른 개발자의 승인을 받은 후 merge
6. **merge 후 로컬 브랜치 정리**: 
   ```bash
   git checkout master
   git pull origin master
   git branch -d 브랜치명  # 로컬 브랜치 삭제
   ```

---

## 🚨 문제 해결

### 브랜치가 없는 경우
```bash
# 새 브랜치 생성 및 이동
git checkout -b Myeonggi
# 또는
git checkout -b Gijun

# 원격 저장소에 브랜치 생성
git push -u origin Myeonggi
```

### Merge 충돌 발생시
```bash
# master 브랜치와 동기화 시 충돌 발생한 경우
git status  # 충돌 파일 확인
# 충돌 파일을 수동으로 수정
git add .
git commit -m "resolve merge conflict"
git push origin 브랜치명
```

### 실수로 master에 푸시한 경우
```bash
# 마지막 커밋 취소 (로컬만)
git reset --soft HEAD~1

# 개발 브랜치로 이동 후 다시 커밋
git checkout Myeonggi
git add .
git commit -m "커밋 메시지"
git push origin Myeonggi
```
