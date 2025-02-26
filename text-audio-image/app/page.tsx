'use client'
import { useState } from 'react';
//import { GoogleCloudTranslation } from '@google/generative-ai';
//import { generateSpeech, createSynthesisSpeech } from 'google-speech-api/build/src/vision/speech';

export default function Home() {
    const [hungarianText, setHungarianText] = useState('');
    const [englishText, setEnglishText] = useState('');
    
    // Google Cloud Translation API key
    //const translationAPI = new GoogleCloudTranslation('YOUR_API_KEY');
    
    async function convertTextToAudio() {
        if (!hungarianText.trim()) return;
        
        try {
            // Translate text to English
           // const englishResponse = await translationAPI.translate(
           //     hungarianText,
           //     'en'
           // );
            
            // Extract the translated text from HTML response
            //const translatedText = englishResponse.data.translations[0].text;
            
            // Generate audio from English text
            //const synthesisSpeech = generateSpeech(translatedText);
            //const audioBuffer = await createSynthesisSpeech(synthesisSpeech);
            
            // Play the generated audio
            //const audio = new (window.AudioContext || window.webkitAudioContext)();
           // const source = audio.createBufferSource();
            //source.buffer = audioBuffer;
            //source.connect(audio.destination);
            //source.start(0);
            
            // Save the audio file (WAV format)
            //const wavFile = audioBuffer.to WAV();
            //downloadAudio(wavFile, 'audio.wav');
        } catch (error) {
            console.error('Error:', error);
        }
    }

    return (
      <div className="p-5 h-screen bg-black text-white flex justify-evenly">
        <div className="w-full max-w-4xl space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">Audio Converter</h1>

            <div className="space-y-2">
              <label htmlFor="hungarian-text">Hungarian text:</label>
              <textarea
                id="hungarian-text"
                value={hungarianText}
                onChange={(e) => setHungarianText(e.target.value)}
                className="p-3 w-full bg-gray-800 rounded text-white"
                placeholder="Enter Hungarian text below..."
              />

              <h3 className="text-lg">Character count:</h3>
              <span className="text-lambda">{hungarianText.length}</span>
            </div>

            <div className="space-y-2">
              <label htmlFor="english-text">English text:</label>
              <textarea
                id="english-text"
                value={englishText}
                onChange={(e) => setEnglishText(e.target.value)}
                className="p-3 w-full bg-gray-800 rounded text-white"
                placeholder="Translated English text will appear here..."
              />

              <h3 className="text-lg">Character count:</h3>
              <span className="text-lambda">{englishText.length}</span>
            </div>

            <button
              onClick={convertTextToAudio}
              className="bg-white text-black px-6 py-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              Convert to voice
            </button>
            <div className="mt-8">
              <audio controls>
                <source type="audio/wav" />
              </audio>
            </div>

            <button className="bg-white text-black px-6 py-2 rounded-full hover:bg-gray-700 transition-colors">Download</button>
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold">Pictures to save:</h1>
        </div>
      </div>
    )
}

