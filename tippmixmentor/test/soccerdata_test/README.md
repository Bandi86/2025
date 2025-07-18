# SoccerData Tesztek

Ez a mappa a soccerdata könyvtár tesztelésére és a BettingMentor projektbe való integrálására szolgáló példakódokat tartalmaz.

## Fájlok

- `fbref_test.py`: Egyszerű teszt a soccerdata FBref funkcionalitásának bemutatására
- `betting_integration.py`: Példa a soccerdata integrálására a BettingMentor projektbe
- `output/`: A tesztek által generált kimeneti fájlok mappája (automatikusan létrejön)

## Előfeltételek

A tesztek futtatásához a következő csomagokra van szükség:

```bash
pip install soccerdata pandas numpy scikit-learn joblib matplotlib
```

## Használat

### FBref teszt futtatása

Ez a teszt bemutatja, hogyan lehet adatokat lekérni az FBref adatforrásból:

```bash
python test/soccerdata_test/fbref_test.py
```

A teszt a következő műveleteket végzi:
1. Inicializálja az FBref adatforrást az angol Premier League 2022-2023-as szezonjára
2. Lekéri a mérkőzések ütemezését
3. Lekéri a csapat szezon statisztikákat
4. Lekéri a játékos szezon statisztikákat
5. Elmenti az adatokat CSV fájlokba
6. Egyszerű adatelemzést végez

### BettingMentor integráció teszt futtatása

Ez a teszt bemutatja, hogyan lehet a soccerdata által gyűjtött adatokat felhasználni a fogadási predikciók készítéséhez:

```bash
python test/soccerdata_test/betting_integration.py
```

A teszt a következő műveleteket végzi:
1. Létrehoz egy egyszerű botot a döntetlen kimenetelű mérkőzések predikciójára
2. Adatokat gyűjt a soccerdata segítségével
3. Előkészíti a feature-öket a modell számára
4. Betanít egy Random Forest modellt
5. Predikciót készít a közelgő mérkőzésekre
6. Elmenti a predikciókat CSV fájlba

## Kimenetek

A tesztek futtatása után a következő kimeneti fájlok jönnek létre az `output/` mappában:

- `meccsek_ENG-Premier League_2023.csv`: Mérkőzések ütemezése
- `csapat_statisztikak_ENG-Premier League_2023.csv`: Csapat szezon statisztikák
- `jatekos_statisztikak_ENG-Premier League_2023.csv`: Játékos szezon statisztikák
- `draw_prediction_model.pkl`: Betanított modell a döntetlen kimenetelű mérkőzések predikciójára
- `draw_predictions.csv`: Predikciók a közelgő mérkőzésekre

## Megjegyzések

- Az adatok első letöltése hosszabb időt vehet igénybe, de a későbbi futtatások gyorsabbak lesznek a helyi gyorsítótárazás miatt
- A soccerdata könyvtár webes adatgyűjtést végez, ezért internetkapcsolatra van szükség
- A weboldalak változásai miatt előfordulhat, hogy a kód frissítésre szorul