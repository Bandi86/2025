// gemma.js
const axios = require('axios');
const fs = require('fs');

(async () => {
  try {
    const text = fs.readFileSync('page.txt', 'utf-8');

    const prompt = `
Ez az oldal szövege:
"""${text}"""

Kérlek nyerd ki a meccsek adatait JSON formában.
Minta:
[
  {
    "hazai_csapat": "...",
    "vendeg_csapat": "...",
    "eredmeny": "...",
    "idopont": "..."
  }
]
Ha nincs ilyen adat, jelezd.
`;

    console.log('📤 Kérés elküldve a Gemma modellnek...');
    process.stdout.write('⌛ Válasz generálása folyamatban');

    const res = await axios.post('http://localhost:11434/api/generate', {
      model: 'gemma3:4b',
      prompt,
      stream: true
    }, { responseType: 'stream' });

    // pontokat írunk ki, míg stream megy
    const dots = setInterval(() => process.stdout.write('.'), 1000);

    let output = '';

    res.data.on('data', chunk => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              process.stdout.write(data.response); // ide írja valós időben
              output += data.response;
            }
          } catch (e) {
            console.error('❌ Hiba a válasz feldolgozásában:', e.message);
          }
        }
      }
    });

    res.data.on('end', () => {
      clearInterval(dots);
      console.log('\n✅ Válasz teljesen megérkezett!');

      // Mentés fájlba is
      fs.writeFileSync('llm-valasz.txt', output);
      console.log('📝 Válasz elmentve: llm-valasz.txt');
    });

  } catch (err) {
    console.error('❌ Hiba történt:', err.message);
  }
})();
