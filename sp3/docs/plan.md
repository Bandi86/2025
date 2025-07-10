# Machine Learning sport bet project

## 🎯 Projekt célkitűzések

Egy automata rendszer készítése ami letölti az adott napra a fogadási kínálatot focibó, majd az algoritmus megvizsgálja azt,
és kiértékeli mik a legjobb fogadási lehetőségek. Kombinált, vagy sima szelvényre. Minden hónap elsején egy adott összegről indulva ajánlatot tesz és a cél az hogy a hónap végén megnézzük mennyi pénzünk lett volna ha esetleg elfogadjuk az ajánlást ez a teszt.

---

## 🏗 Rendszer architektúra

### Backend - NestJS

- **API Gateway**: Központi belépési pont
- **Data Collection Service**: Fogadási adatok gyűjtése
- **ML Processing Service**: Algoritmus futtatása
- **Portfolio Management**: Tőkekezelés és ajánlások
- **Database**: PostgreSQL + Redis cache

### Frontend - Next.js 15

- **Dashboard**: Napi ajánlások megjelenítése
- **Analytics**: Teljesítmény követés, statisztikák
- **Portfolio Tracking**: Virtuális portfólió kezelés
- **Historical Data**: Múltbeli eredmények elemzése

### ML Pipeline (Python + Modern AI)

- **Data Processing**: Adatok tisztítása, normalizálása
- **Intelligent Scraping**: LLM-powered web data extraction
- **Feature Engineering**: Komplex változók automatikus létrehozása
- **Deep Learning Models**: Neural Networks, Transformers
- **Prediction Engine**: Ensemble methods kombinálása
- **Backtesting**: Históriás adatokon validálás
- **Kelly Optimizer**: Optimális tét méret számítás

**Modern AI Components**:

- **BeautifulSoup + Selenium**: Alapvető scraping
- **Scrapy + AI parsing**: Intelligent data extraction
- **Pandas + NumPy**: Data processing
- **Scikit-learn**: Klasszikus ML
- **PyTorch/TensorFlow**: Deep Learning
- **Transformers**: Text analysis (news sentiment)
- **LangChain**: AI-powered data parsing

---

## 📊 Adatkezelés és források

### 🏆 Target Ligák (Top 5)

- **Premier League** (Anglia) - 20 csapat
- **Bundesliga** (Németország) - 18 csapat
- **La Liga** (Spanyolország) - 20 csapat
- **Ligue 1** (Franciaország) - 18 csapat
- **Serie A** (Olaszország) - 20 csapat

**Szezon timeline**: 2024/25 szezon (aug-máj) - Nyári felkészülés alatt fejlesztés

### Fogadási adatok (Ingyenes források)

- **The Odds API** (ingyenes tier): 500 request/hónap
- **API-Football** (freemium): Odds + meccsadatok
- **Web scraping targets**:
  - Tippmix.hu (magyar bookmaker)
  - Oddsportal.com (históriás odds)
  - Flashscore.com (élő eredmények)
- **Frissítési gyakoriság**: 2x naponta (reggel/este)

### Sportoló adatok (Hibrid megközelítés)

**Ingyenes API források**:

- **Football-Data.org**: Liga táblázatok, basic team stats
- **API-Football**: Mérkőzések, csapat adatok (freemium)
- **OpenFootball**: Nyílt forrású football adatok

**Intelligent Web Scraping**:

- **Transfermarkt**: Csapat értékek, sérülések, átigazolások
- **Fbref.com**: Részletes statisztikák, xG adatok
- **ESPN**: Forma, head-to-head
- **UEFA.com**: Európai kupaforma

**Manuális override lehetőség**:

- CSV import funkció kulcsfontosságú adatokhoz
- Admin interface manual corrections-höz
- Excel template team/player data bulk upload-hoz

### Adattípusok

```
Csapat adatok:
- Liga pozíció, pontszám
- Sérült játékosok listája
- Elmúlt 5 meccs eredményei
- Hazai/vendég teljesítmény
- Gólarányok, kapott gólok

Mérkőzés adatok:
- Időjárás
- Tét (bajnokság, kupa, stb.)
- Játékvezető statisztikák
- Head-to-head történet

Piaci adatok:
- Odds változások időben
- Tét volumen
- Public betting százalékok
```

---

### 🤖 Advanced ML Stratégia

**Deep Learning Architecture**:

1. **Multi-Modal Input Processing**
   - Numerical features (stats, odds, historical)
   - Text features (news sentiment, injuries, transfers)
   - Time series (form curves, momentum)

2. **Ensemble Deep Networks**
   - **LSTM**: Idősor adatok (forma, momentum)
   - **Transformer**: Text analysis (hírek, social media)
   - **CNN**: Pattern recognition (historical matchups)
   - **XGBoost**: Feature importance ranking

3. **Advanced Features**
   - **Player network analysis**: Csapat kemia modellek
   - **Weather impact models**: Időjárás hatása játékstílusra
   - **Referee bias analysis**: Játékvezető tendenciák
   - **Market sentiment**: Betting volume patterns

### Intelligent Scraping Agent

```python
# AI-powered scraping architecture
class FootballIntelligenceAgent:
    - web_scraper: Selenium + BeautifulSoup
    - llm_parser: GPT/Claude for data extraction
    - data_validator: Consistency checks
    - cache_manager: Efficient data storage
    - rate_limiter: Respectful scraping
```

### Feature Engineering

```python
# Példa feature-ök
- team_form_last_5_games
- home_advantage_factor
- head_to_head_last_10
- player_injury_impact_score
- weather_impact_factor
- referee_cards_per_game_avg
- motivation_factor (league_position, european_spots)
```

### Backtesting Framework

```python
# Históriás adatokon tesztelés
- 2019-2024 szezonok
- Rolling window validation
- Kelly Criterion tőkekezelés
- Sharpe ratio számítás
- Maximum drawdown analízis
```

---

## 💰 Kelly Criterion Tőkekezelés

### Szimulációs Portfolio Setup

- **Kezdő tőke**: 100,000 Ft/hónap (virtuális)
- **Kelly Formula**: f = (bp - q) / b
  - f = fraction of capital to bet
  - b = odds received on the wager
  - p = probability of winning
  - q = probability of losing (1-p)

### Risk Management Rules

- **Max bet per game**: Kelly * 0.25 (quarter Kelly strategy)
- **Portfolio limits**: Max 15% tőke egyidőben kockáztatva
- **Confidence threshold**: Minimum 55% prediction confidence
- **Stop-loss**: -25% havi veszteségnél szünet

### Bet Categories & Kelly Application

```text
High Confidence (Kelly * 0.5):
- Model accuracy >60% ezen a bet típuson
- Odds value >10% (model odds vs market)

Medium Confidence (Kelly * 0.25):
- Model accuracy 55-60%
- Clear statistical edge

Low Stakes (Kelly * 0.1):
- Experimental bets (new features testing)
- Complex combination bets
```

### Dynamic Bankroll Management

- Weekly bankroll adjustments
- Winning streak: Conservative scaling
- Losing streak: Reduced exposure
- Drawdown protection: Auto-pause at -20%

---

## 🛠 Technológiai stack részletesen

### Backend (NestJS)

```typescript
// Mikroszolgáltatások
- odds-collector.service.ts
- ml-processor.service.ts
- portfolio.service.ts
- notification.service.ts

// Adatbázis entitások
- Match entity
- Team entity
- Odds entity
- Prediction entity
- Portfolio entity
```

### ML Pipeline (Python)

```python
# Fő komponensek
- data_collector.py      # Web scraping + API calls
- feature_engineer.py    # Változók létrehozása
- model_trainer.py       # Modellek tanítása
- predictor.py          # Valós idejű predikciók
- backtester.py         # Teljesítmény mérés
- portfolio_optimizer.py # Tőkekezelés
```

### 🏠 Local Development Setup

**Deployment Strategy**: Csak helyi gépen futtatás (legalább tesztelési fázisban)

**Development Environment**:

- **Docker Compose**: PostgreSQL + Redis lokálisan
- **Python Environment**: Conda/venv ML pipeline-hoz
- **Node.js**: NestJS backend + Next.js frontend
- **Port allocation**:
  - Frontend: 3000
  - Backend: 3001
  - Database: 5432
  - Redis: 6379

**Local Data Storage**:

- **Historical data**: SQLite backup fájlok
- **ML models**: Pickled models lokális tárolás
- **Scraping cache**: Redis + file system cache
- **Config management**: .env fájlok

---

## 📅 Fejlesztési ütemterv

### Fázis 1: Alapok (4-6 hét)

- [ ] NestJS backend alapszerkezet
- [ ] PostgreSQL adatbázis séma
- [ ] Alap odds scraper
- [ ] Next.js frontend váz

### Fázis 2: Adatgyűjtés (3-4 hét)

- [ ] Multiple odds providers integrálása
- [ ] Team/player adatok API-k
- [ ] Historical data collection
- [ ] Data cleaning pipeline

### Fázis 3: ML Development (6-8 hét)

- [ ] Feature engineering
- [ ] Model training pipeline
- [ ] Backtesting framework
- [ ] Prediction engine

### Fázis 4: Portfolio Management (2-3 hét)

- [ ] Kelly Criterion implementáció
- [ ] Risk management rules
- [ ] Portfolio tracking
- [ ] Performance analytics

### Fázis 5: Frontend & UX (3-4 hét)

- [ ] Dashboard design
- [ ] Real-time updates
- [ ] Charts és analytics
- [ ] Mobile optimization

### Fázis 6: Testing & Deploy (2-3 hét)

- [ ] Integration testing
- [ ] Performance optimization
- [ ] Docker deployment
- [ ] Monitoring setup

---

## ⚖️ Jogi és etikai megfontolások

### Compliance

- **Csak szimulációs jellegű**: Valódi pénzt nem kezel
- **Oktatási célú**: Algoritmus hatékonyságának tesztelése
- **Transparency**: Minden döntés magyarázható
- **Responsible gambling**: Figyelmeztetések a kockázatokról

### Adatvédelem

- Nyilvános adatok használata
- API terms of service betartása
- Rate limiting és fair use

---

## 🎯 Success Metrics

### Technikai KPI-k

- **Prediction accuracy**: >52% (break-even ~52.38%)
- **Sharpe ratio**: >1.0
- **Maximum drawdown**: <25%
- **API response time**: <500ms

### Business KPI-k

- **Monthly ROI**: Pozitív trend 6 hónap alatt
- **Win rate**: Minimum 45-50%
- **Average bet value**: Optimális Kelly szerint

---

## 🚀 Következő lépések

1. **Technológiai döntések finalizálása**
2. **Adatforrások API kulcsok beszerzése**
3. **Development environment setup**
4. **Git repository structure kialakítása**
5. **CI/CD pipeline tervezése**

---

## 💡 Nyitott kérdések megbeszélésre - FRISSÍTETT

### ✅ Már eldöntött kérdések

- **Ligák**: Top 5 európai liga (PL, Bundesliga, La Liga, Ligue 1, Serie A)
- **Adatforrások**: Ingyenes API-k + intelligent scraping + manual override
- **ML approach**: Komplex deep learning with ensemble methods
- **Deployment**: Local development (saját gép)
- **Tőkekezelés**: Kelly Criterion implementáció

### 🤔 Még eldöntendő részletek

**Data Collection Priority**:

- Milyen gyakran futtassuk a scraping-et? (napi 2x vs folyamatos)
- Mennyire mélyen menjünk bele a player-level adatokba vs team-level fókusz?
- Historical data: hány szezon visszamenőleg? (2-3 vs 5+ év)

**ML Model Complexity**:

- Kezdjük egyszerű logistic regression-nal és építsük fel fokozatosan?
- Vagy egyből deep learning architecture teljes komplexitással?
- Real-time training vs batch model updates?

**Development Approach**:

- Monorepo vs külön repositories?
- Testing strategy: unit tests vs integration tests priority?
- CI/CD setup helyi fejlesztéshez vagy egyelőre manual?

### 🎯 Javasolt következő lépések

1. **Repository setup + basic structure**
2. **Docker environment + database schema**
3. **Proof of concept: egy liga, egy bookmaker scraping**
4. **Simple ML model egy bet type-ra**
5. **Kelly implementation basic verzió**
