/**
 * Requirements Validation Rules
 * Validates hardware, network, and VLA adapter requirements
 */

export const requirementsRules = [
  {
    name: 'requirements.hardware.cpu_cores',
    test: (data) => {
      const cores = data.requirements?.hardware?.cpu_cores;
      return cores === undefined || (Number.isInteger(cores) && cores >= 1);
    },
    message: 'CPU cores must be a positive integer',
    section: 'requirements.hardware',
    field: 'cpu_cores'
  },
  
  {
    name: 'requirements.hardware.memory_mb',
    test: (data) => {
      const mem = data.requirements?.hardware?.memory_mb;
      return mem === undefined || (Number.isInteger(mem) && mem >= 1);
    },
    message: 'Memory MB must be a positive integer',
    section: 'requirements.hardware',
    field: 'memory_mb'
  },
  
  {
    name: 'requirements.hardware.storage_mb',
    test: (data) => {
      const storage = data.requirements?.hardware?.storage_mb;
      return storage === undefined || (Number.isInteger(storage) && storage >= 1);
    },
    message: 'Storage MB must be a positive integer',
    section: 'requirements.hardware',
    field: 'storage_mb'
  },
  
  {
    name: 'requirements.hardware.gpu_memory_mb',
    test: (data) => {
      const gpu = data.requirements?.hardware?.gpu_memory_mb;
      return gpu === undefined || (Number.isInteger(gpu) && gpu >= 1);
    },
    message: 'GPU memory MB must be a positive integer',
    section: 'requirements.hardware',
    field: 'gpu_memory_mb'
  },
  
  {
    name: 'requirements.network.bandwidth_mbps',
    test: (data) => {
      const bw = data.requirements?.network?.bandwidth_mbps;
      return bw === undefined || (typeof bw === 'number' && bw >= 0);
    },
    message: 'Bandwidth must be a non-negative number',
    section: 'requirements.network',
    field: 'bandwidth_mbps'
  },
  
  {
    name: 'requirements.vla.adapter.required',
    test: (data) => {
      const vla = data.requirements?.vla;
      return !vla || !!vla.adapter;
    },
    message: "Required field 'requirements.vla.adapter' is missing",
    section: 'requirements.vla',
    field: 'adapter'
  },
  
  {
    name: 'requirements.vla.adapter.valid',
    test: (data) => {
      const adapter = data.requirements?.vla?.adapter;
      if (!adapter) return true;
      const allowed = ['openpi', 'π0.7', 'generic'];
      return allowed.includes(adapter);
    },
    message: (data) => {
      const allowed = ['openpi', 'π0.7', 'generic'];
      return `Adapter must be one of: ${allowed.join(', ')}`;
    },
    section: 'requirements.vla',
    field: 'adapter'
  }
];

// Made with Moe Abdelaziz
