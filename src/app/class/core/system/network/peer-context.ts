import * as lzbase62 from 'lzbase62/lzbase62.min.js';
import * as CryptoJS from 'crypto-js/core.js';
import * as SHA256 from 'crypto-js/sha256.js';

import { base } from '../util/base-x';

const Base62 = base('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
const roomIdPattern = /^(\w{6})(\w{3})(\w*)-(\w*)/i;

export interface IPeerContext {
  readonly fullstring: string;
  readonly id: string;
  readonly room: string;
  readonly roomName: string;
  readonly password: string;
  readonly digestId: string;
  readonly digestPassword: string;
  readonly isOpen: boolean;
  readonly isRoom: boolean;
  readonly hasPassword: boolean;
}

export class PeerContext implements IPeerContext {
  fullstring: string = '';
  id: string = '';
  room: string = '';
  roomName: string = '';
  password: string = '';
  digestId: string = '';
  digestPassword: string = '';
  isOpen: boolean = false;

  get isRoom(): boolean { return 0 < this.room.length; }
  get hasPassword(): boolean { return 0 < this.password.length + this.digestPassword.length; }

  private constructor(fullstring: string) {
    this.parse(fullstring);
  }

  private parse(fullstring: string) {
    try {
      this.fullstring = fullstring;
      let regArray = roomIdPattern.exec(fullstring);
      let isRoom = regArray != null;
      if (isRoom) {
        this.id = regArray[1];
        this.room = regArray[2];
        this.roomName = lzbase62.decompress(regArray[3]);
        this.digestPassword = regArray[4];
        return;
      }
    } catch (e) {
      console.warn(e);
    }
    this.digestId = fullstring;
    return;
  }

  verifyPassword(password: string): boolean {
    let digest = calcDigestPassword(this.room, password);
    let isCorrect = digest === this.digestPassword;
    return isCorrect;
  }

  static parse(fullstring: string): PeerContext {
    return new PeerContext(fullstring);
  }

  static create(peerId: string): PeerContext
  static create(peerId: string, roomId: string, roomName: string, password: string): PeerContext
  static create(...args: any[]): PeerContext {
    if (args.length <= 1) {
      return PeerContext._create.apply(this, args);
    } else {
      return PeerContext._createRoom.apply(this, args);
    }
  }

  private static _create(peerId: string = '') {
    let digestPeerId = calcDigestPeerId(peerId);
    let peerContext = new PeerContext(digestPeerId);

    peerContext.id = peerId;
    return peerContext;
  }

  private static _createRoom(peerId: string = '', roomId: string = '', roomName: string = '', password: string = ''): PeerContext {
    let digestPassword = calcDigestPassword(roomId, password);
    let fullstring = `${peerId}${roomId}${lzbase62.compress(roomName)}-${digestPassword}`;

    let peerContext = new PeerContext(fullstring);
    peerContext.password = password;
    return peerContext;
  }

  static generateId(format: string = '******'): string {
    const h: string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    let k: string = format;
    k = format.replace(/\*/g, function (c) {
      let r: number = Math.floor(Math.random() * (h.length));
      return h[r];
    });

    return k;
  }
}

function calcDigestPeerId(peerId: string): string {
  if (peerId == null) return '';
  return calcDigest(peerId);
}

function calcDigestPassword(room: string, password: string): string {
  if (room == null || password == null) return '';
  return 0 < password.length ? calcDigest(room + password, 7) : '';
}

function calcDigest(str: string, truncateLength: number = -1): string {
  if (str == null) return '';
  let hash = SHA256(str);
  let array = new Uint8Array(Uint32Array.from(hash.words).buffer);
  let base62 = Base62.encode(array);

  if (truncateLength < 0) truncateLength = base62.length;
  if (base62.length < truncateLength) truncateLength = base62.length;

  base62 = base62.slice(0, truncateLength);
  return base62;
}
