const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ucoeripmzhgsbebkhhpx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjb2VyaXBtemhnc2JlYmtoaHB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjkyNzg1NCwiZXhwIjoyMDcyNTAzODU0fQ.BSW6f8sbR1D37hXRZqgOfH_EFmQM4nG-6tyYIpHPYJU'
);

async function createSpecificUser() {
  console.log('Creating test@miraclass.com with password Mira4071!!...');
  
  try {
    // Supabase Auth에 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@miraclass.com',
      password: 'Mira4071!!',
      email_confirm: true,
      user_metadata: {
        name: '테스트 사용자',
        role: 'teacher'
      }
    });

    if (authError) {
      console.error('Auth user creation failed:', authError);
      return;
    }

    console.log('✅ Auth user created:', authData.user?.email);
    console.log('🎉 계정 생성 완료!');
    console.log('Email: test@miraclass.com');
    console.log('Password: Mira4071!!');
    
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

createSpecificUser();