const algosdk = require('algosdk');

const mnemonic = 'rubber phrase truly weekend exile chef click excite dress wasp rough lift casual tenant because nasty distance scrap diamond point wise member hammer inmate';

const words = mnemonic.split(' ');
console.log('Word count:', words.length);

try {
  const account = algosdk.mnemonicToSecretKey(mnemonic);
  console.log('\n✅ Mnemonic is valid!');
  console.log('Address:', account.addr);
} catch (error) {
  console.error('\n❌ Error:', error.message);
}
