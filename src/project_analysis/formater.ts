
export function formatTime(ms: number): string {
    const milliseconds = ms % 1000;
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

    const hoursDisplay = hours > 0 ? `${hours}h ` : '';
    const minutesDisplay = minutes > 0 ? `${minutes}m ` : '';
    const secondsDisplay = seconds > 0 ? `${seconds}s ` : '';
    const millisecondsDisplay = milliseconds > 0 ? `${milliseconds}ms` : '';

    return `${hoursDisplay}${minutesDisplay}${secondsDisplay}${millisecondsDisplay}`.trim() || '0ms';
}
