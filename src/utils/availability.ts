export const hasOverlap = (slots: { startTime: string; endTime: string }[]): { overlap: boolean; details?: string[] } => {
    // Convert times to minutes
    const times = slots.map((s) => {
        const [startH, startM] = s.startTime.split(":").map(Number);
        const [endH, endM] = s.endTime.split(":").map(Number);
        return { start: startH * 60 + startM, end: endH * 60 + endM, original: s };
    });

    // Sort slots by start time
    times.sort((a, b) => a.start - b.start);

    const overlappingPairs: string[] = [];

    for (let i = 1; i < times.length; i++) {
        if (times[i].start < times[i - 1].end) {
            // Overlap detected
            const pair = `${times[i - 1].original.startTime}-${times[i - 1].original.endTime} ↔ ${times[i].original.startTime}-${times[i].original.endTime}`;
            overlappingPairs.push(pair);
        }
    }

    return {
        overlap: overlappingPairs.length > 0,
        details: overlappingPairs.length > 0 ? overlappingPairs : undefined,
    };
};
