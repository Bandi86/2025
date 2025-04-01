/**
 * Game configuration types
 */
export type GameDifficulty = 'easy' | 'medium' | 'hard';

export interface GameConfig {
  pairs: number;
  cols: number;
}

export interface GameConfigs {
  easy: GameConfig;
  medium: GameConfig;
  hard: GameConfig;
}

/**
 * Card types
 */
export interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

/**
 * Game state types
 */
export interface GameState {
  cards: Card[];
  flippedCardIds: number[];
  moves: number;
  isGameWon: boolean;
  timer: number;
  isGameStarted: boolean;
}

/**
 * Game statistics
 */
export interface GameStats {
  time: string;
  moves: number;
  difficulty: GameDifficulty;
}
