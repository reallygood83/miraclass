const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ucoeripmzhgsbebkhhpx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjb2VyaXBtemhnc2JlYmtoaHB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkyNzg1NCwiZXhwIjoyMDcyNTAzODU0fQ.BSW6f8sbR1D37hXRZqgOfH_EFmQM4nG-6tyYIpHPYJU'
);

async function confirmUserEmail() {
  console.log('이메일 확인 상태 체크 및 확인 처리...');
  
  try {
    // 1. 특정 사용자 조회
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('사용자 목록 조회 실패:', listError);
      return;
    }
    
    console.log('📋 전체 사용자 목록:');
    users.users.forEach(user => {
      console.log(`- ${user.email} | 이메일 확인: ${user.email_confirmed_at ? '✅' : '❌'} | 생성: ${new Date(user.created_at).toLocaleString()}`);
    });
    
    // 2. test@miraclass.com 사용자 찾기
    const testUser = users.users.find(u => u.email === 'test@miraclass.com');
    
    if (!testUser) {
      console.log('❌ test@miraclass.com 사용자를 찾을 수 없습니다.');
      return;
    }
    
    // 3. 이메일이 확인되지 않았다면 확인 처리
    if (!testUser.email_confirmed_at) {
      console.log('📧 이메일이 확인되지 않음. 확인 처리 중...');
      
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        testUser.id, 
        { 
          email_confirm: true 
        }
      );
      
      if (updateError) {
        console.error('이메일 확인 처리 실패:', updateError);
        return;
      }
      
      console.log('✅ 이메일 확인 처리 완료!');
    } else {
      console.log('✅ 이미 이메일이 확인된 상태입니다.');
    }
    
    // 4. users 테이블에도 사용자 정보 확인/추가
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test@miraclass.com')
      .single();
    
    if (dbError && dbError.code === 'PGRST116') {
      // 사용자가 없으면 추가
      console.log('📝 users 테이블에 사용자 정보 추가 중...');
      
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: testUser.id,
          email: testUser.email,
          name: testUser.user_metadata?.name || '테스트 사용자',
          role: testUser.user_metadata?.role || 'teacher'
        }]);
      
      if (insertError) {
        console.error('users 테이블 추가 실패:', insertError);
      } else {
        console.log('✅ users 테이블에 사용자 정보 추가 완료!');
      }
    } else if (!dbError) {
      console.log('✅ users 테이블에 이미 사용자 정보 존재:', dbUser.name);
    } else {
      console.error('users 테이블 조회 오류:', dbError);
    }
    
    console.log('\n🎉 로그인 준비 완료!');
    console.log('📧 이메일: test@miraclass.com');
    console.log('🔒 비밀번호: Mira4071!!');
    
  } catch (error) {
    console.error('처리 중 오류 발생:', error);
  }
}

confirmUserEmail();