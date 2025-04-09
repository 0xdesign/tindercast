'use client';

import { useState } from 'react';

export default function ApiTestPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [fid, setFid] = useState<number>(1317); // Default to FID 1317
  const [targetFid, setTargetFid] = useState<number>(1); // Default target FID

  async function testFollowingApi() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/following', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fid })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function testWalletOverlapApi() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/wallet-overlap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userFid: fid, profileFid: targetFid })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      <p className="mb-4">Test the Tindercast API endpoints</p>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Test Settings</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">User FID:</label>
            <input
              type="number"
              value={fid}
              onChange={(e) => setFid(Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Target FID (for wallet overlap):</label>
            <input
              type="number"
              value={targetFid}
              onChange={(e) => setTargetFid(Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">API Endpoints</h2>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={testFollowingApi}
              disabled={loading}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              Test Following API
            </button>
            <button
              onClick={testWalletOverlapApi}
              disabled={loading}
              className="p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
            >
              Test Wallet Overlap API
            </button>
          </div>
        </div>
      </div>
      
      {loading && (
        <div className="p-4 border rounded bg-gray-50">
          <p className="text-center">Loading...</p>
        </div>
      )}
      
      {error && (
        <div className="p-4 border rounded bg-red-50 text-red-800">
          <h2 className="font-semibold mb-2">Error:</h2>
          <p>{error}</p>
        </div>
      )}
      
      {results && (
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Results:</h2>
          <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-96 text-sm">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 