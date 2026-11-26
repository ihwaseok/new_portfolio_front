// UTF-8 문자와 이벤트가 여러 네트워크 청크로 나뉘어도 완성된 SSE만 전달합니다.
export async function readChatStream(
    body: ReadableStream<Uint8Array>,
    onEvent: (event: string, data: unknown) => void,
): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let lines: string[] = [];
    const dispatch = () => {
        const data = lines
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).replace(/^ /, ''))
            .join('\n');
        const event =
            lines
                .find((line) => line.startsWith('event:'))
                ?.slice(6)
                .trim() || 'message';
        lines = [];
        if (data) onEvent(event, JSON.parse(data));
    };
    try {
        while (true) {
            const { value, done } = await reader.read();
            buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
            let end;
            while ((end = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, end).replace(/\r$/, '');
                buffer = buffer.slice(end + 1);
                if (!line) dispatch();
                else lines.push(line);
            }
            if (done) {
                if (buffer) lines.push(buffer.replace(/\r$/, ''));
                dispatch();
                return;
            }
        }
    } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
    }
}
