export interface FileTimings {
    [filePath: string]: {
        lastEdit: number;
        totalTime: number;
        isWriting: boolean;
    };
}