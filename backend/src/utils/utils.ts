export class MediaCalculator {
    /**
     * Calculates simple average from a single notas object
     * Used for overall evaluation scores from a single evaluation
     */
    static calculateSimpleMedia(notasString: string | null): number {
        if (!notasString) return 0;
        try {
            const notasObj = JSON.parse(notasString);
            const values = Object.values(notasObj).filter(v => typeof v === 'number') as number[];
            return values.length > 0 ? Number((values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2)) : 0;
        } catch {
            return 0;
        }
    }
} 