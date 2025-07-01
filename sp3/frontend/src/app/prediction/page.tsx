'use client';

import { useState } from 'react';

interface PredictionResult {
  league: string;
  home_team: string;
  away_team: string;
  date: string;
  probabilities: {
    home: number;
    draw: number;
    away: number;
  };
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  expected_goals: {
    home: number;
    away: number;
    total: number;
  };
  btts: {
    probability: number;
    yes_prob: number;
    no_prob: number;
  };
  over_under_25: {
    over_prob: number;
    under_prob: number;
    total_expected: number;
  };
  recommendation: {
    bet: string | null;
    value: number;
    text: string;
  };
  model: string;
  timestamp: string;
  explanation: string;
}

export default function PredictionPage() {
  const [formData, setFormData] = useState({
    home_team: '',
    away_team: '',
    league: '',
    date: '',
    odds_home: '',
    odds_draw: '',
    odds_away: ''
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/ml-processor/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          odds_home: parseFloat(formData.odds_home),
          odds_draw: parseFloat(formData.odds_draw),
          odds_away: parseFloat(formData.odds_away)
        })
      });

      if (!response.ok) {
        throw new Error('Predikció sikertelen');
      }

      const result = await response.json();
      setPrediction(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Futball Predikció</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Meccs adatok</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Hazai csapat</label>
              <input
                type="text"
                name="home_team"
                value={formData.home_team}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Vendég csapat</label>
              <input
                type="text"
                name="away_team"
                value={formData.away_team}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Liga/Torna</label>
              <select
                name="league"
                value={formData.league}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Válassz ligát/tornát</option>

                <optgroup label="Európai Ligák">
                  <option value="premier-league">Premier League</option>
                  <option value="la-liga">La Liga</option>
                  <option value="bundesliga">Bundesliga</option>
                  <option value="serie-a">Serie A</option>
                  <option value="ligue-1">Ligue 1</option>
                  <option value="eredivisie">Eredivisie</option>
                  <option value="primeira-liga">Primeira Liga</option>
                  <option value="scottish-premiership">Scottish Premiership</option>
                </optgroup>

                <optgroup label="Nemzetközi Klub Tornák">
                  <option value="champions-league">Bajnokok Ligája</option>
                  <option value="europa-league">Európa Liga</option>
                  <option value="conference-league">Konferencia Liga</option>
                  <option value="club-world-cup">Klub Világbajnokság</option>
                  <option value="uefa-super-cup">UEFA Szuperkupa</option>
                </optgroup>

                <optgroup label="Nemzeti Kupák">
                  <option value="fa-cup">FA Cup</option>
                  <option value="copa-del-rey">Copa del Rey</option>
                  <option value="dfb-pokal">DFB-Pokal</option>
                  <option value="coppa-italia">Coppa Italia</option>
                  <option value="coupe-de-france">Coupe de France</option>
                </optgroup>

                <optgroup label="Válogatott Tornák">
                  <option value="world-cup">Világbajnokság</option>
                  <option value="euros">Európa-bajnokság</option>
                  <option value="nations-league">Nations League</option>
                </optgroup>

                <optgroup label="Egyéb Ligák">
                  <option value="brazil">Brazil Serie A</option>
                  <option value="mls">MLS</option>
                </optgroup>

                <optgroup label="Általános">
                  <option value="international">Nemzetközi meccs</option>
                  <option value="friendly">Barátságos meccs</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Dátum</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Hazai odds</label>
                <input
                  type="number"
                  step="0.01"
                  name="odds_home"
                  value={formData.odds_home}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Döntetlen odds</label>
                <input
                  type="number"
                  step="0.01"
                  name="odds_draw"
                  value={formData.odds_draw}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vendég odds</label>
                <input
                  type="number"
                  step="0.01"
                  name="odds_away"
                  value={formData.odds_away}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Predikció futtatása...' : 'Predikció'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Eredmény</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {prediction && (
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="font-semibold text-lg">
                  {prediction.home_team} vs {prediction.away_team}
                </h3>
                <p className="text-gray-600">{prediction.league} | {prediction.date}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  Valószínűségek:
                  <span className="relative group cursor-pointer">
                    <svg className="w-4 h-4 text-gray-400 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
                    <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-gray-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                      Ezek a százalékok a modell által becsült győzelmi esélyek (hazai/döntetlen/vendég).
                    </span>
                  </span>
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 rounded relative">
                    <div className="font-semibold">Hazai</div>
                    <div className="text-lg font-bold">
                      <span className={`inline-block px-2 py-1 rounded-full ${prediction.probabilities.home > 50 ? 'bg-green-400 text-white' : 'bg-gray-200'}`}>{prediction.probabilities.home}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded mt-1">
                      <div className="h-2 rounded bg-green-400" style={{width: `${prediction.probabilities.home}%`}}></div>
                    </div>
                    <div className="text-xs text-gray-600">Odds: {prediction.odds.home}</div>
                  </div>
                  <div className="text-center p-2 rounded relative">
                    <div className="font-semibold">Döntetlen</div>
                    <div className="text-lg font-bold">
                      <span className={`inline-block px-2 py-1 rounded-full ${prediction.probabilities.draw > 40 ? 'bg-yellow-400 text-white' : 'bg-gray-200'}`}>{prediction.probabilities.draw}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded mt-1">
                      <div className="h-2 rounded bg-yellow-400" style={{width: `${prediction.probabilities.draw}%`}}></div>
                    </div>
                    <div className="text-xs text-gray-600">Odds: {prediction.odds.draw}</div>
                  </div>
                  <div className="text-center p-2 rounded relative">
                    <div className="font-semibold">Vendég</div>
                    <div className="text-lg font-bold">
                      <span className={`inline-block px-2 py-1 rounded-full ${prediction.probabilities.away > 50 ? 'bg-red-400 text-white' : 'bg-gray-200'}`}>{prediction.probabilities.away}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded mt-1">
                      <div className="h-2 rounded bg-red-400" style={{width: `${prediction.probabilities.away}%`}}></div>
                    </div>
                    <div className="text-xs text-gray-600">Odds: {prediction.odds.away}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Várható gólok:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-2 bg-blue-100 rounded">
                    <div className="font-semibold">{prediction.home_team}</div>
                    <div className="text-lg">{prediction.expected_goals.home}</div>
                  </div>
                  <div className="text-center p-2 bg-blue-100 rounded">
                    <div className="font-semibold">{prediction.away_team}</div>
                    <div className="text-lg">{prediction.expected_goals.away}</div>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded ${prediction.recommendation.bet ? 'bg-green-100 border border-green-400' : 'bg-gray-100'}`}>
                <h4 className="font-medium mb-1">Fogadási ajánlás:</h4>
                <p className="text-sm">{prediction.recommendation.text}</p>
                {prediction.recommendation.bet && (
                  <p className="text-xs text-green-700 mt-1">
                    Value: {prediction.recommendation.value}%
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  Mindkét csapat szerez gólt (BTTS):
                  <span className="relative group cursor-pointer">
                    <svg className="w-4 h-4 text-gray-400 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
                    <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-gray-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                      BTTS: Mindkét csapat szerez gólt-e a meccsen? Igen/Nem százalékos esély.
                    </span>
                  </span>
                </h4>
                <div className="flex gap-4 text-sm">
                  <div className="flex-1 text-center p-2 rounded bg-green-50">
                    <div className="font-semibold">Igen</div>
                    <div className="text-lg font-bold">
                      <span className={`inline-block px-2 py-1 rounded-full ${prediction.btts.yes_prob > 50 ? 'bg-green-400 text-white' : 'bg-gray-200'}`}>{prediction.btts.yes_prob}%</span>
                    </div>
                  </div>
                  <div className="flex-1 text-center p-2 rounded bg-red-50">
                    <div className="font-semibold">Nem</div>
                    <div className="text-lg font-bold">
                      <span className={`inline-block px-2 py-1 rounded-full ${prediction.btts.no_prob > 50 ? 'bg-red-400 text-white' : 'bg-gray-200'}`}>{prediction.btts.no_prob}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  Összes gól: 2.5 alatt/felett
                  <span className="relative group cursor-pointer">
                    <svg className="w-4 h-4 text-gray-400 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
                    <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-gray-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                      Over/Under 2.5: A meccsen várhatóan 2.5 gól alatt vagy felett lesz.
                    </span>
                  </span>
                </h4>
                <div className="flex gap-4 text-sm">
                  <div className="flex-1 text-center p-2 rounded bg-blue-50">
                    <div className="font-semibold">2.5 felett</div>
                    <div className="text-lg font-bold">
                      <span className={`inline-block px-2 py-1 rounded-full ${prediction.over_under_25.over_prob > 50 ? 'bg-blue-400 text-white' : 'bg-gray-200'}`}>{prediction.over_under_25.over_prob}%</span>
                    </div>
                  </div>
                  <div className="flex-1 text-center p-2 rounded bg-yellow-50">
                    <div className="font-semibold">2.5 alatt</div>
                    <div className="text-lg font-bold">
                      <span className={`inline-block px-2 py-1 rounded-full ${prediction.over_under_25.under_prob > 50 ? 'bg-yellow-400 text-white' : 'bg-gray-200'}`}>{prediction.over_under_25.under_prob}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1 text-center">Várható összgól: {prediction.expected_goals.total}</div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-700">
                <h4 className="font-medium mb-1">Predikció magyarázat:</h4>
                <p>{prediction.explanation}</p>
              </div>

              <div className="text-xs text-gray-500 pt-2 border-t">
                Modell: {prediction.model} | {prediction.timestamp}
              </div>
            </div>
          )}

          {!prediction && !error && !loading && (
            <p className="text-gray-500 text-center">Töltsd ki a formot a predikció elindításához</p>
          )}
        </div>
      </div>
    </div>
  );
}
