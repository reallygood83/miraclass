interface ApiSettings {
  geminiApiKey: string;
  openaiApiKey: string;
  preferredModel: 'gemini' | 'openai';
  autoQuestionGeneration: boolean;
  maxQuestionsPerSurvey: number;
}

interface SurveyQuestion {
  id: string;
  type: 'friend_selection' | 'collaboration' | 'trust' | 'leadership' | 'help';
  title: string;
  description: string;
  maxSelections: number;
}

export class AIService {
  private static instance: AIService;
  private settings: ApiSettings | null = null;

  private constructor() {
    this.loadSettings();
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private loadSettings(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ourClassConnect_settings');
      this.settings = saved ? JSON.parse(saved) : null;
    }
  }

  public refreshSettings(): void {
    this.loadSettings();
  }

  public hasApiKey(): boolean {
    return !!(this.settings?.geminiApiKey || this.settings?.openaiApiKey);
  }

  public getPreferredModel(): 'gemini' | 'openai' | null {
    if (!this.settings) return null;
    
    // Auto-determine if only one key is available
    if (this.settings.geminiApiKey && !this.settings.openaiApiKey) {
      return 'gemini';
    }
    if (this.settings.openaiApiKey && !this.settings.geminiApiKey) {
      return 'openai';
    }
    
    // Return user preference if both are available
    return this.settings.preferredModel || 'gemini';
  }

  /**
   * Generate survey questions using AI
   */
  public async generateSurveyQuestions(
    className: string,
    surveyPurpose: string,
    studentCount?: number
  ): Promise<SurveyQuestion[]> {
    if (!this.hasApiKey()) {
      throw new Error('API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 입력해주세요.');
    }

    const model = this.getPreferredModel();
    const maxQuestions = this.settings?.maxQuestionsPerSurvey || 5;

    const prompt = this.buildQuestionGenerationPrompt(className, surveyPurpose, maxQuestions, studentCount);

    try {
      let response: string;
      
      if (model === 'gemini') {
        response = await this.callGeminiAPI(prompt);
      } else {
        response = await this.callOpenAIAPI(prompt);
      }

      return this.parseQuestionResponse(response);
    } catch (error) {
      console.error('AI question generation failed:', error);
      throw new Error('AI 질문 생성 중 오류가 발생했습니다. API 키가 유효한지 확인해주세요.');
    }
  }

  /**
   * Analyze survey results and provide insights
   */
  public async analyzeSurveyResults(
    surveyData: any,
    studentList: string[]
  ): Promise<{
    insights: string[];
    recommendations: string[];
    riskStudents: string[];
    socialLeaders: string[];
  }> {
    if (!this.hasApiKey()) {
      throw new Error('API 키가 설정되지 않았습니다.');
    }

    const model = this.getPreferredModel();
    const prompt = this.buildAnalysisPrompt(surveyData, studentList);

    try {
      let response: string;
      
      if (model === 'gemini') {
        response = await this.callGeminiAPI(prompt);
      } else {
        response = await this.callOpenAIAPI(prompt);
      }

      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw new Error('AI 분석 중 오류가 발생했습니다.');
    }
  }

  private buildQuestionGenerationPrompt(
    className: string,
    purpose: string,
    maxQuestions: number,
    studentCount?: number
  ): string {
    return `
당신은 교육 전문가입니다. ${className}의 학생 관계 분석을 위한 설문 질문을 생성해주세요.

설문 목적: ${purpose}
학생 수: ${studentCount ? `약 ${studentCount}명` : '정보 없음'}
생성할 질문 수: ${maxQuestions}개

다음 질문 유형들을 참고하여 다양하고 균형잡힌 질문을 만들어주세요:
1. friend_selection: 친구 관계 파악
2. collaboration: 협력 관계 분석  
3. trust: 신뢰 관계 측정
4. leadership: 리더십 역할 확인
5. help: 도움 관계 파악

각 질문은 반드시 다음 JSON 형식으로 응답해주세요:
{
  "questions": [
    {
      "id": "q1",
      "type": "friend_selection",
      "title": "가장 친한 친구 3명을 선택해주세요",
      "description": "우리 반에서 가장 가까운 친구들을 선택해주세요.",
      "maxSelections": 3
    }
  ]
}

주의사항:
- 학생들이 이해하기 쉬운 언어 사용
- 부정적인 질문(갈등, 싫어하는 친구 등) 지양
- 각 질문의 maxSelections는 3-7 사이에서 적절히 설정
- 질문 유형을 골고루 분배
- 반드시 올바른 JSON 형식으로 응답
`;
  }

  private buildAnalysisPrompt(surveyData: any, studentList: string[]): string {
    return `
당신은 교육 심리학 전문가입니다. 다음 학급 관계 설문 결과를 분석하여 인사이트를 제공해주세요.

학생 목록: ${studentList.join(', ')}
설문 데이터: ${JSON.stringify(surveyData)}

다음 JSON 형식으로 분석 결과를 제공해주세요:
{
  "insights": [
    "주요 발견사항 1",
    "주요 발견사항 2",
    "주요 발견사항 3"
  ],
  "recommendations": [
    "교사를 위한 권장사항 1",
    "교사를 위한 권장사항 2"
  ],
  "riskStudents": [
    "관심이 필요한 학생명들"
  ],
  "socialLeaders": [
    "사회적 리더 역할을 하는 학생명들"
  ]
}

분석 관점:
- 사회적 연결성 (누가 인기가 있는가?)
- 고립 위험 (누가 선택받지 못했는가?)
- 그룹 형성 패턴
- 상호 선택 관계
- 리더십 역할 분포

반드시 학생들의 실명을 사용하여 구체적인 분석을 제공하고, 올바른 JSON 형식으로 응답해주세요.
`;
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    if (!this.settings?.geminiApiKey) {
      throw new Error('Gemini API 키가 없습니다.');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.settings.geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API 오류: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  }

  private async callOpenAIAPI(prompt: string): Promise<string> {
    if (!this.settings?.openaiApiKey) {
      throw new Error('OpenAI API 키가 없습니다.');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.settings.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '당신은 교육 전문가입니다. 요청받은 형식에 맞춰 정확하게 응답해주세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API 오류: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private parseQuestionResponse(response: string): SurveyQuestion[] {
    try {
      // Extract JSON from response (in case there's additional text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      
      const parsed = JSON.parse(jsonString);
      
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return parsed.questions.map((q: any, index: number) => ({
          id: q.id || `q${index + 1}`,
          type: q.type || 'friend_selection',
          title: q.title || '질문 제목',
          description: q.description || '질문 설명',
          maxSelections: q.maxSelections || 3
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Question parsing failed:', error);
      
      // Fallback: generate default questions
      return this.getDefaultQuestions();
    }
  }

  private parseAnalysisResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      
      const parsed = JSON.parse(jsonString);
      
      return {
        insights: parsed.insights || ['분석 결과를 생성할 수 없습니다.'],
        recommendations: parsed.recommendations || ['권장사항을 생성할 수 없습니다.'],
        riskStudents: parsed.riskStudents || [],
        socialLeaders: parsed.socialLeaders || []
      };
    } catch (error) {
      console.error('Analysis parsing failed:', error);
      
      return {
        insights: ['AI 분석 결과를 해석하는 중 오류가 발생했습니다.'],
        recommendations: ['수동으로 데이터를 검토해보세요.'],
        riskStudents: [],
        socialLeaders: []
      };
    }
  }

  private getDefaultQuestions(): SurveyQuestion[] {
    return [
      {
        id: 'q1',
        type: 'friend_selection',
        title: '가장 친한 친구 3명을 선택해주세요',
        description: '우리 반에서 가장 가까운 친구들을 선택해주세요.',
        maxSelections: 3
      },
      {
        id: 'q2',
        type: 'collaboration',
        title: '함께 프로젝트를 하고 싶은 친구들을 선택해주세요',
        description: '팀 프로젝트나 과제를 함께 할 때 협력하고 싶은 친구들입니다.',
        maxSelections: 5
      },
      {
        id: 'q3',
        type: 'trust',
        title: '고민을 상담하고 싶은 친구들을 선택해주세요',
        description: '개인적인 고민이나 어려움이 있을 때 도움을 구하고 싶은 친구들입니다.',
        maxSelections: 3
      }
    ];
  }

  /**
   * Test API connection
   */
  public async testApiConnection(apiType: 'gemini' | 'openai'): Promise<boolean> {
    try {
      const testPrompt = 'Hello, this is a connection test. Please respond with "Connection successful".';
      
      let response: string;
      if (apiType === 'gemini') {
        response = await this.callGeminiAPI(testPrompt);
      } else {
        response = await this.callOpenAIAPI(testPrompt);
      }
      
      return response.length > 0;
    } catch (error) {
      console.error(`${apiType} API test failed:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();