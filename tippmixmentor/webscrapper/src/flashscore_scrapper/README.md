# Flashscore Scrapper Module

This module is designed to scrape match data from Flashscore, providing a robust and extensible solution for collecting football statistics. It leverages Playwright for browser automation and is built with a focus on modularity, error handling, and maintainability.

## Current Capabilities

The `flashscore_scrapper` module is capable of:

* **Data Scraping:** Extracts match IDs and detailed match data (stage, date, home/away teams, result, information, statistics) for specified countries and leagues from Flashscore.
* **CSV Output:** A core feature is the ability to export scraped data into CSV format, making it easy to integrate with other data analysis tools.
* **Configurable Scraping Options:** Allows users to specify the country, league, output file type (e.g., CSV), and headless browser mode via command-line arguments or interactive prompts.
* **Robust Browser Management:** Manages browser instances, including launching, creating pages, closing, and health checks with auto-restart capabilities. It also handles user agent rotation for better scraping resilience.
* **Centralized Error Handling:** Classifies errors (Network, Scraping, Validation, System, Configuration) and implements retry mechanisms with exponential backoff to handle transient failures.
* **File-System Caching:** Utilizes a file system-based cache to store and retrieve scraped data efficiently, reducing redundant requests and improving performance.
* **Comprehensive Logging:** Provides detailed logging for various events and error conditions, aiding in monitoring and debugging.

## How to Use (CSV Functionality)

To use the CSV output functionality:

1. **Install Dependencies:**

    ```bash
    npm install
    ```

2. **Run the Scraper:**
    You can run the scraper via the command line, providing the necessary arguments:

    ```bash
    npm run cli -- --country "england" --league "premier-league" --fileType "csv" --headless true
    ```

    Replace `"england"` and `"premier-league"` with your desired country and league.
    * `--country`: The country of the league (e.g., "england").
    * `--league`: The league name (e.g., "premier-league").
    * `--fileType`: The desired output format. Use `"csv"` for CSV output.
    * `--headless`: Set to `true` for headless browser operation (recommended for server environments) or `false` to see the browser UI.

    If you omit any of the required arguments (`--country`, `--league`, `--fileType`), the CLI will interactively prompt you for the missing information.

3. **Output Location:**
    The generated CSV files will be saved in the `./riports/` directory within the `flashscore_scrapper` module, with filenames generated based on the league, season, and date (e.g., `premier_league_unknown_season_YYYY-MM-DD.csv`).

## Future Expansion and Improvement Recommendations

This section outlines key areas for future development and enhancement:

1. **Test Suite Enhancement:**
    * **Achieve 100% Passing Tests:** Ensure all existing tests are fully functional and reliable.
    * **Increase Test Coverage:** Implement comprehensive unit, integration, and end-to-end tests to cover all critical paths and scenarios.
    * **Mock External Dependencies:** Improve test isolation and speed by effectively mocking external services like Playwright and the file system.

2. **Additional Output Formats:**
    * **XML Output:** Implement a new XML converter and writer to provide data in XML format.
    * **Direct Database Integration:** Develop modules for direct data storage into various databases (e.g., PostgreSQL, MongoDB) to streamline data pipelines.

3. **Scraping Logic Enhancements:**
    * **Complex Scenario Handling:** Improve handling of dynamic content loading, CAPTCHA/anti-bot measures, and robust pagination/infinite scroll mechanisms.
    * **Advanced Error Recovery:** Expand recovery strategies to include more intelligent responses to scraping failures, such as dynamic proxy rotation or adaptive retry delays.
    * **Performance Optimization:** Implement controlled concurrency for scraping multiple matches and fine-tune resource management for long-running operations.

4. **Architectural and Code Quality Improvements:**
    * **Centralized Configuration:** Consolidate all application configurations into a single, easily manageable system.
    * **Dependency Injection:** Explore using dependency injection for better component management and testability.
    * **Improved Documentation:** Enhance JSDoc comments and internal documentation for better code understanding.
    * **Code Style Enforcement:** Maintain consistent code style and quality using linters and formatters.
    * **Performance Monitoring:** Integrate advanced tools for identifying and resolving performance bottlenecks.

These recommendations aim to make the `flashscore_scrapper` module even more robust, efficient, and versatile for future data scraping needs.
