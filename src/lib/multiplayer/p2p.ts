export type SignalKind = "offer" | "answer" | "ice";
export interface PeerRow { id: string; name: string }
export interface SignalRow { id: number; from: string; kind: SignalKind; payload: unknown }
export interface RtcPollResponse { peers: PeerRow[] }
export type PeerInfo = PeerRow;
export type P2PRoomOptions = Record<string, unknown>;
export const defaultIceServers: RTCIceServer[] = [];
export class P2PRoom {
  constructor(_opts?: P2PRoomOptions) {}
  close() {}
}
