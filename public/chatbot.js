// ================================================================
// 🤖 질문봇 (초등 4학년 국어 '제안하는 글쓰기' AI 챗봇 클라이언트 모듈)
// ================================================================

(function () {
  // 중복 초기화 방지
  if (window.__QUESTION_BOT_INITIALIZED__) return;
  window.__QUESTION_BOT_INITIALIZED__ = true;

  // 대화 기록 (세션 내 유지)
  const conversationHistory = [];

  // 추천 질문 칩 목록
  const SUGGESTION_CHIPS = [
    '💡 알맞은 까닭은 어떻게 적어?',
    '🏫 학교 속 불편한 상황 추천해줘',
    '✏️ 제안하는 문장 예시 알려줘',
    '📋 제안하는 글의 짜임이 뭐야?'
  ];

  // 챗봇 UI 생성 및 주입
  function initChatbot() {
    // 챗봇 컨테이너 요소 생성
    const botWrapper = document.createElement('div');
    botWrapper.id = 'questionBotContainer';
    botWrapper.className = 'qbot-container';

    botWrapper.innerHTML = `
      <!-- 플로팅 토글 버튼 -->
      <button type="button" id="qbotToggleBtn" class="qbot-toggle-btn" aria-label="질문봇 열기">
        <span class="qbot-toggle-icon">🤖</span>
        <span class="qbot-toggle-label">질문봇</span>
        <span class="qbot-unread-dot" id="qbotUnreadDot"></span>
      </button>

      <!-- 챗봇 대화창 -->
      <div id="qbotWindow" class="qbot-window" style="display: none;">
        <!-- 상단 헤더 -->
        <div class="qbot-header">
          <div class="qbot-header-info">
            <div class="qbot-avatar">🤖</div>
            <div>
              <div class="qbot-title">질문봇</div>
              <div class="qbot-subtitle">초등 4학년 국어 글쓰기 도우미</div>
            </div>
          </div>
          <div class="qbot-header-actions">
            <button type="button" id="qbotResetBtn" class="qbot-icon-btn" title="대화 지우기" aria-label="대화 다시 시작">
              🔄
            </button>
            <button type="button" id="qbotCloseBtn" class="qbot-icon-btn" title="닫기" aria-label="챗봇 닫기">
              ✕
            </button>
          </div>
        </div>

        <!-- 추천 질문 칩 영역 -->
        <div class="qbot-chips-bar" id="qbotChipsBar">
          ${SUGGESTION_CHIPS.map(chip => `<button type="button" class="qbot-chip">${chip}</button>`).join('')}
        </div>

        <!-- 메시지 리스트 영역 -->
        <div class="qbot-messages" id="qbotMessages">
          <div class="qbot-msg-row bot">
            <div class="qbot-msg-avatar">🤖</div>
            <div class="qbot-bubble bot">
              반가워요! 저는 국어 수업을 도와주는 <strong>질문봇</strong>이에요. 🌸<br><br>
              학교 속 불편한 점을 찾거나, 멋진 제안과 까닭을 쓸 때 궁금한 점이 있다면 무엇이든 편하게 물어보세요!
            </div>
          </div>
        </div>

        <!-- 하단 입력창 -->
        <div class="qbot-input-area">
          <form id="qbotForm" onsubmit="return false;" class="qbot-form">
            <input 
              type="text" 
              id="qbotInput" 
              class="qbot-input" 
              placeholder="질문봇에게 무엇이든 물어보세요..." 
              maxlength="150" 
              autocomplete="off"
            />
            <button type="submit" id="qbotSendBtn" class="qbot-send-btn" aria-label="전송">
              <span>보내기</span>
            </button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(botWrapper);

    // 요소 참조
    const toggleBtn = document.getElementById('qbotToggleBtn');
    const qbotWindow = document.getElementById('qbotWindow');
    const closeBtn = document.getElementById('qbotCloseBtn');
    const resetBtn = document.getElementById('qbotResetBtn');
    const qbotForm = document.getElementById('qbotForm');
    const qbotInput = document.getElementById('qbotInput');
    const qbotSendBtn = document.getElementById('qbotSendBtn');
    const qbotMessages = document.getElementById('qbotMessages');
    const qbotUnreadDot = document.getElementById('qbotUnreadDot');
    const chipsBar = document.getElementById('qbotChipsBar');

    let isOpen = false;
    let isSending = false;

    // 챗봇 열기 / 닫기
    function toggleWindow(open) {
      isOpen = typeof open === 'boolean' ? open : !isOpen;
      if (isOpen) {
        qbotWindow.style.display = 'flex';
        // 애니메이션 클래스
        setTimeout(() => qbotWindow.classList.add('active'), 10);
        toggleBtn.classList.add('active');
        qbotUnreadDot.style.display = 'none';
        qbotInput.focus();
        scrollToBottom();
      } else {
        qbotWindow.classList.remove('active');
        toggleBtn.classList.remove('active');
        setTimeout(() => {
          if (!isOpen) qbotWindow.style.display = 'none';
        }, 250);
      }
    }

    toggleBtn.addEventListener('click', () => toggleWindow());
    closeBtn.addEventListener('click', () => toggleWindow(false));

    // 대화 초기화
    resetBtn.addEventListener('click', () => {
      if (confirm('질문봇과의 대화를 새로 시작할까요?')) {
        conversationHistory.length = 0;
        qbotMessages.innerHTML = `
          <div class="qbot-msg-row bot">
            <div class="qbot-msg-avatar">🤖</div>
            <div class="qbot-bubble bot">
              대화를 새로 시작했어요! 궁금한 점이 생기면 언제든 물어보세요. ✨
            </div>
          </div>
        `;
        chipsBar.style.display = 'flex';
      }
    });

    // 추천 질문 칩 클릭
    chipsBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.qbot-chip');
      if (!chip) return;
      const text = chip.textContent.replace(/^[^\w가-힣]+/, '').trim();
      sendUserMessage(text);
    });

    // 메시지 스크롤 하단 이동
    function scrollToBottom() {
      qbotMessages.scrollTop = qbotMessages.scrollHeight;
    }

    // 사용자 메시지 전송
    async function sendUserMessage(msgText) {
      const text = (msgText || qbotInput.value || '').trim();
      if (!text || isSending) return;

      qbotInput.value = '';
      isSending = true;
      qbotSendBtn.disabled = true;

      // 추천 칩 숨김
      chipsBar.style.display = 'none';

      // 1. 유저 말풍선 추가
      appendMessage('user', text);

      // 2. 로딩 애니메이션 말풍선 추가
      const loadingRow = appendLoadingIndicator();
      scrollToBottom();

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: conversationHistory,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || '답변을 불러오지 못했어요.');
        }

        const data = await response.json();
        const botReply = data.reply || '답변을 생성하지 못했어요.';

        // 대화 기록 업데이트
        conversationHistory.push({ role: 'user', text });
        conversationHistory.push({ role: 'model', text: botReply });

        // 로딩 말풍선 제거 후 봇 말풍선 추가
        loadingRow.remove();
        appendMessage('bot', botReply);
      } catch (err) {
        console.error('QBot error:', err);
        loadingRow.remove();
        appendMessage(
          'bot',
          '⚠️ 죄송해요, 일시적인 오류가 발생했어요. 다시 질문해 주시거나 선생님께 도움을 요청해 보세요.'
        );
      } finally {
        isSending = false;
        qbotSendBtn.disabled = false;
        qbotInput.focus();
        scrollToBottom();
      }
    }

    // 폼 제출 이벤트
    qbotForm.addEventListener('submit', () => {
      sendUserMessage();
    });

    // 말풍선 추가 헬퍼
    function appendMessage(role, text) {
      const row = document.createElement('div');
      row.className = `qbot-msg-row ${role}`;

      const formatted = escapeHtml(text).replace(/\n/g, '<br>');

      if (role === 'bot') {
        row.innerHTML = `
          <div class="qbot-msg-avatar">🤖</div>
          <div class="qbot-bubble bot">${formatted}</div>
        `;
      } else {
        row.innerHTML = `
          <div class="qbot-bubble user">${formatted}</div>
        `;
      }

      qbotMessages.appendChild(row);
      scrollToBottom();
      return row;
    }

    // 생각 중 로딩 표시
    function appendLoadingIndicator() {
      const row = document.createElement('div');
      row.className = 'qbot-msg-row bot qbot-loading-row';
      row.innerHTML = `
        <div class="qbot-msg-avatar">🤖</div>
        <div class="qbot-bubble bot qbot-thinking">
          <span class="qbot-dot"></span>
          <span class="qbot-dot"></span>
          <span class="qbot-dot"></span>
          <span style="margin-left: 8px; font-size: 0.95rem; color: #4A5568;">질문봇이 생각 중이에요...</span>
        </div>
      `;
      qbotMessages.appendChild(row);
      return row;
    }

    function escapeHtml(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  }

  // DOM 로드 시 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();
