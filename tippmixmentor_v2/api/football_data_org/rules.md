# Api usage rules

Documentation: https://www.football-data.org/documentation/quickstart

# Avaible data
- competitions
 - WC | FIFA World Cup
 - CL | UEFA Champions League
 - BL1 | Bundesliga
 - DED | Eredivisie
 - BSA | Campeonato Brasileiro Série A
 - PD | Primera Division
 - FL1 | Ligue 1
 - ELC | Championship
 - PPL | Primeira Liga
 - EC | European Championship
 - SA | Serie A
 - PL | Premier League

## Rules

12 competitions
Scores delayed
Fixtures
Schedules delayed
League Tables
10 calls/minute

Implementing maximum limit of 10 calls/minute
save data so not need to call the api every time

# Data

## Competitions

## Scores

## Fixtures

## Schedules

## Example Requests

See todays' matches of your subscribed competitions:

```bash
https://api.football-data.org/v4/matches
```

Get all matches of the Champions League:

```bash
https://api.football-data.org/v4/teams/86/matches?status=SCHEDULED
```

Get all matches where Gigi Buffon was in the squad:

```bash
https://api.football-data.org/v4/persons/2019/matches?status=FINISHED
```

Check schedules for Premier League on matchday 11:

```bash
https://api.football-data.org/v4/competitions/PL/matches?matchday=11
```

Get the league table for Eredivisie:

```bash
https://api.football-data.org/v4/competitions/DED/standings
```

See best 10 scorers of Italy's top league (scorers subresource defaults to limit=10):

```bash
https://api.football-data.org/v4/competitions/SA/scorers
```