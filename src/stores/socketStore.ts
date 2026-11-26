import { ref } from 'vue';
import { defineStore } from 'pinia';
import socketClass from '@/util/SocketInstance';

// 웹소켓 연결·재시도·전송 대기열을 관리하는 인터페이스 또는 클래스입니다.
interface SocketInstance {
    socketId: string;
    socketStatus: string;
    isActive: boolean;
    messageHandler: ((message: unknown) => void) | null;
    initSocket: (socketId: string, url: string, onStateChange: (state: unknown) => void) => void;
    sendMessage: (message: unknown, isForce?: boolean) => void;
    closeSocket: (reason?: string) => void;
}

const socketList = ref<SocketInstance[]>([]);
const socketActiveList = ref<string[]>([]);
const isConnectedAll = ref(false);

// 등록된 소켓의 전체 연결 여부를 갱신합니다.
function handleConnectState(_state: unknown) {
    isConnectedAll.value = socketList.value.every((s) => s.socketStatus === 'CONNECTED');
}

// 소켓 연결을 시작하고 활성 여부와 함께 등록합니다.
function createSocket(socketId: string, url: string, isActive: boolean) {
    const socket = new socketClass() as SocketInstance;
    socket.isActive = isActive;
    socket.initSocket(socketId, url, handleConnectState);

    socketList.value.push(socket);
    if (isActive) {
        socketActiveList.value.push(socketId);
    }
}

// 모든 소켓에 동일한 수신 처리 함수를 적용합니다.
function changeHandlerAll(customFunc: (message: unknown) => void) {
    for (const socket of socketList.value) {
        socket.messageHandler = customFunc;
    }
}

// 지정한 소켓만 수신 처리와 일반 전송 대상으로 활성화합니다.
function changeActive(target: string | string[]) {
    socketActiveList.value = [];

    for (const socket of socketList.value) {
        if (typeof target === 'string') {
            socket.isActive = socket.socketId === target;
            if (socket.isActive) socketActiveList.value.push(socket.socketId);
        } else {
            socket.isActive = target.includes(socket.socketId);
            if (socket.isActive) socketActiveList.value.push(socket.socketId);
        }
    }
}

// 모든 소켓에 메시지 전송을 요청합니다.
function sendMessageAll(message: unknown, isForce?: boolean) {
    for (const socket of socketList.value) {
        socket.sendMessage(message, isForce);
    }
}

// 활성 여부를 확인하여 메시지를 전송합니다.
function sendMessage(targetId: string, message: unknown, isForce?: boolean) {
    for (const socket of socketList.value) {
        if (socket.socketId === targetId) {
            socket.sendMessage(message, isForce);
        }
    }
}

// 등록된 모든 소켓의 종료를 요청합니다.
function closeSocketAll(reason?: string) {
    for (const socket of socketList.value) {
        socket.closeSocket(reason);
    }
}

// 소켓 종료와 관련된 자원을 정리합니다.
function closeSocket(targetId: string, reason?: string) {
    for (const socket of socketList.value) {
        if (socket.socketId === targetId) {
            socket.closeSocket(reason);
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
}));
