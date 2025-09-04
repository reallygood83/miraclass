// 학생 관계 분석 알고리즘
import { 
  Student, 
  StudentRelationship, 
  NetworkAnalysis, 
  ClassNetworkSummary,
  StudentGroup,
  AnalysisInsight,
  Recommendation,
  SurveyResponse,
  QuestionResponse
} from '../types/relationships';

export class RelationshipAnalyzer {
  
  /**
   * 설문 응답을 StudentRelationship으로 변환
   */
  static processResponses(responses: SurveyResponse[]): StudentRelationship[] {
    const relationships: StudentRelationship[] = [];
    
    responses.forEach(response => {
      response.responses.forEach(questionResponse => {
        const relationshipType = this.getRelationshipTypeFromQuestionId(questionResponse.questionId);
        
        questionResponse.selectedStudentIds.forEach(selectedId => {
          relationships.push({
            id: `${response.surveyId}-${response.respondentId}-${selectedId}-${questionResponse.questionId}`,
            surveyId: response.surveyId,
            fromStudentId: response.respondentId,
            toStudentId: selectedId,
            relationshipType,
            strength: 1, // 기본 강도, 나중에 가중치 적용
            isReciprocal: false, // 나중에 계산
            createdAt: response.submittedAt
          });
        });
      });
    });

    // 상호 관계 확인
    this.markReciprocalRelationships(relationships);
    
    return relationships;
  }

  /**
   * 질문 ID로부터 관계 유형 추출
   */
  private static getRelationshipTypeFromQuestionId(questionId: string): 'friend' | 'collaboration' | 'trust' | 'conflict' {
    // 실제 구현에서는 question 데이터를 조회해야 함
    // 임시로 questionId 패턴으로 판단
    if (questionId.includes('friend')) return 'friend';
    if (questionId.includes('collaboration')) return 'collaboration';
    if (questionId.includes('trust')) return 'trust';
    if (questionId.includes('conflict')) return 'conflict';
    return 'friend'; // 기본값
  }

  /**
   * 상호 관계 표시
   */
  private static markReciprocalRelationships(relationships: StudentRelationship[]): void {
    const relationshipMap = new Map<string, StudentRelationship>();
    
    // 관계를 맵으로 저장
    relationships.forEach(rel => {
      const key = `${rel.fromStudentId}-${rel.toStudentId}-${rel.relationshipType}`;
      relationshipMap.set(key, rel);
    });
    
    // 상호 관계 확인
    relationships.forEach(rel => {
      const reverseKey = `${rel.toStudentId}-${rel.fromStudentId}-${rel.relationshipType}`;
      if (relationshipMap.has(reverseKey)) {
        rel.isReciprocal = true;
        relationshipMap.get(reverseKey)!.isReciprocal = true;
      }
    });
  }

  /**
   * 개별 학생의 네트워크 분석
   */
  static analyzeStudentNetwork(studentId: string, relationships: StudentRelationship[], allStudents: Student[]): NetworkAnalysis {
    const studentRelationships = relationships.filter(
      rel => rel.fromStudentId === studentId || rel.toStudentId === studentId
    );

    const outgoingConnections = relationships.filter(rel => rel.fromStudentId === studentId).length;
    const incomingConnections = relationships.filter(rel => rel.toStudentId === studentId).length;
    const reciprocalConnections = studentRelationships.filter(rel => rel.isReciprocal).length;
    const totalConnections = new Set([
      ...relationships.filter(rel => rel.fromStudentId === studentId).map(r => r.toStudentId),
      ...relationships.filter(rel => rel.toStudentId === studentId).map(r => r.fromStudentId)
    ]).size;

    // 중심성 지표 계산
    const degreeCentrality = this.calculateDegreeCentrality(studentId, relationships, allStudents.length);
    const betweennessCentrality = this.calculateBetweennessCentrality(studentId, relationships, allStudents);
    const closenessCentrality = this.calculateClosenessCentrality(studentId, relationships, allStudents);
    const eigenvectorCentrality = this.calculateEigenvectorCentrality(studentId, relationships, allStudents);

    // 위험도 및 점수 계산
    const isolationRisk = this.calculateIsolationRisk(totalConnections, allStudents.length);
    const popularityScore = this.calculatePopularityScore(incomingConnections, allStudents.length);
    const sociabilityScore = this.calculateSociabilityScore(outgoingConnections, totalConnections);

    return {
      id: `analysis-${studentId}-${Date.now()}`,
      surveyId: relationships[0]?.surveyId || '',
      studentId,
      degreeCentrality,
      betweennessCentrality,
      closenessCentrality,
      eigenvectorCentrality,
      totalConnections,
      incomingConnections,
      outgoingConnections,
      reciprocalConnections,
      isolationRisk,
      popularityScore,
      sociabilityScore,
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * 연결 중심성 계산
   */
  private static calculateDegreeCentrality(studentId: string, relationships: StudentRelationship[], totalStudents: number): number {
    const connections = new Set([
      ...relationships.filter(rel => rel.fromStudentId === studentId).map(r => r.toStudentId),
      ...relationships.filter(rel => rel.toStudentId === studentId).map(r => r.fromStudentId)
    ]).size;
    
    return connections / (totalStudents - 1); // 자신 제외
  }

  /**
   * 매개 중심성 계산 (단순화된 버전)
   */
  private static calculateBetweennessCentrality(studentId: string, relationships: StudentRelationship[], allStudents: Student[]): number {
    // 실제로는 모든 최단 경로를 계산해야 하지만, 단순화된 버전으로 구현
    const studentConnections = this.getDirectConnections(studentId, relationships);
    const bridgeConnections = this.countBridgeConnections(studentId, relationships, allStudents);
    
    return bridgeConnections / Math.max(1, studentConnections.length * (allStudents.length - 2));
  }

  /**
   * 근접 중심성 계산 (단순화된 버전)
   */
  private static calculateClosenessCentrality(studentId: string, relationships: StudentRelationship[], allStudents: Student[]): number {
    const distances = this.calculateShortestPaths(studentId, relationships, allStudents);
    const totalDistance = distances.reduce((sum, dist) => sum + (dist || Infinity), 0);
    
    if (totalDistance === 0 || totalDistance === Infinity) return 0;
    return (allStudents.length - 1) / totalDistance;
  }

  /**
   * 고유벡터 중심성 계산 (단순화된 버전)
   */
  private static calculateEigenvectorCentrality(studentId: string, relationships: StudentRelationship[], allStudents: Student[]): number {
    // 연결된 노드들의 중심성을 고려한 가중 점수
    const connections = this.getDirectConnections(studentId, relationships);
    if (connections.length === 0) return 0;
    
    // 임시로 연결된 노드들의 연결 수를 기반으로 계산
    let score = 0;
    connections.forEach(connectedId => {
      const connectedNodeConnections = this.getDirectConnections(connectedId, relationships);
      score += connectedNodeConnections.length;
    });
    
    return score / (allStudents.length * allStudents.length);
  }

  /**
   * 직접 연결된 학생들 가져오기
   */
  private static getDirectConnections(studentId: string, relationships: StudentRelationship[]): string[] {
    return Array.from(new Set([
      ...relationships.filter(rel => rel.fromStudentId === studentId).map(r => r.toStudentId),
      ...relationships.filter(rel => rel.toStudentId === studentId).map(r => r.fromStudentId)
    ]));
  }

  /**
   * 브릿지 연결 수 계산 (다른 그룹을 연결하는 역할)
   */
  private static countBridgeConnections(studentId: string, relationships: StudentRelationship[], allStudents: Student[]): number {
    const studentConnections = this.getDirectConnections(studentId, relationships);
    let bridgeCount = 0;
    
    for (let i = 0; i < studentConnections.length; i++) {
      for (let j = i + 1; j < studentConnections.length; j++) {
        const conn1 = studentConnections[i];
        const conn2 = studentConnections[j];
        
        // conn1과 conn2가 직접 연결되어 있지 않다면, studentId가 이들을 연결하는 브릿지 역할
        const directlyConnected = relationships.some(rel => 
          (rel.fromStudentId === conn1 && rel.toStudentId === conn2) ||
          (rel.fromStudentId === conn2 && rel.toStudentId === conn1)
        );
        
        if (!directlyConnected) {
          bridgeCount++;
        }
      }
    }
    
    return bridgeCount;
  }

  /**
   * 최단 경로 계산 (BFS 사용)
   */
  private static calculateShortestPaths(startStudent: string, relationships: StudentRelationship[], allStudents: Student[]): number[] {
    const distances: number[] = new Array(allStudents.length).fill(Infinity);
    const startIndex = allStudents.findIndex(s => s.id === startStudent);
    if (startIndex === -1) return distances;
    
    distances[startIndex] = 0;
    const queue = [startStudent];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      
      const currentIndex = allStudents.findIndex(s => s.id === currentId);
      const currentDistance = distances[currentIndex];
      
      const connections = this.getDirectConnections(currentId, relationships);
      connections.forEach(connectedId => {
        const connectedIndex = allStudents.findIndex(s => s.id === connectedId);
        if (connectedIndex !== -1 && distances[connectedIndex] > currentDistance + 1) {
          distances[connectedIndex] = currentDistance + 1;
          queue.push(connectedId);
        }
      });
    }
    
    return distances.slice(0, allStudents.length);
  }

  /**
   * 고립 위험도 계산
   */
  private static calculateIsolationRisk(totalConnections: number, classSize: number): 'low' | 'medium' | 'high' {
    const connectionRatio = totalConnections / classSize;
    
    if (connectionRatio < 0.1) return 'high';      // 10% 미만
    if (connectionRatio < 0.25) return 'medium';   // 25% 미만
    return 'low';
  }

  /**
   * 인기도 점수 계산
   */
  private static calculatePopularityScore(incomingConnections: number, classSize: number): number {
    return Math.min(1, incomingConnections / (classSize * 0.3)); // 클래스의 30%에게 선택받으면 만점
  }

  /**
   * 사교성 점수 계산
   */
  private static calculateSociabilityScore(outgoingConnections: number, totalConnections: number): number {
    if (totalConnections === 0) return 0;
    return outgoingConnections / Math.max(totalConnections, outgoingConnections);
  }

  /**
   * 클래스 전체 네트워크 분석
   */
  static analyzeClassNetwork(
    surveyId: string, 
    classId: string, 
    students: Student[], 
    relationships: StudentRelationship[]
  ): ClassNetworkSummary {
    const totalStudents = students.length;
    const totalRelationships = relationships.length;
    
    // 네트워크 밀도 계산
    const maxPossibleRelationships = totalStudents * (totalStudents - 1);
    const networkDensity = totalRelationships / maxPossibleRelationships;
    
    // 평균 경로 길이 계산 (단순화)
    const avgPathLength = this.calculateAveragePathLength(students, relationships);
    
    // 군집 계수 계산
    const clusteringCoefficient = this.calculateClusteringCoefficient(students, relationships);
    
    // 그룹 식별
    const identifiedGroups = this.identifyStudentGroups(students, relationships);
    
    // 특별한 학생들 식별
    const isolatedStudents = this.findIsolatedStudents(students, relationships);
    const popularStudents = this.findPopularStudents(students, relationships);
    const bridgeStudents = this.findBridgeStudents(students, relationships);
    
    return {
      id: `class-summary-${surveyId}-${Date.now()}`,
      surveyId,
      classId,
      totalStudents,
      totalRelationships,
      networkDensity,
      avgPathLength,
      clusteringCoefficient,
      identifiedGroups,
      isolatedStudents,
      popularStudents,
      bridgeStudents,
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * 평균 경로 길이 계산
   */
  private static calculateAveragePathLength(students: Student[], relationships: StudentRelationship[]): number {
    let totalPathLength = 0;
    let pathCount = 0;
    
    students.forEach(student => {
      const distances = this.calculateShortestPaths(student.id, relationships, students);
      distances.forEach(distance => {
        if (distance !== 0 && distance !== Infinity) {
          totalPathLength += distance;
          pathCount++;
        }
      });
    });
    
    return pathCount > 0 ? totalPathLength / pathCount : 0;
  }

  /**
   * 군집 계수 계산
   */
  private static calculateClusteringCoefficient(students: Student[], relationships: StudentRelationship[]): number {
    let totalClusteringCoeff = 0;
    
    students.forEach(student => {
      const neighbors = this.getDirectConnections(student.id, relationships);
      if (neighbors.length < 2) return;
      
      let neighborConnections = 0;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          const connected = relationships.some(rel =>
            (rel.fromStudentId === neighbors[i] && rel.toStudentId === neighbors[j]) ||
            (rel.fromStudentId === neighbors[j] && rel.toStudentId === neighbors[i])
          );
          if (connected) neighborConnections++;
        }
      }
      
      const possibleConnections = (neighbors.length * (neighbors.length - 1)) / 2;
      totalClusteringCoeff += neighborConnections / possibleConnections;
    });
    
    return students.length > 0 ? totalClusteringCoeff / students.length : 0;
  }

  /**
   * 학생 그룹 식별 (커뮤니티 탐지 알고리즘 단순화 버전)
   */
  private static identifyStudentGroups(students: Student[], relationships: StudentRelationship[]): StudentGroup[] {
    const groups: StudentGroup[] = [];
    const visited = new Set<string>();
    
    students.forEach(student => {
      if (visited.has(student.id)) return;
      
      const group = this.findConnectedComponent(student.id, relationships, visited);
      if (group.length >= 2) {
        const cohesionScore = this.calculateGroupCohesion(group, relationships);
        const avgStrength = this.calculateAverageRelationshipStrength(group, relationships);
        
        groups.push({
          id: `group-${groups.length + 1}`,
          name: `그룹 ${groups.length + 1}`,
          studentIds: group,
          groupType: this.determineGroupType(group, relationships),
          cohesionScore,
          avgRelationshipStrength: avgStrength
        });
      }
    });
    
    return groups;
  }

  /**
   * 연결된 컴포넌트 찾기 (DFS)
   */
  private static findConnectedComponent(startId: string, relationships: StudentRelationship[], visited: Set<string>): string[] {
    const component = [];
    const stack = [startId];
    
    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (visited.has(currentId)) continue;
      
      visited.add(currentId);
      component.push(currentId);
      
      const neighbors = this.getDirectConnections(currentId, relationships);
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          stack.push(neighborId);
        }
      });
    }
    
    return component;
  }

  /**
   * 그룹 응집력 계산
   */
  private static calculateGroupCohesion(groupMembers: string[], relationships: StudentRelationship[]): number {
    const groupSize = groupMembers.length;
    const maxConnections = (groupSize * (groupSize - 1)) / 2;
    
    let actualConnections = 0;
    for (let i = 0; i < groupMembers.length; i++) {
      for (let j = i + 1; j < groupMembers.length; j++) {
        const connected = relationships.some(rel =>
          (rel.fromStudentId === groupMembers[i] && rel.toStudentId === groupMembers[j]) ||
          (rel.fromStudentId === groupMembers[j] && rel.toStudentId === groupMembers[i])
        );
        if (connected) actualConnections++;
      }
    }
    
    return maxConnections > 0 ? actualConnections / maxConnections : 0;
  }

  /**
   * 평균 관계 강도 계산
   */
  private static calculateAverageRelationshipStrength(groupMembers: string[], relationships: StudentRelationship[]): number {
    const groupRelationships = relationships.filter(rel =>
      groupMembers.includes(rel.fromStudentId) && groupMembers.includes(rel.toStudentId)
    );
    
    if (groupRelationships.length === 0) return 0;
    
    const totalStrength = groupRelationships.reduce((sum, rel) => sum + rel.strength, 0);
    return totalStrength / groupRelationships.length;
  }

  /**
   * 그룹 유형 결정
   */
  private static determineGroupType(groupMembers: string[], relationships: StudentRelationship[]): 'friend_group' | 'study_group' | 'isolated_pair' | 'clique' {
    if (groupMembers.length === 2) return 'isolated_pair';
    
    const groupRelationships = relationships.filter(rel =>
      groupMembers.includes(rel.fromStudentId) && groupMembers.includes(rel.toStudentId)
    );
    
    const friendRelations = groupRelationships.filter(rel => rel.relationshipType === 'friend').length;
    const studyRelations = groupRelationships.filter(rel => rel.relationshipType === 'collaboration').length;
    const totalRelations = groupRelationships.length;
    
    if (friendRelations / totalRelations > 0.6) return 'friend_group';
    if (studyRelations / totalRelations > 0.6) return 'study_group';
    
    const cohesion = this.calculateGroupCohesion(groupMembers, relationships);
    return cohesion > 0.8 ? 'clique' : 'friend_group';
  }

  /**
   * 고립된 학생들 찾기
   */
  private static findIsolatedStudents(students: Student[], relationships: StudentRelationship[]): string[] {
    return students
      .filter(student => {
        const connections = this.getDirectConnections(student.id, relationships);
        return connections.length <= 1; // 1개 이하의 연결
      })
      .map(student => student.id);
  }

  /**
   * 인기 있는 학생들 찾기 (많은 incoming connections)
   */
  private static findPopularStudents(students: Student[], relationships: StudentRelationship[]): string[] {
    const incomingCounts = new Map<string, number>();
    
    students.forEach(student => {
      const incomingConnections = relationships.filter(rel => rel.toStudentId === student.id).length;
      incomingCounts.set(student.id, incomingConnections);
    });
    
    const averageIncoming = Array.from(incomingCounts.values()).reduce((a, b) => a + b, 0) / students.length;
    const threshold = Math.max(3, averageIncoming * 1.5); // 평균의 1.5배 또는 최소 3개
    
    return Array.from(incomingCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([studentId, _]) => studentId);
  }

  /**
   * 브릿지 역할을 하는 학생들 찾기 (그룹 간 연결)
   */
  private static findBridgeStudents(students: Student[], relationships: StudentRelationship[]): string[] {
    return students
      .filter(student => {
        const bridgeCount = this.countBridgeConnections(student.id, relationships, students);
        return bridgeCount >= 2; // 2개 이상의 브릿지 연결
      })
      .map(student => student.id);
  }

  /**
   * 분석 인사이트 생성
   */
  static generateInsights(
    networkAnalysis: NetworkAnalysis[], 
    classSummary: ClassNetworkSummary,
    students: Student[],
    relationships?: StudentRelationship[]
  ): AnalysisInsight[] {
    const insights: AnalysisInsight[] = [];
    
    // 고립 위험 학생 식별
    const highRiskStudents = networkAnalysis.filter(analysis => analysis.isolationRisk === 'high');
    if (highRiskStudents.length > 0) {
      insights.push({
        id: `insight-isolation-${Date.now()}`,
        type: 'isolation_risk',
        title: '고립 위험 학생 발견',
        description: `${highRiskStudents.length}명의 학생이 고립 위험 상태입니다. 적극적인 관심과 지원이 필요합니다.`,
        severity: 'critical',
        affectedStudents: highRiskStudents.map(a => a.studentId),
        recommendation: '개별 상담 및 그룹 활동 참여를 유도하여 사회적 연결을 강화해주세요.'
      });
    }
    
    // 네트워크 밀도 분석
    if (classSummary.networkDensity < 0.1) {
      insights.push({
        id: `insight-density-${Date.now()}`,
        type: 'social_structure',
        title: '낮은 네트워크 밀도',
        description: `학급의 관계 밀도가 ${(classSummary.networkDensity * 100).toFixed(1)}%로 낮습니다. 학생 간 상호작용이 부족합니다.`,
        severity: 'warning',
        recommendation: '전체 학급이 참여하는 협력 활동을 통해 관계 형성을 촉진해주세요.'
      });
    }

    // 성별 간 상호작용 분석
    const genderInteractionInsight = this.analyzeGenderInteraction(networkAnalysis, students);
    if (genderInteractionInsight) {
      insights.push(genderInteractionInsight);
    }

    // 인기 학생 분석 - 과도한 집중도 체크
    const popularityInsight = this.analyzePopularityConcentration(networkAnalysis, classSummary);
    if (popularityInsight) {
      insights.push(popularityInsight);
    }

    // 소그룹 형성 패턴 분석
    const subgroupInsight = this.analyzeSubgroupFormation(classSummary);
    if (subgroupInsight) {
      insights.push(subgroupInsight);
    }
    
    // 그룹 역학 분석
    const isolatedGroups = classSummary.identifiedGroups.filter(group => group.cohesionScore > 0.8);
    if (isolatedGroups.length > 2) {
      insights.push({
        id: `insight-cliques-${Date.now()}`,
        type: 'group_dynamics',
        title: '강한 소그룹 형성',
        description: `${isolatedGroups.length}개의 강한 결속력을 가진 소그룹이 발견되었습니다. 그룹 간 교류가 제한적일 수 있습니다.`,
        severity: 'warning',
        recommendation: '소그룹 간 협력 프로젝트를 통해 그룹 경계를 완화해주세요.'
      });
    }

    // 새로운 고급 분석 메서드 호출 (relationships가 있는 경우에만)
    if (relationships && relationships.length > 0) {
      // 소통 패턴 분석
      const communicationInsight = this.analyzeCommunicationPatterns(networkAnalysis, relationships, students);
      if (communicationInsight) {
        insights.push(communicationInsight);
      }

      // 정서적 분위기 분석
      const emotionalClimateInsight = this.analyzeEmotionalClimate(networkAnalysis, classSummary, relationships);
      if (emotionalClimateInsight) {
        insights.push(emotionalClimateInsight);
      }

      // 학급 역학 예측 분석
      const predictionInsight = this.predictClassroomDynamics(networkAnalysis, classSummary, relationships);
      if (predictionInsight) {
        insights.push(predictionInsight);
      }

      // 학습 협력 네트워크 분석
      const learningNetworkInsight = this.analyzeLearningCollaborationNetwork(relationships, students);
      if (learningNetworkInsight) {
        insights.push(learningNetworkInsight);
      }
    }
    
    return insights;
  }

  /**
   * 권장사항 생성
   */
  static generateRecommendations(
    networkAnalysis: NetworkAnalysis[],
    classSummary: ClassNetworkSummary,
    insights: AnalysisInsight[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // 고립 학생 지원
    if (classSummary.isolatedStudents.length > 0) {
      recommendations.push({
        id: `rec-isolation-${Date.now()}`,
        type: 'intervention',
        title: '고립 학생 통합 지원',
        description: '고립된 학생들을 위한 단계적 사회적 통합 프로그램',
        priority: 'high',
        targetStudents: classSummary.isolatedStudents,
        actionSteps: [
          '개별 상담을 통한 관심사 파악',
          '공통 관심사를 가진 학생들과 소규모 활동 진행',
          '점차 활동 규모를 확대하여 자연스러운 관계 형성 유도',
          '정기적인 모니터링 및 지속적인 지원'
        ]
      });
    }
    
    // 브릿지 학생 활용
    if (classSummary.bridgeStudents.length > 0) {
      recommendations.push({
        id: `rec-bridge-${Date.now()}`,
        type: 'grouping',
        title: '브릿지 학생 리더십 활용',
        description: '그룹 간 연결 역할을 하는 학생들의 리더십을 활용한 통합 활동',
        priority: 'medium',
        targetStudents: classSummary.bridgeStudents,
        actionSteps: [
          '브릿지 역할 학생들에게 리더 역할 부여',
          '학급 전체 활동에서 조별 구성 시 브릿지 학생을 중심으로 배치',
          '브릿지 학생들이 다양한 그룹을 연결할 수 있는 프로젝트 설계'
        ]
      });
    }
    
    // 네트워크 강화 활동
    if (classSummary.networkDensity < 0.2) {
      recommendations.push({
        id: `rec-network-${Date.now()}`,
        type: 'support',
        title: '전체 네트워크 강화',
        description: '학급 전체의 관계 밀도 향상을 위한 체계적 접근',
        priority: 'medium',
        targetStudents: [], // 전체 학급 대상
        actionSteps: [
          '무작위 팀 구성을 통한 새로운 관계 형성 기회 제공',
          '협력 학습 및 그룹 프로젝트 증대',
          '학급 내 소통을 촉진하는 활동 정기 실시',
          '월별 관계 네트워크 변화 모니터링'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * 성별 간 상호작용 패턴 분석
   */
  private static analyzeGenderInteraction(networkAnalysis: NetworkAnalysis[], students: Student[]): AnalysisInsight | null {
    const maleStudents = students.filter(s => s.gender === 'M');
    const femaleStudents = students.filter(s => s.gender === 'F');
    
    if (maleStudents.length === 0 || femaleStudents.length === 0) return null;

    const maleAnalysis = networkAnalysis.filter(a => maleStudents.find(s => s.id === a.studentId));
    const femaleAnalysis = networkAnalysis.filter(a => femaleStudents.find(s => s.id === a.studentId));

    const avgMaleConnections = maleAnalysis.reduce((sum, a) => sum + a.totalConnections, 0) / maleAnalysis.length;
    const avgFemaleConnections = femaleAnalysis.reduce((sum, a) => sum + a.totalConnections, 0) / femaleAnalysis.length;

    const connectionDiff = Math.abs(avgMaleConnections - avgFemaleConnections);
    
    if (connectionDiff > 2) {
      const moreConnectedGender = avgMaleConnections > avgFemaleConnections ? '남학생' : '여학생';
      const lessConnectedGender = avgMaleConnections > avgFemaleConnections ? '여학생' : '남학생';
      
      return {
        id: `insight-gender-${Date.now()}`,
        type: 'relationship_patterns',
        title: '성별 간 관계 형성 격차',
        description: `${moreConnectedGender}이 평균 ${Math.max(avgMaleConnections, avgFemaleConnections).toFixed(1)}개, ${lessConnectedGender}이 평균 ${Math.min(avgMaleConnections, avgFemaleConnections).toFixed(1)}개의 관계를 형성하여 격차가 있습니다.`,
        severity: 'warning',
        recommendation: `${lessConnectedGender}의 사회적 참여를 높이는 활동을 기획하고, 성별 혼합 그룹 활동을 늘려 균형적인 관계 형성을 도와주세요.`
      };
    }
    
    return null;
  }

  /**
   * 인기 학생 집중도 분석
   */
  private static analyzePopularityConcentration(networkAnalysis: NetworkAnalysis[], classSummary: ClassNetworkSummary): AnalysisInsight | null {
    if (classSummary.popularStudents.length === 0) return null;

    const popularAnalysis = networkAnalysis.filter(a => classSummary.popularStudents.includes(a.studentId));
    const totalPopularConnections = popularAnalysis.reduce((sum, a) => sum + a.incomingConnections, 0);
    const concentrationRatio = totalPopularConnections / classSummary.totalRelationships;

    if (concentrationRatio > 0.4) {
      return {
        id: `insight-popularity-${Date.now()}`,
        type: 'social_structure',
        title: '인기 학생에게 과도한 관심 집중',
        description: `전체 관계의 ${(concentrationRatio * 100).toFixed(1)}%가 소수의 인기 학생에게 집중되어 있습니다. 이는 다른 학생들의 소외감을 증가시킬 수 있습니다.`,
        severity: 'warning',
        affectedStudents: classSummary.popularStudents,
        recommendation: '다양한 학생들이 리더십을 발휘할 기회를 제공하고, 역할 순환제를 통해 균형적인 관계 분산을 유도하세요.'
      };
    }

    return null;
  }

  /**
   * 소그룹 형성 패턴 분석
   */
  private static analyzeSubgroupFormation(classSummary: ClassNetworkSummary): AnalysisInsight | null {
    const tightGroups = classSummary.identifiedGroups.filter(group => 
      group.cohesionScore > 0.8 && group.studentIds.length >= 3
    );

    if (tightGroups.length > 1) {
      const totalInGroups = tightGroups.reduce((sum, group) => sum + group.studentIds.length, 0);
      const groupRatio = totalInGroups / classSummary.totalStudents;

      if (groupRatio > 0.6) {
        return {
          id: `insight-subgroups-${Date.now()}`,
          type: 'group_dynamics',
          title: '강한 소그룹 형성 패턴',
          description: `학급의 ${(groupRatio * 100).toFixed(1)}%가 ${tightGroups.length}개의 강한 응집력을 가진 소그룹으로 나뉘어 있습니다. 그룹 간 교류가 제한적일 수 있습니다.`,
          severity: 'info',
          recommendation: '그룹 간 협력 프로젝트와 교차 활동을 통해 학급 전체의 통합성을 높이세요. 그룹 구성원을 섞은 새로운 활동을 정기적으로 진행하세요.'
        };
      }
    }

    return null;
  }

  /**
   * 관계 유형별 균형 분석
   */
  private static analyzeRelationshipTypeBalance(relationships: StudentRelationship[]): AnalysisInsight | null {
    const typeCounts = {
      friend: relationships.filter(r => r.relationshipType === 'friend').length,
      collaboration: relationships.filter(r => r.relationshipType === 'collaboration').length,
      trust: relationships.filter(r => r.relationshipType === 'trust').length,
      conflict: relationships.filter(r => r.relationshipType === 'conflict').length
    };

    const total = relationships.length;
    if (total === 0) return null;

    const friendRatio = typeCounts.friend / total;
    const collaborationRatio = typeCounts.collaboration / total;
    const trustRatio = typeCounts.trust / total;

    // 친구 관계가 과도하게 많은 경우 (80% 이상)
    if (friendRatio > 0.8) {
      return {
        id: `insight-relationship-balance-${Date.now()}`,
        type: 'relationship_patterns',
        title: '관계 유형의 불균형',
        description: `친구 관계가 전체의 ${(friendRatio * 100).toFixed(1)}%를 차지합니다. 협력이나 신뢰 관계 개발이 부족할 수 있습니다.`,
        severity: 'info',
        recommendation: '학업 협력 활동과 신뢰 구축 활동을 늘려 다양한 관계 형성을 지원하세요.'
      };
    }

    // 협력 관계가 매우 적은 경우 (10% 미만)
    if (collaborationRatio < 0.1 && total > 10) {
      return {
        id: `insight-collaboration-low-${Date.now()}`,
        type: 'relationship_patterns', 
        title: '낮은 협력 관계 비율',
        description: `전체 관계 중 협력 관계가 ${(collaborationRatio * 100).toFixed(1)}%에 불과합니다. 학업적 협력이 부족합니다.`,
        severity: 'warning',
        recommendation: '그룹 프로젝트, 페어 활동, 협력 학습 등을 통해 학생 간 협력 관계를 강화하세요.'
      };
    }

    return null;
  }

  /**
   * 소통 패턴 분석 - 학생들의 소통 스타일과 네트워크 위치 분석
   */
  private static analyzeCommunicationPatterns(
    networkAnalysis: NetworkAnalysis[], 
    relationships: StudentRelationship[], 
    students: Student[]
  ): AnalysisInsight | null {
    // 소통 스타일 분류: 적극적 소통자, 선택적 소통자, 소극적 소통자
    const communicationProfiles = networkAnalysis.map(analysis => {
      const outgoingRatio = analysis.outgoingConnections / Math.max(1, analysis.totalConnections);
      const incomingRatio = analysis.incomingConnections / Math.max(1, analysis.totalConnections);
      
      let communicationType: 'active' | 'selective' | 'passive' | 'isolated';
      if (analysis.totalConnections === 0) {
        communicationType = 'isolated';
      } else if (outgoingRatio > 0.6) {
        communicationType = 'active';
      } else if (outgoingRatio > 0.3 && analysis.reciprocalConnections > analysis.totalConnections * 0.5) {
        communicationType = 'selective';
      } else {
        communicationType = 'passive';
      }

      return {
        studentId: analysis.studentId,
        type: communicationType,
        balanceScore: Math.abs(outgoingRatio - incomingRatio),
        reciprocalRatio: analysis.reciprocalConnections / Math.max(1, analysis.totalConnections)
      };
    });

    const isolatedCount = communicationProfiles.filter(p => p.type === 'isolated').length;
    const passiveCount = communicationProfiles.filter(p => p.type === 'passive').length;
    
    if (isolatedCount + passiveCount > students.length * 0.3) {
      return {
        id: `insight-communication-${Date.now()}`,
        type: 'social_structure',
        title: '소통 참여도 불균형',
        description: `학생의 ${((isolatedCount + passiveCount) / students.length * 100).toFixed(1)}%가 소극적이거나 고립된 소통 패턴을 보입니다. 적극적인 소통 유도가 필요합니다.`,
        severity: 'warning',
        affectedStudents: communicationProfiles
          .filter(p => p.type === 'isolated' || p.type === 'passive')
          .map(p => p.studentId),
        recommendation: '소극적 소통자를 위한 구조화된 발표 기회와 소그룹 활동을 제공하여 점진적인 소통 참여를 유도하세요.'
      };
    }

    return null;
  }

  /**
   * 학급 정서적 분위기 분석 - 관계의 질과 정서적 안정성 평가
   */
  private static analyzeEmotionalClimate(
    networkAnalysis: NetworkAnalysis[], 
    classSummary: ClassNetworkSummary,
    relationships: StudentRelationship[]
  ): AnalysisInsight | null {
    // 정서적 안정성 지표 계산
    const reciprocalRelationships = relationships.filter(r => r.isReciprocal).length;
    const reciprocalRatio = reciprocalRelationships / Math.max(1, relationships.length);
    
    const avgCohesion = classSummary.identifiedGroups.length > 0 
      ? classSummary.identifiedGroups.reduce((sum, g) => sum + g.cohesionScore, 0) / classSummary.identifiedGroups.length 
      : 0;
    
    const highIsolationRisk = networkAnalysis.filter(a => a.isolationRisk === 'high').length;
    const mediumIsolationRisk = networkAnalysis.filter(a => a.isolationRisk === 'medium').length;
    
    // 정서적 안정성 점수 (0-1)
    const emotionalStabilityScore = (
      (reciprocalRatio * 0.4) + 
      (avgCohesion * 0.3) + 
      (Math.max(0, 1 - (highIsolationRisk + mediumIsolationRisk * 0.5) / networkAnalysis.length) * 0.3)
    );
    
    if (emotionalStabilityScore < 0.4) {
      return {
        id: `insight-emotional-climate-${Date.now()}`,
        type: 'group_dynamics',
        title: '학급 정서적 분위기 불안정',
        description: `학급의 정서적 안정성 점수가 ${(emotionalStabilityScore * 100).toFixed(1)}점으로 낮습니다. 상호 신뢰가 부족하고 정서적 지원 체계가 약합니다.`,
        severity: 'critical',
        affectedStudents: networkAnalysis
          .filter(a => a.isolationRisk !== 'low')
          .map(a => a.studentId),
        recommendation: '정서적 유대감 강화를 위한 서클 타임, 감정 표현 활동, 상호 칭찬하기 등의 활동을 정기적으로 실시하세요.'
      };
    } else if (emotionalStabilityScore < 0.6) {
      return {
        id: `insight-emotional-improvement-${Date.now()}`,
        type: 'group_dynamics',
        title: '정서적 분위기 개선 여지',
        description: `현재 정서적 안정성은 보통 수준입니다. 더 따뜻하고 지지적인 학급 문화 조성이 가능합니다.`,
        severity: 'info',
        recommendation: '긍정적 관계 증진을 위한 협력 활동과 서로를 알아가는 시간을 늘려보세요.'
      };
    }

    return null;
  }

  /**
   * 학급 역학 예측 분석 - 현재 패턴을 바탕으로 미래 변화 예측
   */
  private static predictClassroomDynamics(
    networkAnalysis: NetworkAnalysis[], 
    classSummary: ClassNetworkSummary,
    relationships: StudentRelationship[]
  ): AnalysisInsight | null {
    // 성장 잠재력 있는 학생 식별
    const emergingLeaders = networkAnalysis.filter(analysis => 
      analysis.betweennessCentrality > 0.1 && 
      analysis.popularityScore < 0.3 && 
      analysis.sociabilityScore > 0.6
    );

    // 관계 발전 가능성이 높은 학생들
    const relationshipGrowthCandidates = networkAnalysis.filter(analysis =>
      analysis.isolationRisk === 'medium' &&
      analysis.sociabilityScore > 0.4
    );

    // 네트워크 성장 예측
    const currentDensity = classSummary.networkDensity;
    const potentialConnections = emergingLeaders.length * 3 + relationshipGrowthCandidates.length * 2;
    const maxPossibleConnections = classSummary.totalStudents * (classSummary.totalStudents - 1);
    const growthPotential = (potentialConnections / maxPossibleConnections);

    if (emergingLeaders.length > 0 || relationshipGrowthCandidates.length > 0) {
      return {
        id: `insight-prediction-${Date.now()}`,
        type: 'social_structure',
        title: '학급 관계 발전 가능성',
        description: `${emergingLeaders.length}명의 잠재적 리더와 ${relationshipGrowthCandidates.length}명의 관계 성장 후보가 식별되었습니다. 적절한 지원으로 학급 응집력이 크게 향상될 수 있습니다.`,
        severity: 'info',
        affectedStudents: [...emergingLeaders.map(e => e.studentId), ...relationshipGrowthCandidates.map(r => r.studentId)],
        recommendation: '잠재력 있는 학생들에게 리더십 기회를 제공하고, 관계 성장 후보들을 기존 그룹 활동에 점진적으로 참여시켜주세요.'
      };
    }

    return null;
  }

  /**
   * 학습 협력 네트워크 분석 - 학습 관련 협력 패턴 분석
   */
  private static analyzeLearningCollaborationNetwork(relationships: StudentRelationship[], students: Student[]): AnalysisInsight | null {
    const collaborationRelationships = relationships.filter(r => r.relationshipType === 'collaboration');
    const trustRelationships = relationships.filter(r => r.relationshipType === 'trust');
    
    // 학습 협력 네트워크 밀도
    const learningNetworkDensity = collaborationRelationships.length / Math.max(1, relationships.length);
    
    // 학습 지원 체계 분석
    const studentsInLearningNetwork = new Set([
      ...collaborationRelationships.map(r => r.fromStudentId),
      ...collaborationRelationships.map(r => r.toStudentId),
      ...trustRelationships.map(r => r.fromStudentId),
      ...trustRelationships.map(r => r.toStudentId)
    ]);

    const coverageRatio = studentsInLearningNetwork.size / students.length;
    
    if (coverageRatio < 0.5) {
      return {
        id: `insight-learning-network-${Date.now()}`,
        type: 'relationship_patterns',
        title: '학습 협력 네트워크 부족',
        description: `전체 학생의 ${(coverageRatio * 100).toFixed(1)}%만이 학습 협력 관계에 참여하고 있습니다. 학습 지원 체계가 불충분합니다.`,
        severity: 'warning',
        affectedStudents: students
          .filter(s => !studentsInLearningNetwork.has(s.id))
          .map(s => s.id),
        recommendation: '학습 버디 시스템, 상호 멘토링, 협력 학습 모둠 등을 통해 모든 학생이 학습 지원을 받을 수 있는 체계를 구축하세요.'
      };
    }

    return null;
  }
}