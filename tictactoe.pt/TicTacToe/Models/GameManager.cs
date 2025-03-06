using System.Collections.Concurrent;

namespace TicTacToe.Models
{
    public class GameManager
    {
        public static readonly ConcurrentDictionary<string, Game> Games = new ConcurrentDictionary<string, Game>();

        public static Game CreateGame()
        {
            var game = new Game();
            Games[game.Id] = game;
            return game;
        }

        public static Game GetGame(string gameId)
        {
            Games.TryGetValue(gameId, out var game);
            return game;
        }

        public static void RemoveGame(string gameId)
        {
            Games.TryRemove(gameId, out _);
        }

        public static GameResult CheckGameResult(string[] board)
        {
            // Winning combinations (rows, columns, diagonals)
            int[][] winPatterns = new int[][]
            {
                new int[] { 0, 1, 2 }, new int[] { 3, 4, 5 }, new int[] { 6, 7, 8 }, // rows
                new int[] { 0, 3, 6 }, new int[] { 1, 4, 7 }, new int[] { 2, 5, 8 }, // columns
                new int[] { 0, 4, 8 }, new int[] { 2, 4, 6 }                         // diagonals
            };

            // Check for a win
            foreach (var pattern in winPatterns)
            {
                int a = pattern[0], b = pattern[1], c = pattern[2];
                if (!string.IsNullOrEmpty(board[a]) && board[a] == board[b] && board[a] == board[c])
                {
                    return new GameResult { Status = "win", WinningLine = pattern };
                }
            }

            // Check for a draw
            bool isDraw = true;
            foreach (var cell in board)
            {
                if (string.IsNullOrEmpty(cell))
                {
                    isDraw = false;
                    break;
                }
            }

            if (isDraw)
            {
                return new GameResult { Status = "draw" };
            }

            // Game is still in progress
            return new GameResult { Status = "playing" };
        }
    }
}
