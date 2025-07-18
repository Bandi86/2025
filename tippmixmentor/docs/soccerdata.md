https://github.com/probberechts/soccerdata
Mi a soccerdata?
A soccerdata egy Python könyvtár, amely különböző futball adatforrásokból való adatgyűjtésre szolgál. Ez egy nyílt forráskódú projekt, amely lehetővé teszi a felhasználók számára, hogy különböző népszerű futball adatforrásokból strukturált adatokat gyűjtsenek.

Főbb jellemzők:
Adatforrások: A könyvtár számos népszerű futball adatforrásból képes adatokat gyűjteni, többek között:

Club Elo
ESPN
FBref
FotMob
Sofascore
SoFIFA
Understat
WhoScored
Adatformátum: Az adatokat Pandas DataFrame formátumban adja vissza, egységes oszlopnevekkel és azonosítókkal, ami megkönnyíti a különböző forrásokból származó adatok összehasonlítását és kombinálását.

Gyorsítótárazás: Az adatokat automatikusan letölti és helyben tárolja, így nem kell minden alkalommal újra letölteni ugyanazokat az adatokat.

Hogyan használható a BettingMentor projektben:
A soccerdata könyvtár tökéletesen illeszkedik a BettingMentor projekt céljaihoz, mivel:

Adatgyűjtés: A BettingMentor AI-alapú sportfogadási rendszerként működik, amely több adatforrást elemez. A soccerdata segítségével automatikusan gyűjthetők adatok különböző futball mérkőzésekről, csapatokról és játékosokról.

Adatelőkészítés: A könyvtár által biztosított strukturált adatok közvetlenül felhasználhatók a BettingMentor AI modellek betanításához és predikciók készítéséhez.

Integrálás a meglévő rendszerbe: A soccerdata könnyen integrálható a projekt Python alapú komponenseibe, különösen a betmentors modulba, amely az AI modelleket és bot logikát tartalmazza.

Példa használatra:
import soccerdata as sd

# FBref adatforrás inicializálása az angol Premier League 2021-es szezonjára
fbref = sd.FBref('ENG-Premier League', '2021')

# Adatok lekérése
meccsek = fbref.read_schedule()  # Mérkőzések ütemezése
csapat_statisztikak = fbref.read_team_season_stats(stat_type="passing")  # Csapat passzolási statisztikák
jatekos_statisztikak = fbref.read_player_season_stats(stat_type="standard")  # Játékos alap statisztikák
Hogyan illeszkedik a projekt struktúrájába:
A soccerdata könyvtár a BettingMentor projekt adatgyűjtési rétegének része lehet. A dokumentáció alapján a projekt adatfolyam architektúrája:

Adatgyűjtés: webscrapper + pdfconverter → Nyers adatok

Itt a soccerdata kiegészítheti vagy helyettesítheti a meglévő webscrapper modult, különösen a futball adatok gyűjtésében.
Adatfeldolgozás: betmentors → AI elemzés

A soccerdata által gyűjtött adatok feldolgozhatók a betmentors modulban lévő AI modellek által.
API réteg: backend → Üzleti logika és adathozzáférés

Felhasználói felület: frontend → Felhasználói interakció

Tárolás: PostgreSQL (strukturált) + Redis (gyorsítótár)

Összefoglalás:
A soccerdata egy hatékony eszköz a BettingMentor projektben, amely lehetővé teszi a különböző futball adatforrásokból való automatikus adatgyűjtést. Ezek az adatok felhasználhatók az AI modellek betanításához és predikciók készítéséhez, ami a projekt fő célja. A könyvtár könnyen integrálható a meglévő Python alapú komponensekbe, és segít a projekt adatgyűjtési folyamatának automatizálásában és strukturálásában.