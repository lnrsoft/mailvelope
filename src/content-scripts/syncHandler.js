/**
 * Copyright (C) 2015-2016 Mailvelope GmbH
 * Licensed under the GNU Affero General Public License version 3
 */

import mvelo from '../mvelo';
import {postMessage} from './clientAPI';


export default class SyncHandler {
  /**
   * @param {string} keyringId - the keyring to use for this operation
   * @constructor
   */
  constructor(keyringId) {
    this.keyringId = keyringId;
    this.id = mvelo.util.getHash();
    this.port = mvelo.EventHandler.connect(`syncHandler-${this.id}`, this);
    this.registerEventListener();
    this.port.emit('init', {keyringId: this.keyringId});
  }

  syncDone(data) {
    //console.log('mvelo.SyncHandler.prototype.restoreDone()', restoreBackup);
    this.port.emit('sync-done', {data});
  }

  /**
   * @returns {mvelo.SyncHandler}
   */
  registerEventListener() {
    this.port.on('sync-event', msg => postMessage('sync-event', null, msg, null));
    // workaround for https://bugs.chromium.org/p/chromium/issues/detail?id=655932
    window.addEventListener('beforeunload', () => {
      this.port.disconnect();
    });
  }
}
