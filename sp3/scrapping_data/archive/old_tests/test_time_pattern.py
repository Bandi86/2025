#!/usr/bin/env python3
"""
Test time extraction pattern to make sure it works correctly.
"""

import re

def test_time_extraction():
    """Test time extraction patterns."""

    test_cases = [
        "08.07. 02:00",
        "21:00",
        "07.07. 01:30",
        "29.06. 23:15",
        "15.06. 23:15",
        "21:30",
        "01:30"
    ]

    print("Testing time extraction patterns:")

    for base_time in test_cases:
        print(f"\nInput: '{base_time}'")

        # Pattern 1: Time at end after date
        time_match = re.search(r'(\d{1,2}:\d{2})(?:\s*$)', base_time)
        if time_match:
            result1 = time_match.group(1)
            print(f"  Pattern 1 (end): '{result1}'")
        else:
            print(f"  Pattern 1 (end): No match")

        # Pattern 2: Any time in string
        time_match = re.search(r'(\d{1,2}:\d{2})', base_time)
        if time_match:
            result2 = time_match.group(1)
            print(f"  Pattern 2 (any): '{result2}'")
        else:
            print(f"  Pattern 2 (any): No match")

if __name__ == "__main__":
    test_time_extraction()
