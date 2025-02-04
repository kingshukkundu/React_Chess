interface StockfishResponse {
    success: boolean;
    evaluation?: number;
    mate: number | null;
    bestmove: string;
    continuation: string;
}

export const getComputerMove = async (fen: string, depth: number = 10): Promise<string> => {
    const url = `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=${depth}`;
    
    try {
        const response = await fetch(url);
        const data: StockfishResponse = await response.json();
        
        if (!data.success) {
            throw new Error('Failed to get computer move');
        }
        
        // Extract the actual move from the bestmove string (removes "bestmove " prefix and " ponder..." suffix)
        const move = data.bestmove.split(' ')[1];
        return move;
    } catch (error) {
        console.error('Error getting computer move:', error);
        throw error;
    }
}
