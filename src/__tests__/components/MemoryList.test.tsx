import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MemoryList from '../../renderer/components/MemoryList';
import { ToastProvider } from '../../renderer/components/Toast';
import { Memory, MemoryType } from '../../shared/types';

// Mock the Toast provider
const MockedMemoryList = (props: any) => (
  <ToastProvider>
    <MemoryList {...props} />
  </ToastProvider>
);

describe('MemoryList', () => {
  const mockOnMemorySelect = jest.fn();
  const mockOnMemoryDelete = jest.fn();

  const sampleMemories: Memory[] = [
    {
      id: '1',
      title: 'React Hooks Guide',
      content: 'A comprehensive guide to React hooks including useState, useEffect, and custom hooks.',
      type: MemoryType.DOCUMENTATION,
      tags: ['react', 'hooks', 'frontend'],
      metadata: { source: 'documentation', project: 'frontend' },
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02')
    },
    {
      id: '2',
      title: 'Python Error Handling',
      content: 'try:\n    risky_operation()\nexcept Exception as e:\n    handle_error(e)',
      type: MemoryType.CODE_SNIPPET,
      tags: ['python', 'error-handling'],
      metadata: { source: 'vscode', language: 'python', url: 'https://example.com' },
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-03')
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no memories provided', () => {
    render(
      <MockedMemoryList
        memories={[]}
        onMemorySelect={mockOnMemorySelect}
        onMemoryDelete={mockOnMemoryDelete}
        selectedMemory={null}
      />
    );

    expect(screen.getByText('No memories found')).toBeInTheDocument();
    expect(screen.getByText('Start capturing your development knowledge')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create your first memory/i })).toBeInTheDocument();
  });

  it('renders memories list correctly', () => {
    render(
      <MockedMemoryList
        memories={sampleMemories}
        onMemorySelect={mockOnMemorySelect}
        onMemoryDelete={mockOnMemoryDelete}
        selectedMemory={null}
      />
    );

    expect(screen.getByText('Memories (2)')).toBeInTheDocument();
    expect(screen.getByText('React Hooks Guide')).toBeInTheDocument();
    expect(screen.getByText('Python Error Handling')).toBeInTheDocument();
    
    // Check that content is truncated and visible
    expect(screen.getByText(/A comprehensive guide to React hooks/)).toBeInTheDocument();
    expect(screen.getByText(/try:/)).toBeInTheDocument();
  });

  it('displays memory metadata correctly', () => {
    render(
      <MockedMemoryList
        memories={sampleMemories}
        onMemorySelect={mockOnMemorySelect}
        onMemoryDelete={mockOnMemoryDelete}
        selectedMemory={null}
      />
    );

    // Check dates are formatted
    expect(screen.getByText(/Jan 2, 2023/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 3, 2023/)).toBeInTheDocument();
    
    // Check source metadata
    expect(screen.getByText('documentation')).toBeInTheDocument();
    expect(screen.getByText('vscode')).toBeInTheDocument();
    
    // Check project metadata
    expect(screen.getByText('frontend')).toBeInTheDocument();
  });

  it('displays memory types as badges', () => {
    render(
      <MockedMemoryList
        memories={sampleMemories}
        onMemorySelect={mockOnMemorySelect}
        onMemoryDelete={mockOnMemoryDelete}
        selectedMemory={null}
      />
    );

    expect(screen.getByText('documentation')).toBeInTheDocument();
    expect(screen.getByText('code snippet')).toBeInTheDocument();
  });

  it('displays tags correctly', () => {
    render(
      <MockedMemoryList
        memories={sampleMemories}
        onMemorySelect={mockOnMemorySelect}
        onMemoryDelete={mockOnMemoryDelete}
        selectedMemory={null}
      />
    );

    // Check tags are rendered
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('hooks')).toBeInTheDocument();
    expect(screen.getByText('python')).toBeInTheDocument();
    expect(screen.getByText('error-handling')).toBeInTheDocument();
  });

  it('highlights selected memory', () => {
    render(
      <MockedMemoryList
        memories={sampleMemories}
        onMemorySelect={mockOnMemorySelect}
        onMemoryDelete={mockOnMemoryDelete}
        selectedMemory={sampleMemories[0]}
      />
    );

    const selectedMemoryCard = screen.getByText('React Hooks Guide').closest('.memory-card');
    expect(selectedMemoryCard).toHaveClass('selected');
  });

  it('calls onMemorySelect when memory is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MockedMemoryList
        memories={sampleMemories}
        onMemorySelect={mockOnMemorySelect}
        onMemoryDelete={mockOnMemoryDelete}
        selectedMemory={null}
      />
    );

    await user.click(screen.getByText('React Hooks Guide'));
    
    expect(mockOnMemorySelect).toHaveBeenCalledWith(sampleMemories[0]);
  });

  it('shows external link button when URL is provided', () => {
    render(
      <MockedMemoryList
        memories={sampleMemories}
        onMemorySelect={mockOnMemorySelect}
        onMemoryDelete={mockOnMemoryDelete}
        selectedMemory={null}
      />
    );

    // Only the Python memory has a URL
    const linkButtons = screen.getAllByTitle('Open external link');
    expect(linkButtons).toHaveLength(1);
  });

  it('shows delete button for all memories', () => {
    render(
      <MockedMemoryList
        memories={sampleMemories}
        onMemorySelect={mockOnMemorySelect}
        onMemoryDelete={mockOnMemoryDelete}
        selectedMemory={null}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete memory');
    expect(deleteButtons).toHaveLength(2);
  });

  it('shows confirmation dialog when delete is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MockedMemoryList
        memories={sampleMemories}
        onMemorySelect={mockOnMemorySelect}
        onMemoryDelete={mockOnMemoryDelete}
        selectedMemory={null}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete memory');
    await user.click(deleteButtons[0]);

    // Should show confirmation dialog
    expect(screen.getByText('Delete Memory')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete "React Hooks Guide"/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls onMemoryDelete when deletion is confirmed', async () => {
    const user = userEvent.setup();
    render(
      <MockedMemoryList
        memories={sampleMemories}
        onMemorySelect={mockOnMemorySelect}
        onMemoryDelete={mockOnMemoryDelete}
        selectedMemory={null}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete memory');
    await user.click(deleteButtons[0]);

    // Confirm deletion
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(mockOnMemoryDelete).toHaveBeenCalledWith('1');
  });

  it('does not call onMemoryDelete when deletion is cancelled', async () => {
    const user = userEvent.setup();
    render(
      <MockedMemoryList
        memories={sampleMemories}
        onMemorySelect={mockOnMemorySelect}
        onMemoryDelete={mockOnMemoryDelete}
        selectedMemory={null}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete memory');
    await user.click(deleteButtons[0]);

    // Cancel deletion
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockOnMemoryDelete).not.toHaveBeenCalled();
    expect(screen.queryByText('Delete Memory')).not.toBeInTheDocument();
  });

  it('prevents event propagation when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MockedMemoryList
        memories={sampleMemories}
        onMemorySelect={mockOnMemorySelect}
        onMemoryDelete={mockOnMemoryDelete}
        selectedMemory={null}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete memory');
    await user.click(deleteButtons[0]);

    // onMemorySelect should not be called when delete button is clicked
    expect(mockOnMemorySelect).not.toHaveBeenCalled();
  });

  it('prevents event propagation when external link button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MockedMemoryList
        memories={sampleMemories}
        onMemorySelect={mockOnMemorySelect}
        onMemoryDelete={mockOnMemoryDelete}
        selectedMemory={null}
      />
    );

    const linkButton = screen.getByTitle('Open external link');
    await user.click(linkButton);

    // onMemorySelect should not be called when link button is clicked
    expect(mockOnMemorySelect).not.toHaveBeenCalled();
  });

  it('calls onMemorySelect with empty object when "Create first memory" is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MockedMemoryList
        memories={[]}
        onMemorySelect={mockOnMemorySelect}
        onMemoryDelete={mockOnMemoryDelete}
        selectedMemory={null}
      />
    );

    await user.click(screen.getByRole('button', { name: /create your first memory/i }));
    
    expect(mockOnMemorySelect).toHaveBeenCalledWith({});
  });

  it('formats dates correctly', () => {
    const memoryWithOldDate = {
      ...sampleMemories[0],
      updatedAt: new Date('2020-06-15')
    };

    render(
      <MockedMemoryList
        memories={[memoryWithOldDate]}
        onMemorySelect={mockOnMemorySelect}
        onMemoryDelete={mockOnMemoryDelete}
        selectedMemory={null}
      />
    );

    expect(screen.getByText('Jun 15, 2020')).toBeInTheDocument();
  });

  it('truncates long content appropriately', () => {
    const memoryWithLongContent = {
      ...sampleMemories[0],
      content: 'A'.repeat(500) // Very long content
    };

    render(
      <MockedMemoryList
        memories={[memoryWithLongContent]}
        onMemorySelect={mockOnMemorySelect}
        onMemoryDelete={mockOnMemoryDelete}
        selectedMemory={null}
      />
    );

    // Should truncate content with CSS line-clamp
    const contentElement = screen.getByText(/A{100,}/);
    expect(contentElement).toBeInTheDocument();
  });
});