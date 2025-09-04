'use client'

import { useEffect, useRef, useState } from 'react';
import { Card, Select, Button, Space, Statistic, Row, Col, message, Spin } from 'antd';
import { ReloadOutlined, FullscreenOutlined, BarChartOutlined, TeamOutlined } from '@ant-design/icons';
import { 
  Student, 
  StudentRelationship, 
  NetworkAnalysis, 
  ClassNetworkSummary,
  SurveyAnalysisResult,
  NetworkVisualizationNode,
  NetworkVisualizationEdge,
  AnalysisInsight,
  Recommendation
} from '@/lib/types/relationships';
import InsightsDisplay from './InsightsDisplay';

interface NetworkData {
  students: Student[];
  relationships: StudentRelationship[];
  networkAnalysis: NetworkAnalysis[];
  classSummary: ClassNetworkSummary;
}

interface RelationshipNetworkProps {
  surveyId?: string;
  enableAnalysis?: boolean;
}

const RelationshipNetwork: React.FC<RelationshipNetworkProps> = ({ 
  surveyId, 
  enableAnalysis = true 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedView, setSelectedView] = useState<'friend' | 'collaboration' | 'trust' | 'all'>('all');
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState<AnalysisInsight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [nodes, setNodes] = useState<NetworkVisualizationNode[]>([]);
  const [edges, setEdges] = useState<NetworkVisualizationEdge[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const [windowWidth, setWindowWidth] = useState(900); // 기본값

  // 터치 제스처 핸들링
  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: TouchList) => {
    if (touches.length === 0) return { x: 0, y: 0 };
    if (touches.length === 1) return { x: touches[0].clientX, y: touches[0].clientY };
    
    const x = (touches[0].clientX + touches[1].clientX) / 2;
    const y = (touches[0].clientY + touches[1].clientY) / 2;
    return { x, y };
  };

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      // 단일 터치 - 패닝 시작
      setIsPanning(true);
      const touch = e.touches[0];
      setLastPanPosition({ x: touch.clientX, y: touch.clientY });
    } else if (e.touches.length === 2) {
      // 두 손가락 터치 - 줌 시작
      setIsPanning(false);
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && isPanning) {
      // 패닝
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastPanPosition.x;
      const deltaY = touch.clientY - lastPanPosition.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPosition({ x: touch.clientX, y: touch.clientY });
    } else if (e.touches.length === 2) {
      // 핀치 투 줌
      const distance = getTouchDistance(e.touches);
      if (lastTouchDistance > 0) {
        const scale = distance / lastTouchDistance;
        const newZoom = Math.max(0.5, Math.min(3, zoomLevel * scale));
        setZoomLevel(newZoom);
      }
      setLastTouchDistance(distance);
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    setIsPanning(false);
    setLastTouchDistance(0);
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    const newZoom = Math.max(0.5, Math.min(3, zoomLevel + delta));
    setZoomLevel(newZoom);
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // 더미 데이터 생성 (실제 데이터가 없을 때 사용)
  const generateDummyData = (): NetworkData => {
    const maleNames = ['김민수', '이준호', '박대현', '최태민', '정현우', '장민재', '윤성호', '임도현', '한지훈', '강민석'];
    const femaleNames = ['이지은', '박수영', '최서연', '정하늘', '김소희', '윤예린', '한유진', '장서영', '임채원', '강지민'];
    
    const students: Student[] = [];
    
    // 남학생 14명
    for (let i = 0; i < 14; i++) {
      students.push({
        id: `male_${i + 1}`,
        name: maleNames[i % maleNames.length] + (Math.floor(i / maleNames.length) > 0 ? (Math.floor(i / maleNames.length) + 1) : ''),
        number: i + 1,
        gender: 'M',
        classId: 'class-1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    // 여학생 14명  
    for (let i = 0; i < 14; i++) {
      students.push({
        id: `female_${i + 1}`,
        name: femaleNames[i % femaleNames.length] + (Math.floor(i / femaleNames.length) > 0 ? (Math.floor(i / femaleNames.length) + 1) : ''),
        number: i + 15,
        gender: 'F',
        classId: 'class-1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    const sortedStudents = students.sort((a, b) => a.number - b.number);

    const relationships: StudentRelationship[] = [];
    const relationshipTypes: ('friend' | 'collaboration' | 'trust')[] = ['friend', 'collaboration', 'trust'];
    
    // 랜덤하게 관계 생성
    for (let i = 0; i < 80; i++) {
      const from = Math.floor(Math.random() * 28);
      const to = Math.floor(Math.random() * 28);
      
      if (from !== to) {
        relationships.push({
          id: `rel-${i}`,
          surveyId: surveyId || 'dummy-survey',
          fromStudentId: sortedStudents[from].id,
          toStudentId: sortedStudents[to].id,
          relationshipType: relationshipTypes[Math.floor(Math.random() * 3)],
          strength: Math.floor(Math.random() * 3) + 1,
          isReciprocal: Math.random() > 0.7,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 더미 네트워크 분석 데이터
    const networkAnalysis: NetworkAnalysis[] = sortedStudents.map(student => ({
      id: `analysis-${student.id}`,
      surveyId: surveyId || 'dummy-survey',
      studentId: student.id,
      degreeCentrality: Math.random() * 0.8 + 0.1,
      betweennessCentrality: Math.random() * 0.6,
      closenessCentrality: Math.random() * 0.7 + 0.2,
      eigenvectorCentrality: Math.random() * 0.5,
      totalConnections: Math.floor(Math.random() * 8) + 1,
      incomingConnections: Math.floor(Math.random() * 5),
      outgoingConnections: Math.floor(Math.random() * 5),
      reciprocalConnections: Math.floor(Math.random() * 3),
      isolationRisk: Math.random() > 0.8 ? 'high' : Math.random() > 0.6 ? 'medium' : 'low',
      popularityScore: Math.random(),
      sociabilityScore: Math.random(),
      analyzedAt: new Date().toISOString()
    }));

    // 더미 클래스 요약
    const classSummary: ClassNetworkSummary = {
      id: `summary-${surveyId || 'dummy'}`,
      surveyId: surveyId || 'dummy-survey',
      classId: 'class-1',
      totalStudents: 28,
      totalRelationships: relationships.length,
      networkDensity: relationships.length / (28 * 27), // 최대 가능한 관계 수로 나눔
      avgPathLength: 2.5,
      clusteringCoefficient: 0.3,
      identifiedGroups: [
        {
          id: 'group-1',
          name: '친구 그룹 1',
          studentIds: students.slice(0, 5).map(s => s.id),
          groupType: 'friend_group',
          cohesionScore: 0.8,
          avgRelationshipStrength: 2.5
        }
      ],
      isolatedStudents: networkAnalysis.filter(a => a.isolationRisk === 'high').map(a => a.studentId),
      popularStudents: networkAnalysis
        .sort((a, b) => b.popularityScore - a.popularityScore)
        .slice(0, 3)
        .map(a => a.studentId),
      bridgeStudents: networkAnalysis
        .sort((a, b) => b.betweennessCentrality - a.betweennessCentrality)
        .slice(0, 3)
        .map(a => a.studentId),
      analyzedAt: new Date().toISOString()
    };

    return { students: sortedStudents, relationships, networkAnalysis, classSummary };
  };

  // 실제 관계 분석 API 호출
  const performAnalysis = async () => {
    if (!surveyId && !enableAnalysis) return;
    
    setAnalyzing(true);
    try {
      // 설문 응답 데이터 가져오기 (로컬스토리지에서)
      const storedResponses = localStorage.getItem('survey_responses');
      const allResponses = storedResponses ? JSON.parse(storedResponses) : [];
      const surveyResponses = allResponses.filter((r: any) => r.surveyId === surveyId);

      if (surveyResponses.length === 0) {
        console.log('No survey responses found, using dummy data');
        const dummyData = generateDummyData();
        setNetworkData(dummyData);
        setAnalyzing(false);
        return;
      }

      // 학생 데이터 생성 (더미 데이터 사용)
      const students = generateDummyData().students;

      // 응답 데이터를 API 형식으로 변환
      const transformedResponses = surveyResponses.map((response: any, index: number) => {
        // 학생 정보가 있다면 해당 학생의 ID를 사용, 없다면 응답 순서대로 학생 ID 할당
        let respondentId = `male_${index + 1}`; // 기본값
        
        if (response.studentInfo && response.studentInfo.name) {
          const matchedStudent = students.find(s => s.name === response.studentInfo.name);
          if (matchedStudent) {
            respondentId = matchedStudent.id;
          }
        }

        return {
          id: response.id,
          surveyId: response.surveyId,
          respondentId,
          responses: response.responses.map((r: any) => ({
            questionId: r.questionId,
            selectedStudentIds: Array.isArray(r.selectedStudents) ? r.selectedStudents : []
          })),
          submittedAt: response.submittedAt
        };
      });

      const response = await fetch('/api/relationships/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surveyId,
          responses: transformedResponses,
          students,
          classId: 'class-1',
          surveyTitle: '6학년 1반 친구 관계 조사'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze relationships');
      }

      const result = await response.json();
      const analysisData: SurveyAnalysisResult = result.data;
      
      setNetworkData(analysisData.networkData);
      setInsights(analysisData.insights);
      setRecommendations(analysisData.recommendations);
      
      message.success(`관계 분석이 완료되었습니다. ${analysisData.insights.length}개의 인사이트를 발견했습니다.`);
      
    } catch (error) {
      console.error('Analysis failed:', error);
      message.error('관계 분석에 실패했습니다. 더미 데이터를 사용합니다.');
      
      // 실패 시 더미 데이터 사용
      const dummyData = generateDummyData();
      setNetworkData(dummyData);
    } finally {
      setAnalyzing(false);
    }
  };

  // 네트워크 시각화 데이터 변환
  const transformToVisualizationData = (data: NetworkData) => {
    const filteredRelationships = selectedView === 'all' 
      ? data.relationships 
      : data.relationships.filter(rel => rel.relationshipType === selectedView);

    // 노드 변환 (모바일 최적화 포함)
    const transformedNodes: NetworkVisualizationNode[] = data.students.map(student => {
      const analysis = data.networkAnalysis.find(a => a.studentId === student.id);
      const isIsolated = data.classSummary.isolatedStudents.includes(student.id);
      const isPopular = data.classSummary.popularStudents.includes(student.id);
      const isBridge = data.classSummary.bridgeStudents.includes(student.id);

      let color = student.gender === 'M' ? '#4096ff' : '#f759ab'; // 기본: 남자는 파랑, 여자는 핑크
      if (isIsolated) color = '#ff4d4f'; // 고립: 빨강
      else if (isPopular) color = '#52c41a'; // 인기: 초록
      else if (isBridge) color = '#faad14'; // 브릿지: 주황

      // 모바일에서 더 작은 반지름 사용
      const containerWidth = windowWidth;
      const isMobile = containerWidth < 768;
      const baseRadius = isMobile ? 6 : 8;
      const maxRadius = isMobile ? 18 : 25;
      
      return {
        id: student.id,
        name: student.name,
        x: Math.random() * (isMobile ? containerWidth - 100 : 800) + 50,
        y: Math.random() * (isMobile ? 350 : 600) + 50,
        radius: Math.max(baseRadius, Math.min(maxRadius, (analysis?.degreeCentrality || 0) * 25 + baseRadius)),
        color,
        centralityScore: analysis?.degreeCentrality || 0,
        connections: analysis?.totalConnections || 0,
        group: isIsolated ? 'isolated' : isPopular ? 'popular' : isBridge ? 'bridge' : 'normal'
      };
    });

    // 엣지 변환
    const transformedEdges: NetworkVisualizationEdge[] = filteredRelationships.map(rel => {
      let color = '#d9d9d9';
      if (rel.relationshipType === 'friend') color = '#52c41a';
      else if (rel.relationshipType === 'collaboration') color = '#1890ff';
      else if (rel.relationshipType === 'trust') color = '#722ed1';

      return {
        id: rel.id,
        source: rel.fromStudentId,
        target: rel.toStudentId,
        weight: rel.strength,
        type: rel.relationshipType,
        color,
        isReciprocal: rel.isReciprocal
      };
    });

    setNodes(transformedNodes);
    setEdges(transformedEdges);
  };

  // Force-directed layout 알고리즘
  const runForceSimulation = () => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = svgRef.current;
    // 반응형 크기 계산
    const containerWidth = svg.clientWidth || svg.parentElement?.clientWidth || 900;
    const isMobile = containerWidth < 768;
    const width = Math.max(containerWidth, 320);
    const height = isMobile ? Math.min(400, width * 0.75) : 600;

    // 노드들을 복사하여 시뮬레이션 실행
    const simulationNodes = [...nodes];
    const simulationEdges = [...edges];

    // Force simulation
    for (let i = 0; i < 300; i++) {
      // Repulsion between nodes (척력)
      for (let j = 0; j < simulationNodes.length; j++) {
        for (let k = j + 1; k < simulationNodes.length; k++) {
          const node1 = simulationNodes[j];
          const node2 = simulationNodes[k];
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const force = 2000 / (distance * distance);
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            node1.x -= fx;
            node1.y -= fy;
            node2.x += fx;
            node2.y += fy;
          }
        }
      }

      // Attraction for connected nodes (인력)
      simulationEdges.forEach(edge => {
        const source = simulationNodes.find(n => n.id === edge.source);
        const target = simulationNodes.find(n => n.id === edge.target);
        
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const force = distance * 0.01 * edge.weight;
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            source.x += fx;
            source.y += fy;
            target.x -= fx;
            target.y -= fy;
          }
        }
      });

      // Keep nodes within bounds
      simulationNodes.forEach(node => {
        node.x = Math.max(node.radius, Math.min(width - node.radius, node.x));
        node.y = Math.max(node.radius, Math.min(height - node.radius, node.y));
      });
    }

    // 시뮬레이션 결과를 DOM에 반영
    renderNetwork(simulationNodes, simulationEdges);
  };

  // 네트워크 렌더링
  const renderNetwork = (renderNodes: NetworkVisualizationNode[], renderEdges: NetworkVisualizationEdge[]) => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    svg.innerHTML = '';

    // 엣지 그리기
    renderEdges.forEach(edge => {
      const source = renderNodes.find(n => n.id === edge.source);
      const target = renderNodes.find(n => n.id === edge.target);
      
      if (source && target) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // 곡선 경로 계산
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const curve = distance * 0.2;
        
        const controlX = (source.x + target.x) / 2 + dy * curve / distance;
        const controlY = (source.y + target.y) / 2 - dx * curve / distance;
        
        const pathData = `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`;
        path.setAttribute('d', pathData);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', edge.color);
        path.setAttribute('stroke-width', String(edge.weight * 1.5));
        path.setAttribute('stroke-opacity', '0.7');
        
        if (edge.type === 'collaboration') {
          path.setAttribute('stroke-dasharray', '5,5');
        } else if (edge.type === 'trust') {
          path.setAttribute('stroke-dasharray', '2,2');
        }
        
        path.addEventListener('mouseenter', () => {
          path.setAttribute('stroke-opacity', '1');
          path.setAttribute('stroke-width', String(edge.weight * 2));
        });
        
        path.addEventListener('mouseleave', () => {
          path.setAttribute('stroke-opacity', '0.7');
          path.setAttribute('stroke-width', String(edge.weight * 1.5));
        });
        
        svg.appendChild(path);
      }
    });

    // 노드 그리기
    renderNodes.forEach(node => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
      
      // 노드 원
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', String(node.radius));
      circle.setAttribute('fill', node.color);
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
      
      // 노드 텍스트 (모바일 최적화)
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dy', '0.3em');
      text.setAttribute('fill', '#fff');
      const fontSize = node.radius > 12 ? '10px' : '8px';
      text.setAttribute('font-size', fontSize);
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('pointer-events', 'none');
      // 모바일에서 더 짧게 텍스트 표시
      const maxLength = node.radius > 15 ? 4 : 2;
      text.textContent = node.name.length > maxLength ? node.name.substring(0, maxLength - 1) + '…' : node.name;
      
      // 중심성 점수 표시
      const scoreText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      scoreText.setAttribute('text-anchor', 'middle');
      scoreText.setAttribute('dy', String(node.radius + 15));
      scoreText.setAttribute('fill', '#666');
      scoreText.setAttribute('font-size', '8px');
      scoreText.setAttribute('pointer-events', 'none');
      scoreText.textContent = `${(node.centralityScore * 100).toFixed(0)}%`;
      
      // 호버 및 터치 효과
      const handleInteractionStart = () => {
        circle.setAttribute('r', String(node.radius * 1.2));
        circle.setAttribute('stroke-width', '3');
        setSelectedNode(node.id);
      };

      const handleInteractionEnd = () => {
        circle.setAttribute('r', String(node.radius));
        circle.setAttribute('stroke-width', '2');
        if (!isDragging) {
          setSelectedNode(null);
        }
      };

      // 마우스 이벤트
      group.addEventListener('mouseenter', handleInteractionStart);
      group.addEventListener('mouseleave', handleInteractionEnd);

      // 터치 이벤트 (모바일)
      group.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleInteractionStart();
      }, { passive: false });

      group.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleInteractionEnd();
      }, { passive: false });

      // 클릭/탭 이벤트
      group.addEventListener('click', (e) => {
        e.preventDefault();
        // 노드 정보를 콘솔에 출력하거나 상태에 저장
        console.log(`선택된 학생: ${node.name}`, {
          중심성: `${(node.centralityScore * 100).toFixed(1)}%`,
          연결수: node.connections,
          그룹: node.group
        });
      });
      
      group.appendChild(circle);
      group.appendChild(text);
      group.appendChild(scoreText);
      svg.appendChild(group);
    });
  };

  // 데이터 로드
  useEffect(() => {
    if (surveyId || enableAnalysis) {
      performAnalysis();
    } else {
      // surveyId가 없으면 더미 데이터 사용
      const dummyData = generateDummyData();
      setNetworkData(dummyData);
    }
  }, [surveyId]);

  // 네트워크 데이터가 변경되면 시각화 업데이트
  useEffect(() => {
    if (networkData) {
      transformToVisualizationData(networkData);
    }
  }, [networkData, selectedView]);

  // 노드와 엣지가 변경되면 시뮬레이션 실행
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => runForceSimulation(), 100);
    }
  }, [nodes, edges]);

  // SVG 터치 이벤트 연결
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // 터치 이벤트 리스너 추가
    svg.addEventListener('touchstart', handleTouchStart, { passive: false });
    svg.addEventListener('touchmove', handleTouchMove, { passive: false });
    svg.addEventListener('touchend', handleTouchEnd, { passive: false });
    svg.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      // 이벤트 리스너 제거
      svg.removeEventListener('touchstart', handleTouchStart);
      svg.removeEventListener('touchmove', handleTouchMove);
      svg.removeEventListener('touchend', handleTouchEnd);
      svg.removeEventListener('wheel', handleWheel);
    };
  }, [isPanning, lastTouchDistance, lastPanPosition, zoomLevel]);

  // 윈도우 크기 변경 감지
  useEffect(() => {
    const updateWindowWidth = () => {
      setWindowWidth(window.innerWidth);
    };

    // 초기 크기 설정
    updateWindowWidth();

    // 윈도우 크기 변경 이벤트 리스너
    window.addEventListener('resize', updateWindowWidth);
    window.addEventListener('orientationchange', updateWindowWidth);

    return () => {
      window.removeEventListener('resize', updateWindowWidth);
      window.removeEventListener('orientationchange', updateWindowWidth);
    };
  }, []);

  if (analyzing) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px' }}>관계 분석을 진행 중입니다...</p>
          <p style={{ color: '#666', fontSize: '14px' }}>
            설문 응답을 분석하여 학생 간 관계 네트워크를 구성하고 있습니다.
          </p>
        </div>
      </Card>
    );
  }

  if (!networkData) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <TeamOutlined style={{ fontSize: '48px', color: '#ccc' }} />
          <p style={{ marginTop: '16px' }}>네트워크 데이터를 불러오는 중...</p>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* 네트워크 통계 - 모바일 최적화 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={12} sm={6}>
          <Statistic
            title="전체 학생 수"
            value={networkData.classSummary.totalStudents}
            prefix={<TeamOutlined />}
            valueStyle={{ color: '#1890ff', fontSize: '16px' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="관계 연결"
            value={networkData.classSummary.totalRelationships}
            prefix={<BarChartOutlined />}
            valueStyle={{ color: '#52c41a', fontSize: '16px' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="네트워크 밀도"
            value={(networkData.classSummary.networkDensity * 100).toFixed(1)}
            suffix="%"
            valueStyle={{ color: '#722ed1', fontSize: '16px' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="고립 위험"
            value={networkData.classSummary.isolatedStudents.length}
            suffix="명"
            valueStyle={{ 
              color: networkData.classSummary.isolatedStudents.length > 0 ? '#ff4d4f' : '#52c41a',
              fontSize: '16px' 
            }}
          />
        </Col>
      </Row>

      {/* 컨트롤 패널 - 모바일 최적화 */}
      <Card 
        title={
          <span style={{ fontSize: windowWidth < 768 ? '16px' : '18px' }}>
            학급 관계 네트워크
          </span>
        }
        extra={
          windowWidth < 768 ? (
            // 모바일 레이아웃: 세로 배열
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <Select
                value={selectedView}
                onChange={setSelectedView}
                style={{ width: '100%' }}
                size="small"
              >
                <Select.Option value="all">전체 관계</Select.Option>
                <Select.Option value="friend">친구 관계</Select.Option>
                <Select.Option value="collaboration">협력 관계</Select.Option>
                <Select.Option value="trust">신뢰 관계</Select.Option>
              </Select>
              <Space size="small" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={() => runForceSimulation()}
                  title="레이아웃 재정렬"
                  size="small"
                  style={{ flex: 1 }}
                >
                  재정렬
                </Button>
                <Button 
                  icon={<BarChartOutlined />} 
                  onClick={performAnalysis}
                  loading={analyzing}
                  title="관계 분석 재실행"
                  size="small"
                  style={{ flex: 1 }}
                >
                  분석
                </Button>
                <Button 
                  icon={<FullscreenOutlined />}
                  title="화면 초기화"
                  onClick={resetView}
                  size="small"
                  style={{ flex: 1 }}
                >
                  초기화
                </Button>
              </Space>
            </div>
          ) : (
            // 데스크탑 레이아웃: 가로 배열
            <Space direction="vertical" size="small" style={{ display: 'flex' }}>
              <Select
                value={selectedView}
                onChange={setSelectedView}
                style={{ width: 120 }}
                size="middle"
              >
                <Select.Option value="all">전체 관계</Select.Option>
                <Select.Option value="friend">친구 관계</Select.Option>
                <Select.Option value="collaboration">협력 관계</Select.Option>
                <Select.Option value="trust">신뢰 관계</Select.Option>
              </Select>
              <Space size="small">
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={() => runForceSimulation()}
                  title="레이아웃 재정렬"
                  size="middle"
                />
                <Button 
                  icon={<BarChartOutlined />} 
                  onClick={performAnalysis}
                  loading={analyzing}
                  title="관계 분석 재실행"
                  size="middle"
                />
                <Button 
                  icon={<FullscreenOutlined />}
                  title="화면 초기화"
                  onClick={resetView}
                  size="middle"
                />
              </Space>
            </Space>
          )
        }
        bodyStyle={{ 
          padding: windowWidth < 768 ? '12px' : '24px' 
        }}
      >
        {/* 범례 - 모바일 최적화 */}
        <div style={{ 
          marginBottom: '16px', 
          padding: windowWidth < 768 ? '8px' : '12px', 
          background: '#fafafa', 
          borderRadius: '6px',
          display: 'grid',
          gridTemplateColumns: windowWidth < 768 ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: windowWidth < 768 ? '8px' : '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#52c41a', borderRadius: '50%' }} />
            <span style={{ fontSize: '12px' }}>인기 학생</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#faad14', borderRadius: '50%' }} />
            <span style={{ fontSize: '12px' }}>브릿지 학생</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#ff4d4f', borderRadius: '50%' }} />
            <span style={{ fontSize: '12px' }}>고립 위험</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '2px', backgroundColor: '#52c41a' }} />
            <span style={{ fontSize: '12px' }}>친구 관계</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '2px', backgroundColor: '#1890ff', background: 'repeating-linear-gradient(to right, #1890ff 0px, #1890ff 5px, transparent 5px, transparent 10px)' }} />
            <span style={{ fontSize: '12px' }}>협력 관계</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '2px', backgroundColor: '#722ed1', background: 'repeating-linear-gradient(to right, #722ed1 0px, #722ed1 2px, transparent 2px, transparent 4px)' }} />
            <span style={{ fontSize: '12px' }}>신뢰 관계</span>
          </div>
        </div>

        {/* SVG 네트워크 시각화 - 모바일 최적화 */}
        <div style={{ 
          width: '100%', 
          height: windowWidth < 768 ? '400px' : '600px', 
          border: '1px solid #d9d9d9', 
          borderRadius: '6px', 
          overflow: 'hidden',
          touchAction: 'none', // 터치 스크롤 방지
          position: 'relative'
        }}>
          <svg 
            ref={svgRef}
            width="100%" 
            height="100%" 
            viewBox={`0 0 ${windowWidth < 768 ? Math.min(windowWidth - 40, 400) : 900} ${windowWidth < 768 ? 400 : 600}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ 
              background: '#fff', 
              cursor: isPanning ? 'grabbing' : 'grab',
              transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.1s ease-out'
            }}
          />
          
          {/* 줌 컨트롤 버튼 - 모바일용 */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            zIndex: 10
          }}>
            <Button 
              size="small"
              type="text"
              onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.2))}
              style={{ 
                background: 'rgba(255,255,255,0.9)', 
                border: '1px solid #d9d9d9',
                minWidth: '28px',
                height: '28px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              +
            </Button>
            <Button 
              size="small"
              type="text"
              onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.2))}
              style={{ 
                background: 'rgba(255,255,255,0.9)', 
                border: '1px solid #d9d9d9',
                minWidth: '28px',
                height: '28px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              −
            </Button>
            <Button 
              size="small"
              type="text"
              onClick={resetView}
              title="원래 크기로"
              style={{ 
                background: 'rgba(255,255,255,0.9)', 
                border: '1px solid #d9d9d9',
                minWidth: '28px',
                height: '28px',
                fontSize: '10px'
              }}
            >
              1:1
            </Button>
          </div>
          
          {/* 줌 레벨 표시 */}
          {windowWidth < 768 && (
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              zIndex: 10
            }}>
              {Math.round(zoomLevel * 100)}%
            </div>
          )}
        </div>

        {/* 모바일용 선택된 노드 정보 표시 */}
        {selectedNode && windowWidth < 768 && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: '#f0f8ff',
            border: '1px solid #1890ff',
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            {(() => {
              const node = nodes.find(n => n.id === selectedNode);
              return node ? (
                <div>
                  <strong>{node.name}</strong>
                  <div>중심성: {(node.centralityScore * 100).toFixed(1)}%</div>
                  <div>연결수: {node.connections}개</div>
                  <div>유형: {
                    node.group === 'popular' ? '인기 학생' :
                    node.group === 'bridge' ? '브릿지 학생' :
                    node.group === 'isolated' ? '고립 위험' : '일반 학생'
                  }</div>
                </div>
              ) : null;
            })()}
          </div>
        )}

      </Card>

      {/* AI 인사이트 및 추천사항 표시 */}
      {(insights.length > 0 || recommendations.length > 0) && (
        <InsightsDisplay 
          insights={insights}
          recommendations={recommendations}
          classSummary={networkData.classSummary}
        />
      )}
    </div>
  );
};

export default RelationshipNetwork;