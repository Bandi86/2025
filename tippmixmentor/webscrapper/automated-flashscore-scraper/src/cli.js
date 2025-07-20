#!/usr/bin/env node

import {AutomatedScraper} from './scraper/automatedScraper.js';
import {ComprehensiveScraper} from './scraper/comprehensiveScraper.js';
import {logger} from './utils/logger.js';
import {CONFIG} from './config/index.js';
import {cacheManager} from './utils/cacheManager.js';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';

/**
 * CLI parancsok kezelése
 */
class CLI {
    constructor() {
        this.scraper = new AutomatedScraper();
    }

    /**
   * Parancsok feldolgozása
   */
    async processCommand(args) {
        const command = args[2];

        switch (command) {
            case 'start':
                await this.startScraping();
                break;

            case 'status':
                this.showStatus();
                break;

            case 'config':
                this.showConfig();
                break;

            case 'stats':
                await this.showStats();
                break;

            case 'clean':
                await this.cleanData();
                break;

            case 'discover':
                await this.startDiscovery();
                break;

            case 'select':
                await this.startInteractiveSelection();
                break;

            case 'comprehensive':
                await this.startComprehensive();
                break;

            case 'ml-dataset':
                await this.generateMLDatasets();
                break;

            case 'refresh-cache':
                await this.refreshCache();
                break;

            case 'cache-status':
                await this.showCacheStatus();
                break;

            case 'help':
            default:
                this.showHelp();
                break;
        }
    }

    /**
   * Scraping indítása
   */
    async startScraping() {
        console.log('🚀 Automatizált scraping indítása...\n');
        await this.scraper.start();
    }

    /**
   * Aktuális státusz megjelenítése
   */
    showStatus() {
        const status = this.scraper.getStatus();

        console.log('📊 SCRAPER STÁTUSZ');
        console.log('==================');
        console.log(`Futás: ${
            status.isRunning ? '🟢 AKTÍV' : '🔴 LEÁLLÍTVA'
        }`);
        console.log(`Összes meccs: ${
            status.stats.totalMatches
        }`);
        console.log(`Sikeres: ${
            status.stats.successfulMatches
        }`);
        console.log(`Sikertelen: ${
            status.stats.failedMatches
        }`);

        if (status.stats.startTime) {
            const duration = (new Date() - status.stats.startTime) / 1000 / 60;
            console.log(`Futási idő: ${
                Math.round(duration)
            } perc`);
        }
    }

    /**
   * Konfiguráció megjelenítése
   */
    showConfig() {
        console.log('⚙️  KONFIGURÁCIÓ');
        console.log('================');
        console.log(`Meccsek közötti késleltetés: ${
            CONFIG.DELAY_BETWEEN_MATCHES
        }ms`);
        console.log(`Ligák közötti késleltetés: ${
            CONFIG.DELAY_BETWEEN_LEAGUES
        }ms`);
        console.log(`Országok közötti késleltetés: ${
            CONFIG.DELAY_BETWEEN_COUNTRIES
        }ms`);
        console.log(`Fájlformátum: ${
            CONFIG.FILE_FORMAT.toUpperCase()
        }`);
        console.log(`Kimeneti mappa: ${
            CONFIG.OUTPUT_BASE_PATH
        }`);
        console.log(`Headless mód: ${
            CONFIG.HEADLESS ? 'BE' : 'KI'
        }`);

        console.log('\n🎯 CÉLLIGÁK:');
        CONFIG.TARGET_LEAGUES.forEach(country => {
            console.log(`  ${
                country.country.toUpperCase()
            }:`);
            country.leagues.forEach(league => {
                console.log(`    - ${league}`);
            });
        });
    }

    /**
   * Statisztikák megjelenítése
   */
    async showStats() {
        console.log('📈 ADATGYŰJTÉSI STATISZTIKÁK');
        console.log('===========================');

        try {
            const stats = await this.calculateDataStats();

            console.log(`Összes ország: ${
                stats.countries
            }`);
            console.log(`Összes liga: ${
                stats.leagues
            }`);
            console.log(`Összes meccs: ${
                stats.totalMatches
            }`);
            console.log(`Fájlok száma: ${
                stats.files
            }`);
            console.log(`Összes fájlméret: ${
                this.formatBytes(stats.totalSize)
            }`);

            console.log('\n📁 ORSZÁGONKÉNTI BONTÁS:');
            Object.entries(stats.byCountry).forEach(([country, data]) => {
                console.log(`  ${
                    country.toUpperCase()
                }: ${
                    data.matches
                } meccs, ${
                    data.leagues
                } liga`);
            });

        } catch (error) {
            console.error('Hiba a statisztikák számításakor:', error.message);
        }
    }

    /**
   * Adatok törlése
   */
    async cleanData() {
        console.log('🧹 Adatok törlése...');

        try {
            if (await fs.pathExists(CONFIG.OUTPUT_BASE_PATH)) {
                await fs.remove(CONFIG.OUTPUT_BASE_PATH);
                console.log('✅ Adatok sikeresen törölve!');
            } else {
                console.log('ℹ️  Nincs törlendő adat.');
            }
        } catch (error) {
            console.error('❌ Hiba az adatok törlésekor:', error.message);
        }
    }

    /**
   * Már letöltött adatok ellenőrzése
   */
    async checkExistingData() {
        const existingData = {};

        if (!await fs.pathExists(CONFIG.OUTPUT_BASE_PATH)) {
            return existingData;
        }

        try {
            const countries = await fs.readdir(CONFIG.OUTPUT_BASE_PATH);

            for (const country of countries) {
                const countryPath = path.join(CONFIG.OUTPUT_BASE_PATH, country);
                const countryStats = await fs.stat(countryPath);

                if (countryStats.isDirectory()) {
                    existingData[country] = {
                        leagues: [],
                        totalMatches: 0,
                        lastUpdated: null
                    };

                    const leagues = await fs.readdir(countryPath);

                    for (const league of leagues) {
                        const leaguePath = path.join(countryPath, league);
                        const leagueStats = await fs.stat(leaguePath);

                        if (leagueStats.isDirectory()) {
                            const seasons = await fs.readdir(leaguePath);
                            let leagueMatches = 0;
                            let latestUpdate = null;

                            for (const season of seasons) {
                                const seasonPath = path.join(leaguePath, season);
                                const files = await fs.readdir(seasonPath);

                                for (const file of files) {
                                    if (file.endsWith('.json')) {
                                        const filePath = path.join(seasonPath, file);
                                        const fileStats = await fs.stat(filePath);

                                        if (! latestUpdate || fileStats.mtime > latestUpdate) {
                                            latestUpdate = fileStats.mtime;
                                        }

                                        try {
                                            const data = await fs.readJson(filePath);
                                            leagueMatches += Object.keys(data).length;
                                        } catch (error) { // Hibás JSON fájl esetén folytatjuk
                                        }
                                    }
                                }
                            }

                            existingData[country].leagues.push({name: league, matches: leagueMatches, lastUpdated: latestUpdate});
                            existingData[country].totalMatches += leagueMatches;

                            if (! existingData[country].lastUpdated || (latestUpdate && latestUpdate > existingData[country].lastUpdated)) {
                                existingData[country].lastUpdated = latestUpdate;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Hiba a meglévő adatok ellenőrzésekor:', error.message);
        }

        return existingData;
    }

    /**
   * Interaktív kiválasztás indítása
   */
    async startInteractiveSelection() {
        console.log('🎯 Intelligens Liga Kiválasztás');
        console.log('===============================\n');

        try { // Ellenőrizzük a már letöltött adatokat
            console.log('📊 Meglévő adatok ellenőrzése...');
            const existingData = await this.checkExistingData();

            // Import the discovery class
            const {CountryDiscovery} = await import ('./scraper/countryDiscovery.js');
            const {createBrowser} = await import ('./scraper/browser.js');

            const browser = await createBrowser();
            const discovery = new CountryDiscovery(browser);

            // Országok betöltése cache-ből vagy felfedezése
            console.log('🔍 Elérhető országok keresése...');
            let countries = await cacheManager.loadCountriesFromCache();

            // Ha nincs cache vagy elavult, akkor felfedezzük az országokat
            if (! countries) {
                console.log('🔍 Országok felfedezése és cache-elése...');
                countries = await discovery.discoverAvailableCountries();
                await cacheManager.saveCountriesToCache(countries);
            }

            if (countries.length === 0) {
                console.log('❌ Nem találhatók elérhető országok.');
                await browser.close();
                return;
            }

            // Csoportosítás régiók szerint
            const countryGroups = {};
            countries.forEach(country => {
                const region = country.region || 'Egyéb';
                if (! countryGroups[region]) {
                    countryGroups[region] = [];
                }
                countryGroups[region].push(country);
            });

            // Országok megjelenítése információkkal
            console.log(`\n✅ ${
                countries.length
            } ország felfedezve:\n`);
            Object.entries(countryGroups).forEach(([region, regionCountries]) => {
                console.log(`📍 ${region}:`);
                regionCountries.forEach(country => {
                    const existing = existingData[country.name];
                    let status = '';

                    if (existing && existing.leagues.length > 0) {
                        const daysSinceUpdate = existing.lastUpdated ? Math.floor((new Date() - existing.lastUpdated) / (1000 * 60 * 60 * 24)) : null;

                        status = ` 📁 ${
                            existing.leagues.length
                        } liga, ${
                            existing.totalMatches
                        } meccs`;
                        if (daysSinceUpdate !== null) {
                            if (daysSinceUpdate === 0) {
                                status += ` 🟢 ma frissítve`;
                            } else if (daysSinceUpdate <= 7) {
                                status += ` 🟡 ${daysSinceUpdate} napja frissítve`;
                            } else {
                                status += ` 🔴 ${daysSinceUpdate} napja frissítve`;
                            }
                        }
                    } else {
                        status = ' 🆕 új';
                    }

                    console.log(`   ${
                        country.flag
                    } ${
                        country.displayName
                    }${status}`);
                });
                console.log('');
            });

            // Szűrési opciók
            logger.info('Prompting for filter option...');
            const {filterOption} = await inquirer.prompt([{
                    type: 'list',
                    name: 'filterOption',
                    message: 'Hogyan szeretnéd szűrni az országokat?',
                    choices: [
                        {
                            name: '🌟 Összes ország megjelenítése',
                            value: 'all'
                        }, {
                            name: '🆕 Csak új országok (még nincs adat)',
                            value: 'new'
                        }, {
                            name: '🔄 Régen frissített országok (7+ nap)',
                            value: 'old'
                        }, {
                            name: '📍 Régió szerint szűrés',
                            value: 'region'
                        }
                    ]
                }]);
            logger.info(`Filter option selected: ${filterOption}`);

            let filteredCountries = countries;

            if (filterOption === 'new') {
                filteredCountries = countries.filter(country => ! existingData[country.name] || existingData[country.name].leagues.length === 0);
                console.log(`\n🆕 ${
                    filteredCountries.length
                } új ország található.\n`);
            } else if (filterOption === 'old') {
                filteredCountries = countries.filter(country => {
                        const existing = existingData[country.name];
                        if (! existing || ! existing.lastUpdated) 
                            return false;
                            const daysSinceUpdate = Math.floor((new Date() - existing.lastUpdated) / (1000 * 60 * 60 * 24));
                            return daysSinceUpdate >= 7;
                        }
                    );
                    console.log(`\n🔄 ${
                        filteredCountries.length
                    } régen frissített ország található.\n`);
                } else if (filterOption === 'region') {
                    logger.info('Prompting for selected region...');
                const {selectedRegion} = await inquirer.prompt([{
                            type: 'list',
                            name: 'selectedRegion',
                            message: 'Válaszd ki a régiót:',
                            choices: Object.keys(countryGroups).map(region => ({name: `📍 ${region} (${
                                    countryGroups[region].length
                                } ország)`, value: region}))
                        }]);
                logger.info(`Selected region: ${selectedRegion}`);
                    filteredCountries = countryGroups[selectedRegion];
                    console.log(`\n📍 ${
                        filteredCountries.length
                    } ország a ${selectedRegion} régióban.\n`);
                }

                if (filteredCountries.length === 0) {
                    console.log('❌ Nincs ország a kiválasztott szűrés alapján.');
                    await browser.close();
                    return;
                }

                // Országok kiválasztása intelligens információkkal
                const countryChoices = filteredCountries.map(country => {
                    const existing = existingData[country.name];
                    let name = `${
                        country.flag
                    } ${
                        country.displayName
                    }`;

                    if (existing && existing.leagues.length > 0) {
                        const daysSinceUpdate = existing.lastUpdated ? Math.floor((new Date() - existing.lastUpdated) / (1000 * 60 * 60 * 24)) : null;

                        name += ` (${
                            existing.leagues.length
                        } liga, ${
                            existing.totalMatches
                        } meccs`;
                        if (daysSinceUpdate !== null) {
                            if (daysSinceUpdate === 0) {
                                name += `, ma frissítve)`;
                            } else {
                                name += `, ${daysSinceUpdate} napja frissítve)`;
                            }
                        } else {
                            name += ')';
                        }
                    } else {
                        name += ' 🆕';
                    }

                    return {name: name, value: country, short: country.displayName};
                });

                logger.info('Prompting for selected countries...');
                const {selectedCountries} = await inquirer.prompt([{
                        type: 'checkbox',
                        name: 'selectedCountries',
                        message: 'Válaszd ki a kívánt országokat:',
                        choices: countryChoices,
                        pageSize: 15,
                        validate: (answer) => {
                            if (answer.length < 1) {
                                return 'Legalább egy országot ki kell választanod!';
                            }
                            return true;
                        }
                    }]);
                logger.info(`Selected ${selectedCountries.length} countries.`);

                console.log(`\n✅ ${
                    selectedCountries.length
                } ország kiválasztva.\n`);

                // Ligák felfedezése és kiválasztása
                const finalSelection = [];

                for (const country of selectedCountries) {
                    console.log(`🏆 ${
                        country.displayName
                    } ligáinak felfedezése...`);

                    logger.info(`Attempting to load leagues from cache for ${country.displayName}...`);
                    let leagues = await cacheManager.loadLeaguesFromCache(country.name);

                    // Ha nincs cache vagy elavult, akkor felfedezzük a ligákat
                    if (! leagues) {
                        logger.info(`Cache miss or outdated for ${country.displayName}. Discovering leagues...`);
                        leagues = await discovery.discoverCountryLeagues(country.name);

                        // Csak akkor mentjük a cache-be, ha találtunk ligákat
                        if (leagues && leagues.length > 0) {
                            await cacheManager.saveLeaguesToCache(country.name, leagues);
                            logger.info(`Leagues discovered and saved to cache for ${country.displayName}.`);
                        }
                    } else {
                        logger.info(`Leagues loaded from cache for ${country.displayName}.`);
                    }

                    if (leagues.length === 0) {
                        console.log(`❌ Nem találhatók ligák ${
                            country.displayName
                        } országban.\n`);
                        continue;
                    }

                    // Ligák információkkal való kiegészítése
                    const existingCountryData = existingData[country.name];
                    const leaguesWithInfo = leagues.map(league => {
                        const existingLeague = existingCountryData ?. leagues.find(l => l.name === league.name || l.name.includes(league.name) || league.name.includes(l.name));

                        return {
                            ...league,
                            existing: existingLeague || null
                        };
                    });

                    // Szűrési opciók ligákhoz
                    const newLeagues = leaguesWithInfo.filter(l => !l.existing);
                    const oldLeagues = leaguesWithInfo.filter(l => l.existing);

                    let leagueChoices = [{
                            name: `🌟 ÖSSZES LIGA (${
                                leagues.length
                            } db)`,
                            value: 'ALL',
                            short: 'Összes liga'
                        }];

                    if (newLeagues.length > 0) {
                        leagueChoices.push({name: `🆕 ÚJ LIGÁK (${
                                newLeagues.length
                            } db)`, value: 'NEW', short: 'Új ligák'});
                    }

                    if (oldLeagues.length > 0) {
                        leagueChoices.push({name: `🔄 MEGLÉVŐ LIGÁK (${
                                oldLeagues.length
                            } db)`, value: 'EXISTING', short: 'Meglévő ligák'});
                    }

                    leagueChoices.push(new inquirer.Separator('--- Egyedi ligák ---'));

                    leagueChoices.push(... leaguesWithInfo.map(league => {
                        let name = `⚽ ${
                            league.displayName
                        }`;
                        if (league.existing) {
                            const daysSinceUpdate = league.existing.lastUpdated ? Math.floor((new Date() - league.existing.lastUpdated) / (1000 * 60 * 60 * 24)) : null;

                            name += ` (${
                                league.existing.matches
                            } meccs`;
                            if (daysSinceUpdate !== null) {
                                if (daysSinceUpdate === 0) {
                                    name += `, ma frissítve)`;
                                } else {
                                    name += `, ${daysSinceUpdate} napja frissítve)`;
                                }
                            } else {
                                name += ')';
                            }
                        } else {
                            name += ' 🆕';
                        }

                        return {name: name, value: league, short: league.displayName};
                    }));

                    logger.info(`Prompting for leagues in ${country.displayName}...`);
                    const {selectedLeagues} = await inquirer.prompt([{
                            type: 'checkbox',
                            name: 'selectedLeagues',
                            message: `Válaszd ki a ligákat ${
                                country.displayName
                            } országból:`,
                            choices: leagueChoices,
                            pageSize: 20
                        }]);

                    // Kiválasztás feldolgozása
                    let leaguesToAdd = [];

                    if (selectedLeagues.includes('ALL')) {
                        leaguesToAdd = leagues;
                    } else if (selectedLeagues.includes('NEW')) {
                        leaguesToAdd = newLeagues;
                    } else if (selectedLeagues.includes('EXISTING')) {
                        leaguesToAdd = oldLeagues;
                    } else {
                        leaguesToAdd = selectedLeagues.filter(l => typeof l === 'object');
                    }

                    if (leaguesToAdd.length > 0) {
                        // Szezon kiválasztás
                        const {getAvailableSeasons} = await import ('./scraper/matchScraper.js');
                        const seasonsForLeague = {};

                        for (const league of leaguesToAdd) {
                            console.log(`
⏳ Szezonok lekérése ${country.displayName} - ${league.displayName} ligához...`);
                            const availableSeasons = await getAvailableSeasons(browser, country.name, league.name);

                            if (availableSeasons.length === 0) {
                                console.log(`❌ Nincs elérhető szezon ${league.displayName} ligához.`);
                                continue;
                            }

                            const seasonChoices = availableSeasons.map(s => ({name: s, value: s}));
                            const {selectedSeason} = await inquirer.prompt([{
                                    type: 'list',
                                    name: 'selectedSeason',
                                    message: `Válaszd ki a szezont ${league.displayName} ligához:`, 
                                    choices: seasonChoices,
                                    default: seasonChoices[0].value
                                }]);
                            seasonsForLeague[league.name] = selectedSeason;
                        }

                        finalSelection.push({country: country, leagues: leaguesToAdd, seasons: seasonsForLeague, mode: 'selected'});
                        console.log(`✅ ${
                            country.displayName
                        }: ${
                            leaguesToAdd.length
                        } liga kiválasztva\n`);
                    } else {
                        console.log(`⚠️ ${
                            country.displayName
                        }: Nincs liga kiválasztva\n`);
                    }
                }

                await browser.close();

                if (finalSelection.length === 0) {
                    console.log('❌ Nincs kiválasztott liga. Kilépés.');
                    return;
                }

                // Végső összefoglaló
                console.log('📋 VÉGSŐ KIVÁLASZTÁS:');
                console.log('=====================');
                let totalLeagues = 0;
                let newLeaguesCount = 0;

                finalSelection.forEach(selection => {
                        console.log(`${
                            selection.country.flag
                        } ${
                            selection.country.displayName
                        }:`);
                        selection.leagues.forEach(league => {
                                const isNew = !league.existing;
                                const icon = isNew ? '🆕' : '🔄';
                                const season = selection.seasons[league.name];
                                console.log(`   ${icon} ${
                                    league.displayName
                                } (Szezon: ${season})`);
                                if (isNew) 
                                    newLeaguesCount++;
                                }
                            );
                            totalLeagues += selection.leagues.length;
                        }
                    );

                    console.log(`\n📊 Összesen: ${
                        finalSelection.length
                    } ország, ${totalLeagues} liga`);
                    console.log(`🆕 Új ligák: ${newLeaguesCount}`);
                    console.log(`🔄 Frissítendő ligák: ${
                        totalLeagues - newLeaguesCount
                    }\n`);

                    // Megerősítés és indítás
                        logger.info('Prompting to start scraping...');
                        const {shouldStart} = await inquirer.prompt([{
                            type: 'confirm',
                            name: 'shouldStart',
                            message: 'Elindítsuk a scraping-et ezekkel a beállításokkal?',
                            default: true
                        }]);

                    if(shouldStart) {
                        await this.startCustomScraping(finalSelection);
                    } else {
                        console.log('❌ Scraping megszakítva.');
                    }

                } catch (error) {
                    console.error('❌ Hiba az interaktív kiválasztás során:', error.message);
                }
            }

            /**
   * Egyedi scraping indítása a kiválasztott országokkal/ligákkal
   */
            async startCustomScraping(selection) {
                console.log('🚀 Egyedi scraping indítása...\n');

                try { // Create a custom scraper configuration
                    const customConfig = {
                        TARGET_LEAGUES: []
                    };

                    // Convert selection to config format
                    selection.forEach(item => {
                        const leagueNames = item.leagues.map(league => league.name);
                        const seasons = item.seasons;
                        customConfig.TARGET_LEAGUES.push({country: item.country.name, leagues: leagueNames, seasons: seasons});
                    });

                    // Create a custom scraper with the new configuration
                    const customScraper = new AutomatedScraper();

                    // Override the config temporarily
                    const originalConfig = {
                        ...CONFIG
                    };
                    Object.assign(CONFIG, {
                        ...CONFIG,
                        ... customConfig
                    });

                    // Start scraping
                    await customScraper.start();

                    // Restore original config
                    Object.assign(CONFIG, originalConfig);

                    console.log('\n✅ Egyedi scraping befejezve!');

                } catch (error) {
                    console.error('❌ Hiba az egyedi scraping során:', error.message);
                }
            }

            /**
   * Liga felfedezés indítása
   */
            async startDiscovery() {
                console.log('🔍 Liga felfedezés indítása...\n');

                try { // Import the new CountryDiscovery class
                    const {CountryDiscovery} = await import ('./scraper/countryDiscovery.js');
                    const {createBrowser} = await import ('./scraper/browser.js');

                    const browser = await createBrowser();
                    const discovery = new CountryDiscovery(browser);

                    // Discover available countries
                    const countries = await discovery.discoverAvailableCountries();

                    console.log(`\n✅ ${
                        countries.length
                    } ország felfedezve:`);
                    countries.forEach(country => {
                        console.log(`  🏴 ${
                            country.displayName
                        } (${
                            country.name
                        })`);
                    });

                    // Optionally discover leagues for the first few countries
                    if (countries.length > 0) {
                        console.log('\n🏆 Liga felfedezés az első országban...');
                        const firstCountry = countries[0];
                        const leagues = await discovery.discoverCountryLeagues(firstCountry.name);

                        if (leagues.length > 0) {
                            console.log(`\n✅ ${
                                leagues.length
                            } liga találva ${
                                firstCountry.displayName
                            } országban:`);
                            leagues.forEach(league => {
                                console.log(`  ⚽ ${
                                    league.displayName
                                } (${
                                    league.name
                                })`);
                            });
                        }
                    }

                    await browser.close();
                } catch (error) {
                    console.error('❌ Hiba a felfedezés során:', error.message);
                }
            }

            /**
   * Átfogó scraping indítása
   */
            async startComprehensive() {
                console.log('🌟 ÁTFOGÓ SCRAPING indítása - Minden elérhető adat...\n');
                console.log('⚠️  FIGYELEM: Ez több órát is igénybe vehet!');
                console.log('⚠️  A folyamat lassan halad az IP védelem miatt.\n');

                const comprehensiveScraper = new ComprehensiveScraper();
                await comprehensiveScraper.startComprehensiveScraping();
            }

            /**
   * ML datasetek generálása
   */
            async generateMLDatasets() {
                console.log('🤖 ML datasetek generálása...\n');

                try {
                    const {MLDataProcessor} = await import ('./utils/mlDataProcessor.js');
                    await MLDataProcessor.generateAllMLDatasets();
                    console.log('\n✅ ML datasetek sikeresen generálva!');
                    console.log('📁 Keresés: scraped_data/*/*/*_ml_dataset.csv');
                } catch (error) {
                    console.error('❌ Hiba az ML datasetek generálása során:', error.message);
                }
            }

            /**
   * Cache frissítése
   */
            async refreshCache() {
        console.log('🔄 Cache frissítése...');

        try {
            const { createBrowser } = await import('./scraper/browser.js');
            const browser = await createBrowser();

            await cacheManager.refreshCache(browser);

            await browser.close();
            console.log('✅ Cache frissítése befejezve!');
        } catch (error) {
            console.error('❌ Hiba a cache frissítésekor:', error.message);
        }
    }

            async showCacheStatus() {
        console.log('📋 CACHE ÁLLAPOT');
        console.log('===============');

        try {
            const status = await cacheManager.checkCacheStatus();

            if (status.hasCountriesCache) {
                console.log(`🌍 Országok cache: ✅ (${status.countriesCacheAge} napos)`);
            } else {
                console.log('🌍 Országok cache: ❌ (nem található)');
            }

            console.log(`🏆 Ligák cache: ${status.leaguesCacheCount} ország`);

            if (status.leaguesCacheCount > 0) {
                console.log(`   - Legrégebbi: ${status.oldestLeagueCache} napos`);
                console.log(`   - Legújabb: ${status.newestLeagueCache} napos`);
            }

            // Cache érvényesség ellenőrzése
            const cacheValidDays = 7; // Ugyanaz, mint a CacheManager osztályban

            if (status.hasCountriesCache && status.countriesCacheAge > cacheValidDays) {
                console.log('\n⚠️  Az országok cache elavult, frissítés javasolt!');
            }

            if (status.leaguesCacheCount > 0 && status.oldestLeagueCache > cacheValidDays) {
                console.log('⚠️  Néhány liga cache elavult, frissítés javasolt!');
            }

            console.log('\nCache frissítése:');
            console.log('  npm run refresh-cache');

        } catch (error) {
            console.error('❌ Hiba a cache állapot ellenőrzésekor:', error.message);
        }
    }

  /**
   * Súgó megjelenítése
   */
            showHelp() {
                console.log('🎯 BettingMentor Automatizált Flashscore Scraper');
                console.log('================================================\n');

                console.log('HASZNÁLAT:');
                console.log('  node src/cli.js <parancs>\n');

                console.log('PARANCSOK:');
                console.log('  start         🚀 Scraping indítása (konfigurált ligák)');
                console.log('  select        🎯 Interaktív ország/liga kiválasztás');
                console.log('  comprehensive 🌟 MINDEN elérhető adat letöltése');
                console.log('  discover      🔍 Elérhető országok/ligák felfedezése');
                console.log('  ml-dataset    🤖 ML datasetek generálása (JSON→CSV)');
                console.log('  refresh-cache 🔄 Országok és ligák cache frissítése');
                console.log('  cache-status  📋 Cache állapot megjelenítése');
                console.log('  status        📊 Aktuális státusz');
                console.log('  config        ⚙️  Konfiguráció megjelenítése');
                console.log('  stats         📈 Adatgyűjtési statisztikák');
                console.log('  clean         🧹 Összes adat törlése');
                console.log('  help          ❓ Ez a súgó\n');

                console.log('PÉLDÁK:');
                console.log('  node src/cli.js start');
                console.log('  node src/cli.js select');
                console.log('  node src/cli.js refresh-cache\n');
            }

  /**
   * Adatstatisztikák számítása
   */
  async calculateDataStats() {
    const stats = {
      countries: 0,
      leagues: 0,
      totalMatches: 0,
      files: 0,
      totalSize: 0,
      byCountry: {}
    };

    if (!await fs.pathExists(CONFIG.OUTPUT_BASE_PATH)) {
      return stats;
    }

    const countries = await fs.readdir(CONFIG.OUTPUT_BASE_PATH);
    stats.countries = countries.length;

    for (const country of countries) {
      const countryPath = path.join(CONFIG.OUTPUT_BASE_PATH, country);
      const countryStats = await fs.stat(countryPath);

      if (countryStats.isDirectory()) {
        stats.byCountry[country] = { leagues: 0, matches: 0 };

        const leagues = await fs.readdir(countryPath);
        stats.leagues += leagues.length;
        stats.byCountry[country].leagues = leagues.length;

        for (const league of leagues) {
          const leaguePath = path.join(countryPath, league);
          const leagueStats = await fs.stat(leaguePath);

          if (leagueStats.isDirectory()) {
            const seasons = await fs.readdir(leaguePath);

            for (const season of seasons) {
              const seasonPath = path.join(leaguePath, season);
              const files = await fs.readdir(seasonPath);

              for (const file of files) {
                if (file.endsWith('.json')) {
                  const filePath = path.join(seasonPath, file);
                  const fileStats = await fs.stat(filePath);

                  stats.files++;
                  stats.totalSize += fileStats.size;

                  try {
                    const data = await fs.readJson(filePath);
                    const matchCount = Object.keys(data).length;
                    stats.totalMatches += matchCount;
                    stats.byCountry[country].matches += matchCount;
                  } catch (error) {
                    logger.error(`Hiba a JSON fájl olvasásakor: ${filePath}`, error);
                  }
                }
              }
            }
          }
        }
      }
    }
    return stats;
  }

  /**
   * Bájtok olvasható formátumba formázása
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

// CLI indítás
const cli = new CLI();
cli.processCommand(process.argv).catch(error => {
  logger.error('CLI hiba:', error);
  process.exit(1);
});
