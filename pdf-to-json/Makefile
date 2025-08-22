# PDF to JSON Converter - Development Makefile
.PHONY: help setup test clean lint format run convert extract install dev

# Default target
help:
	@echo "Available commands:"
	@echo "  setup         Install dependencies and setup development environment"
	@echo "  test          Run all tests"
	@echo "  test-unit     Run unit tests only"
	@echo "  test-int      Run integration tests only"
	@echo "  clean         Clean up generated files and cache"
	@echo "  lint          Run linting checks"
	@echo "  format        Format code with black"
	@echo "  run           Run the main application"
	@echo "  convert       Convert a PDF file (requires INPUT and OUTPUT vars)"
	@echo "  extract       Extract football data (requires INPUT and OUTPUT vars)"
	@echo "  install       Install the package in development mode"
	@echo "  dev           Start development server"
	@echo "  docker-build  Build Docker image"
	@echo "  docker-run    Run Docker container"

# Setup
setup:
	@echo "Setting up development environment..."
	pip install -r requirements.txt
	pip install -e .
	@echo "✅ Setup complete!"

# Testing
test:
	@echo "Running all tests..."
	pytest tests/ -v --cov=src --cov-report=html

test-unit:
	@echo "Running unit tests..."
	pytest tests/unit/ -v

test-int:
	@echo "Running integration tests..."
	pytest tests/integration/ -v

# Code Quality
lint:
	@echo "Running linting checks..."
	flake8 src/ tests/
	black --check src/ tests/

format:
	@echo "Formatting code..."
	black src/ tests/

# Development
dev:
	@echo "Starting development server..."
	uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

run:
	@echo "Running main application..."
	python main.py $(ARGS)

# Common conversion tasks
convert:
	@if [ -z "$(INPUT)" ]; then echo "Error: INPUT variable required"; exit 1; fi
	@if [ -z "$(OUTPUT)" ]; then echo "Error: OUTPUT variable required"; exit 1; fi
	@echo "Converting $(INPUT) to $(OUTPUT)..."
	python main.py --input $(INPUT) --output $(OUTPUT)

extract:
	@if [ -z "$(INPUT)" ]; then echo "Error: INPUT variable required"; exit 1; fi
	@if [ -z "$(OUTPUT)" ]; then echo "Error: OUTPUT variable required"; exit 1; fi
	@echo "Extracting football data from $(INPUT) to $(OUTPUT)..."
	python main.py --extract-football $(INPUT) --football-output $(OUTPUT)

# Complete pipeline
pipeline:
	@if [ -z "$(INPUT)" ]; then echo "Error: INPUT variable required"; exit 1; fi
	@echo "Running complete football conversion pipeline..."
	python main.py --convert-football $(INPUT) --output data/output/

# Cleanup
clean:
	@echo "Cleaning up generated files..."
	rm -rf data/output/*
	rm -rf data/temp/*
	rm -rf logs/*/*.log
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pytest_cache" -type d -exec rm -rf {} + 2>/dev/null || true

clean-all: clean
	@echo "Deep cleaning..."
	rm -rf .coverage htmlcov/
	rm -rf data/output/*
	rm -rf data/processed/*

# Docker
docker-build:
	@echo "Building Docker image..."
	docker build -t pdf-to-json .

docker-run:
	@echo "Running Docker container..."
	docker run -p 8000:8000 -v $(PWD)/data:/app/data pdf-to-json

# Utility
logs:
	@echo "Showing recent logs..."
	tail -f logs/processing/*.log

status:
	@echo "Project status:"
	@echo "  Python version: $(shell python --version)"
	@echo "  Dependencies: $(shell pip list | wc -l) packages"
	@echo "  Input files: $(shell find data/input -name "*.pdf" | wc -l) PDFs"
	@echo "  Output files: $(shell find data/output -name "*.json" | wc -l) JSONs"
	@echo "  Test files: $(shell find tests -name "test_*.py" | wc -l) tests"

# Examples
example-convert:
	@echo "Example: Converting PDF to JSON"
	@make convert INPUT=data/input/Web__62sz__K__08-05.pdf OUTPUT=data/output/example.json

example-extract:
	@echo "Example: Extracting football data"
	@make extract INPUT=data/output/example.json OUTPUT=data/output/football_data.json

example-pipeline:
	@echo "Example: Running complete pipeline"
	@make pipeline INPUT=data/output/example.json
