import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../renderer/App';
import { Memory, MemoryType } from '../../shared/types';

// Mock electron APIs with more comprehensive implementations
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

// Wrapped App component for testing
const TestApp = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

describe('App Integration Tests', () => {
  const sampleMemories: Memory[] = [
    {
      id: '1',
      title: 'React Testing Guide',
      content: 'Comprehensive guide to testing React components with Jest and Testing Library',
      type: MemoryType.DOCUMENTATION,
      tags: ['react', 'testing', 'jest'],
      metadata: { source: 'documentation', project: 'frontend' },
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02')
    },
    {
      id: '2',
      title: 'SQL Query Optimization',
      content: 'SELECT * FROM users WHERE active = 1 ORDER BY created_at DESC',
      type: MemoryType.CODE_SNIPPET,
      tags: ['sql', 'database', 'optimization'],
      metadata: { source: 'vscode', language: 'sql' },
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-03')
    }
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockElectronAPI.getRecentMemories.mockResolvedValue(sampleMemories);
    mockElectronAPI.searchMemories.mockResolvedValue(sampleMemories);
    mockElectronAPI.createMemory.mockImplementation((memory) => 
      Promise.resolve({
        ...memory,
        id: 'new-id',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    );
    mockElectronAPI.updateMemory.mockImplementation((id, updates) => 
      Promise.resolve({
        ...sampleMemories.find(m => m.id === id),
        ...updates,
        updatedAt: new Date()
      })
    );
    mockElectronAPI.deleteMemory.mockResolvedValue(true);
    mockElectronAPI.getVectorInfo.mockResolvedValue({
      count: 2,
      name: 'devmemory',
      healthy: true
    });

    // Expose mocked API
    (global as any).window.electronAPI = mockElectronAPI;
  });

  it('loads and displays memories on startup', async () => {
    render(<TestApp />);

    // Should show loading initially
    expect(screen.getByText('Loading DevMemory...')).toBeInTheDocument();

    // Wait for memories to load
    await waitFor(() => {
      expect(screen.getByText('React Testing Guide')).toBeInTheDocument();
    });

    expect(screen.getByText('SQL Query Optimization')).toBeInTheDocument();
    expect(mockElectronAPI.getRecentMemories).toHaveBeenCalledWith(50);
  });

  it('handles memory creation workflow', async () => {
    const user = userEvent.setup();
    render(<TestApp />);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByText('React Testing Guide')).toBeInTheDocument();
    });

    // Click new memory button
    const newMemoryButton = screen.getByText('New Memory');
    await user.click(newMemoryButton);

    // Should show memory editor
    expect(screen.getByText('New Memory')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();

    // Fill out the form
    await user.type(screen.getByLabelText(/title/i), 'Integration Test Memory');
    await user.type(screen.getByLabelText(/content/i), 'This is a test memory created during integration testing');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /save/i }));

    // Should call createMemory API
    await waitFor(() => {
      expect(mockElectronAPI.createMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Integration Test Memory',
          content: 'This is a test memory created during integration testing'
        })
      );
    });
  });

  it('handles memory editing workflow', async () => {
    const user = userEvent.setup();
    render(<TestApp />);

    // Wait for memories to load
    await waitFor(() => {
      expect(screen.getByText('React Testing Guide')).toBeInTheDocument();
    });

    // Click on a memory to select and edit it
    await user.click(screen.getByText('React Testing Guide'));

    // Should show memory editor with existing data
    await waitFor(() => {
      expect(screen.getByText('Edit Memory')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('React Testing Guide')).toBeInTheDocument();

    // Modify the title
    const titleInput = screen.getByDisplayValue('React Testing Guide');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated React Testing Guide');

    // Save changes
    await user.click(screen.getByRole('button', { name: /save/i }));

    // Should call updateMemory API
    await waitFor(() => {
      expect(mockElectronAPI.updateMemory).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          title: 'Updated React Testing Guide'
        })
      );
    });
  });

  it('handles memory deletion workflow', async () => {
    const user = userEvent.setup();
    render(<TestApp />);

    // Wait for memories to load
    await waitFor(() => {
      expect(screen.getByText('React Testing Guide')).toBeInTheDocument();
    });

    // Click delete button on a memory
    const deleteButtons = screen.getAllByTitle('Delete memory');
    await user.click(deleteButtons[0]);

    // Should show confirmation dialog
    expect(screen.getByText('Delete Memory')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete "React Testing Guide"/)).toBeInTheDocument();

    // Confirm deletion
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    // Should call deleteMemory API
    await waitFor(() => {
      expect(mockElectronAPI.deleteMemory).toHaveBeenCalledWith('1');
    });
  });

  it('handles search functionality', async () => {
    const user = userEvent.setup();
    render(<TestApp />);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByText('React Testing Guide')).toBeInTheDocument();
    });

    // Click search button
    const searchButton = screen.getByText('Search');
    await user.click(searchButton);

    // Should show search view
    expect(screen.getByPlaceholderText(/search your memories/i)).toBeInTheDocument();

    // Enter search query
    const searchInput = screen.getByPlaceholderText(/search your memories/i);
    await user.type(searchInput, 'React testing');

    // Submit search
    await user.click(screen.getByRole('button', { name: /search/i }));

    // Should call search API
    await waitFor(() => {
      expect(mockElectronAPI.searchMemories).toHaveBeenCalledWith('React testing', 50);
    });
  });

  it('handles settings view', async () => {
    const user = userEvent.setup();
    render(<TestApp />);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByText('React Testing Guide')).toBeInTheDocument();
    });

    // Click settings button
    const settingsButton = screen.getByText('Settings');
    await user.click(settingsButton);

    // Should show settings view
    expect(screen.getByText('Application Settings')).toBeInTheDocument();
  });

  it('handles knowledge graph view', async () => {
    const user = userEvent.setup();
    render(<TestApp />);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByText('React Testing Guide')).toBeInTheDocument();
    });

    // Simulate menu knowledge graph event
    const menuHandler = mockElectronAPI.onMenuKnowledgeGraph.mock.calls[0][0];
    menuHandler();

    // Should show knowledge graph
    await waitFor(() => {
      expect(screen.getByText('Knowledge Graph')).toBeInTheDocument();
    });
  });

  it('handles error scenarios gracefully', async () => {
    // Mock API failures
    mockElectronAPI.getRecentMemories.mockRejectedValue(new Error('Database connection failed'));
    
    render(<TestApp />);

    // Should show loading initially
    expect(screen.getByText('Loading DevMemory...')).toBeInTheDocument();

    // Should handle error and stop loading
    await waitFor(() => {
      expect(screen.queryByText('Loading DevMemory...')).not.toBeInTheDocument();
    });

    // Should show error toast notification
    await waitFor(() => {
      expect(screen.getByText('Failed to load memories')).toBeInTheDocument();
    });
  });

  it('handles empty state correctly', async () => {
    // Mock empty memory list
    mockElectronAPI.getRecentMemories.mockResolvedValue([]);
    
    render(<TestApp />);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.queryByText('Loading DevMemory...')).not.toBeInTheDocument();
    });

    // Should show empty state
    expect(screen.getByText('No memories found')).toBeInTheDocument();
    expect(screen.getByText('Start capturing your development knowledge')).toBeInTheDocument();
  });

  it('maintains state consistency across operations', async () => {
    const user = userEvent.setup();
    
    // Start with one memory
    mockElectronAPI.getRecentMemories.mockResolvedValue([sampleMemories[0]]);
    
    render(<TestApp />);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByText('React Testing Guide')).toBeInTheDocument();
    });

    // Create a new memory
    await user.click(screen.getByText('New Memory'));
    await user.type(screen.getByLabelText(/title/i), 'State Consistency Test');
    await user.type(screen.getByLabelText(/content/i), 'Testing state consistency');
    await user.click(screen.getByRole('button', { name: /save/i }));

    // Memory should be added to the list
    await waitFor(() => {
      expect(screen.getByText('State Consistency Test')).toBeInTheDocument();
    });

    // Both memories should be visible
    expect(screen.getByText('React Testing Guide')).toBeInTheDocument();
    expect(screen.getByText('State Consistency Test')).toBeInTheDocument();
  });

  it('handles concurrent operations correctly', async () => {
    const user = userEvent.setup();
    render(<TestApp />);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByText('React Testing Guide')).toBeInTheDocument();
    });

    // Simulate multiple rapid operations
    const promises = [
      user.click(screen.getByText('Search')),
      user.click(screen.getByText('Settings')),
      user.click(screen.getByText('New Memory'))
    ];

    await Promise.all(promises);

    // App should handle concurrent navigation gracefully
    // The last operation (New Memory) should be active
    await waitFor(() => {
      expect(screen.getByText('New Memory')).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = render(<TestApp />);
    
    // Verify event listeners were set up
    expect(mockElectronAPI.onMenuNewMemory).toHaveBeenCalled();
    expect(mockElectronAPI.onMenuSearch).toHaveBeenCalled();
    expect(mockElectronAPI.onMenuSettings).toHaveBeenCalled();

    // Unmount component
    unmount();

    // Verify cleanup was called
    expect(mockElectronAPI.removeAllListeners).toHaveBeenCalledWith('menu-new-memory');
    expect(mockElectronAPI.removeAllListeners).toHaveBeenCalledWith('menu-search');
    expect(mockElectronAPI.removeAllListeners).toHaveBeenCalledWith('menu-settings');
    expect(mockElectronAPI.removeAllListeners).toHaveBeenCalledWith('menu-knowledge-graph');
    expect(mockElectronAPI.removeAllListeners).toHaveBeenCalledWith('menu-memory-list');
    expect(mockElectronAPI.removeAllListeners).toHaveBeenCalledWith('menu-about');
  });
});