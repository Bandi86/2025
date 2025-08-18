# Product Overview

This is a **Football Automation System** - a comprehensive PDF to JSON converter specifically designed for processing football/sports betting data. The system automates the extraction, processing, and analysis of football match data from PDF documents.

## Core Functionality

- **PDF Processing**: Converts PDF documents to structured JSON format with multiple output types (basic, detailed, minimal, structured)
- **Football Data Extraction**: Specialized extraction of football matches, odds, and betting markets from converted JSON
- **Automated Processing Pipeline**: Complete automation workflow with web downloading, file monitoring, and processing
- **Data Normalization**: Team name normalization with alias mapping and OCR error correction
- **Market Processing**: Intelligent grouping and classification of betting markets
- **Report Generation**: Comprehensive reporting with statistics, anomaly detection, and daily breakdowns

## Key Features

- **Multi-interface Access**: CLI, REST API, and Streamlit web dashboard
- **Scalable Architecture**: Docker-based deployment with separate services for API, automation, and workers
- **Real-time Monitoring**: Health checks, metrics collection, and alerting system
- **Data Persistence**: PostgreSQL database with Redis caching
- **Security**: JWT authentication, rate limiting, and input validation

## Target Use Cases

- Automated processing of sports betting data from PDF sources
- Real-time monitoring and processing of football match information
- Data extraction and normalization for sports analytics
- Batch processing of historical sports data