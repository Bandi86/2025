# TeamNormalizer

The `TeamNormalizer` class provides functionality for normalizing team names using configurable alias mapping, heuristic rules, OCR error correction, and fuzzy matching.

## Features

- **Alias Mapping**: Direct mapping of team name variations to canonical names
- **Heuristic Rules**:
  - Pattern removal (e.g., removing suffixes like "FC", "United", etc.)
  - Pattern replacement (e.g., replacing common abbreviations)
  - Case normalization with preserved abbreviations
- **OCR Error Correction**: Fixing common OCR errors in team names
- **Fuzzy Matching**: Finding the closest match when exact matches aren't found
- **Statistics Tracking**: Monitoring normalization performance

## Configuration

The `TeamNormalizer` uses the `team_aliases.json` configuration file with the following structure:

```json
{
  "aliases": {
    "team variation 1": "canonical team name",
    "team variation 2": "canonical team name",
    ...
  },
  "heuristics": {
    "remove_patterns": ["FC", "United", ...],
    "replace_patterns": {
      "Utd": "United",
      "Man": "Manchester",
      ...
    },
    "case_normalization": {
      "enabled": true,
      "preserved_abbreviations": ["FC", "AC", "SC", ...]
    },
    "common_ocr_errors": {
      "0": "o",
      "l": "i",
      ...
    }
  },
  "settings": {
    "max_edit_distance": 2,
    "min_confidence_threshold": 0.8,
    "enable_fuzzy_matching": true,
    "log_unmatched_teams": true
  }
}
```

## Usage

```python
from src.converter.team_normalizer import TeamNormalizer

# Initialize with path to config directory containing team_aliases.json
normalizer = TeamNormalizer("path/to/config/dir")

# Normalize a team name
normalized_name = normalizer.normalize("Manchester Utd")
# Result: "Manchester United"

# Get normalization statistics
stats = normalizer.get_stats()
print(stats)

# Reset statistics
normalizer.reset_stats()
```

## Normalization Process

The normalization process follows these steps:

1. Check for direct match in aliases
2. Apply heuristic rules:
   - Remove patterns
   - Apply replacements
   - Normalize case (preserving abbreviations)
   - Correct OCR errors
3. Check for match after heuristics
4. If still no match and fuzzy matching is enabled, find closest match
5. Update statistics

## Statistics

The `get_stats()` method returns a dictionary with the following information:

- `total_processed`: Total number of team names processed
- `direct_matches`: Number of direct matches from aliases
- `heuristic_matches`: Number of matches after applying heuristics
- `fuzzy_matches`: Number of matches found through fuzzy matching
- `unmatched_teams`: List of team names that couldn't be matched

## Example

See the `examples/team_normalizer_example.py` script for a complete usage example.