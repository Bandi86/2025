'use client';

import { useState } from 'react';
import axios from 'axios';

export default function TestDataPage() {
  const [message, setMessage] = useState('Click the button to collect odds.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCollectOdds = async () => {
    setLoading(true);
    setError(null);
    setMessage('Collecting odds...');
    try {
      // Assuming backend is running on port 3001
      const response = await axios.get('http://localhost:3001/odds-collector/collect');
      setMessage(response.data);
    } catch (err) {
      console.error('Error collecting odds:', err);
      setError('Failed to collect odds. Check console for details.');
      setMessage('Error!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test Data Collection</h1>
      <p>{message}</p>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <button
        onClick={handleCollectOdds}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
        }}
      >
        {loading ? 'Collecting...' : 'Collect Odds'}
      </button>
      <p style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
        This page attempts to call the backend API at <code>http://localhost:3001/odds-collector/collect</code>.
        Ensure your backend is running and accessible.
      </p>
    </div>
  );
}
