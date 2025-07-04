import '@testing-library/jest-dom';

// Mock Electron APIs
global.window = global.window || {};

const mockElectronAPI = {
  createMemory: jest.fn(),
  getMemory: jest.fn(),
  updateMemory: jest.fn(),
  deleteMemory: jest.fn(),
  searchMemories: jest.fn(),
  getMemoriesByType: jest.fn(),
  getMemoriesByTags: jest.fn(),
  getRecentMemories: jest.fn(),
  getAllMemories: jest.fn(),
  getMemoryCount: jest.fn(),
  getAllTags: jest.fn(),
  getAppConfig: jest.fn(),
  setAppConfig: jest.fn(),
  getAppVersion: jest.fn(),
  getVectorInfo: jest.fn(),
  onMenuNewMemory: jest.fn(),
  onMenuSearch: jest.fn(),
  onMenuSettings: jest.fn(),
  onMenuKnowledgeGraph: jest.fn(),
  onMenuMemoryList: jest.fn(),
  onMenuAbout: jest.fn(),
  removeAllListeners: jest.fn(),
};

(global as any).window.electronAPI = mockElectronAPI;

// Mock matchMedia for components that use it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock canvas for KnowledgeGraph tests
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arc: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: '',
  fillText: jest.fn(),
})) as any;

// Suppress console errors during tests unless needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});