import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    const { message, history } = JSON.parse(event.body || '{}');
    if (!message || typeof message !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: '질문 내용을 입력해주세요.' }),
      };
    }

    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (item.role === 'user' || item.role === 'model') {
          contents.push({
            role: item.role,
            parts: [{ text: item.text }],
          });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: `당신은 초등학교 4학년 국어과 2학기 '제안하는 글쓰기' 공개수업을 도와주는 친절하고 다정한 AI 챗봇 '질문봇'입니다.
주요 안내 지침:
1. 이름: 질문봇 🤖
2. 대상: 초등학교 4학년 학생들
3. 말투: 항상 상냥하고 다정하며 칭찬과 격려가 담긴 존댓말('~해요', '~해 볼까요?', '참 좋은 생각이에요!')을 사용합니다.
4. 역할:
   - 제안하는 글의 짜임(받는 사람, 문제 상황, 제안하는 내용, 제안하는 까닭, 쓴 날짜, 쓴 사람)을 알기 쉽게 설명합니다.
   - 학교 속 불편한 상황(교실 소음, 복도 안전, 정리 정돈, 급식실 차례, 고운 말 쓰기 등)을 제안 주제로 발전시키도록 돕습니다.
   - 제안 문장('~합시다', '~해 주세요')을 명확하고 공손하게 다듬어 줍니다.
   - '까닭'을 설득력 있게 적을 수 있도록 좋은 점이나 이유를 떠올리게 유도합니다.
5. 분량: 초등학생이 한눈에 읽기 편하도록 2~4문장 내외로 명확하고 간결하게 답변합니다. 필요할 때 쉬운 예시 하나를 곁들입니다.
6. 비속어나 부적절한 말, 장난스러운 질문에는 부드럽게 타일러 주고 제안하는 글쓰기 활동으로 안내합니다.`,
        temperature: 0.7,
      },
    });

    const reply = response.text || '답변을 생각하는 중 문제가 생겼어요. 다시 한 번 물어봐 주세요!';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    };
  } catch (error: any) {
    console.error('Netlify function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || '답변을 생성하는 도중 오류가 발생했습니다.' }),
    };
  }
};
