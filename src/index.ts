import { doLogin } from './login';

(async () => {
  try {
    await doLogin();
    console.log('🎉 Automation completed');
  } catch (err) {
    console.error('❌ Error in automation:', err);
    process.exit(1);
  }
})();

