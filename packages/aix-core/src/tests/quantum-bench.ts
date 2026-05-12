import { QuantumMemoryCache } from '../memory/QuantumMemoryCache';

/**
 * 📊 QUANTUM MEMORY BENCHMARK
 * Measures storage gains and latency for 4-bit quantization.
 */

async function runBenchmark() {
  console.log('📊 Starting Quantum Memory Benchmark...');

  // Simulate 1536-dimensional vector (standard OpenAI embedding size)
  const vectorLength = 1536;
  const originalVector = Array.from({ length: vectorLength }, () => Math.random());

  // Measure Original Size (approximate JSON)
  const originalSize = JSON.stringify(originalVector).length;
  console.log(`📏 Original Size (JSON): ~${originalSize} bytes`);

  const startTime = performance.now();
  
  // 1. Quantize
  const { packed, min, max } = QuantumMemoryCache.quantize(originalVector);
  
  const compressionTime = performance.now() - startTime;
  console.log(`⚡ Compression Time: ${compressionTime.toFixed(4)}ms`);
  console.log(`📦 Quantized Size (Binary): ${packed.length} bytes + overhead`);

  // 2. Dequantize
  const dequantStart = performance.now();
  const recovered = QuantumMemoryCache.dequantize(packed, min, max, vectorLength);
  const dequantTime = performance.now() - dequantStart;
  
  console.log(`⚡ Decompression Time: ${dequantTime.toFixed(4)}ms`);

  // 3. Gains
  const gain = (originalSize / packed.length).toFixed(2);
  console.log(`🚀 Space Savings: ~${gain}x`);

  // 4. Accuracy Check (MSE)
  let mse = 0;
  for (let i = 0; i < vectorLength; i++) {
    mse += Math.pow(originalVector[i] - recovered[i], 2);
  }
  mse /= vectorLength;
  console.log(`🎯 Accuracy Loss (MSE): ${mse.toFixed(6)}`);

  process.exit(0);
}

runBenchmark().catch(console.error);
