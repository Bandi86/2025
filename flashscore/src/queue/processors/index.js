const BaseProcessor = require('./BaseProcessor');
const LiveMatchProcessor = require('./LiveMatchProcessor');
const HistoricalDataProcessor = require('./HistoricalDataProcessor');
const UpcomingFixturesProcessor = require('./UpcomingFixturesProcessor');
const LeagueDiscoveryProcessor = require('./LeagueDiscoveryProcessor');

module.exports = {
  BaseProcessor,
  LiveMatchProcessor,
  HistoricalDataProcessor,
  UpcomingFixturesProcessor,
  LeagueDiscoveryProcessor
};