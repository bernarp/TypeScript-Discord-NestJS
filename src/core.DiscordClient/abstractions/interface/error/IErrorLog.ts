export interface IErrorLog {
    errorId: string;
    timestamp: string;
    command: {
        name: string;
        id: string;
    };
    user: {
        tag: string;
        id: string;
    };
    guild?: {
        name: string;
        id: string;
    };
    error: {
        name: string;
        message: string;
        stack?: string;
    };
}
