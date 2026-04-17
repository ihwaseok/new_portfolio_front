import { ref } from 'vue'
import { defineStore } from 'pinia'
import socketClass from '@/util/SocketInstance'

interface SocketInstance {
  socketId: string
  socketStatus: string
  isActive: boolean
  messageHandler: ((message: unknown) => void) | null
  initSocket: (socketId: string, url: string, onStateChange: (state: unknown) => void) => void
  sendMessage: (message: unknown, isForce?: boolean) => void
  closeSocket: (reason?: string) => void
}

const socketList       = ref<SocketInstance[]>([])
const socketActiveList = ref<string[]>([])
const isConnectedAll   = ref(false)

function handleConnectState(_state: unknown) {
  isConnectedAll.value = socketList.value.every(s => s.socketStatus === 'CONNECTED')
}

function createSocket(socketId: string, url: string, isActive: boolean) {
  const socket = new socketClass() as SocketInstance
  socket.isActive = isActive
  socket.initSocket(socketId, url, handleConnectState)

  socketList.value.push(socket)
  if (isActive) {
    socketActiveList.value.push(socketId)
  }
}

function changeHandlerAll(customFunc: (message: unknown) => void) {
  for (const socket of socketList.value) {
    socket.messageHandler = customFunc
  }
}

function changeActive(target: string | string[]) {
  socketActiveList.value = []

  for (const socket of socketList.value) {
    if (typeof target === 'string') {
      socket.isActive = socket.socketId === target
      if (socket.isActive) socketActiveList.value.push(socket.socketId)
    } else {
      socket.isActive = target.includes(socket.socketId)
      if (socket.isActive) socketActiveList.value.push(socket.socketId)
    }
  }
}

function sendMessageAll(message: unknown, isForce?: boolean) {
  for (const socket of socketList.value) {
    socket.sendMessage(message, isForce)
  }
}

function sendMessage(targetId: string, message: unknown, isForce?: boolean) {
  for (const socket of socketList.value) {
    if (socket.socketId === targetId) {
      socket.sendMessage(message, isForce)
    }
  }
}

function closeSocketAll(reason?: string) {
  for (const socket of socketList.value) {
    socket.closeSocket(reason)
  }
}

function closeSocket(targetId: string, reason?: string) {
  for (const socket of socketList.value) {
    if (socket.socketId === targetId) {
      socket.closeSocket(reason)
    }
  }
}

export const useSocketStore = defineStore('socket', () => ({
  socketList,
  socketActiveList,
  isConnectedAll,
  createSocket,
  changeHandlerAll,
  changeActive,
  sendMessageAll,
  sendMessage,
  closeSocketAll,
  closeSocket,
}))
