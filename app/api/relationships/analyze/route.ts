// 관계 분석 API 엔드포인트
import { NextRequest, NextResponse } from 'next/server';
import { RelationshipAnalyzer } from '@/lib/analysis/relationshipAnalyzer';
import { 
  Student, 
  SurveyResponse, 
  RelationshipNetworkData,
  SurveyAnalysisResult 
} from '@/lib/types/relationships';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { surveyId, responses, students, classId } = body;
    
    if (!surveyId || !responses || !students) {
      return NextResponse.json(
        { error: 'Missing required fields: surveyId, responses, students' },
        { status: 400 }
      );
    }

    console.log(`🔍 Starting relationship analysis for survey: ${surveyId}`);
    console.log(`📊 Analyzing ${responses.length} responses from ${students.length} students`);

    // Step 1: 설문 응답을 관계 데이터로 변환
    const relationships = RelationshipAnalyzer.processResponses(responses as SurveyResponse[]);
    console.log(`🔗 Generated ${relationships.length} relationship connections`);

    // Step 2: 각 학생의 네트워크 분석
    const networkAnalysis = students.map((student: Student) => 
      RelationshipAnalyzer.analyzeStudentNetwork(student.id, relationships, students)
    );
    console.log(`👥 Completed individual network analysis for ${networkAnalysis.length} students`);

    // Step 3: 클래스 전체 네트워크 분석
    const classSummary = RelationshipAnalyzer.analyzeClassNetwork(
      surveyId, 
      classId || 'default-class', 
      students, 
      relationships
    );
    console.log(`🏫 Completed class-wide network analysis`);
    console.log(`📈 Network density: ${(classSummary.networkDensity * 100).toFixed(1)}%`);
    console.log(`👤 Isolated students: ${classSummary.isolatedStudents.length}`);
    console.log(`⭐ Popular students: ${classSummary.popularStudents.length}`);
    console.log(`🌉 Bridge students: ${classSummary.bridgeStudents.length}`);

    // Step 4: 네트워크 데이터 구성
    const networkData: RelationshipNetworkData = {
      students,
      relationships,
      networkAnalysis,
      classSummary
    };

    // Step 5: 인사이트 및 권장사항 생성 (관계 데이터 포함)
    const insights = RelationshipAnalyzer.generateInsights(networkAnalysis, classSummary, students, relationships);
    const recommendations = RelationshipAnalyzer.generateRecommendations(networkAnalysis, classSummary, insights);

    console.log(`💡 Generated ${insights.length} insights and ${recommendations.length} recommendations`);

    // Step 6: 분석 결과 구성
    const analysisResult: SurveyAnalysisResult = {
      surveyId,
      surveyTitle: body.surveyTitle || 'Untitled Survey',
      totalResponses: responses.length,
      responseRate: (responses.length / students.length) * 100,
      networkData,
      insights,
      recommendations,
      generatedAt: new Date().toISOString()
    };

    // Step 7: 분석 결과 저장 (로컬스토리지 시뮬레이션)
    console.log(`💾 Analysis completed successfully`);
    console.log(`📋 Summary: ${networkData.relationships.length} relationships, ${insights.length} insights, ${recommendations.length} recommendations`);

    return NextResponse.json({
      success: true,
      data: analysisResult,
      message: `Successfully analyzed ${responses.length} responses and generated comprehensive relationship insights.`
    });

  } catch (error) {
    console.error('❌ Relationship analysis failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze relationships',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 분석 결과 조회 엔드포인트
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get('surveyId');
    
    if (!surveyId) {
      return NextResponse.json(
        { error: 'Missing surveyId parameter' },
        { status: 400 }
      );
    }

    // 실제 구현에서는 데이터베이스에서 조회
    // 현재는 로컬스토리지 시뮬레이션
    console.log(`📖 Fetching analysis results for survey: ${surveyId}`);
    
    // 임시 응답 - 실제로는 저장된 분석 결과를 반환
    return NextResponse.json({
      success: true,
      message: 'Analysis results retrieved successfully',
      data: null // 실제 데이터로 교체 필요
    });

  } catch (error) {
    console.error('❌ Failed to fetch analysis results:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch analysis results',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}