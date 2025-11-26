export interface EmailMessage {
    subject: string;
    inReplyTo?: string;
    references?: string | string[];
    from: { email: string; name: string };
}

export function isReply(message: EmailMessage, leadEmail?: string): boolean {
    // 1. Check Subject for "Re:" prefix
    const subject = message.subject.toLowerCase().trim();
    if (subject.startsWith("re:") || subject.startsWith("fwd:")) {
        return true;
    }

    // 2. Check In-Reply-To header
    if (message.inReplyTo) {
        return true;
    }

    // 3. Check References header
    if (message.references && (Array.isArray(message.references) ? message.references.length > 0 : message.references.length > 0)) {
        return true;
    }

    // 4. Check if sender matches lead email (inbound message from lead is likely a reply to our outreach)
    if (leadEmail && message.from.email.toLowerCase() === leadEmail.toLowerCase()) {
        return true;
    }

    return false;
}
