const CryptoJS = require('crypto-js');

/**
 * @link http://php.net/manual/en/function.openssl-get-cipher-methods.php Refer to available methods in PHP if we are working between JS & PHP encryption.
 * @var string Cipher method. 
 *              Recommended AES-128-CBC, AES-192-CBC, AES-256-CBC 
 *              due to there is no `openssl_cipher_iv_length()` function in JavaScript 
 *              and all of these methods are known as 16 in iv_length.
 */
const encryptMethod = 'AES-256-CBC';

/**
 * Encryption class for encrypt/decrypt that works between programming languages.
 * 
 * @author Vee Winch.
 * @link https://stackoverflow.com/questions/41222162/encrypt-in-php-openssl-and-decrypt-in-javascript-cryptojs Reference.
 * @link https://github.com/brix/crypto-js/releases crypto-js.js can be download from here.
 */
class Encryption {
  /**
   * @var integer Return encrypt method or Cipher method number. (128, 192, 256)
   */
  static encryptMethodLength() {
    // get only number from string.
    // @link https://stackoverflow.com/a/10003709/128761 Reference.
    const aesNumber = encryptMethod.match(/\d+/)[0];
    return parseInt(aesNumber, 10);
  }

  /**
   * Decrypt string.
   * 
   * @link https://stackoverflow.com/questions/41222162/encrypt-in-php-openssl-and-decrypt-in-javascript-cryptojs Reference.
   * @link https://stackoverflow.com/questions/25492179/decode-a-base64-string-using-cryptojs Crypto JS base64 encode/decode reference.
   * @param string encryptedString The encrypted string to be decrypt.
   * @param string key The key.
   * @return string Return decrypted string.
   */
  static decrypt(encryptedString, key) {
    const json = JSON.parse(CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(encryptedString)));

    const salt = CryptoJS.enc.Hex.parse(json.salt);
    const iv = CryptoJS.enc.Hex.parse(json.iv);

    const encrypted = json.ciphertext;// no need to base64 decode.

    let iterations = parseInt(json.iterations, 10);
    if (iterations <= 0) {
      iterations = 999;
    }
    const encryptMethodLength = (this.encryptMethodLength()/4);// example: AES number is 256 / 4 = 64
    const hashKey = CryptoJS.PBKDF2(key, salt, {
      'hasher': CryptoJS.algo.SHA512,
      'keySize': (encryptMethodLength/8),
      'iterations': iterations
    });

    const decrypted = CryptoJS.AES.decrypt(encrypted, hashKey, {
      'mode': CryptoJS.mode.CBC,
      'iv': iv
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Encrypt string.
   * 
   * @link https://stackoverflow.com/questions/41222162/encrypt-in-php-openssl-and-decrypt-in-javascript-cryptojs Reference.
   * @link https://stackoverflow.com/questions/25492179/decode-a-base64-string-using-cryptojs Crypto JS base64 encode/decode reference.
   * @param string string The original string to be encrypt.
   * @param string key The key.
   * @return string Return encrypted string.
   */
  static encrypt(data, key) {
    if (!data) return false;
    if (['object', 'number'].includes(typeof data)) {
      data = JSON.stringify(data);
    }

    const iv = CryptoJS.lib.WordArray.random(16);// the reason to be 16, please read on `encryptMethod` property.

    const salt = CryptoJS.lib.WordArray.random(256);
    const iterations = 999;
    const encryptMethodLength = (this.encryptMethodLength()/4);// example: AES number is 256 / 4 = 64
    const hashKey = CryptoJS.PBKDF2(key, salt, {
      'hasher': CryptoJS.algo.SHA512,
      'keySize': (encryptMethodLength/8),
      'iterations': iterations
    });

    const encrypted = CryptoJS.AES.encrypt(data, hashKey, {
      'mode': CryptoJS.mode.CBC,
      'iv': iv
    });
    const encryptedString = CryptoJS.enc.Base64.stringify(encrypted.ciphertext);

    const output = {
      'ciphertext': encryptedString,
      'iv': CryptoJS.enc.Hex.stringify(iv),
      'salt': CryptoJS.enc.Hex.stringify(salt),
      'iterations': iterations
    };

    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify(output)));
  }
}
module.exports = Encryption;

