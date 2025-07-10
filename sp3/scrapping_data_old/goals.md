## scrapping data

# Mi a cel?
- adatokhoz jutni foci meccsekkel kapcsolatban aznapi meccslista letrehozasa, es az aznapi meccsekhez a reszletes adatok elkeszitese kulon fileba.

# mappa es file struktura

- fo mappa - data ezen belul datumozasi rendszer egy pelda erre: 2025/07/10
a mappan belul lesz 1db json ami az adot meccslista ennek neve az adott nap datuma .json
egy kulon mappa matches neven amibe az aznapi meccsek adatai szerepelnek kulon json fileokban
pl egy json-re 20250710_xy_vs_xy.json
- script mappa ebbe tesszuk a python fileokat probaljuk meg feladatok szerint kisebb fileokra bontani es utana egyy fo fileba importalni a reszeket.
- fo file neve scrapping.py ez felel a teljes folyamatert
- elso folyamat file az aznapi meccslista keszitese. daily_match_list.py ez elkesziti az adott napra a jsont a meccslistaval
- masodik folyamat file: ha mar letrejott a json az elozo filebol ez beolvassa belole a reszletes meccs linkeket es elkezdi ossze allitani meccs adatokat.
- kulon lehetnek a fileok minden fo url forrashoz pl eredmenyek.com, flashscore stb hogy jobban szet legyen bontva a logika es a rendszer kiiserje az oldal strukturajat es ezekbol a fileokbol dolgozzon

tovabbi mappak:
- docs mappa
- test mappa
- debug mapa
- logs
- reports

## reszletes meccs json struktura mit kellene tartalmazzon
** header **
Orszag: pl Bolivia
Bajnoksag neve: Division Profesional
Fordulo: pl 13
Datum: pl 2025.07.07
ido: 0:00
Csapatok: Bolivar - Independiente
odds meccs elott: pl: hazai 1.75 dontetlen 3.00 vendeg 5.12
Nyertes odds: 1.75
Vegeredmeny: 4 - 0

**pre match data**
    "referee": "",
    "venue": "",
    "capacity": "",
    "attendance": "",
    "weather": "",
    "temperature": ""

**match summary**
idopont  esemeny nev pl: 11 perc sargalap xy, vagy 15 perc gol xy cserek stb.

**match stat**
ez kulon tab ablakba elerheto
pelda adatok:
top stat:
varhato golok xg csapat1  csapat2
labdabirtoklas
osszes loves
kaput eltalalo lovesek
nagy eselyek
szogletek
passzok
sarga lap
piros lap

lovesek:
varhato golok xg
kaput talalo xgot
osszes loves
kaput eltalalo lovesek
kaput nem talalo lovesek
blokkolt loves
tizenhatoson beluli lovesek
tizenhatoson kivuli lovesek
kapufak
fejesgolok

Tamadasok:
nagy eselyek
szogletek
ellenfel kapuja elotti labdaerintesek
pontos keresztlabdak
lesek
szabadrugasok

Passzok:
passzok
hosszu passzok
passzok az utolso harmadban
beivelesek
varhato golpasszok (xA)
bedobasok

vedelem:
szabalytalansag
szerelesek
megnyert parharcok
tisztazasok
labdaszerzesek
loveshez vezeto hibak
golhoz vezeto hibak

kapus:
vedesek
kapott xGOT
megelozott golok

oddsok 1 x 2

## bovites
bovitesi lehetoseg hogy tobb fo urlbol csekkolni az aznapi meccseket, utana ha mar tudjuk milyen meccsek mikor es mikor kezdodnek van csapatnev stb akkor a reszletes meccs adatokat is lehet keresni tobb urlbol