using System;
using System.Collections.Generic;

namespace TicTacToe.Models
{
    public class Game
    {
        public string Id { get; set; }
        public string[] Board { get; set; }
        public List<string> Players { get; set; }
        public int CurrentTurn { get; set; }
        public string Status { get; set; }

        public Game()
        {
            Id = GenerateGameId();
            Board = new string[9];
            for (int i = 0; i < 9; i++)
            {
                Board[i] = "";
            }
            Players = new List<string>();
            CurrentTurn = 0;
            Status = "waiting"; // waiting, playing, finished
        }

        private string GenerateGameId()
        {
            return Guid.NewGuid().ToString().Substring(0, 6).ToUpper();
        }
    }

    public class GameResult
    {
        public string Status { get; set; }
        public int[] WinningLine { get; set; }
    }
}
