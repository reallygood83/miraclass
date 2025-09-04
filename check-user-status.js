const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ucoeripmzhgsbebkhhpx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjb2VyaXBtemhnc2JlYmtoaHB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkyNzg1NCwiZXhwIjoyMDcyNTAzODU0fQ.BSW6f8sbR1D37hXRZqgOfH_EFmQM4nG-6tyYIpHPYJU'
);

async function checkUserStatus() {
  console.log('사용자 상태 확인 중...');
  
  try {
    // 1. Auth 상태 확인
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Auth 사용자 조회 실패:', authError);
      return;
    }
    
    const testUser = users.users.find(u => u.email === 'test@miraclass.com');
    if (!testUser) {
      console.log('❌ test@miraclass.com 사용자가 Auth에 없습니다.');
      return;
    }
    
    console.log('✅ Auth 사용자 확인됨:', testUser.email);
    console.log('📧 이메일 확인 상태:', testUser.email_confirmed_at ? '✅ 확인됨' : '❌ 미확인');
    
    // 2. Users 테이블 상태 확인
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test@miraclass.com')
      .single();
    
    if (dbError) {
      if (dbError.code === 'PGRST116') {
        console.log('📝 users 테이블에 사용자 없음 - 정상 (Auth만으로도 로그인 가능)');
      } else {
        console.error('users 테이블 조회 오류:', dbError);
      }
    } else {
      console.log('✅ users 테이블에 사용자 존재:', dbUser.name);
    }
    
    // 3. 로그인 테스트
    console.log('\n🔐 로그인 테스트 중...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'test@miraclass.com',
      password: 'Mira4071!!'
    });
    
    if (loginError) {
      console.error('❌ 로그인 실패:', loginError);
    } else {
      console.log('✅ 로그인 성공!');
      console.log('🎉 사용자 ID:', loginData.user?.id);
      console.log('📧 이메일:', loginData.user?.email);
      
      // 로그아웃
      await supabase.auth.signOut();
      console.log('✅ 로그아웃 완료');
    }
    
  } catch (error) {
    console.error('처리 중 오류 발생:', error);
  }
}

checkUserStatus();