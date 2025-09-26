export function connectWS(onMsg:(ev:any)=>void) {
  const url = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace("http","ws") + "/ws";
  const ws = new WebSocket(url);
  ws.onmessage = (e)=> {
    try { onMsg(JSON.parse(e.data)); } catch { /* noop */ }
  };
  return ws;
}
