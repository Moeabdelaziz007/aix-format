/**
 * ⚛️ QUANTUM MEMORY CACHE (v1.0 - R&D)
 * Implements 4-bit Scalar Quantization for LTM Embeddings.
 * 
 * Made with Moe Abdelaziz
 */

export class QuantumMemoryCache {
  /**
   * 📉 Quantize: Converts Float32Array to 4-bit packed Buffer.
   */
  static quantize(vector: number[]): { packed: Buffer; min: number; max: number } {
    const min = Math.min(...vector);
    const max = Math.max(...vector);
    const range = max - min;
    const levels = 15; // 2^4 - 1

    const quantized = vector.map(v => {
      const normalized = (v - min) / (range || 1);
      return Math.round(normalized * levels);
    });

    // Pack two 4-bit values into one byte
    const packed = Buffer.alloc(Math.ceil(quantized.length / 2));
    for (let i = 0; i < quantized.length; i += 2) {
      const high = quantized[i] << 4;
      const low = (quantized[i + 1] || 0) & 0x0F;
      packed[i / 2] = high | low;
    }

    return { packed, min, max };
  }

  /**
   * 📈 Dequantize: Recovers approximate Float32Array.
   */
  static dequantize(packed: Buffer, min: number, max: number, length: number): number[] {
    const range = max - min;
    const levels = 15;
    const vector: number[] = [];

    for (let i = 0; i < packed.length; i++) {
      const high = (packed[i] >> 4) & 0x0F;
      const low = packed[i] & 0x0F;
      
      vector.push(min + (high / levels) * range);
      if (vector.length < length) {
        vector.push(min + (low / levels) * range);
      }
    }

    return vector;
  }
}

// Made with Moe Abdelaziz
