export interface ThreadMessage {
    id: string;
    threadId?: string;
    subject: string;
    date: any; // Timestamp or Date
    from: { name: string; email: string };
    to: { name: string; email: string };
    snippet: string;
    seen: boolean;
    folder: string;
    bodyText?: string;
    sequenceReply?: boolean;
    // ... other fields
}

export interface Thread {
    id: string; // usually the threadId or the id of the latest message
    subject: string;
    participants: { name: string; email: string }[];
    lastMessageDate: any;
    snippet: string;
    unreadCount: number;
    messages: ThreadMessage[];
    messageCount: number;
}

export function groupMessagesIntoThreads(messages: ThreadMessage[]): Thread[] {
    const threadsMap = new Map<string, Thread>();

    // Sort messages by date (newest first)
    const sortedMessages = [...messages].sort((a, b) => {
        const dateA = new Date(a.date.seconds ? a.date.seconds * 1000 : a.date).getTime();
        const dateB = new Date(b.date.seconds ? b.date.seconds * 1000 : b.date).getTime();
        return dateB - dateA;
    });

    for (const msg of sortedMessages) {
        // Use threadId if available, otherwise group by subject (normalized)
        let threadId = msg.threadId;
        
        if (!threadId) {
            // Fallback: simple subject grouping (remove Re:, Fwd:)
            const normalizedSubject = msg.subject.replace(/^(re|fwd):\s*/i, "").trim();
            threadId = `subject_${normalizedSubject}`;
        }

        if (!threadsMap.has(threadId)) {
            threadsMap.set(threadId, {
                id: threadId,
                subject: msg.subject,
                participants: [msg.from],
                lastMessageDate: msg.date,
                snippet: msg.snippet,
                unreadCount: 0,
                messages: [],
                messageCount: 0
            });
        }

        const thread = threadsMap.get(threadId)!;
        thread.messages.push(msg);
        thread.messageCount++;
        
        if (!msg.seen) {
            thread.unreadCount++;
        }

        // Add participant if unique
        const exists = thread.participants.some(p => p.email === msg.from.email);
        if (!exists) {
            thread.participants.push(msg.from);
        }
    }

    return Array.from(threadsMap.values());
}
