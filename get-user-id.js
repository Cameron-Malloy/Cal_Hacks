const admin = require('firebase-admin');
const serviceAccount = require('./final_python_script/productivly-563e3-firebase-adminsdk-fbsvc-7d29118195.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function listUsers() {
  console.log('\n🔍 Fetching Firebase Users...\n');

  try {
    const listUsersResult = await admin.auth().listUsers();

    if (listUsersResult.users.length === 0) {
      console.log('❌ No users found! Please sign up first at http://localhost:3002\n');
      process.exit(0);
    }

    console.log('✅ Found', listUsersResult.users.length, 'user(s):\n');

    listUsersResult.users.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`);
      console.log('   User ID:', user.uid);
      console.log('   Email:', user.email || '(no email)');
      console.log('   Created:', user.metadata.creationTime);
      console.log('');
    });

    console.log('📋 Copy a User ID above and use it in the sync command:');
    console.log('   cd final_python_script');
    console.log('   python firebase_sync.py --watch --user-id YOUR_USER_ID\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

listUsers();
