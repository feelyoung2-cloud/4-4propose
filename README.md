# 🏫 초등 4학년 국어 "제안하는 글쓰기" 공개수업 웹앱

본 웹앱은 **초등학교 4학년 1학기 국어과 "제안하는 글쓰기" 공개수업**을 위해 제작된 실시간 상호작용 웹 애플리케이션입니다.  
학생들은 **로그인이나 회원가입 없이 링크(또는 QR코드)만 누르면** 즉시 참여할 수 있으며, 학생들의 응답과 제안서가 교실 TV 및 전자칠판에 실시간으로 모입니다.

---

## 📂 파일 구조 및 5개 화면 안내

```text
public/
  ├── index.html          # [허브 메뉴] 5개 화면으로 가는 통합 안내판
  ├── student.html        # [화면1] 학생용 도입 설문 "우리 반 불편함 탐정단"
  ├── teacher.html        # [화면2] 교사용(TV) 실시간 설문 결과 (차트 + 히트맵 + 1위 공개)
  ├── write.html          # [화면3] 학생용 제안하는 글쓰기 (설문 연계 + 편지지 미리보기 + TTS)
  ├── board.html          # [화면4] 학생/교사용 공감 나누기 게시판 (?role=teacher: TV 발표 모드)
  ├── app.js              # Firebase 초기화 + 욕설 필터 + 기기 ID + 실시간 브릿지
  ├── firebase-config.js  # Firebase 프로젝트 설정값 (교사가 키를 붙여넣는 곳)
  └── style.css           # 초등 4학년 맞춤 따뜻한 공통 디자인 (Gowun Batang + Noto Sans KR)
firebase.json             # Firebase Hosting 설정 ("public" 폴더 지정)
firestore.rules           # Cloud Firestore 보안 규칙 (무로그인 학생 참여 허용)
README.md                 # 초보 교사용 설치 및 배포 안내서 (현재 문서)
```

---

## ⏱️ 40분 공개수업 흐름도 및 활용 팁

| 단계 (시간) | 화면 | 활동 내용 및 교사 팁 |
|---|---|---|
| **도입 (8분)** | `student.html`<br>`teacher.html` | **우리 반 불편함 탐정단 (익명 설문)**<br>• 학생들은 태블릿으로 장소, 문제 유형, 상황을 익명으로 제출합니다.<br>• 교사용 TV에서 **[결과 가리기]**를 켜두었다가 설문이 끝나면 짠! 공개합니다.<br>• **[가장 많이 나온 문제 크게 보기]** 버튼으로 1위 문제를 대형 화면에 띄웁니다. |
| **전개 (20분)** | `write.html` | **모둠별 제안하는 글쓰기**<br>• 앞선 설문에서 모인 문제 카드를 터치하면 문제 상황이 자동 입력됩니다.<br>• 받는 사람(전교 학생, 담임 선생님 등)을 정하고 제안과 까닭을 씁니다.<br>• **[편지지 미리보기]**와 **[소리 내어 읽기(TTS)]**로 스스로 점검합니다.<br>• 3가지 기준을 모두 체크해야 제출할 수 있습니다. |
| **정리 (12분)** | `board.html`<br>`?role=teacher` | **공감 나누기 및 우수 제안 발표**<br>• 학생들은 다른 모둠의 제안서를 읽고 하트(❤️) 공감과 격려 댓글을 남깁니다.<br>• 교사용 TV 모드(`board.html?role=teacher`)에서 **[1·2위 제안 크게 보기]**를 눌러 우리 반 명예의 제안을 발표하고 칭찬합니다. |

---

## 🚀 초보 교사를 위한 Firebase 설치부터 배포까지 (5단계)

> **✅ Firebase 자동 연결 완료 상태:**
> 현재 **`our-class-ideas`** 프로젝트와 Cloud Firestore 데이터베이스(`ai-studio-4-8c21487e-dfd5-414a-a3ae-7567f2a97354`)가 성공적으로 프로비저닝되었으며, `public/firebase-config.js`에 설정이 반영되고 보안 규칙(`firestore.rules`) 배포까지 완료되었습니다! 이제 앱을 바로 실행하면 실제 클라우드 실시간 동기화로 작동합니다.

---
1. 구글에 로그인한 후 [Firebase 콘솔](https://console.firebase.google.com/)에 접속합니다.
2. **[프로젝트 추가]**를 클릭합니다.
3. 프로젝트 이름 입력 (예: `class-writing-4th`) → Google 애널리틱스는 해제(또는 기본값) 후 **[프로젝트 만들기]** 클릭.

### 2단계: Cloud Firestore 데이터베이스 만들기
1. 콘솔 왼쪽 메뉴에서 **[빌드] → [Firestore Database]**를 클릭합니다.
2. **[데이터베이스 만들기]** 버튼을 누릅니다.
3. 위치 설정에서 **`asia-northeast3 (Seoul)`**을 선택합니다.
4. 보안 규칙 시작은 **'테스트 모드에서 시작'**을 선택하고 **[사용 설정]**을 누릅니다. (규칙은 다음 단계에서 안전한 규칙으로 자동 배포됩니다.)

### 3단계: 웹 앱 등록 및 설정값 복사
1. 프로젝트 개요 페이지 중앙의 **웹 아이콘 `</>`**을 클릭합니다.
2. 앱 닉네임 입력 (예: `국어수업웹`) 후 **[앱 등록]** 클릭.
3. 화면에 나타나는 `firebaseConfig = { ... };` 안의 내용을 복사합니다.
4. 본 프로젝트의 **`public/firebase-config.js`** 파일을 열고 복사한 내용을 붙여넣고 저장합니다:
   ```javascript
   export const firebaseConfig = {
     apiKey: "실제_발급받은_API_KEY",
     authDomain: "class-writing-4th.firebaseapp.com",
     projectId: "class-writing-4th",
     storageBucket: "class-writing-4th.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

### 4단계: Firebase CLI 도구 설치 (컴퓨터 터미널)
터미널(또는 명령 프롬프트)을 열고 아래 명령어를 순서대로 실행합니다:

```bash
# 1. Firebase 도구 전역 설치
npm install -g firebase-tools

# 2. 내 구글 계정으로 로그인 (웹 브라우저가 열리면 로그인)
firebase login

# 3. 방금 만든 내 Firebase 프로젝트 연결
firebase use --add
# (화살표 키로 1단계에서 만든 프로젝트 선택 후 별칭 입력: default)
```

### 5단계: 배포하기 (Deploy)
프로젝트 폴더에서 다음 단어를 입력하면 끝납니다:

```bash
firebase deploy
```

배포가 완료되면 터미널에 **Hosting URL**이 출력됩니다!  
예: `https://class-writing-4th.web.app`

- 교사용 TV: `https://class-writing-4th.web.app/teacher.html`
- 학생용 태블릿: `https://class-writing-4th.web.app/student.html` (QR코드로 만들어 칠판에 붙여주시면 편리합니다)

---

## 🛡️ 안전 및 보안 장치 (초등 4학년 안심 설계)
1. **욕설/비속어 자동 필터 (`BAD_WORDS`):** 설문, 제안서, 댓글 모든 입력 단계에서 초등학생이 접할 수 있는 비속어 및 욕설을 사전 차단하여 "친구에게 고운 말을 사용해 주세요" 안내가 뜹니다.
2. **익명 보호:** 도입 설문에서는 학생 이름과 학번을 일체 수집하지 않아 솔직한 생각을 이끌어냅니다.
3. **공감 중복 방지:** 기기별 브라우저 식별자를 통해 자기 모둠 글에는 공감을 누를 수 없으며, 1인당 1회만 공감할 수 있습니다.
4. **교사 검토 시스템:** 학생들의 상황 글은 교사용 TV 화면에서 교사가 먼저 확인 후 [화면에 띄우기] 버튼을 누른 글만 TV에 공개됩니다.
