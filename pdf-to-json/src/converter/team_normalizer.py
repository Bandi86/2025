"""Team name normalization utilities for football data processing.

This module provides the TeamNormalizer class for normalizing team names
using alias mapping, heuristic rules, and fuzzy matching.
"""

import re
import unicodedata
import logging
from typing import Dict, Any, List, Optional, Tuple, Set
from difflib import SequenceMatcher

from .config_loader import load_team_aliases_config


class TeamNormalizer:
    """Class for normalizing team names using alias mapping and heuristics.
    
    This class provides methods for normalizing team names using a combination of:
    1. Direct alias mapping from configuration
    2. Heuristic-based normalization (pattern removal, replacements, case normalization)
    3. OCR error correction
    4. Fuzzy matching for similar names
    
    It also tracks statistics about normalization operations for monitoring and debugging.
    """
    
    def __init__(self, config_dir: str = "config", config_file: str = "team_aliases.json"):
        """Initialize the TeamNormalizer with configuration.
        
        Args:
            config_dir: Directory containing configuration files
            config_file: Name of the team aliases configuration file
        """
        self.logger = logging.getLogger(__name__)
        self.config = load_team_aliases_config(config_dir, config_file)
        
        # Extract configuration sections
        self.aliases = self.config["aliases"]
        self.heuristics = self.config["heuristics"]
        self.settings = self.config["settings"]
        
        # Compile regex patterns for better performance
        self.remove_patterns = [re.compile(pattern) for pattern in self.heuristics["remove_patterns"]]
        self.replace_patterns = {re.compile(pattern): replacement 
                               for pattern, replacement in self.heuristics["replace_patterns"].items()}
        
        # OCR error correction mapping
        self.ocr_errors = self.heuristics.get("common_ocr_errors", {})
        
        # Case normalization settings
        self.case_normalization = self.heuristics.get("case_normalization", {"enabled": False})
        self.preserve_abbreviations = set(self.case_normalization.get("preserve_known_abbreviations", []))
        
        # Fuzzy matching settings
        self.enable_fuzzy_matching = self.settings.get("enable_fuzzy_matching", False)
        self.max_edit_distance = self.settings.get("max_edit_distance", 2)
        self.min_confidence_threshold = self.settings.get("min_confidence_threshold", 0.8)
        self.log_unmatched_teams = self.settings.get("log_unmatched_teams", True)
        
        # Statistics tracking
        self.stats = {
            "total_normalizations": 0,
            "direct_alias_matches": 0,
            "heuristic_normalizations": 0,
            "ocr_corrections": 0,
            "fuzzy_matches": 0,
            "unmatched": 0,
            "unmatched_teams": set()
        }
    
    def normalize(self, team_name: str) -> str:
        """Normalize a team name using all available methods.
        
        This method applies the following normalization steps in order:
        1. Basic cleaning (whitespace, special characters)
        2. Direct alias lookup
        3. Heuristic-based normalization
        4. OCR error correction
        5. Fuzzy matching (if enabled)
        
        Args:
            team_name: The team name to normalize
            
        Returns:
            Normalized team name
        """
        if not team_name:
            return ""
        
        self.stats["total_normalizations"] += 1
        
        # Basic cleaning
        cleaned_name = self._basic_clean(team_name)
        
        # Direct alias lookup
        if cleaned_name in self.aliases:
            self.stats["direct_alias_matches"] += 1
            return self.aliases[cleaned_name]
        
        # Apply heuristic normalization
        normalized_name = self._apply_heuristics(cleaned_name)
        
        # Check if the normalized name matches an alias
        if normalized_name in self.aliases:
            self.stats["direct_alias_matches"] += 1
            return self.aliases[normalized_name]
        
        # Apply OCR error correction
        corrected_name = self._correct_ocr_errors(normalized_name)
        if corrected_name != normalized_name:
            self.stats["ocr_corrections"] += 1
            normalized_name = corrected_name
            
            # Check if the corrected name matches an alias
            if normalized_name in self.aliases:
                self.stats["direct_alias_matches"] += 1
                return self.aliases[normalized_name]
        
        # Try fuzzy matching if enabled
        if self.enable_fuzzy_matching:
            fuzzy_match = self._find_fuzzy_match(normalized_name)
            if fuzzy_match:
                self.stats["fuzzy_matches"] += 1
                return fuzzy_match
        
        # If we reach here, we couldn't find a match
        if self.log_unmatched_teams:
            self.stats["unmatched"] += 1
            self.stats["unmatched_teams"].add(team_name)
            self.logger.debug(f"Unmatched team name: {team_name} -> {normalized_name}")
        
        return normalized_name
    
    def _basic_clean(self, name: str) -> str:
        """Perform basic cleaning of a team name.
        
        Args:
            name: Team name to clean
            
        Returns:
            Cleaned team name
        """
        # Remove extra whitespace
        name = re.sub(r'\s+', ' ', name.strip())
        return name
    
    def _apply_heuristics(self, name: str) -> str:
        """Apply heuristic-based normalization rules.
        
        Args:
            name: Team name to normalize
            
        Returns:
            Normalized team name
        """
        original_name = name
        
        # Apply remove patterns
        for pattern in self.remove_patterns:
            name = pattern.sub('', name)
        
        # Apply replace patterns
        for pattern, replacement in self.replace_patterns.items():
            name = pattern.sub(replacement, name)
        
        # Apply case normalization if enabled
        if self.case_normalization.get("enabled", False):
            name = self._normalize_case(name)
        
        # Track if any heuristics were applied
        if name != original_name:
            self.stats["heuristic_normalizations"] += 1
        
        return name
    
    def _normalize_case(self, name: str) -> str:
        """Normalize the case of a team name while preserving known abbreviations.
        
        Args:
            name: Team name to normalize case
            
        Returns:
            Case-normalized team name
        """
        # Split into words
        words = name.split()
        normalized_words = []
        
        for word in words:
            # Check if this is a known abbreviation to preserve
            if word.upper() in self.preserve_abbreviations:
                normalized_words.append(word.upper())
            else:
                # Title case for regular words
                normalized_words.append(word.capitalize())
        
        return ' '.join(normalized_words)
    
    def _correct_ocr_errors(self, name: str) -> str:
        """Correct common OCR errors in team names.
        
        Args:
            name: Team name to correct
            
        Returns:
            Corrected team name
        """
        corrected = name
        
        # Apply OCR error corrections
        for error, correction in self.ocr_errors.items():
            corrected = corrected.replace(error, correction)
        
        return corrected
    
    def _find_fuzzy_match(self, name: str) -> Optional[str]:
        """Find the closest matching team name using fuzzy matching.
        
        Args:
            name: Team name to find a match for
            
        Returns:
            Matched team name or None if no match found
        """
        best_match = None
        best_ratio = 0.0
        
        # Check against all aliases and their normalized forms
        for alias, normalized in self.aliases.items():
            # Calculate similarity ratio
            ratio = SequenceMatcher(None, name.lower(), alias.lower()).ratio()
            
            if ratio > best_ratio and ratio >= self.min_confidence_threshold:
                best_ratio = ratio
                best_match = normalized
        
        return best_match
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about normalization operations.
        
        Returns:
            Dictionary containing normalization statistics
        """
        # Convert unmatched_teams set to list for easier serialization
        stats_copy = self.stats.copy()
        stats_copy["unmatched_teams"] = list(self.stats["unmatched_teams"])
        return stats_copy
    
    def reset_stats(self) -> None:
        """Reset normalization statistics."""
        self.stats = {
            "total_normalizations": 0,
            "direct_alias_matches": 0,
            "heuristic_normalizations": 0,
            "ocr_corrections": 0,
            "fuzzy_matches": 0,
            "unmatched": 0,
            "unmatched_teams": set()
        }