'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function CompressionDashboard() {
  const [selectedProfile, setSelectedProfile] = useState<string>('general');
  const { data: profiles, error: profilesError } = useSWR('/api/compression/profiles', fetcher);
  const { data: metrics, error: metricsError } = useSWR('/api/compression/analyze', fetcher);

  const [compressionState, setCompressionState] = useState({
    originalSize: 0,
    compressedSize: 0,
    ratio: 0,
    savings: 0
  });

  const handleAnalyze = async () => {
    try {
      const response = await fetch('/api/compression/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: { memory: 1000, context: 500 },
          taskType: selectedProfile
        })
      });
      const data = await response.json();
      if (data.success) {
        setCompressionState({
          originalSize: data.analysis.originalSize,
          compressedSize: data.analysis.compressedSize,
          ratio: data.analysis.ratio,
          savings: data.analysis.savingsPercentage
        });
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const handleApplyCompression = async () => {
    try {
      const response = await fetch('/api/compression/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: { memory: 1000, context: 500 },
          taskType: selectedProfile,
          recordOutcome: true
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(`Compression applied! Ratio: ${data.compression.ratio}x`);
      }
    } catch (error) {
      console.error('Compression failed:', error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Compression Dashboard</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Task Profile</label>
        <select 
          value={selectedProfile}
          onChange={(e) => setSelectedProfile(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="general">General</option>
          <option value="code">Code</option>
          <option value="data">Data Analysis</option>
          <option value="kyc">KYC Verification</option>
          <option value="creative">Creative Writing</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded">
          <div className="text-sm text-gray-600">Original Size</div>
          <div className="text-2xl font-bold">{compressionState.originalSize} MB</div>
        </div>
        <div className="p-4 bg-green-50 rounded">
          <div className="text-sm text-gray-600">Compressed Size</div>
          <div className="text-2xl font-bold">{compressionState.compressedSize} MB</div>
        </div>
        <div className="p-4 bg-purple-50 rounded">
          <div className="text-sm text-gray-600">Compression Ratio</div>
          <div className="text-2xl font-bold">{compressionState.ratio}x</div>
        </div>
        <div className="p-4 bg-yellow-50 rounded">
          <div className="text-sm text-gray-600">Cost Savings</div>
          <div className="text-2xl font-bold">{compressionState.savings}%</div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleAnalyze}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Analyze
        </button>
        <button
          onClick={handleApplyCompression}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          Apply Compression
        </button>
      </div>

      {profilesError && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">
          Failed to load profiles
        </div>
      )}
    </div>
  );
}

// Made with Moe Abdelaziz
