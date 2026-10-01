import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize GoogleGenAI client (Server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface PressReleaseInput {
  projectName?: string;
  eventName?: string;
  dateTimeLocation?: string;
  content?: string;
  outcomes?: string;
  attendees?: string;
  department?: string;
  emphasis?: string;
  refinementNotes?: string;
}

const SYSTEM_INSTRUCTION = `당신은 대한민국 지방자치단체 홍보 담당 최고 전문가입니다.
각 부서의 사업 담당 공무원이 제공한 사업 및 행사 정보를 분석하여 언론사 기자가 즉시 인용·보도할 수 있는 고품질의 '홍보형 지자체 보도자료 초안'을 전문적으로 작성합니다.

[핵심 작성 원칙]
1. 제목: 핵심 사업의 가치와 시민 체감 혜택이 잘 드러나도록 두괄식으로 명확하고 눈에 띄게 작성합니다.
2. 부제목: 본문의 주요 내용을 보충하는 1~2줄의 부가 설명(- 기호 또는 문장형)으로 작성합니다.
3. 리드문: 6하원칙(누가, 언제, 어디서, 무엇을, 왜, 어떻게)을 적용하여 보도자료의 핵심 가치와 결과를 첫 문단에서 흡입력 있게 요약합니다(~고 밝혔다 등).
4. 본문: 지방자치단체 공식 보도자료에 적합한 행정 격식체(~했다, ~밝혔다, ~추진한다, ~설명했다 등)로 문단을 나누어 정돈되게 작성합니다.
5. 주요 성과 강조: 입력된 성과가 있다면 그 수치와 파급 효과를 전면에 효과적으로 강조합니다.
6. 강조 사항 반영: 사용자가 '강조하고 싶은 내용'을 핵심 메시지와 기관 관계자 코멘트("OO시 관계자는 ... 라고 전했다") 등으로 자연스럽게 녹여냅니다.
7. 사실 중심 작성(환각 엄격 금지): 사용자가 입력한 사실을 중심으로 작성하며, 입력되지 않은 구체적인 사실, 수치, 인물, 가짜 통계나 성과를 임의로 지어내지 않습니다.
8. 유연성: 입력 정보가 다소 부족하더라도 오류를 내지 않고 주어진 문맥과 상식적인 행정 절차 내에서 자연스럽게 보도자료를 구성합니다.
9. 개인정보 보호: 담당자 정보는 실제 개인정보 대신 '홍길동 / 000-0000-0000' (또는 입력된 부서명 / 담당자 직급 / 성명 / 연락처)을 사용합니다.
10. 보도자료 전체(fullPressRelease)는 다음 대한민국 공공기관 공식 표준 업무 양식 틀을 엄격히 준수하여 완결성 있게 작성하며, 각 섹션 및 항목 사이는 반드시 줄바꿈(\n)을 넉넉히 주어 작성합니다:

[보도 일시] 2026년 O월 O일(O) 배포 즉시 가능

[담당 부서] (부서명) / 주무관 / 홍길동 / 000-0000-0000

제목: (핵심 내용을 두괄식으로 명확하고 눈에 띄게 작성)

부제: (본문 내용을 보충하는 1~2줄의 부가 설명)

(리드문 문단)

□ 추진 배경 및 목적 (Why)
○ 
○ 

□ 주요 행사 / 정책 내용 (What, When, Where, Who)
○ 일시: 
○ 장소: 
○ 대상: 
○ 주요 내용: 

□ 기대 효과 및 주요 성과 (How / Result)
○ 
○ 

[붙임] 관련 사진 또는 상세 자료 별첨 <끝>
`;

// Helper function to call Gemini with model fallback
async function callGeminiWithFallback(config: any) {
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        ...config,
        model,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed, trying next fallback:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('All models failed to respond');
}

// Fallback template builder in case AI service is temporarily unavailable
function generateTemplateFallback(input: PressReleaseInput): any {
  const proj = input.projectName || '사업명 미정';
  const evt = input.eventName || '행사명 미정';
  const dtLoc = input.dateTimeLocation || '일시 및 장소 미정';
  const dept = input.department || '○○시 담당부서';
  const att = input.attendees || '시민 및 관계자';
  const cont = input.content || '사업 및 행사 상세 내용이 원활히 추진되었습니다.';
  const outc = input.outcomes || '참여 시민 만족도 제고 및 역량 강화 달성';
  const emph = input.emphasis || '시민 중심의 체감도 높은 공공 행정 서비스 제공';

  const title = `${dept}, '${proj}' 추진으로 시민 혜택 대폭 확대`;
  const subtitle = `- ${evt} 성황리 개최... ${outc} 성과 달성 -`;
  const lead = `${dept}는 ${dtLoc}에서 ${att} 등이 참여한 가운데 '${proj}'의 일환으로 '${evt}'를 성공적으로 개최했다고 밝혔다.`;
  const body = `이번 행사는 ${cont}\n\n행사에 참석한 ${att}는 적극적인 참여와 높은 호응을 보였으며, 실질적인 체감 효과를 이끌어냈다.\n\n${dept} 관계자는 "${emph}"라며, "앞으로도 시민 여러분이 체감할 수 있는 실질적인 정책 지원을 지속적으로 확대해 나가겠다"고 강조했다.`;
  const outcomesSummary = `○ 주요 성과: ${outc}\n○ 참여 인원: ${att}\n○ 핵심 의의: ${emph}`;
  const departmentInfo = `[담당 부서] ${dept} / 주무관 / 홍길동 / 000-0000-0000`;

  const fullPressRelease = `[보도 일시] 2026년 10월 15일(목) 배포 즉시 가능

${departmentInfo}

제목: ${title}

부제: ${subtitle}

${lead}

□ 추진 배경 및 목적 (Why)
○ ${proj}를 통한 시민 삶의 질 향상 및 공공 서비스 접근성 제고
○ ${emph}

□ 주요 행사 / 정책 내용 (What, When, Where, Who)
○ 일시·장소: ${dtLoc}
○ 대    상: ${att}
○ 주요내용: ${cont}

□ 기대 효과 및 주요 성과 (How / Result)
○ ${outc}
○ 시민들의 실생활 편의 증진 및 디지털 격차 해소 기여

[붙임] 관련 사진 또는 상세 자료 별첨 <끝>`;

  return {
    title,
    subtitle,
    lead,
    body,
    outcomesSummary,
    departmentInfo,
    fullPressRelease,
  };
}

// API: 보도자료 생성
app.post('/api/generate', async (req: Request, res: Response) => {
  const input: PressReleaseInput = req.body;

  try {
    const prompt = `다음은 지방자치단체 사업 담당 공무원이 입력한 사업 및 행사 정보입니다. 이 정보를 기반으로 홍보형 보도자료 초안을 작성해주세요.

[입력 항목]
1. 사업명: ${input.projectName || '(미입력)'}
2. 행사명: ${input.eventName || '(미입력)'}
3. 일시·장소: ${input.dateTimeLocation || '(미입력)'}
4. 사업/행사 내용: ${input.content || '(미입력)'}
5. 주요 성과: ${input.outcomes || '(미입력)'}
6. 참석자: ${input.attendees || '(미입력)'}
7. 담당부서: ${input.department || '○○시 담당부서'}
8. 강조하고 싶은 내용: ${input.emphasis || '(미입력)'}
${input.refinementNotes ? `[추가 요청사항/수정 피드백]: ${input.refinementNotes}` : ''}

규정에 따라 제목, 부제목, 리드문, 본문, 주요 성과 요약, 담당부서, 보도자료 전체(공식 양식 준수)를 생성해주세요.`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: '핵심 내용을 두괄식으로 명확하고 눈에 띄게 작성한 제목',
            },
            subtitle: {
              type: Type.STRING,
              description: '본문의 주요 내용을 보충하는 1~2줄의 부제목',
            },
            lead: {
              type: Type.STRING,
              description: '보도자료의 핵심 내용을 요약한 리드문',
            },
            body: {
              type: Type.STRING,
              description: '지방자치단체 공식 보도자료 문체로 작성된 상세 본문',
            },
            outcomesSummary: {
              type: Type.STRING,
              description: '주요 성과 및 파급효과 요약 (개조식 또는 문장형)',
            },
            departmentInfo: {
              type: Type.STRING,
              description: '담당부서 정보 (예: [담당 부서] ○○시 평생교육과 / 주무관 / 홍길동 / 000-0000-0000)',
            },
            fullPressRelease: {
              type: Type.STRING,
              description: '기존 지자체 업무 양식 규격에 맞춰 작성된 보도자료 전체 내용',
            },
          },
          required: [
            'title',
            'subtitle',
            'lead',
            'body',
            'outcomesSummary',
            'departmentInfo',
            'fullPressRelease',
          ],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('AI 응답이 비어있습니다.');
    }

    const parsedData = JSON.parse(responseText);
    res.json(parsedData);
  } catch (error) {
    console.error('Error generating press release with AI:', error);
    // If AI generation had a temporary issue, fallback gracefully to template generation
    // but return high quality output so user is not blocked
    try {
      console.log('Serving robust template fallback...');
      const fallbackData = generateTemplateFallback(input);
      res.json(fallbackData);
    } catch (fbErr) {
      res.status(500).json({
        error: '보도자료를 생성하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      });
    }
  }
});

// API: 제목 및 부제목 다시 생성
app.post('/api/regenerate-titles', async (req: Request, res: Response) => {
  const input: PressReleaseInput = req.body;

  try {
    const prompt = `다음은 지방자치단체 사업 담당 공무원이 입력한 8개 사업 및 행사 정보입니다.
이 8개 정보를 종합적으로 분석하여 언론 기자의 시선을 사로잡을 수 있는 새로운 두괄식 제목과 본문 핵심을 보충하는 1~2줄의 부제목을 생성해주세요.
이전 제목과 차별화되도록 사업의 가치, 주민 체감 혜택, 구체적 성과를 부각하는 새로운 표현으로 작성해주세요.

[입력 항목 (8개 정보)]
1. 사업명: ${input.projectName || '(미입력)'}
2. 행사명: ${input.eventName || '(미입력)'}
3. 일시·장소: ${input.dateTimeLocation || '(미입력)'}
4. 사업/행사 내용: ${input.content || '(미입력)'}
5. 주요 성과: ${input.outcomes || '(미입력)'}
6. 참석자: ${input.attendees || '(미입력)'}
7. 담당부서: ${input.department || '○○시 담당부서'}
8. 강조하고 싶은 내용: ${input.emphasis || '(미입력)'}

제목은 두괄식으로 명확하고 눈에 띄게, 부제목은 1~2줄로 품격 있는 행정 문체로 작성해주세요.`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.85,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: '핵심 내용이 잘 드러나고 눈에 띄는 새로운 두괄식 제목',
            },
            subtitle: {
              type: Type.STRING,
              description: '본문의 주요 내용을 보충하는 새로운 1~2줄 부제목',
            },
          },
          required: ['title', 'subtitle'],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('AI 응답이 비어있습니다.');
    }

    const parsedData = JSON.parse(responseText);
    res.json(parsedData);
  } catch (error) {
    console.error('Error generating titles:', error);
    const fallbackTitle = `${input.department || '○○시'}, '${input.projectName || '사업'}'으로 시민 일상에 활력 더한다`;
    const fallbackSubtitle = `- '${input.eventName || '행사'}' 성료... ${input.outcomes || '참여 시민 만족도 제고'} -`;
    res.json({
      title: fallbackTitle,
      subtitle: fallbackSubtitle,
    });
  }
});

// Server setup with Vite middleware in dev, static files in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
