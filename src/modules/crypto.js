/**
 * Copyright (C) 2015-2017 Mailvelope GmbH
 * Licensed under the GNU Affero General Public License version 3
 */

import * as openpgp from 'openpgp';

export function randomString(length) {
  let result = '';
  const base = 32;
  const buf = new Uint8Array(length);
  window.crypto.getRandomValues(buf);
  for (let i = 0; i < buf.length; i++) {
    result += (buf[i] % base).toString(base);
  }
  return result;
}

/**
 * Encrypt the message symmetrically using a passphrase.
 *   https://tools.ietf.org/html/rfc4880#section-3.7.2.2
 * Copyright (C) 2015 Tankred Hase
 * @param {String} passphrase
 * @return {openpgp.message.Message} new message with encrypted content
 */
export async function symEncrypt(msg, passphrase) {
  if (!passphrase) {
    throw new Error('The passphrase cannot be empty!');
  }

  const algo = openpgp.enums.read(openpgp.enums.symmetric, openpgp.enums.symmetric.aes256);
  const packetlist = new openpgp.packet.List();

  // create a Symmetric-key Encrypted Session Key (ESK)
  const symESKPacket = new openpgp.packet.SymEncryptedSessionKey();
  symESKPacket.version = 4;
  symESKPacket.sessionKeyAlgorithm = algo;
  symESKPacket.s2k = new openpgp.S2K();
  symESKPacket.s2k.salt = await openpgp.crypto.random.getRandomBytes(8);
  await symESKPacket.decrypt(passphrase); // generate the session key
  packetlist.push(symESKPacket);

  // create integrity protected packet
  const symEncryptedPacket = new openpgp.packet.SymEncryptedIntegrityProtected();
  symEncryptedPacket.packets = msg.packets;
  await symEncryptedPacket.encrypt(algo, symESKPacket.sessionKey);
  packetlist.push(symEncryptedPacket);

  // remove packets after encryption
  symEncryptedPacket.packets = new openpgp.packet.List();
  return new openpgp.message.Message(packetlist);
}

/**
 * Return a secure random number in the specified range
 * @param {Number} from - min of the random number
 * @param {Number} to - max of the random number (max 32bit)
 * @return {Number} - a secure random number
 */
export function getSecureRandom(from, to) {
  let randUint = getSecureRandomUint();
  const bits = ((to - from)).toString(2).length;
  while ((randUint & (Math.pow(2, bits) - 1)) > (to - from)) {
    randUint = getSecureRandomUint();
  }
  return from + (Math.abs(randUint & (Math.pow(2, bits) - 1)));
}

function getSecureRandomUint() {
  const buf = new Uint8Array(4);
  const dv = new DataView(buf.buffer);
  window.crypto.getRandomValues(buf);
  return dv.getUint32(0);
}
