import { ImapFlow } from 'imapflow';

export interface ImapConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
}

export class ImapClient {
    private client: ImapFlow;

    constructor(config: ImapConfig) {
        this.client = new ImapFlow({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: config.auth,
            logger: false, // Disable logging for production
        });
    }

    async connect() {
        await this.client.connect();
    }

    async disconnect() {
        await this.client.logout();
    }

    async listMessages(folder = 'INBOX', limit = 10) {
        const lock = await this.client.getMailboxLock(folder);
        try {
            const messages = [];
            for await (const message of this.client.fetch('1:*', { envelope: true, source: true }, { uid: true })) {
                messages.push(message);
                if (messages.length >= limit) break;
            }
            return messages;
        } finally {
            lock.release();
        }
    }
}
