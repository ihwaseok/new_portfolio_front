type SocketStatus = 'CONNECTING' | 'CONNECTED' | 'RETRYING' | 'CLOSED' | 'ERROR'

interface SocketOptions {
  maxRetry?: number
  baseRetryMs?: number
  maxRetryMs?: number
  jitterRatio?: number
  connectTimeoutMs?: number
  enableSendQueue?: boolean
  maxQueueSize?: number
  pingIntervalMs?: number
  ignoreCloseReasons?: string[]
}

type MessageHandler = (data: Record<string, unknown> & { socketId: string | null }) => void

class SocketInstance {
  isActive: boolean
  socket: WebSocket | null
  socketId: string | null
  socketStatus: SocketStatus
  messageHandler: MessageHandler | null

  isConnecting: boolean
  retryCount: number
  maxRetry: number
  baseRetryMs: number
  maxRetryMs: number
  jitterRatio: number
  connectTimeoutMs: number
  enableSendQueue: boolean
  maxQueueSize: number
  sendQueue: string[]
  pingIntervalMs: number
  ignoreCloseReasons: Set<string>

  private timers = new Map<string, ReturnType<typeof setTimeout>>()
  private intervals = new Map<string, ReturnType<typeof setInterval>>()

  constructor(paramObj?: SocketOptions) {
    this.isActive = true
    this.socket = null
    this.socketId = null
    this.socketStatus = 'CLOSED'
    this.messageHandler = null

    this.isConnecting = false
    this.retryCount = 0
    this.maxRetry = paramObj?.maxRetry ?? -1
    this.baseRetryMs = paramObj?.baseRetryMs ?? 1000
    this.maxRetryMs = paramObj?.maxRetryMs ?? 30000
    this.jitterRatio = paramObj?.jitterRatio ?? 0.2
    this.connectTimeoutMs = paramObj?.connectTimeoutMs ?? 8000
    this.enableSendQueue = paramObj?.enableSendQueue ?? true
    this.maxQueueSize = paramObj?.maxQueueSize ?? 200
    this.sendQueue = []
    this.pingIntervalMs = paramObj?.pingIntervalMs ?? 30000
    this.ignoreCloseReasons = new Set(paramObj?.ignoreCloseReasons ?? ['END'])
  }

  async initSocket(id: string, url: string, statusFunc?: (state: SocketStatus) => void) {
    this.socketId = id

    if (this.isConnecting) return

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.setStatus('CONNECTED', statusFunc)
      return
    }

    this.removeTimer('reconnectTimer')
    this.isConnecting = true
    this.setStatus('CONNECTING', statusFunc)

    try {
      const ws = await this.connect(url)
      this.socket = ws
      this.retryCount = 0
      this.setStatus('CONNECTED', statusFunc)
      this.setPropHandler()

      this.addInterval('intervalPing', 5000, () => {
        this.socket?.send(JSON.stringify({ type: 'PING' }))
      })

      this.sendWaitMessage()

      this.socket.onclose = (event) => {
        this.socket = null
        this.isConnecting = false
        this.removeInterval('intervalPing')

        if (event?.reason && this.ignoreCloseReasons.has(event.reason)) {
          this.setStatus('CLOSED', statusFunc)
        } else {
          this.setStatus('ERROR', statusFunc)
          this.connectRetry(id, url, statusFunc)
        }
      }

      this.socket.onerror = () => {
        try {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.close()
          }
        } catch (err) {
          console.error(err)
        }
      }

      console.log(`WebSocket 연결성공 - ${id}`)
    } catch (err) {
      this.socket = null
      this.isConnecting = false
      this.removeInterval('intervalPing')
      this.setStatus('ERROR', statusFunc)
      console.error('웹소켓 연결실패', err)
      this.connectRetry(id, url, statusFunc)
    } finally {
      this.isConnecting = false
    }
  }

  connect(url: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url)

      let isPromiseEnd = false
      const endPromise = (callback: (arg: WebSocket | Error) => void, param: WebSocket | Error) => {
        if (isPromiseEnd) return
        isPromiseEnd = true
        clearTimeout(timerNoResponse)
        callback(param)
      }

      const timerNoResponse = setTimeout(() => {
        try { ws.close() } catch (err) { console.error(err) }
        endPromise(reject as (arg: WebSocket | Error) => void, new Error(`WebSocket connect timeout (${this.connectTimeoutMs}ms)`))
      }, this.connectTimeoutMs)

      ws.onopen = () => endPromise(resolve as (arg: WebSocket | Error) => void, ws)
      ws.onerror = (err) => endPromise(reject as (arg: WebSocket | Error) => void, err instanceof Error ? err : new Error('WebSocket error'))
      ws.onclose = (event) => {
        if (!isPromiseEnd) endPromise(reject as (arg: WebSocket | Error) => void, new Error(`WebSocket closed before open (code=${event.code}, reason=${event.reason || ''})`))
      }
    })
  }

  connectRetry(id: string, url: string, statusFunc?: (state: SocketStatus) => void) {
    if (this.retryCount >= this.maxRetry && this.maxRetry > 0) {
      this.setStatus('CLOSED', statusFunc)
      console.warn(`WebSocket retry stopped (maxRetry=${this.maxRetry})`, id)
      return
    }

    this.removeTimer('reconnectTimer')
    this.retryCount += 1

    const delay = this.calcRetryTime()
    this.setStatus('RETRYING', statusFunc)

    const timer = setTimeout(() => {
      this.timers.delete('reconnectTimer')
      this.initSocket(id, url, statusFunc)
    }, delay)
    this.timers.set('reconnectTimer', timer)
  }

  closeSocket(reason?: string) {
    this.removeTimer('reconnectTimer')
    this.removeInterval('intervalPing')

    try {
      if (this.socket) this.socket.close(1000, reason)
    } catch (err) {
      console.error(err)
    }

    this.socket = null
    this.setStatus('CLOSED')
  }

  sendMessage(paramObj: unknown, isForce?: boolean) {
    if (!this.isActive && !isForce) return

    let text: string
    if (paramObj && typeof paramObj === 'object') {
      try {
        text = JSON.stringify(paramObj)
      } catch (err) {
        console.error('웹소켓 메시지 stringify 실패', err)
        text = String(paramObj)
      }
    } else {
      text = String(paramObj ?? '')
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(text)
        return
      } catch {
        // 실패 시 큐에 추가
      }
    }

    if (this.enableSendQueue) {
      if (this.sendQueue.length >= this.maxQueueSize) {
        this.sendQueue.shift()
      }
      this.sendQueue.push(text)
    }
  }

  sendWaitMessage() {
    if (!this.enableSendQueue) return
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return
    if (this.sendQueue.length === 0) return

    const queued = this.sendQueue.splice(0, this.sendQueue.length)
    for (const text of queued) {
      try {
        this.socket.send(text)
      } catch (err) {
        this.sendQueue.unshift(text, ...queued.slice(queued.indexOf(text) + 1))
        break
      }
    }
  }

  setPropHandler() {
    if (!this.socket) return

    this.socket.onmessage = (msg) => {
      if (!this.isActive) return
      if (!msg?.data) return
      if (typeof msg.data !== 'string') return

      try {
        const jsonData: Record<string, unknown> = JSON.parse(msg.data)
        jsonData.socketId = this.socketId
        this.messageHandler?.(jsonData as Record<string, unknown> & { socketId: string | null })
      } catch (err) {
        console.error('메시지가 JSON 형식이 아닙니다.', err)
      }
    }
  }

  setStatus(status: SocketStatus, statusFunc?: (state: SocketStatus) => void) {
    this.socketStatus = status
    statusFunc?.(status)
  }

  removeTimer(id: string) {
    const timer = this.timers.get(id)
    if (timer !== undefined) {
      clearTimeout(timer)
      this.timers.delete(id)
    }
  }

  addInterval(id: string, intervalTime: number, customFunc: (...args: unknown[]) => void, ...customParam: unknown[]) {
    this.removeInterval(id)

    if (customFunc) {
      this.intervals.set(id, setInterval(() => customFunc(...customParam), intervalTime))
    } else {
      console.log('Interval 객체 등록실패. 등록할 함수가 없습니다.')
    }
  }

  removeInterval(id: string) {
    const interval = this.intervals.get(id)
    if (interval !== undefined) {
      clearInterval(interval)
      this.intervals.delete(id)
    }
  }

  calcRetryTime(): number {
    const exp = Math.min(this.retryCount, 10)
    let delay = Math.min(this.baseRetryMs * Math.pow(2, exp), this.maxRetryMs)
    const jitter = delay * this.jitterRatio * (Math.random() * 2 - 1)
    return Math.max(0, Math.floor(delay + jitter))
  }
}

export default SocketInstance
