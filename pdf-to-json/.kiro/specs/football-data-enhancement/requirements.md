# Requirements Document

## Introduction

This feature enhances the existing football data extraction and processing system to address current issues with team name normalization, market classification, data deduplication, and reporting. The system currently extracts football match data from PDF-converted JSON files but suffers from inconsistent team names, poor market grouping, and lacks comprehensive reporting capabilities. This enhancement will implement robust team normalization, improved market detection, data deduplication with priority-based capping, per-day data splitting, comprehensive reporting, and a unified conversion workflow.

## Requirements

### Requirement 1

**User Story:** As a data analyst, I want accurate and consistent team names across all extracted football data, so that I can perform reliable analysis without manual data cleaning.

#### Acceptance Criteria

1. WHEN the system extracts team names THEN it SHALL apply normalization using a configurable alias mapping system
2. WHEN team names contain OCR errors or variations THEN the system SHALL correct them using heuristic rules and the alias map
3. WHEN the alias map is updated THEN the system SHALL use the new mappings for subsequent extractions
4. IF a team name cannot be normalized THEN the system SHALL log it as an anomaly for manual review
5. WHEN generating reports THEN the system SHALL include a mapping of original to normalized team names

### Requirement 2

**User Story:** As a sports betting analyst, I want properly classified and grouped markets for each football match, so that I can distinguish between main markets and additional betting options.

#### Acceptance Criteria

1. WHEN extracting football data THEN the system SHALL identify main 1X2 markets separately from special bet types
2. WHEN multiple markets exist for the same game THEN the system SHALL group them under a single game entry
3. WHEN classifying markets THEN the system SHALL use improved detection algorithms to identify market types
4. IF market classification is uncertain THEN the system SHALL mark it for manual review
5. WHEN merging markets THEN the system SHALL preserve all original market information

### Requirement 3

**User Story:** As a data processor, I want duplicate markets removed and additional markets capped to a reasonable limit, so that the dataset remains manageable and focused on the most relevant betting options.

#### Acceptance Criteria

1. WHEN processing additional markets THEN the system SHALL remove exact duplicates
2. WHEN multiple additional markets exist for a game THEN the system SHALL cap them to 10 markets maximum
3. WHEN capping markets THEN the system SHALL use a confirmed priority system to select the most important markets
4. WHEN markets are capped THEN the system SHALL log which markets were excluded
5. WHEN generating reports THEN the system SHALL include statistics on deduplication and capping actions

### Requirement 4

**User Story:** As a daily operations manager, I want football data automatically split by day with standardized filenames, so that I can easily process and archive daily betting data.

#### Acceptance Criteria

1. WHEN processing football data THEN the system SHALL split matches by date into separate files
2. WHEN creating daily files THEN the system SHALL use ISO date format in filenames (YYYY-MM-DD)
3. WHEN splitting data THEN the system SHALL maintain the original merged file alongside daily splits
4. WHEN a date cannot be determined THEN the system SHALL place matches in an "undated" file
5. WHEN daily files are created THEN the system SHALL store them in a dedicated jsons/days/ directory

### Requirement 5

**User Story:** As a data quality manager, I want comprehensive reports on extraction results, anomalies, and processing statistics, so that I can monitor system performance and identify data quality issues.

#### Acceptance Criteria

1. WHEN extraction completes THEN the system SHALL generate JSON and CSV reports
2. WHEN generating reports THEN the system SHALL include counts of games, markets, and processing actions
3. WHEN anomalies are detected THEN the system SHALL log them with details in the reports
4. WHEN normalization occurs THEN the system SHALL include mapping statistics in reports
5. WHEN reports are generated THEN the system SHALL store them in jsons/reports/ directory with timestamps

### Requirement 6

**User Story:** As a system integrator, I want a unified high-level conversion flow that orchestrates all processing steps, so that I can run the complete football data pipeline with a single command.

#### Acceptance Criteria

1. WHEN the convert_football flow is invoked THEN it SHALL execute extraction, merging, splitting, and reporting in sequence
2. WHEN any step fails THEN the system SHALL provide clear error messages and continue with remaining steps where possible
3. WHEN the flow completes THEN it SHALL return a comprehensive summary of all processing results
4. IF configuration files are missing THEN the system SHALL create default configurations
5. WHEN the flow runs THEN it SHALL log all major processing steps and their outcomes

### Requirement 7

**User Story:** As a software developer, I want comprehensive unit tests for all new functionality, so that I can ensure code quality and prevent regressions during future development.

#### Acceptance Criteria

1. WHEN new merging functionality is implemented THEN it SHALL have unit tests covering normal and edge cases
2. WHEN capping logic is implemented THEN it SHALL have tests verifying priority-based selection
3. WHEN normalization features are added THEN they SHALL have tests for alias mapping and heuristics
4. WHEN per-day splitting is implemented THEN it SHALL have tests for date parsing and file organization
5. WHEN all tests run THEN they SHALL achieve at least 90% code coverage for new functionality
