// 학생 관계 분석을 위한 데이터 타입 정의

export interface Student {
  id: string;
  name: string;
  number: number;
  gender: 'M' | 'F';
  classId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  name: string; // 예: "6학년 1반"
  teacherId: string;
  totalStudents: number;
  academicYear: string;
  semester: string;
  createdAt: string;
  updatedAt: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  classId: string;
  teacherId: string;
  status: 'draft' | 'active' | 'completed' | 'paused';
  anonymous: boolean;
  startDate: string;
  endDate: string;
  questions: SurveyQuestion[];
  totalResponses: number;
  autoAnalysis: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyQuestion {
  id: string;
  surveyId: string;
  type: 'friend_selection' | 'collaboration' | 'trust' | 'conflict';
  title: string;
  description: string;
  maxSelections: number;
  order: number;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentId: string; // 응답자 학생 ID
  responses: QuestionResponse[];
  submittedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface QuestionResponse {
  questionId: string;
  selectedStudentIds: string[]; // 선택한 학생들의 ID 배열
}

// 관계 분석 결과
export interface StudentRelationship {
  id: string;
  surveyId: string;
  fromStudentId: string;
  toStudentId: string;
  relationshipType: 'friend' | 'collaboration' | 'trust' | 'conflict';
  strength: number; // 1-10 척도의 관계 강도
  isReciprocal: boolean; // 상호 선택 여부
  createdAt: string;
}

// 네트워크 분석 결과
export interface NetworkAnalysis {
  id: string;
  surveyId: string;
  studentId: string;
  // 중심성 지표들
  degreeCentrality: number;    // 연결 중심성
  betweennessCentrality: number; // 매개 중심성
  closenessCentrality: number;   // 근접 중심성
  eigenvectorCentrality: number; // 고유벡터 중심성
  // 관계 특성
  totalConnections: number;
  incomingConnections: number;  // 들어오는 관계
  outgoingConnections: number;  // 나가는 관계
  reciprocalConnections: number; // 상호 관계
  // 위험 지표
  isolationRisk: 'low' | 'medium' | 'high'; // 고립 위험도
  popularityScore: number;      // 인기도 점수
  sociabilityScore: number;     // 사교성 점수
  analyzedAt: string;
}

// 클래스 전체 네트워크 분석
export interface ClassNetworkSummary {
  id: string;
  surveyId: string;
  classId: string;
  // 전체 네트워크 지표
  totalStudents: number;
  totalRelationships: number;
  networkDensity: number;       // 네트워크 밀도 (0-1)
  avgPathLength: number;        // 평균 경로 길이
  clusteringCoefficient: number; // 군집 계수
  // 그룹 분석
  identifiedGroups: StudentGroup[];
  isolatedStudents: string[];   // 고립된 학생 ID들
  popularStudents: string[];    // 인기 학생 ID들
  bridgeStudents: string[];     // 그룹 간 연결하는 학생들
  analyzedAt: string;
  aiInsights?: string;          // AI 분석 인사이트
}

export interface StudentGroup {
  id: string;
  name: string;
  studentIds: string[];
  groupType: 'friend_group' | 'study_group' | 'isolated_pair' | 'clique';
  cohesionScore: number;        // 응집력 점수 (0-1)
  avgRelationshipStrength: number;
}

// API 응답 타입들
export interface RelationshipNetworkData {
  students: Student[];
  relationships: StudentRelationship[];
  networkAnalysis: NetworkAnalysis[];
  classSummary: ClassNetworkSummary;
}

export interface SurveyAnalysisResult {
  surveyId: string;
  surveyTitle: string;
  totalResponses: number;
  responseRate: number;
  networkData: RelationshipNetworkData;
  insights: AnalysisInsight[];
  recommendations: Recommendation[];
  generatedAt: string;
}

export interface AnalysisInsight {
  id: string;
  type: 'social_structure' | 'isolation_risk' | 'group_dynamics' | 'relationship_patterns';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  affectedStudents?: string[];
  recommendation?: string;
}

export interface Recommendation {
  id: string;
  type: 'intervention' | 'grouping' | 'monitoring' | 'support';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  targetStudents: string[];
  actionSteps: string[];
}

// 프론트엔드 상태 관리용 타입들
export interface NetworkVisualizationNode {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  centralityScore: number;
  connections: number;
  group?: string;
}

export interface NetworkVisualizationEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  type: string;
  color: string;
  isReciprocal: boolean;
}

export interface NetworkVisualizationData {
  nodes: NetworkVisualizationNode[];
  edges: NetworkVisualizationEdge[];
}