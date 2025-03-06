using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;
using TicTacToe.Models;

namespace TicTacToe.Hubs
{
    public class GameHub : Hub
    {
        public override async Task OnDisconnectedAsync(Exception exception)
        {
            // Find any games the player was in
            foreach (var game in GameManager.Games.Values)
            {
                int playerIndex = game.Players.IndexOf(Context.ConnectionId);
                if (playerIndex != -1)
                {
                    // Notify the other player that this player has left
                    await Clients.Group(game.Id).SendAsync("PlayerLeft");
                    
                    // Remove the game
                    GameManager.RemoveGame(game.Id);
                    Console.WriteLine($"Game {game.Id} ended because a player left");
                }
            }
            
            await base.OnDisconnectedAsync(exception);
        }

        public async Task CreateGame()
        {
            var game = GameManager.CreateGame();
            game.Players.Add(Context.ConnectionId);
            
            await Groups.AddToGroupAsync(Context.ConnectionId, game.Id);
            await Clients.Caller.SendAsync("GameCreated", new { gameId = game.Id });
            
            Console.WriteLine($"Game created: {game.Id}");
        }

        public async Task JoinGame(string gameId)
        {
            var game = GameManager.GetGame(gameId);
            
            if (game == null)
            {
                await Clients.Caller.SendAsync("Error", new { message = "Game not found" });
                return;
            }

            if (game.Players.Count >= 2)
            {
                await Clients.Caller.SendAsync("Error", new { message = "Game is full" });
                return;
            }

            game.Players.Add(Context.ConnectionId);
            game.Status = "playing";
            
            await Groups.AddToGroupAsync(Context.ConnectionId, game.Id);
            
            // Notify both players that the game has started
            await Clients.Group(game.Id).SendAsync("GameStarted", new
            {
                gameId = game.Id,
                board = game.Board,
                currentTurn = game.CurrentTurn,
                players = game.Players
            });
            
            Console.WriteLine($"Player joined game: {game.Id}");
        }

        public async Task MakeMove(string gameId, int index)
        {
            var game = GameManager.GetGame(gameId);
            
            if (game == null)
            {
                await Clients.Caller.SendAsync("Error", new { message = "Game not found" });
                return;
            }

            // Check if it's the player's turn
            int playerIndex = game.Players.IndexOf(Context.ConnectionId);
            if (playerIndex == -1 || playerIndex != game.CurrentTurn)
            {
                await Clients.Caller.SendAsync("Error", new { message = "Not your turn" });
                return;
            }

            // Check if the cell is already taken
            if (!string.IsNullOrEmpty(game.Board[index]))
            {
                await Clients.Caller.SendAsync("Error", new { message = "Cell already taken" });
                return;
            }

            // Make the move
            game.Board[index] = playerIndex == 0 ? "X" : "O";
            
            // Check for a win or draw
            var result = GameManager.CheckGameResult(game.Board);
            
            if (result.Status == "win")
            {
                game.Status = "finished";
                await Clients.Group(game.Id).SendAsync("GameOver", new
                {
                    winner = playerIndex,
                    winningLine = result.WinningLine,
                    board = game.Board
                });
            }
            else if (result.Status == "draw")
            {
                game.Status = "finished";
                await Clients.Group(game.Id).SendAsync("GameOver", new
                {
                    winner = -1, // No winner
                    board = game.Board
                });
            }
            else
            {
                // Switch turns
                game.CurrentTurn = 1 - game.CurrentTurn;
                
                // Update all players with the new game state
                await Clients.Group(game.Id).SendAsync("GameUpdated", new
                {
                    board = game.Board,
                    currentTurn = game.CurrentTurn
                });
            }
        }

        public async Task RestartGame(string gameId)
        {
            var game = GameManager.GetGame(gameId);
            
            if (game == null)
            {
                await Clients.Caller.SendAsync("Error", new { message = "Game not found" });
                return;
            }

            // Reset the game
            for (int i = 0; i < 9; i++)
            {
                game.Board[i] = "";
            }
            game.CurrentTurn = 0;
            game.Status = "playing";
            
            // Notify both players that the game has restarted
            await Clients.Group(game.Id).SendAsync("GameStarted", new
            {
                gameId = game.Id,
                board = game.Board,
                currentTurn = game.CurrentTurn,
                players = game.Players
            });
            
            Console.WriteLine($"Game restarted: {game.Id}");
        }
    }
}
