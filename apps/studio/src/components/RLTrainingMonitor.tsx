'use client';

import { useState } from 'react';

export function RLTrainingMonitor() {
  const [training, setTraining] = useState<any>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [episodes, setEpisodes] = useState(100);

  const startTraining = async () => {
    setIsTraining(true);
    try {
      const response = await fetch('/api/rl/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodes, taskType: 'general' })
      });
      const data = await response.json();
      if (data.success) {
        setTraining(data.training);
      }
    } catch (error) {
      console.error('Training failed:', error);
    } finally {
      setIsTraining(false);
    }
  };

  const evaluatePolicy = async () => {
    try {
      const response = await fetch('/api/rl/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCases: 50, taskType: 'general' })
      });
      const data = await response.json();
      if (data.success) {
        alert(`Performance Grade: ${data.performance.grade}\n${data.performance.recommendation}`);
      }
    } catch (error) {
      console.error('Evaluation failed:', error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">RL Training Monitor</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Training Episodes</label>
        <input
          type="number"
          value={episodes}
          onChange={(e) => setEpisodes(parseInt(e.target.value))}
          className="w-full p-2 border rounded"
          min="10"
          max="1000"
        />
      </div>

      {training && (
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <div className="text-sm text-gray-600">Total Episodes</div>
              <div className="text-2xl font-bold">{training.episodes.length}</div>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <div className="text-sm text-gray-600">Avg Reward</div>
              <div className="text-2xl font-bold">{training.averageReward.toFixed(3)}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded">
              <div className="text-sm text-gray-600">Convergence</div>
              <div className="text-2xl font-bold">
                {training.convergenceEpisode !== -1 ? `Ep ${training.convergenceEpisode}` : 'N/A'}
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Recent Episodes</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {training.episodes.slice(-10).reverse().map((ep: any, idx: number) => (
                <div key={idx} className="text-sm flex justify-between">
                  <span>Episode {ep.episode}</span>
                  <span>Reward: {ep.reward.toFixed(3)}</span>
                  <span>ε: {ep.epsilon.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={startTraining}
          disabled={isTraining}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isTraining ? 'Training...' : 'Start Training'}
        </button>
        <button
          onClick={evaluatePolicy}
          disabled={!training}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          Evaluate Policy
        </button>
      </div>
    </div>
  );
}

// Made with Moe Abdelaziz
