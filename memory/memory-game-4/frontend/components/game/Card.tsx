import React from 'react';

// Define the props for the Card component
interface CardProps {
  id: number; // Unique identifier for the card
  content: string; // The emoji or image URL for the card face
  isFlipped: boolean; // Whether the card is currently face up
  isMatched: boolean; // Whether the card has been successfully matched
  onClick: (id: number) => void; // Function to call when the card is clicked
}

const Card: React.FC<CardProps> = ({ id, content, isFlipped, isMatched, onClick }) => {
  const handleClick = () => {
    // Only allow clicks on cards that are not already flipped or matched
    if (!isFlipped && !isMatched) {
      onClick(id);
    }
  };

  // Base styles for the card
  const baseStyle = "flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-lg shadow-md cursor-pointer transition-transform duration-300 ease-in-out";
  
  // Styles for the card back (when not flipped or matched)
  const backStyle = "bg-indigo-500 hover:bg-indigo-600";
  
  // Styles for the card front (when flipped but not matched)
  const frontStyle = "bg-gray-100 transform rotate-y-180"; // Added rotate-y-180 for flip effect
  
  // Styles for matched cards
  const matchedStyle = "bg-green-300 opacity-50 cursor-not-allowed"; // Visually indicate matched cards

  // Determine the current style based on the card's state
  let currentStyle = `${baseStyle} ${backStyle}`;
  if (isMatched) {
    currentStyle = `${baseStyle} ${matchedStyle}`;
  } else if (isFlipped) {
    currentStyle = `${baseStyle} ${frontStyle}`;
  }

  // Add perspective for the 3D flip effect (applied to the container or a wrapper if needed)
  // This might be better placed on the grid container for performance
  const perspectiveStyle = "perspective-1000"; 

  return (
    <div className={perspectiveStyle} onClick={handleClick}>
      <div className={`${currentStyle} ${isFlipped || isMatched ? 'rotate-y-180' : ''}`}> 
        {/* Content is only visible when flipped or matched */}
        {(isFlipped || isMatched) && (
          <span className="text-4xl sm:text-5xl transform rotate-y-180"> {/* Counter-rotate content */}
            {content}
          </span>
        )}
      </div>
    </div>
  );
};

export default Card;
