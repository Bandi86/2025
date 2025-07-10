# Tests Directory

## Structure

### `unit/`

Unit tests for individual components:

- `test_match_status.py` - Match status filtering tests
- `test_detailed_with_filtering.py` - Detailed scraping with filtering
- `test_past_date_logic.py` - Date logic validation

### `integration/`

Integration tests for complete workflows:

- `test_complete_pipeline.py` - Full pipeline testing
- `test_complete_system.py` - Complete system testing
- `test_optimized_*.py` - Optimized workflow tests
- `test_finished_*.py` - Finished match processing tests

### `archived/`

Old test files that are no longer actively used.

## Running Tests

```bash
# Run unit tests
python tests/unit/test_match_status.py

# Run integration tests
python tests/integration/test_complete_pipeline.py
```

## Test Data

Tests use the saved HTML dump from `example/flashscoreindex.json` for consistent results.
