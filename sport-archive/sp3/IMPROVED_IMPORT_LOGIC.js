/**
 * JAVÍTOTT IMPORT LOGIKA - INTELLIGENS MERGE
 *
 * A jelenlegi problémák:
 * 1. Ha egy meccs már létezik, a rendszer nem frissíti a markets/odds adatokat
 * 2. Elvesznek a később érkező, bővebb piacok és odds-ok
 * 3. Nincs intelligens merge stratégia
 *
 * Javaslat:
 * 1. Minden import esetén ellenőrizzük a meglévő markets számát
 * 2. Ha több piac érkezik, mergeljük az adatokat
 * 3. Preferáljuk a frissebb/teljesebb verziókat
 */

// JELENLEGI HIBÁS KÓD:
if (!matchRecord) {
  // Csak új meccs esetén történik market import...
  matchRecord = await this.prisma.match.create({...});

  // 4. Marketek és odds-ok importálása
  for (const market of match.markets) {
    // Market létrehozás...
  }
}
// HA MÁR LÉTEZIK A MECCS → SEMMI NEM TÖRTÉNIK! ❌

// JAVÍTOTT LOGIKA:
if (!matchRecord) {
  // Új meccs létrehozása
  matchRecord = await this.prisma.match.create({...});
}

// MINDIG FUSSON LE A MARKET MERGE LOGIKA:
await this.mergeOrUpdateMarkets(matchRecord, match.markets);

/**
 * Intelligens market merge stratégia
 */
private async mergeOrUpdateMarkets(matchRecord: any, newMarkets: any[]): Promise<void> {
  // 1. Meglévő markets lekérése
  const existingMarkets = await this.prisma.market.findMany({
    where: { matchId: matchRecord.id },
    include: { odds: true },
  });

  const existingMarketsCount = existingMarkets.length;
  const newMarketsCount = newMarkets.length;

  this.logger.log(`🔄 Market merge: ${existingMarketsCount} meglévő → ${newMarketsCount} új`);

  // 2. Merge stratégia döntés
  if (newMarketsCount > existingMarketsCount) {
    // Több piac érkezett - teljes replace
    this.logger.log(`📈 Több piac érkezett (${existingMarketsCount} → ${newMarketsCount}) - teljes frissítés`);

    // Régi markets törlése
    const marketIds = existingMarkets.map(m => m.id);
    if (marketIds.length > 0) {
      await this.prisma.odds.deleteMany({ where: { marketId: { in: marketIds } } });
      await this.prisma.market.deleteMany({ where: { matchId: matchRecord.id } });
    }

    // Új markets létrehozása
    await this.createMarkets(matchRecord.id, newMarkets);

  } else if (newMarketsCount === existingMarketsCount) {
    // Azonos piacszám - odds összehasonlítás
    const existingOddsCount = existingMarkets.reduce((sum, m) => sum + m.odds.length, 0);
    const newOddsCount = newMarkets.reduce((sum, m) => sum + (m.odds1 ? 1 : 0) + (m.oddsX ? 1 : 0) + (m.odds2 ? 1 : 0), 0);

    if (newOddsCount > existingOddsCount) {
      this.logger.log(`📊 Több odds érkezett (${existingOddsCount} → ${newOddsCount}) - frissítés`);

      // Régi markets törlése és új létrehozása
      const marketIds = existingMarkets.map(m => m.id);
      if (marketIds.length > 0) {
        await this.prisma.odds.deleteMany({ where: { marketId: { in: marketIds } } });
        await this.prisma.market.deleteMany({ where: { matchId: matchRecord.id } });
      }

      await this.createMarkets(matchRecord.id, newMarkets);
    } else {
      this.logger.log(`⏭️  Nem kell frissítés (${existingOddsCount} >= ${newOddsCount} odds)`);
    }

  } else {
    // Kevesebb piac érkezett - megtartjuk a meglévőt
    this.logger.log(`⬇️  Kevesebb piac érkezett (${newMarketsCount} < ${existingMarketsCount}) - megtartás`);
  }
}

private async createMarkets(matchId: string, markets: any[]): Promise<void> {
  for (const market of markets) {
    const createdMarket = await this.prisma.market.create({
      data: {
        matchId: matchId,
        name: market.name,
        origName: market.orig_market,
      },
    });

    // Odds létrehozása
    if (market.odds1) {
      await this.prisma.odds.create({
        data: {
          marketId: createdMarket.id,
          type: 'odds1',
          value: parseFloat(market.odds1),
        },
      });
    }

    if (market.oddsX) {
      await this.prisma.odds.create({
        data: {
          marketId: createdMarket.id,
          type: 'oddsX',
          value: parseFloat(market.oddsX),
        },
      });
    }

    if (market.odds2) {
      await this.prisma.odds.create({
        data: {
          marketId: createdMarket.id,
          type: 'odds2',
          value: parseFloat(market.odds2),
        },
      });
    }
  }
}
