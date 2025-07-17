# Sport Agent - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Projekt Leírás

Ez egy intelligens sport ügynök alkalmazás, amely automatikusan gyűjti a sportmérkőzések adatait különböző forrásokból, elemzi azokat és riportokat generál.

## Főbb Komponensek

- **Scrapers**: Web scraping modulok különböző sport weboldalakon
- **APIs**: Sport API integrációk (Football-Data.org, The Odds API, stb.)
- **Data Processing**: Adatfeldolgozás és elemzés pandas-szal
- **Reports**: Riport generálás HTML, Markdown, JSON formátumokban
- **Utils**: Segédeszközök (dátum kezelés, logging)

## Kódolási Irányelvek

1. **Magyar kommentek**: Minden komment és docstring magyar nyelven
2. **Típusok**: Használj type hints-et minden függvénynél
3. **Hibakezelés**: Robusztus hibakezelés try-except blokkok
4. **Logging**: Használd a központi Logger osztályt
5. **Konfiguráció**: Minden beállítás a Config osztályon keresztül
6. **Dokumentáció**: Részletes docstring-ek minden osztálynál és függvénynél

## Technológiák

- **Python 3.8+**
- **Requests**: HTTP kérések
- **BeautifulSoup4**: HTML parsing
- **Pandas**: Adatfeldolgozás
- **Jinja2**: Template engine
- **Rich**: Szép konzol kimenetek
- **Click**: CLI interface

## Architektúra

A projekt moduláris felépítésű, ahol minden komponens külön modulban van és jól definiált interfészeken keresztül kommunikál egymással.
