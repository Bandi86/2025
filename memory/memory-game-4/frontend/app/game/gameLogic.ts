import { GameDifficulty, GameConfigs, Card, GameState } from './types'

/**
 * Game configuration constants
 */
export const GAME_CONFIGS: GameConfigs = {
  easy: { pairs: 8, cols: 4 },    // 16 cards
  medium: { pairs: 12, cols: 6 }, // 24 cards
  hard: { pairs: 18, cols: 6 }    // 36 cards
}

// Pool of emojis - ensure enough unique ones for hard difficulty (18 pairs)
const EMOJI_POOL = [
  '😀', '😎', '😍', '🤩', '😊', '😜', '🤪', '😇', 
  '🥳', '😋', '🤓', '🥰', '🤠', '😺', '🦄', '🐶', 
  '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', 
  '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', 
  '🐦', '🐤', '🦋', '🍎' // Add more if needed
];

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * @param array The array to shuffle.
 * @returns The shuffled array.
 */
const shuffleArray = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
};

/**
 * Initializes a new game state with shuffled cards.
 * @param difficulty The game difficulty level.
 * @returns Initial game state.
 */
export const initializeGame = (difficulty: GameDifficulty): GameState => {
  const { pairs } = GAME_CONFIGS[difficulty];
  
  // Select unique emojis for the current difficulty
  const selectedEmojis = EMOJI_POOL.slice(0, pairs);
  const cardValues = [...selectedEmojis, ...selectedEmojis]; // Create pairs
  const shuffledValues = shuffleArray(cardValues);

  const cards: Card[] = shuffledValues.map((value, index) => ({
    id: index,
    value: value,
    isFlipped: false,
    isMatched: false,
  }));

  return {
    cards: cards,
    flippedCardIds: [],
    moves: 0,
    isGameWon: false,
    timer: 0,
    isGameStarted: false, // Game starts on first click
  };
};

/**
 * Handles the logic when a card is clicked.
 * @param currentState The current game state.
 * @param clickedCardId The ID of the card that was clicked.
 * @returns The new game state after the click.
 */
export const handleCardClick = (currentState: GameState, clickedCardId: number): GameState => {
  // If game hasn't started, start it
  const isGameStarted = currentState.isGameStarted || true;

  // Ignore clicks if 2 cards are already flipped or the clicked card is already flipped/matched
  if (currentState.flippedCardIds.length >= 2 || currentState.cards[clickedCardId].isFlipped) {
    return currentState;
  }

  const newFlippedCardIds = [...currentState.flippedCardIds, clickedCardId];
  let newCards = currentState.cards.map(card => 
    card.id === clickedCardId ? { ...card, isFlipped: true } : card
  );
  let newMoves = currentState.moves + 1; // Increment moves on each valid click that flips a card

  let isGameWon = currentState.isGameWon;

  // Check for match if two cards are flipped
  if (newFlippedCardIds.length === 2) {
    const [firstCardId, secondCardId] = newFlippedCardIds;
    const firstCard = newCards.find(c => c.id === firstCardId);
    const secondCard = newCards.find(c => c.id === secondCardId);

    if (firstCard && secondCard && firstCard.value === secondCard.value) {
      // Match found! Mark cards as matched
      newCards = newCards.map(card => 
        card.id === firstCardId || card.id === secondCardId ? { ...card, isMatched: true } : card
      );
      // Check if all cards are matched
      isGameWon = newCards.every(card => card.isMatched);
      // Reset flipped cards immediately after a match
      newFlippedCardIds.length = 0; 
    } else {
      // No match - cards will be flipped back after a delay (handled in component via useEffect)
      // We only update the state here; the visual flip-back is triggered by the component
    }
  }

  return {
    ...currentState,
    cards: newCards,
    flippedCardIds: newFlippedCardIds,
    moves: newMoves,
    isGameWon: isGameWon,
    isGameStarted: isGameStarted,
    timer: isGameStarted && !currentState.isGameStarted ? 0 : currentState.timer // Reset timer only if game just started
  };
};

// Note: The logic to flip cards back on mismatch needs to be handled 
// in the component (page.tsx) using a useEffect and setTimeout, 
// typically by resetting flippedCardIds after a delay if no match occurred.
// This function only updates the state based on the immediate click result.
