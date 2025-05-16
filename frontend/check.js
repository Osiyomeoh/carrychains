try {
    const wallet = require('@coinbase/onchainkit/wallet');
    const identity = require('@coinbase/onchainkit/identity');
    
    console.log('=== @coinbase/onchainkit/wallet exports ===');
    Object.keys(wallet).forEach(key => {
      console.log(` - ${key}`);
    });
    
    console.log('\n=== @coinbase/onchainkit/identity exports ===');
    Object.keys(identity).forEach(key => {
      console.log(` - ${key}`);
    });
  } catch (error) {
    console.error('Error checking exports:', error.message);
  }