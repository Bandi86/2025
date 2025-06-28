# 🎯 SPORT BETTING PREDICTION SYSTEM v2.0

## Advanced Multi-League Sports Betting Analysis & Automation

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)]()
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)]()
[![Leagues](https://img.shields.io/badge/Leagues-4%20Supported-orange.svg)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg)]()

> **A comprehensive, automated sports betting prediction system with multi-league support, live API integration, and advanced analytics.**

---

## 🌟 NEW FEATURES (v2.0)

### 🌍 **Multi-League Support**

- **Premier League** 🏴󠁧󠁢󠁥󠁮󠁧󠁿 (Saturday, Sunday, Tuesday, Wednesday)
- **Major League Soccer** 🇺🇸 (Saturday, Sunday, Wednesday)
- **Brasileirão Serie A** 🇧🇷 (Saturday, Sunday, Wednesday)
- **J1 League** 🇯🇵 (Saturday, Sunday, Wednesday)

### 🔴 **Live API Integration**

- Real-time match data via API-Sports
- Live odds analysis and value betting
- Automatic data refresh and caching
- Rate limiting and error handling

### 🤖 **Enhanced Automation**

- League-specific cron job scheduling
- Automated daily analysis for active leagues
- Smart scheduling based on league calendars
- Multi-league monitoring and reporting

### 📊 **Advanced Analytics**

- Cross-league performance comparison
- League-specific betting strategies
- Enhanced prediction confidence scoring
- Dynamic bankroll management per league

---

## 🚀 QUICK START

### 1. **Complete System Setup**

```bash
# Clone and setup everything
git clone <repository>
cd sport-prediction
python3 setup_complete_system.py
```

### 2. **Daily Usage**

```bash
# Premier League analysis (default)
python master.py --daily

# Specific league analysis
python master.py --daily --league mls
python master.py --daily --league brasileirao
python master.py --daily --league j_league
```

### 3. **Live API Analysis** (requires API key)

```bash
# Set API key
export API_SPORTS_KEY="your_api_sports_key"

# Live analysis
python master.py --live --league premier_league
python master.py --live --league mls
```

### 4. **Automation Setup**

```bash
# Install multi-league automation
python master.py --setup automation

# View schedule
python src/automation/enhanced_automation_system.py --schedule

# Manual run for today's active leagues
python src/automation/enhanced_automation_system.py --run all
```

---

## 📋 COMPREHENSIVE FEATURES

### 🎯 **Core Prediction Engine**

- **Advanced Statistical Models**: Poisson distribution, team strength calculations
- **Multi-Factor Analysis**: Home/away performance, recent form, head-to-head
- **Value Betting Detection**: Edge calculation with confidence scoring
- **Kelly Criterion**: Optimal stake sizing with risk management

### 📈 **Risk Management**

- **Dynamic Bankroll Management**: League-specific risk allocation
- **Daily Risk Limits**: Maximum 8% bankroll exposure per day
- **Confidence Thresholds**: Minimum edge and confidence requirements
- **Stop-Loss Protection**: Automated loss prevention

### 🔄 **Data Sources**

- **Historical Data**: 3+ seasons of match results and statistics
- **Live API Data**: Real-time fixtures, odds, and team information
- **Sample Data**: Generated datasets for testing and development
- **Alternative Sources**: Backup data collection methods

### 🤖 **Automation System**

- **Smart Scheduling**: League-specific active days and times
- **Cron Jobs**: Automated daily analysis and reporting
- **Monitoring**: System health checks and performance tracking
- **Notifications**: Telegram bot and email alerts

---

## 🌍 LEAGUE CONFIGURATIONS

### 🏴󠁧󠁢󠁥󠁮󠁧󠁿 **Premier League**

- **Active Days**: Saturday, Sunday, Tuesday, Wednesday
- **Analysis Time**: 07:00 GMT
- **Season**: August - May
- **Teams**: 20 teams
- **Characteristics**: High-scoring, unpredictable

### 🇺🇸 **Major League Soccer (MLS)**

- **Active Days**: Saturday, Sunday, Wednesday
- **Analysis Time**: 06:00 EST
- **Season**: March - November
- **Teams**: 30 teams (conferences)
- **Characteristics**: High-variance, playoff system

### 🇧🇷 **Brasileirão Serie A**

- **Active Days**: Saturday, Sunday, Wednesday
- **Analysis Time**: 07:30 BRT
- **Season**: April - December
- **Teams**: 20 teams
- **Characteristics**: Home advantage, technical play

### 🇯🇵 **J1 League**

- **Active Days**: Saturday, Sunday, Wednesday
- **Analysis Time**: 05:00 JST
- **Season**: February - December
- **Teams**: 18 teams
- **Characteristics**: Consistent, tactical

---

## 💻 COMMAND REFERENCE

### 🎮 **Master Control (master.py)**

```bash
# Daily Analysis
python master.py --daily [--league LEAGUE]

# System Setup
python master.py --setup [mls|multi|automation|tracking]

# Live API
python master.py --api [--league LEAGUE]
python master.py --live [--league LEAGUE]

# Monitoring
python master.py --track
python master.py --monitor
```

### 🛠 **Direct Scripts**

```bash
# Daily Assistant
python src/tools/daily_betting_assistant.py --league LEAGUE

# Live API Client
python src/api/live_api_client.py --league LEAGUE [--download|--today]

# Enhanced Automation
python src/automation/enhanced_automation_system.py [--setup|--schedule|--status]

# Performance Tracking
python src/tracking/performance_tracker.py [--league LEAGUE]
```

### 📊 **Analysis Tools**

```bash
# Live Betting Analyzer
python src/tools/live_betting_analyzer.py --league LEAGUE [--save]

# Realistic Betting System
python src/tools/realistic_betting_system.py

# Weekend Example
python src/tools/weekend_betting_example.py
```

---

## 🔧 CONFIGURATION

### 🔑 **API Configuration**

```bash
# Required for live data
export API_SPORTS_KEY="your_api_sports_key"

# Optional notifications
export TELEGRAM_BOT_TOKEN="your_telegram_token"
export TELEGRAM_CHAT_ID="your_chat_id"
```

### ⚙️ **System Settings (config.json)**

```json
{
  "leagues": {
    "premier_league": {"enabled": true, "priority": 1},
    "mls": {"enabled": true, "priority": 2},
    "brasileirao": {"enabled": true, "priority": 3},
    "j_league": {"enabled": true, "priority": 4}
  },
  "betting": {
    "default_bankroll": 1000,
    "max_daily_risk": 0.08,
    "min_edge": 0.05,
    "min_confidence": 0.4
  }
}
```

---

## 📂 PROJECT STRUCTURE

```
sport-prediction/
├── master.py                    # 🚀 Main control interface
├── setup_complete_system.py     # 🔧 Complete setup script
├── config.json                  # ⚙️ System configuration
├── QUICK_START.md               # 📖 Quick start guide
│
├── src/
│   ├── core/                    # 🧠 Core prediction engine
│   │   ├── data_loader.py       # 📥 Multi-source data loading
│   │   ├── feature_engineering.py # 🔬 Statistical features
│   │   ├── model_trainer.py     # 🤖 ML model training
│   │   └── improved_strategies.py # 📈 Betting strategies
│   │
│   ├── tools/                   # 🛠 Analysis tools
│   │   ├── daily_betting_assistant.py # 🌅 Multi-league daily analysis
│   │   ├── live_betting_analyzer.py   # 🔴 Live API analysis
│   │   ├── realistic_betting_system.py # 💰 Betting simulation
│   │   └── prediction_engine.py       # 🔮 Prediction engine
│   │
│   ├── api/                     # 🌐 External integrations
│   │   ├── live_api_client.py   # 🔄 Unified API client
│   │   ├── multi_league_system.py # 🌍 Multi-league manager
│   │   └── mls_api_client.py    # 🇺🇸 MLS specific client
│   │
│   ├── automation/              # 🤖 Automation system
│   │   ├── enhanced_automation_system.py # 🚀 Advanced automation
│   │   ├── telegram_bot.py      # 📱 Telegram notifications
│   │   ├── email_notifier.py    # 📧 Email alerts
│   │   └── system_monitor.py    # 🔍 Health monitoring
│   │
│   └── tracking/                # 📊 Performance tracking
│       └── performance_tracker.py # 📈 Results analysis
│
├── data/                        # 📁 League data
│   ├── premier_league/          # 🏴󠁧󠁢󠁥󠁮󠁧󠁿 EPL data
│   ├── mls/                     # 🇺🇸 MLS data
│   ├── brasileirao/             # 🇧🇷 Brazilian data
│   └── j_league/                # 🇯🇵 Japanese data
│
├── results/                     # 📊 Analysis results
├── logs/                        # 📝 System logs
├── scripts/                     # 📜 Automation scripts
└── docs/                        # 📚 Documentation
```

---

## 📊 SAMPLE OUTPUTS

### 🌅 **Daily Analysis Example**

```
📅 SATURDAY - MAJOR LEAGUE SOCCER ANALYSIS
⚽ 4 Major League Soccer matches today:
   LA Galaxy vs LAFC (2.40 - 3.30 - 2.85)
   Seattle vs Portland (2.10 - 3.20 - 3.40)

🎯 BETTING RECOMMENDATIONS:
1. LA Galaxy vs LAFC - HOME WIN
   💰 Stake: $5.00 (0.5% bankroll)
   🎲 Odds: 2.40
   📈 Edge: 15.2% | Confidence: 67%
   💵 Expected Value: +$0.76

📊 DAILY SUMMARY:
   💰 Total Stakes: $8.33 (0.8% bankroll)
   📈 Expected Profit: +$1.24
   ✅ Low Risk - PROCEED!
```

### 📅 **Weekly Schedule**

```
📅 MULTI-LEAGUE SCHEDULE
Saturday (2025-06-28)
   ⚽ Premier League - 07:00
   ⚽ MLS - 06:00
   ⚽ Brasileirão - 07:30
   ⚽ J1 League - 05:00

Wednesday (2025-07-02)
   ⚽ Premier League - 07:00
   ⚽ MLS - 06:00
   ⚽ Brasileirão - 07:30
   ⚽ J1 League - 05:00
```

---

## 🎓 ADVANCED USAGE

### 🔄 **Multi-League Workflow**

```bash
# 1. Setup all leagues
python master.py --setup multi

# 2. Download live data for all leagues
for league in premier_league mls brasileirao j_league; do
    python master.py --api --league $league
done

# 3. Run daily analysis for active leagues
python src/automation/enhanced_automation_system.py --run all

# 4. Track performance across leagues
python master.py --track
```

### 🤖 **Automation Deployment**

```bash
# Install automation
python master.py --setup automation

# Check status
python src/automation/enhanced_automation_system.py --status

# Manual test run
python src/automation/enhanced_automation_system.py --run premier_league
```

### 📊 **Performance Analysis**

```bash
# League-specific tracking
python src/tracking/performance_tracker.py --league mls

# Cross-league comparison
python src/tracking/performance_tracker.py --compare

# Export results
python src/tracking/performance_tracker.py --export
```

---

## 🛡 RISK MANAGEMENT

### 💰 **Bankroll Management**

- **Conservative Approach**: Max 8% daily risk
- **Kelly Criterion**: Optimal stake sizing
- **Stop-Loss**: Automatic loss limits
- **Diversification**: Multi-league spread

### 📊 **Quality Filters**

- **Minimum Edge**: 5% advantage required
- **Confidence Threshold**: 40% minimum confidence
- **Data Quality**: Sufficient historical data required
- **Market Validation**: Cross-reference multiple sources

### ⚠️ **Risk Warnings**

- Never bet more than you can afford to lose
- This is a prediction system, not guaranteed profits
- Past performance doesn't guarantee future results
- Use for educational and analysis purposes

---

## 🔧 TROUBLESHOOTING

### ❌ **Common Issues**

**Import Errors**

```bash
# Ensure virtual environment is activated
source venv/bin/activate
pip install -r requirements.txt
```

**API Errors**

```bash
# Check API key
echo $API_SPORTS_KEY

# Test API connection
python src/api/live_api_client.py --test
```

**Data Missing**

```bash
# Generate sample data
python setup_mls.py
python src/api/multi_league_system.py
```

**Cron Job Issues**

```bash
# Check cron status
crontab -l | grep "Sport Betting"

# Re-install automation
python master.py --setup automation
```

---

## 📈 PERFORMANCE METRICS

### 🎯 **Success Metrics**

- **Win Rate**: 55-65% target
- **ROI**: 8-15% monthly target
- **Edge Detection**: 5%+ minimum
- **Confidence Score**: 40%+ minimum

### 📊 **Tracking Features**

- Daily/weekly/monthly reports
- League-specific performance
- Strategy effectiveness analysis
- Bankroll growth tracking

---

## 🤝 CONTRIBUTING

### 🛠 **Development Setup**

```bash
git clone <repository>
cd sport-prediction
python3 setup_complete_system.py
# Make your changes
# Test thoroughly
# Submit PR
```

### 📝 **Feature Requests**

- New league support
- Additional betting markets
- Enhanced prediction models
- Mobile app development

---

## 📞 SUPPORT

### 🆘 **Getting Help**

- 📖 Check documentation in `docs/`
- 💬 Create GitHub issue
- 📧 Contact maintainers
- 🔍 Search existing issues

### 📚 **Resources**

- [API-Sports Documentation](https://rapidapi.com/api-sports/)
- [Kelly Criterion Calculator](https://en.wikipedia.org/wiki/Kelly_criterion)
- [Sports Betting Theory](https://en.wikipedia.org/wiki/Sports_betting)

---

## 📄 LICENSE

MIT License - See LICENSE file for details.

---

## 🏆 CHANGELOG

### v2.0.0 (Current)

- ✨ Multi-league support (4 leagues)
- 🔴 Live API integration
- 🤖 Enhanced automation system
- 📊 Cross-league analytics
- 🛠 Complete system setup

### v1.0.0

- 🎯 Basic Premier League predictions
- 💰 Kelly criterion betting
- 📈 Performance tracking
- 🔄 Data loading and processing

---

**🎯 Ready to start? Run `python master.py --daily` and begin your betting analysis journey!**
