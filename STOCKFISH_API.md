# Stockfish API Usage Guide (Feb 3, 2025)

This document provides details on how to use the Stockfish API as of February 3, 2025.

## Endpoint

**URL:** `https://stockfish.online/api/s/v2.php`

**HTTP Method:** GET

## Request Parameters

- **fen**: A string representing the FEN (Forsyth–Edwards Notation) of the chess position to analyze.
- **depth**: An integer indicating the depth to which the engine should analyze (>0 and int < 16).

## Receiving a Response

The API returns a JSON response. The response contains the following fields:

- **success**: Boolean value (`true` or `false`). Indicates whether the request was completed successfully.
- **data**: If `success` is `false`, this key contains error information.

If `success` is `true`, the following fields will be present in the response:

- **bestmove**: Contains the best move based on the engine's analysis. Example: `bestmove b1c3 ponder h7h6`
- **evaluation**: Contains the standard evaluation (numerical score) of the given position, or `null` if there is a forced checkmate.
- **mate**: Normally `null`. However, if there is a forced checkmate in the given position, this field will contain the number of moves until checkmate. The value is positive when white is delivering mate and negative when black is delivering mate.
- **continuation**: The top engine line in the given position. Example: `b1c3 h7h6 c3e2 c7c6 h2h3`.

## Example Response

```json
{
    "success": true,
    "evaluation": 1.36,
    "mate": null,
    "bestmove": "bestmove b7b6 ponder f3e5",
    "continuation": "b7b6 f3e5 h7h6 g5f6 f8f6 d2f3"
}
```
