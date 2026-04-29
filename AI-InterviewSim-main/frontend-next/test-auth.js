/**
 * Test Supabase Authentication
 * Simple version without dotenv dependency
 */

const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔐 Testing Supabase Authentication...\n');
console.log('Supabase URL:', supabaseUrl);
console.log('API Key starts with:', supabaseAnonKey?.substring(0, 20) + '...');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

async function testGoogleOAuth() {
  console.log('1️⃣  Testing Google OAuth availability...');
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabaseAnonKey }
    });
    const settings = await response.json();

    const googleEnabled = settings.external?.google;
    const emailEnabled = settings.external?.email;

    console.log('   Google OAuth:', googleEnabled ? '✅ Enabled' : '❌ Disabled');
    console.log('   Email Auth:', emailEnabled ? '✅ Enabled' : '❌ Disabled');

    if (!googleEnabled) {
      console.log('\n⚠️  Google OAuth is NOT enabled in Supabase!');
      console.log('   To enable it:');
      console.log('   1. Go to: https://app.supabase.com/project/btxklozcxznzyqvykxeo/auth/providers');
      console.log('   2. Enable Google provider');
      console.log('   3. Add your Google OAuth credentials (Client ID & Secret)');
      console.log('   4. Add authorized redirect URL:');
      console.log(`      ${supabaseUrl}/auth/v1/callback`);
    }

    return { google: googleEnabled, email: emailEnabled };
  } catch (err) {
    console.error('❌ Failed to check OAuth settings:', err.message);
    return { google: false, email: false };
  }
}

async function testEmailSignUp(email, password) {
  console.log(`\n2️⃣  Testing email signup with: ${email}`);
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.error) {
      if (data.error.message?.includes('User already registered')) {
        console.log('⚠️  Email already registered');
        return { success: false, exists: true };
      }
      console.error('❌ Signup failed:', data.error.message);
      return { success: false, error: data.error.message };
    }

    console.log('✅ Signup request successful');
    console.log('   Check your email for verification link (if enabled)');
    return { success: true, data };
  } catch (err) {
    console.error('❌ Signup failed:', err.message);
    return { success: false, error: err.message };
  }
}

async function testEmailLogin(email, password) {
  console.log(`\n3️⃣  Testing email login with: ${email}`);
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('❌ Login failed:', data.error.message);
      return { success: false, error: data.error.message };
    }

    console.log('✅ Login successful!');
    console.log('   User:', data.user?.email);
    console.log('   Token type:', data.token_type);
    return { success: true, data };
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    return { success: false, error: err.message };
  }
}

async function runTests() {
  const oauthStatus = await testGoogleOAuth();
  
  if (process.argv.includes('test-email')) {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    await testEmailSignUp(testEmail, testPassword);
    await testEmailLogin(testEmail, testPassword);
  } else {
    console.log('\n💡 To test email auth, run: node test-auth.js test-email');
  }

  console.log('\n✅ Authentication tests complete!\n');
}

runTests();
