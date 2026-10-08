// ==============================================================
// 📱 모바일 프레임 모드 (모바일 화면 최적화 & 스마트폰 프레임 뷰)
// ==============================================================
(function () {
  function initMobileFrame() {
    if (document.getElementById('mobileFrameShell')) return;

    const header = document.querySelector('.app-header');
    const main = document.querySelector('.main-container');

    if (!header && !main) return;

    // 스마트폰 디바이스 프레임 쉘 생성
    const shell = document.createElement('div');
    shell.id = 'mobileFrameShell';
    shell.className = 'mobile-frame-shell';

    // 상단 스마트폰 상태바 & 노치 (시계, 카메라 렌즈, 스피커, 배터리)
    const topBar = document.createElement('div');
    topBar.className = 'mobile-frame-topbar';
    topBar.id = 'mobileFrameTopBar';
    topBar.innerHTML = `
      <span class="mobile-top-time">09:41</span>
      <div class="mobile-top-notch">
        <div class="mobile-notch-speaker"></div>
        <div class="mobile-notch-lens"></div>
      </div>
      <span class="mobile-top-icons">5G 📶 98% 🔋</span>
    `;

    // 하단 홈 바
    const bottomBar = document.createElement('div');
    bottomBar.className = 'mobile-frame-bottombar';
    bottomBar.id = 'mobileFrameBottomBar';
    bottomBar.innerHTML = `<div class="mobile-home-indicator"></div>`;

    // DOM 요소를 shell 안으로 안전하게 이동
    const parent = (header || main).parentNode;
    parent.insertBefore(shell, header || main);

    shell.appendChild(topBar);
    if (header) shell.appendChild(header);
    if (main) shell.appendChild(main);
    shell.appendChild(bottomBar);

    // 질문봇이 이미 있으면 shell 안으로 이동
    const qbot = document.getElementById('questionBotContainer');
    if (qbot) shell.appendChild(qbot);

    // 모바일 뷰 전환 버튼
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.id = 'mobileViewToggleBtn';
    toggleBtn.className = 'header-btn mobile-frame-toggle-btn';
    toggleBtn.setAttribute('aria-label', '모바일/PC 화면 프레임 전환');

    function updateBtnState(isActive) {
      if (isActive) {
        toggleBtn.innerHTML = '<span>🖥️ PC 전체화면</span>';
        toggleBtn.classList.add('active');
        toggleBtn.title = 'PC 전체 화면으로 전환하기';
      } else {
        toggleBtn.innerHTML = '<span>📱 모바일 뷰</span>';
        toggleBtn.classList.remove('active');
        toggleBtn.title = '학생용 모바일 스마트폰 프레임으로 보기';
      }
    }

    // URL 파라미터(?view=mobile) 또는 저장된 설정 확인
    const urlParams = new URLSearchParams(window.location.search);
    const forceMobile = urlParams.get('view') === 'mobile' || urlParams.get('mode') === 'mobile';
    const savedMode = localStorage.getItem('gwacheon_view_mode');
    const shouldActivate = forceMobile || (savedMode === 'mobile');

    if (shouldActivate) {
      document.body.classList.add('mobile-frame-active');
      updateBtnState(true);
    } else {
      updateBtnState(false);
    }

    toggleBtn.addEventListener('click', () => {
      const active = document.body.classList.toggle('mobile-frame-active');
      updateBtnState(active);
      localStorage.setItem('gwacheon_view_mode', active ? 'mobile' : 'desktop');

      // 질문봇 위치 동기화
      const curQbot = document.getElementById('questionBotContainer');
      if (curQbot && curQbot.parentNode !== shell) {
        shell.appendChild(curQbot);
      }
    });

    // 헤더에 버튼 배치
    const headerLinks = header ? header.querySelector('.header-links') : null;
    if (headerLinks) {
      headerLinks.appendChild(toggleBtn);
    } else if (header) {
      header.appendChild(toggleBtn);
    }

    // 실시간 시계 업데이트
    function updateClock() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const timeEl = topBar.querySelector('.mobile-top-time');
      if (timeEl) timeEl.textContent = `${hours}:${mins}`;
    }
    updateClock();
    setInterval(updateClock, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileFrame);
  } else {
    initMobileFrame();
  }
})();
