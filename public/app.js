// ================================================================
// 🌟 초등 4학년 국어 "제안하는 글쓰기" 공통 애플리케이션 코어 (app.js)
// Firebase JS SDK 10.x CDN ES 모듈 + 욕설 필터 + 기기 ID + 실시간 브릿지
// ================================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getFirestore, collection, addDoc, doc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, increment, getDocs,
  getDocFromServer
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

// ----------------------------------------------------------------
// 1. 욕설 및 비속어 필터 (초등 4학년 눈높이 클린 필터)
// ----------------------------------------------------------------
export const BAD_WORDS = [
  '시발', '씨발', 'ㅅㅂ', '시바', '씨바', '시빨', '씨빨',
  '병신', 'ㅂㅅ', '븅신', '등신', '호구',
  '존나', 'ㅈㄴ', '졸라', '개새끼', '개색기', '개새', '개소리',
  '미친', '미쳤', '미쳤냐', '미친놈', '미친년',
  '닥쳐', '꺼져', 'ㄲㅈ', '죽어', '죽여', '뒤져', '뒈져',
  '새끼', '새키', '지랄', 'ㅈㄹ', '염병',
  '쌉', '느금', '느금마', '애미', '애비', '엠창', '맘충',
  '바보새끼', '대가리', '대가리박어', 'ㅗ', 'ㅗㅗ'
];

/**
 * 텍스트에 비속어/욕설이 포함되어 있는지 검사합니다.
 * 공백이나 특수기호가 섞인 경우(예: "시 발", "ㅅ.ㅂ")도 정규화하여 검사합니다.
 */
export function containsBadWords(text) {
  if (!text || typeof text !== 'string') return false;
  // 공백 및 일반 구두점 제거 후 검사
  const normalized = text.replace(/[\s\.\,\-_~!?@#\$%\^&\*\(\)]/g, '').toLowerCase();

  for (const word of BAD_WORDS) {
    if (normalized.includes(word.toLowerCase())) {
      return true;
    }
  }
  return false;
}

/**
 * 텍스트 검증 헬퍼 (초등학생용 친절한 피드백 메시지 제공)
 */
export function validateCleanContent(text, labelName = '내용') {
  if (!text || !text.trim()) {
    return { valid: false, message: `${labelName}을(를) 입력해 주세요.` };
  }
  if (containsBadWords(text)) {
    return {
      valid: false,
      message: '친구들과 함께 보는 공간이에요. 예쁘고 고운 말을 사용해 주세요! 😊'
    };
  }
  return { valid: true, message: '' };
}

// ----------------------------------------------------------------
// 2. 기기 식별 및 공감(좋아요) 중복 방지 (localStorage)
// ----------------------------------------------------------------
export function getDeviceId() {
  let deviceId = localStorage.getItem('class_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem('class_device_id', deviceId);
  }
  return deviceId;
}

export function isProposalLikedLocally(proposalId) {
  try {
    const liked = JSON.parse(localStorage.getItem('liked_proposals') || '[]');
    return liked.includes(proposalId);
  } catch (e) {
    return false;
  }
}

export function markProposalLikedLocally(proposalId) {
  try {
    const liked = JSON.parse(localStorage.getItem('liked_proposals') || '[]');
    if (!liked.includes(proposalId)) {
      liked.push(proposalId);
      localStorage.setItem('liked_proposals', JSON.stringify(liked));
    }
  } catch (e) {
    console.error('Failed to save liked state', e);
  }
}

// ----------------------------------------------------------------
// 3. Firebase 초기화 및 로컬 시연 모드 하이브리드 지원
// ----------------------------------------------------------------
let dbInstance = null;
let isFirebaseActive = false;

// BroadcastChannel로 탭 간 실시간 연동 (Firebase 키 설정 전에도 즉시 체험 가능)
const broadcastChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('class_writing_channel')
  : null;

const isConfigValid = firebaseConfig
  && firebaseConfig.apiKey
  && !firebaseConfig.apiKey.includes('YOUR_API_KEY')
  && !firebaseConfig.projectId.includes('YOUR_PROJECT_ID');

if (isConfigValid) {
  try {
    const app = initializeApp(firebaseConfig);
    dbInstance = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
    isFirebaseActive = true;
    console.log('✅ Firebase Firestore 연결 완료! (클라우드 실시간 동기화)');

    // 연결 검증
    async function testConnection() {
      try {
        await getDocFromServer(doc(dbInstance, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  } catch (err) {
    console.warn('⚠️ Firebase 초기화 실패, 로컬 시연 모드로 작동합니다:', err);
    isFirebaseActive = false;
  }
} else {
  console.log('ℹ️ Firebase 설정이 등록되지 않아 [로컬 실시간 시연 모드]로 작동합니다.');
  console.log('👉 Firebase Console의 키를 public/firebase-config.js에 넣으면 클라우드 모드로 자동 전환됩니다.');
}

export function getDatabaseMode() {
  return {
    isCloud: isFirebaseActive,
    label: isFirebaseActive ? '☁️ Firebase 실시간 연결됨' : '💻 로컬 시연 모드 (동일 브라우저 탭 간 실시간 연동)'
  };
}

// ----------------------------------------------------------------
// 4. 로컬 스토리지 시연 데이터 저장소 헬퍼
// ----------------------------------------------------------------
function getLocalCollection(name) {
  try {
    return JSON.parse(localStorage.getItem(`class_db_${name}`) || '[]');
  } catch (e) {
    return [];
  }
}

function setLocalCollection(name, data) {
  try {
    localStorage.setItem(`class_db_${name}`, JSON.stringify(data));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'SYNC_COLLECTION', collection: name });
    }
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
}

// 초기 샘플 데이터 (처음 열었을 때 교실 분위기를 보여주는 따뜻한 예시)
function ensureInitialSeedData() {
  const responses = getLocalCollection('responses');
  if (responses.length === 0) {
    const seedResponses = [
      { id: 'seed_1', location: '복도·계단', issue: '⚠️안전', situation: '쉬는 시간에 복도에서 빠르게 뛰어가다가 마주 오던 친구와 부딪힐 뻔했어요.', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), ts: Date.now() - 30000 },
      { id: 'seed_2', location: '우리 교실', issue: '🔊소음', situation: '선생님께서 설명해 주실 때 뒤에서 큰 소리로 떠들어서 수업 내용이 잘 안 들렸어요.', createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), ts: Date.now() - 25000 },
      { id: 'seed_3', location: '운동장', issue: '🤝놀이 참여', situation: '축구할 때 잘하는 친구들끼리만 패스하고 규칙을 잘 안 지켜서 속상했어요.', createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(), ts: Date.now() - 20000 },
      { id: 'seed_4', location: '급식실', issue: '🚶차례', situation: '급식을 받으려고 줄을 서 있는데 중간에 새치기를 해서 기분이 안 좋았어요.', createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), ts: Date.now() - 15000 },
      { id: 'seed_5', location: '우리 교실', issue: '📦정리', situation: '보드게임 놀이를 하고 나서 상자 정리를 안 해서 바닥에 부품이 굴러다녔어요.', createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), ts: Date.now() - 10000 },
      { id: 'seed_6', location: '화장실', issue: '🗑️청결', situation: '손 씻고 나서 휴지를 쓰레기통에 넣지 않고 바닥에 버려져 있어서 지저분했어요.', createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), ts: Date.now() - 5000 },
      { id: 'seed_7', location: '우리 교실', issue: '😊불편한 점 없음', situation: '', createdAt: new Date().toISOString(), ts: Date.now() }
    ];
    setLocalCollection('responses', seedResponses);
  }

  const proposals = getLocalCollection('proposals');
  if (proposals.length === 0) {
    const seedProposals = [
      {
        id: 'prop_seed_1',
        team: '1모둠',
        name: '민준, 서아, 하람, 도현',
        recipient: '전교 학생들에게',
        problem: '쉬는 시간과 점심시간에 복도와 계단에서 빠르게 뛰는 친구들이 많아 부딪힐 뻔한 일이 자주 일어납니다.',
        proposal: '복도와 계단에서는 "사뿐사뿐 우측통행"을 실천하고, 바닥에 재미있는 발자국 스티커를 붙여 걸어 다니자고 제안합니다.',
        reason1: '우측통행을 지키며 걸으면 마주 오는 친구들과 부딪히지 않아 모두가 안전하게 학교생활을 할 수 있기 때문입니다.',
        reason2: '복도가 조용해져서 교실에서 책을 읽거나 쉬는 친구들에게 방해가 되지 않기 때문입니다.',
        fullText: '전교 학생들에게...\n안녕하세요? 1모둠입니다. 복도에서 안전하게 걷기를 제안합니다.',
        likes: 7,
        submitted: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      },
      {
        id: 'prop_seed_2',
        team: '2모둠',
        name: '예린, 지우, 준호, 수아',
        recipient: '담임 선생님께',
        problem: '교실 뒤편 학급 보드게임 부품들이 뒤섞이고 정리가 잘 되지 않아 다음 사람이 놀기 어렵습니다.',
        proposal: '모둠별로 일주일씩 "보드게임 정리 도우미"를 정하고, 게임 상자마다 정리 완료 스티커판을 만들자고 제안합니다.',
        reason1: '정리 책임이 생기면 잃어버리는 부품 없이 모든 친구들이 언제나 즐겁게 놀 수 있기 때문입니다.',
        reason2: '스스로 정리하는 습관을 길러 우리 교실이 더욱 깨끗해지기 때문입니다.',
        fullText: '담임 선생님께...\n안녕하세요? 2모둠입니다. 보드게임 정리 규칙을 제안합니다.',
        likes: 5,
        submitted: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
      }
    ];
    setLocalCollection('proposals', seedProposals);
  }
}

if (!isFirebaseActive) {
  ensureInitialSeedData();
}

// ----------------------------------------------------------------
// 5. 설문 응답 (responses) API
// ----------------------------------------------------------------
export async function addResponse({ location, issue, situation }) {
  const cleanSituation = situation ? situation.trim() : '';

  if (cleanSituation && containsBadWords(cleanSituation)) {
    throw new Error('친구들과 함께 보는 공간이에요. 바르고 고운 말을 써 주세요! 😊');
  }

  const payload = {
    location: location || '그 밖의 장소',
    issue: issue || '기타',
    situation: cleanSituation,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseActive && dbInstance) {
    try {
      await addDoc(collection(dbInstance, 'responses'), {
        ...payload,
        ts: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      console.error('Firestore addResponse error:', err);
      // Fallback
    }
  }

  // Local fallback
  const list = getLocalCollection('responses');
  const newDoc = {
    id: 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    ...payload,
    ts: Date.now()
  };
  list.unshift(newDoc);
  setLocalCollection('responses', list);
  return { success: true };
}

export function subscribeResponses(callback) {
  if (isFirebaseActive && dbInstance) {
    try {
      const q = query(collection(dbInstance, 'responses'), orderBy('ts', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        callback(items);
      }, (error) => {
        console.warn('Firebase responses subscription fallback to local', error);
        fallbackSubscribe();
      });
      return unsubscribe;
    } catch (err) {
      console.warn('Subscription error', err);
    }
  }

  function fallbackSubscribe() {
    callback(getLocalCollection('responses'));
  }

  fallbackSubscribe();

  const handleMessage = (e) => {
    if (e.data && e.data.collection === 'responses') {
      callback(getLocalCollection('responses'));
    }
  };

  const handleStorage = (e) => {
    if (e.key === 'class_db_responses') {
      callback(getLocalCollection('responses'));
    }
  };

  if (broadcastChannel) broadcastChannel.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);

  return () => {
    if (broadcastChannel) broadcastChannel.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

export async function clearAllResponses() {
  if (isFirebaseActive && dbInstance) {
    try {
      const snap = await getDocs(collection(dbInstance, 'responses'));
      const promises = snap.docs.map(d => deleteDoc(doc(dbInstance, 'responses', d.id)));
      await Promise.all(promises);
    } catch (err) {
      console.error('Failed to clear firestore responses', err);
    }
  }
  setLocalCollection('responses', []);
  return true;
}

// ----------------------------------------------------------------
// 6. 제안하는 글 (proposals) API
// ----------------------------------------------------------------
export async function addProposal(proposalData) {
  const { team, name, recipient, problem, proposal, reason1, reason2, fullText } = proposalData;

  // 비속어 점검
  const combinedText = `${name} ${problem} ${proposal} ${reason1} ${reason2 || ''}`;
  if (containsBadWords(combinedText)) {
    throw new Error('친구들과 함께 보는 제안서입니다. 예쁘고 고운 말을 사용해 주세요! 😊');
  }

  const payload = {
    team: team || '1모둠',
    name: name.trim(),
    recipient: recipient || '담임 선생님께',
    problem: problem.trim(),
    proposal: proposal.trim(),
    reason1: reason1.trim(),
    reason2: (reason2 || '').trim(),
    fullText: fullText || '',
    likes: 0,
    submitted: true,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseActive && dbInstance) {
    try {
      const docRef = await addDoc(collection(dbInstance, 'proposals'), {
        ...payload,
        ts: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (err) {
      console.error('Firestore addProposal error:', err);
    }
  }

  const list = getLocalCollection('proposals');
  const newId = 'prop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const newDoc = {
    id: newId,
    ...payload,
    ts: Date.now()
  };
  list.unshift(newDoc);
  setLocalCollection('proposals', list);
  return { success: true, id: newId };
}

export function subscribeProposals(callback) {
  if (isFirebaseActive && dbInstance) {
    try {
      const q = query(collection(dbInstance, 'proposals'), orderBy('ts', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        callback(items);
      }, (error) => {
        console.warn('Firebase proposals subscription fallback', error);
        callback(getLocalCollection('proposals'));
      });
      return unsubscribe;
    } catch (err) {
      console.warn('Subscription error', err);
    }
  }

  callback(getLocalCollection('proposals'));

  const handleMessage = (e) => {
    if (e.data && e.data.collection === 'proposals') {
      callback(getLocalCollection('proposals'));
    }
  };

  const handleStorage = (e) => {
    if (e.key === 'class_db_proposals') {
      callback(getLocalCollection('proposals'));
    }
  };

  if (broadcastChannel) broadcastChannel.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);

  return () => {
    if (broadcastChannel) broadcastChannel.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

export async function likeProposal(proposalId) {
  if (isProposalLikedLocally(proposalId)) {
    throw new Error('이미 공감(좋아요)을 누른 제안서예요! ❤️');
  }

  if (isFirebaseActive && dbInstance) {
    try {
      const propRef = doc(dbInstance, 'proposals', proposalId);
      await updateDoc(propRef, {
        likes: increment(1)
      });
      markProposalLikedLocally(proposalId);
      return { success: true };
    } catch (err) {
      console.error('Firestore like increment error', err);
    }
  }

  // Local fallback
  const list = getLocalCollection('proposals');
  const index = list.findIndex(p => p.id === proposalId);
  if (index !== -1) {
    list[index].likes = (list[index].likes || 0) + 1;
    setLocalCollection('proposals', list);
    markProposalLikedLocally(proposalId);
    return { success: true };
  }
  return { success: false };
}

// ----------------------------------------------------------------
// 7. 제안서 댓글 (comments) API
// ----------------------------------------------------------------
export async function addProposalComment(proposalId, { team, name, type, text }) {
  if (containsBadWords(text)) {
    throw new Error('친구에게 힘이 되는 고운 말을 써 주세요! 😊');
  }

  const payload = {
    team: team || '모둠',
    name: (name || '친구').trim(),
    type: type || 'good', // 'good' (좋은점) | 'idea' (보완할점)
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  if (isFirebaseActive && dbInstance) {
    try {
      await addDoc(collection(dbInstance, 'proposals', proposalId, 'comments'), {
        ...payload,
        ts: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      console.error('Firestore comment error', err);
    }
  }

  // Local fallback
  const commentsKey = `class_db_comments_${proposalId}`;
  let comments = [];
  try {
    comments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
  } catch (e) { comments = []; }

  const newComment = {
    id: 'cmt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    ...payload,
    ts: Date.now()
  };
  comments.push(newComment);
  localStorage.setItem(commentsKey, JSON.stringify(comments));

  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'SYNC_COLLECTION', collection: commentsKey });
  }

  return { success: true };
}

export function subscribeProposalComments(proposalId, callback) {
  if (isFirebaseActive && dbInstance) {
    try {
      const q = query(collection(dbInstance, 'proposals', proposalId, 'comments'), orderBy('ts', 'asc'));
      const unsubscribe = onSnapshot(q, (snap) => {
        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        callback(items);
      }, (err) => {
        console.warn('Comment subscription error', err);
        callback(getLocalComments(proposalId));
      });
      return unsubscribe;
    } catch (e) {
      console.warn('Comment sub failed', e);
    }
  }

  function getLocalComments(pId) {
    try {
      return JSON.parse(localStorage.getItem(`class_db_comments_${pId}`) || '[]');
    } catch (e) { return []; }
  }

  callback(getLocalComments(proposalId));

  const commentsKey = `class_db_comments_${proposalId}`;
  const handleMessage = (e) => {
    if (e.data && e.data.collection === commentsKey) {
      callback(getLocalComments(proposalId));
    }
  };
  const handleStorage = (e) => {
    if (e.key === commentsKey) {
      callback(getLocalComments(proposalId));
    }
  };

  if (broadcastChannel) broadcastChannel.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);

  return () => {
    if (broadcastChannel) broadcastChannel.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

// ----------------------------------------------------------------
// 8. 텍스트 음성 변환 (TTS - Web Speech API)
// ----------------------------------------------------------------
export function speakText(text) {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel(); // 이전 재생 취소

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  utterance.rate = 0.9; // 초등학생 듣기 좋은 약간 여유로운 속도
  utterance.pitch = 1.05; // 맑고 또렷한 톤

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
