# stube
TUBE (스튜브) - 유튜브 기반 AI 학습 컨설팅 웹앱
유튜브 10분 보고, 과목별 맞춤 커리큘럼 완성

스튜브(STUBE)는 수능 및 내신을 준비하는 수험생들이 방대한 유튜브 공부 노하우 영상(연고티비 등)을 일일이 찾아보는 시간 비용을 줄여주는 AI 맞춤형 학습 컨설팅 모바일 웹앱입니다.

수험생의 학년, 성적, 고민 사항을 분석하여 선배들의 데이터에 기반한 과목별 문제지, 수준별 인강 강사, 맞춤 학습법 전략을 신속하게 제안합니다.

주요 기능
개인화 온보딩

학년, 성적 수준, 학습 고민을 입력받아 맞춤형 추천의 근거가 되는 사용자 데이터를 수집합니다.

데이터 기반 맞춤 리포트 (Gemini AI 연동)

유튜브 공부법 영상 분석 결과를 기반으로 한 수치화된 추천 데이터를 제공합니다.

과목별 추천 교재(기초/심화/N제), 추천 강사, 실전 학습 전략을 한눈에 확인할 수 있습니다.

AI 학습 매니저 (대화형 인터페이스)

D-DAY 전략, 취약점 극복 방법 등 구체적인 학습 상황에 대한 대화형 상담을 제공합니다.

학생 평가 및 요청사항 게시판 (Firebase Firestore 연동)

수험생들이 자유롭게 후기 및 요청사항을 등록할 수 있습니다.

등록된 피드백은 Firebase Firestore에 저장되며 최신순으로 실시간 목록을 불러옵니다.

PWA (Progressive Web App) 지원

모바일 퍼스트 UI/UX 디자인을 적용하여 스마트폰 홈 화면에 추가하여 앱처럼 사용할 수 있으며 오프라인 캐싱을 지원합니다.

기술 스택 (Tech Stack)
Frontend: HTML5, CSS3 (Custom CSS Variables), JavaScript (ES6+ Native Modules)

Backend / Serverless: Vercel Serverless Functions (Node.js)

Database: Firebase Firestore (v10 Web SDK)

AI Model: Google Gemini API (gemini-2.5-flash)

Deployment: Vercel

프로젝트 구조

stube-app/


├── api/


│   └── generate.js       # Vercel 서버리스 함수 (Gemini API 연동)


├── public/


│   ├── index.html        # 메인 HTML (UI 및 Firebase SDK 포함)


│   ├── style.css         # 모바일 퍼스트 디자인 시스템 스타일시트


│   ├── app.js            # 프론트엔드 비즈니스 로직 및 Firebase 연동


│   ├── manifest.json     # PWA 앱 매니페스트


│   ├── sw.js             # PWA 서비스 워커


│   └── screen.png        # 대표 로고 및 파비콘 이미지


├── vercel.json           # Vercel 라우팅 및 PWA 헤더 설정


├── package.json          # 프로젝트 정보 및 의존성 정의


└── README.md             # 프로젝트 문서

환경 변수 설정 (Environment Variables)
이 프로젝트는 보안을 위해 API 키를 코드에 직접 노출하지 않으며, Vercel 환경 변수를 읽어 사용합니다.

Key: GEMINI_API_KEY

Value: Google AI Studio에서 발급받은 Gemini API Key
