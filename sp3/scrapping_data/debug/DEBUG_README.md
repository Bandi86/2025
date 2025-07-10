# Debug and Testing Scripts

This folder contains debug scripts, legacy code, and testing utilities that are not part of the main production workflow.

## Contents

- `legacy_scripts/` - Old scripts that have been replaced
- `sites/` - Website-specific testing and analysis
- `README.md` - Testing documentation
- `simple_test_real_match.py` - Real match testing script
- `test_real_finished_match.py` - Finished match testing script

## Note

These scripts are kept for reference and debugging purposes. For production use, refer to the main `scripts/` folder.

The main production workflow is:

1. `scripts/simple_production_scraper.py` - Daily scraping
2. `scripts/process_finished_matches.py` - Process finished matches ⭐

---

**For production use, always use scripts from the main `scripts/` folder, not from debug!**
