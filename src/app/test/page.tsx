'use client';

import { useState } from 'react';
import { testFollowingApi, testWalletOverlapApi } from '@/utils/test';

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [followingResults, setFollowingResults] = useState<any>(null);
  const [walletResults, setWalletResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userFid, setUserFid] = useState<number>(1317); // Default to FID 1317 as requested
  const [targetFid, setTargetFid] = useState<number>(1);

  const testFollowing = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await testFollowingApi(userFid);
      setFollowingResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testWalletOverlap = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await testWalletOverlapApi(userFid, targetFid);
      setWalletResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">API Test Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">User FID:</label>
            <input
              type="number"
              value={userFid}
              onChange={(e) => setUserFid(Number(e.target.value))}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block mb-2">Target FID (for wallet overlap):</label>
            <input
              type="number"
              value={targetFid}
              onChange={(e) => setTargetFid(Number(e.target.value))}
              className="border p-2 rounded w-full"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Following API</h2>
          <button
            onClick={testFollowing}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300 mb-4"
          >
            {loading ? 'Testing...' : 'Test Following API'}
          </button>
          
          {followingResults && (
            <div>
              <h3 className="font-medium mt-4">Results:</h3>
              <p>Found {followingResults.following.length} following profiles</p>
              <div className="mt-2 max-h-60 overflow-auto">
                <pre className="bg-gray-100 p-2 rounded text-xs">
                  {JSON.stringify(followingResults, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
        
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Wallet Overlap API</h2>
          <button
            onClick={testWalletOverlap}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-green-300 mb-4"
          >
            {loading ? 'Testing...' : 'Test Wallet Overlap API'}
          </button>
          
          {walletResults && (
            <div>
              <h3 className="font-medium mt-4">Results:</h3>
              <p>Overlap: {walletResults.overlapPercentage}%</p>
              <p>Common Assets: {walletResults.totalCommonAssets}</p>
              <div className="mt-2 max-h-60 overflow-auto">
                <pre className="bg-gray-100 p-2 rounded text-xs">
                  {JSON.stringify(walletResults, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg">
          <h3 className="font-bold mb-2">Error:</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
} 