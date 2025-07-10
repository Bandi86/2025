# Matches Page Refactor Documentation

## Overview

The matches page has been completely refactored from a single 660-line file into a clean, modular architecture with reusable components, custom hooks, utility functions, and proper TypeScript types.

## File Structure

```
src/
├── types/
│   └── match.ts                    # TypeScript interfaces and types
├── utils/
│   └── match-helpers.ts           # Helper functions and utilities
├── hooks/
│   └── use-matches.ts             # Custom hook for fetching matches
├── components/
│   └── matches/
│       ├── index.ts               # Component exports
│       ├── matches-header.tsx     # Header with navigation and live count
│       ├── competition-sidebar.tsx # Competition filter sidebar
│       ├── match-card.tsx         # Individual match display
│       ├── matches-list.tsx       # List of match cards
│       ├── odds-display.tsx       # Betting odds component
│       └── match-states.tsx       # Loading, error, and empty states
└── app/
    └── matches/
        └── page.tsx               # Main page (now only 150 lines)
```

## Components Overview

### 1. **MatchesHeader**

- Contains the page title and date navigation
- Shows live matches count
- Handles date changes

### 2. **CompetitionSidebar**

- Displays filterable list of competitions
- Star/favorite functionality
- Match count per competition
- Select all/none functionality

### 3. **MatchCard**

- Individual match display
- Team information with logos
- Match status badges (live, upcoming, finished)
- Main betting odds (1X2)
- Expandable additional markets

### 4. **OddsDisplay**

- Reusable betting odds component
- Color-coded buttons (green/yellow/blue)
- Expandable additional markets button

### 5. **MatchesList**

- Container for all match cards
- Groups matches by competition and date
- Handles expand/collapse state

### 6. **Match States (LoadingState, ErrorState, EmptyState)**

- Loading skeleton components
- Error handling display
- Empty state when no matches found

## Custom Hook

### **useMatches**

- Fetches match data from API
- Handles loading and error states
- Automatic retry logic
- Returns typed match data

## Utility Functions

### **match-helpers.ts**

- `formatCompetitionName()` - Clean competition names
- `formatDate()` - Hungarian date formatting
- `formatTime()` - Hungarian time formatting with timezone
- `capitalizeTeamName()` - Proper team name formatting
- `getMatchStatus()` - Determine match status (live, upcoming, etc.)
- `getDateNavigation()` - Date navigation logic
- `getMatchCardBg()` - Dynamic card styling based on status
- `getTeamLogo()` - Team logo URL helper

## Type Definitions

### **match.ts**

- `Match` - Complete match interface
- `Team` - Team information
- `Competition` - Competition/league data
- `Market` - Betting market with odds
- `MatchStatus` - Status with type and label
- `DateNavigation` - Date navigation data

## Benefits of Refactoring

### ✅ **Maintainability**

- **Single Responsibility**: Each component has one clear purpose
- **Easy to Find**: Related code is grouped logically
- **Quick Fixes**: Bug fixes only require editing specific components

### ✅ **Reusability**

- **Components**: Can be reused across different pages
- **Utilities**: Helper functions available throughout the app
- **Types**: Consistent data structures

### ✅ **Testing**

- **Unit Tests**: Each component can be tested independently
- **Isolation**: Components can be tested in isolation
- **Mocking**: Easy to mock dependencies

### ✅ **Development Speed**

- **Faster Debugging**: Smaller files are easier to understand
- **Team Collaboration**: Multiple developers can work on different components
- **Feature Development**: New features can be added without touching existing code

### ✅ **Code Quality**

- **TypeScript**: Full type safety across all components
- **Consistency**: Uniform patterns and structures
- **Documentation**: Clear interfaces and function signatures

## Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **File Size** | 660 lines | 150 lines (main page) |
| **Components** | 1 monolithic component | 6 focused components |
| **Logic Location** | All in one place | Separated by concern |
| **Reusability** | None | High |
| **Testing** | Difficult | Easy |
| **Team Development** | Bottleneck | Parallel work |

## Usage Example

```tsx
import { MatchesHeader, CompetitionSidebar, MatchesList } from '@/components/matches';
import { useMatches } from '@/hooks/use-matches';
import { getDateNavigation } from '@/utils/match-helpers';

export default function MatchesPage() {
  const { matches, loading, error } = useMatches();

  return (
    <div>
      <MatchesHeader
        liveMatchesCount={5}
        dateNavigation={getDateNavigation(selectedDate)}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      <div className="flex gap-6">
        <CompetitionSidebar
          competitions={competitions}
          selectedCompetitions={selected}
          onToggleSelected={handleToggle}
        />

        <MatchesList
          groupedMatches={grouped}
          expanded={expanded}
          onToggleExpand={toggleExpand}
        />
      </div>
    </div>
  );
}
```

## Next Steps

1. **Add Unit Tests**: Create tests for each component
2. **Storybook**: Add component stories for documentation
3. **Performance**: Add React.memo() where needed
4. **Accessibility**: Improve ARIA labels and keyboard navigation
5. **Mobile**: Optimize responsive design for smaller screens
