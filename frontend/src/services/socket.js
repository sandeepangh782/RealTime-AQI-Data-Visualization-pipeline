export function connectSocket(onMessage) {
  const url = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'
  const ws = new WebSocket(url)
  console.log('[ws] connecting', url)
  ws.onopen = () => console.log('[ws] open')
  ws.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data)
      console.log('[ws] message', data?.type, Array.isArray(data?.data) ? data.data.length : 0)
      onMessage?.(data)
    } catch (e) {
      // ignore
    }
  }
  ws.onerror = (e) => console.log('[ws] error', e)
  ws.onclose = () => console.log('[ws] closed')
  return ws
}


