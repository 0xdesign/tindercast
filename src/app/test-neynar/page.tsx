'use client';

import { useState, useEffect } from 'react';

export default function TestNeynarPage() {
  const [testFid, setTestFid] = useState(1317); // Default test FID
  const [signerUuid, setSignerUuid] = useState('');
  const [signerStatus, setSignerStatus] = useState<any>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    createSigner: false,
    checkStatus: false,
    suggestedFollows: false,
  });
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, `[${new Date().toISOString()}] ${message}`]);
  };

  const createSigner = async () => {
    setLoading({ ...loading, createSigner: true });
    addLog(`Creating signer for FID: ${testFid}`);

    try {
      const response = await fetch('/api/signer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fid: testFid }),
      });

      const data = await response.json();

      if (response.ok) {
        setSignerUuid(data.signer_uuid);
        addLog(`Signer created successfully: ${data.signer_uuid}`);
      } else {
        addLog(`Error creating signer: ${data.error}`);
      }
    } catch (error) {
      addLog(`Exception creating signer: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading({ ...loading, createSigner: false });
    }
  };

  const checkSignerStatus = async () => {
    if (!signerUuid) {
      addLog('No signer UUID available');
      return;
    }

    setLoading({ ...loading, checkStatus: true });
    addLog(`Checking status for signer: ${signerUuid}`);

    try {
      const response = await fetch(`/api/signer?signer_uuid=${signerUuid}`);
      const data = await response.json();

      if (response.ok) {
        setSignerStatus(data);
        addLog(`Signer status: ${data.status}`);
        
        if (data.signer_approval_url) {
          addLog(`Approval URL: ${data.signer_approval_url}`);
        }
      } else {
        addLog(`Error checking signer status: ${data.error}`);
      }
    } catch (error) {
      addLog(`Exception checking signer status: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading({ ...loading, checkStatus: false });
    }
  };

  const fetchSuggestedFollows = async () => {
    setLoading({ ...loading, suggestedFollows: true });
    addLog(`Fetching suggested follows with overlap for FID: ${testFid}`);

    try {
      const response = await fetch(`/api/suggested-follows-with-overlap?fid=${testFid}&limit=5`);
      const data = await response.json();

      if (response.ok) {
        setSuggestedUsers(data.users || []);
        addLog(`Fetched ${data.users?.length || 0} suggested users`);
      } else {
        addLog(`Error fetching suggested follows: ${data.error}`);
      }
    } catch (error) {
      addLog(`Exception fetching suggested follows: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading({ ...loading, suggestedFollows: false });
    }
  };

  const followUser = async (targetFid: number) => {
    if (!signerUuid) {
      addLog('No signer UUID available');
      return;
    }

    if (signerStatus?.status !== 'approved') {
      addLog('Signer is not approved');
      return;
    }

    addLog(`Following user with FID: ${targetFid}`);

    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signerUuid,
          targetFid,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        addLog(`Successfully followed user with FID: ${targetFid}`);
        // Refresh suggested follows to remove the followed user
        fetchSuggestedFollows();
      } else {
        addLog(`Error following user: ${data.error}`);
      }
    } catch (error) {
      addLog(`Exception following user: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Neynar API Test</h1>
      
      <div className="mb-4">
        <label className="block mb-2">
          Test FID:
          <input
            type="number"
            value={testFid}
            onChange={(e) => setTestFid(parseInt(e.target.value))}
            className="ml-2 p-1 border rounded"
          />
        </label>
      </div>
      
      <div className="mb-4 flex space-x-4">
        <button
          onClick={createSigner}
          disabled={loading.createSigner}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {loading.createSigner ? 'Creating...' : 'Create Signer'}
        </button>
        
        <button
          onClick={checkSignerStatus}
          disabled={!signerUuid || loading.checkStatus}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
        >
          {loading.checkStatus ? 'Checking...' : 'Check Signer Status'}
        </button>
        
        <button
          onClick={fetchSuggestedFollows}
          disabled={loading.suggestedFollows}
          className="px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-400"
        >
          {loading.suggestedFollows ? 'Fetching...' : 'Fetch Suggested Follows'}
        </button>
      </div>
      
      {signerUuid && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-semibold mb-2">Signer Information</h2>
          <p><strong>UUID:</strong> {signerUuid}</p>
          {signerStatus && (
            <>
              <p><strong>Status:</strong> {signerStatus.status}</p>
              {signerStatus.signer_approval_url && (
                <div className="mt-2">
                  <p><strong>Approval URL:</strong></p>
                  <a
                    href={signerStatus.signer_approval_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline break-all"
                  >
                    {signerStatus.signer_approval_url}
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {suggestedUsers.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Suggested Users with Overlap</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedUsers.map((user) => (
              <div key={user.fid} className="border rounded p-4">
                <div className="flex items-center mb-2">
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.username}
                      className="w-10 h-10 rounded-full mr-2"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{user.displayName}</p>
                    <p className="text-gray-600">@{user.username}</p>
                  </div>
                </div>
                <p className="text-sm mb-2">{user.bio || 'No bio available'}</p>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-medium">
                    {user.overlapCalculated
                      ? `${user.overlapPercentage}% overlap`
                      : 'Calculating overlap...'}
                  </span>
                  <button
                    onClick={() => followUser(user.fid)}
                    disabled={!signerUuid || signerStatus?.status !== 'approved'}
                    className="px-3 py-1 bg-green-500 text-white rounded disabled:bg-gray-400 text-sm"
                  >
                    Follow
                  </button>
                </div>
                {user.topCommonAssets?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold">Common tokens:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.topCommonAssets.slice(0, 3).map((asset: any, index: number) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-gray-200 rounded-full"
                        >
                          {asset.symbol}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">API Logs</h2>
        <div className="p-4 bg-black text-green-400 font-mono text-sm h-64 overflow-y-auto rounded">
          {logs.map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 