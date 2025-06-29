# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Supabase 백엔드 연동 계획
- 실제 API 연동 작업
- 테스트 코드 작성 계획
- 성능 최적화 작업 계획

### Changed
- 프로젝트 문서화 개선

### Fixed
- GitHub 이슈 등록 및 관리 시작

## [0.1.0] - 2024-06-24

### Added
- 🎉 초기 프로젝트 설정
- ⚛️ React 18 + TypeScript + Vite 환경 구축
- 🎨 Tailwind CSS 스타일링 시스템
- 🔐 사용자 인증 시스템 (Mock 데이터)
  - 로그인/회원가입 페이지
  - 관리자 승인 기반 사용자 관리
  - 보호된 라우트 구현
- 🏢 워크스페이스 관리 시스템
  - 워크스페이스 선택 페이지
  - 다중 워크스페이스 지원
  - 워크스페이스별 사용자 할당
- 📊 대시보드 기능
  - 실시간 통계 표시
  - 공지사항 현황
  - 사용자 관리 현황
- 👥 관리자 사용자 관리
  - 사용자 승인/거부 기능
  - 워크스페이스 할당 기능
  - 사용자 상태 관리
- 📢 공지사항 시스템 기초 구조
  - 공지사항 타입 정의 (출석, 만족도, 스레드)
  - 스케줄링 시스템 구조
  - Slack 웹훅 연동 준비
- 🎨 UI/UX 컴포넌트
  - 반응형 레이아웃
  - 모던한 디자인 시스템
  - 다크 모드 고려 디자인
- 📁 프로젝트 구조 정리
  - 컴포넌트 분리
  - Context API 활용
  - TypeScript 타입 정의

### Technical Details
- **Frontend Stack**: React 18, TypeScript, Vite, Tailwind CSS
- **Routing**: React Router DOM v6
- **State Management**: React Context API
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Code Quality**: ESLint, TypeScript strict mode

### Known Issues
- 🚨 API 서비스가 Mock 데이터만 사용
- 🚨 실제 백엔드 연동 필요
- 🚨 파일 업로드 기능 미구현
- 🚨 테스트 코드 부재

### Notes
이 버전은 프론트엔드 UI/UX 구현에 중점을 둔 초기 버전입니다. 
실제 서비스 운영을 위해서는 백엔드 API 구축이 필요합니다. 