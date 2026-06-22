import type { PeerJSOption } from 'peerjs'

/**
 * PeerJS 기본 TURN(turn.peerjs.com)이 중단되어 ICE 연결이 실패합니다.
 * STUN + 공개 TURN 릴레이를 명시적으로 설정합니다.
 *
 * 자체 TURN 서버가 있으면 .env에 설정:
 *   VITE_TURN_URLS=turn:your.server:3478
 *   VITE_TURN_USERNAME=...
 *   VITE_TURN_CREDENTIAL=...
 */
function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
  ]

  const customTurnUrls = import.meta.env.VITE_TURN_URLS
  if (customTurnUrls) {
    servers.push({
      urls: customTurnUrls.split(',').map((u: string) => u.trim()),
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    })
  } else {
    const relay = {
      username: 'openrelayproject',
      credential: 'openrelayproject',
    }
    servers.push(
      { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443'], ...relay },
    )
  }

  return servers
}

export function createPeerOptions(id?: string): PeerJSOption {
  return {
    ...(id ? {} : {}),
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    debug: import.meta.env.DEV ? 1 : 0,
    config: {
      iceServers: buildIceServers(),
      iceCandidatePoolSize: 10,
    },
  }
}
