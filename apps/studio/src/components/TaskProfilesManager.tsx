'use client';

import { useState } from 'react';

interface TaskProfile {
  taskType: string;
  algorithm: string;
  targetRatio: number;
  maxLatency: number;
  minQuality: number;
}

const DEFAULT_PROFILES: TaskProfile[] = [
  { taskType: 'code', algorithm: 'semantic', targetRatio: 4.5, maxLatency: 50, minQuality: 0.95 },
  { taskType: 'data', algorithm: 'statistical', targetRatio: 6.0, maxLatency: 30, minQuality: 0.90 },
  { taskType: 'kyc', algorithm: 'lossless', targetRatio: 2.0, maxLatency: 100, minQuality: 1.0 },
  { taskType: 'creative', algorithm: 'semantic', targetRatio: 3.0, maxLatency: 80, minQuality: 0.85 },
  { taskType: 'conversation', algorithm: 'adaptive', targetRatio: 5.0, maxLatency: 40, minQuality: 0.88 }
];

export function TaskProfilesManager() {
  const [profiles, setProfiles] = useState<TaskProfile[]>(DEFAULT_PROFILES);
  const [selectedProfile, setSelectedProfile] = useState<TaskProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveProfile = async (profile: TaskProfile) => {
    try {
      const response = await fetch('/api/compression/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      if (response.ok) {
        const updatedProfiles = profiles.map(p => 
          p.taskType === profile.taskType ? profile : p
        );
        setProfiles(updatedProfiles);
        setIsEditing(false);
        setSelectedProfile(null);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleEditProfile = (profile: TaskProfile) => {
    setSelectedProfile({ ...profile });
    setIsEditing(true);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Task Profiles Manager</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {profiles.map((profile) => (
          <div key={profile.taskType} className="p-4 border rounded hover:border-blue-500 cursor-pointer"
               onClick={() => handleEditProfile(profile)}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg capitalize">{profile.taskType}</h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {profile.algorithm}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-gray-600">Ratio</div>
                <div className="font-medium">{profile.targetRatio}x</div>
              </div>
              <div>
                <div className="text-gray-600">Latency</div>
                <div className="font-medium">{profile.maxLatency}ms</div>
              </div>
              <div>
                <div className="text-gray-600">Quality</div>
                <div className="font-medium">{(profile.minQuality * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isEditing && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Edit Profile: {selectedProfile.taskType}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Algorithm</label>
                <select
                  value={selectedProfile.algorithm}
                  onChange={(e) => setSelectedProfile({ ...selectedProfile, algorithm: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="semantic">Semantic</option>
                  <option value="statistical">Statistical</option>
                  <option value="lossless">Lossless</option>
                  <option value="adaptive">Adaptive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Target Ratio: {selectedProfile.targetRatio}x</label>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="0.5"
                  value={selectedProfile.targetRatio}
                  onChange={(e) => setSelectedProfile({ ...selectedProfile, targetRatio: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Max Latency: {selectedProfile.maxLatency}ms</label>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="10"
                  value={selectedProfile.maxLatency}
                  onChange={(e) => setSelectedProfile({ ...selectedProfile, maxLatency: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Min Quality: {(selectedProfile.minQuality * 100).toFixed(0)}%</label>
                <input
                  type="range"
                  min="0.7"
                  max="1.0"
                  step="0.05"
                  value={selectedProfile.minQuality}
                  onChange={(e) => setSelectedProfile({ ...selectedProfile, minQuality: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => handleSaveProfile(selectedProfile)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => { setIsEditing(false); setSelectedProfile(null); }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Made with Moe Abdelaziz
