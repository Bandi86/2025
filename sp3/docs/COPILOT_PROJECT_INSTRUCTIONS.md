# Copilot Project Instructions

## Project Overview

This project consists of three main components:

- **backend/**: Node.js/NestJS backend for API, business logic, and database access.
- **frontend/**: Next.js frontend for the user interface.
- **ml_pipeline/**: Python-based machine learning and data processing pipeline.

## Improved Folder Structure & Responsibilities

### backend/

- **src/**: Main backend source code, organized by domain (e.g., competitions, matches, teams).
- **scripts/**: Utility and maintenance scripts for backend operations.
- **prisma/**: Database schema, migrations, and seed scripts.
- **tests/**: Backend-specific tests.
- **reports/**: Data validation and analysis reports.

### frontend/

- **src/**: Main frontend source code (React/Next.js).
- **components/**, **hooks/**, **lib/**, **utils/**, **types/**: Modularized frontend logic.
- **public/**: Static assets.
- **docs/**: Frontend documentation.
- **tests/**: Frontend-specific tests.

### ml_pipeline/

- **src/**: Core ML/data pipeline code.
- **models/**: Model definitions and trained models.
- **data/**: Input/output datasets.
- **scripts/**: Standalone scripts and CLI tools.
- **reports/**: ML reports and logs.
- **notebooks/**: Jupyter notebooks for experiments.

### database/

- **init/**: Database initialization scripts.

### docs/

- Centralized documentation for the entire project.

### scripts/

- Root-level utility scripts (if needed).

## General Guidelines

- Keep code modular and organized by responsibility.
- Place documentation in the relevant docs/ folder or centralized docs/.
- Use consistent naming conventions across all folders and files.
- Separate tests from production code.
- Store all reports and logs in the appropriate reports/ folder.

## Usage for Copilot

- Use this structure to understand where to place new code, find existing logic, and maintain separation of concerns.
- When generating code, follow the modular and domain-driven organization described above.
- Always check for existing utilities or modules before creating new ones.
