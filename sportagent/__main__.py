"""
Sport Agent - Modulként való futtatáshoz
"""

if __name__ == "__main__":
    from src.main import main

    # Példa paraméterek megadása a main függvényhíváshoz
    # Kérlek, módosítsd az értékeket a saját igényeid szerint!
    main(
        date=None,            # vagy pl. '2024-06-01'
        interactive=False,    # vagy True, ha interaktív módot szeretnél
        format="json"         # vagy 'html', 'markdown'
    )
