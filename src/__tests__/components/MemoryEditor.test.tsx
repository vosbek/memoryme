import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MemoryEditor from '../../renderer/components/MemoryEditor';
import { ToastProvider } from '../../renderer/components/Toast';
import { Memory, MemoryType } from '../../shared/types';

// Mock the Toast provider
const MockedMemoryEditor = ({ onSave, onCancel, memory }: any) => (
  <ToastProvider>
    <MemoryEditor onSave={onSave} onCancel={onCancel} memory={memory} />
  </ToastProvider>
);

describe('MemoryEditor', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly for new memory', () => {
    render(<MockedMemoryEditor onSave={mockOnSave} onCancel={mockOnCancel} memory={null} />);
    
    expect(screen.getByText('New Memory')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders correctly for editing existing memory', () => {
    const memory: Memory = {
      id: '1',
      title: 'Test Memory',
      content: 'Test content',
      type: MemoryType.CODE_SNIPPET,
      tags: ['test', 'javascript'],
      metadata: { source: 'test' },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    render(<MockedMemoryEditor onSave={mockOnSave} onCancel={mockOnCancel} memory={memory} />);
    
    expect(screen.getByText('Edit Memory')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Memory')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test content')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test, javascript')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<MockedMemoryEditor onSave={mockOnSave} onCancel={mockOnCancel} memory={null} />);
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    
    // Try to save without filling required fields
    await user.click(saveButton);
    
    // Should show validation errors
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Content is required')).toBeInTheDocument();
    
    // onSave should not be called
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('validates title length', async () => {
    const user = userEvent.setup();
    render(<MockedMemoryEditor onSave={mockOnSave} onCancel={mockOnCancel} memory={null} />);
    
    const titleInput = screen.getByLabelText(/title/i);
    const longTitle = 'a'.repeat(201); // Exceeds 200 character limit
    
    await user.type(titleInput, longTitle);
    
    await waitFor(() => {
      expect(screen.getByText('Title must be less than 200 characters')).toBeInTheDocument();
    });
  });

  it('validates URL format', async () => {
    const user = userEvent.setup();
    render(<MockedMemoryEditor onSave={mockOnSave} onCancel={mockOnCancel} memory={null} />);
    
    const urlInput = screen.getByLabelText(/url\/link/i);
    
    await user.type(urlInput, 'invalid-url');
    
    await waitFor(() => {
      expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
    });
  });

  it('adds and removes tags correctly', async () => {
    const user = userEvent.setup();
    render(<MockedMemoryEditor onSave={mockOnSave} onCancel={mockOnCancel} memory={null} />);
    
    const tagInput = screen.getByPlaceholderText('Add a tag...');
    const addTagButton = screen.getByRole('button', { name: '' }); // Plus icon button
    
    // Add a tag
    await user.type(tagInput, 'newtag');
    await user.click(addTagButton);
    
    expect(screen.getByText('newtag')).toBeInTheDocument();
    expect(tagInput).toHaveValue('');
    
    // Remove the tag
    const removeTagButton = screen.getByRole('button', { name: '' }); // X icon in tag
    await user.click(removeTagButton);
    
    expect(screen.queryByText('newtag')).not.toBeInTheDocument();
  });

  it('prevents duplicate tags', async () => {
    const user = userEvent.setup();
    render(<MockedMemoryEditor onSave={mockOnSave} onCancel={mockOnCancel} memory={null} />);
    
    const tagInput = screen.getByPlaceholderText('Add a tag...');
    const addTagButton = screen.getByRole('button', { name: '' }); // Plus icon button
    
    // Add a tag twice
    await user.type(tagInput, 'duplicate');
    await user.click(addTagButton);
    await user.type(tagInput, 'duplicate');
    await user.click(addTagButton);
    
    // Should only appear once
    const duplicateTags = screen.getAllByText('duplicate');
    expect(duplicateTags).toHaveLength(1);
  });

  it('calls onSave with correct data for new memory', async () => {
    const user = userEvent.setup();
    render(<MockedMemoryEditor onSave={mockOnSave} onCancel={mockOnCancel} memory={null} />);
    
    // Fill in the form
    await user.type(screen.getByLabelText(/title/i), 'New Test Memory');
    await user.type(screen.getByLabelText(/content/i), 'Test content here');
    await user.selectOptions(screen.getByLabelText(/type/i), MemoryType.DOCUMENTATION);
    await user.type(screen.getByPlaceholderText('Add a tag...'), 'testtag');
    await user.click(screen.getByRole('button', { name: '' })); // Add tag button
    await user.type(screen.getByLabelText(/source/i), 'test-source');
    await user.type(screen.getByLabelText(/project/i), 'test-project');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Test Memory',
          content: 'Test content here',
          type: MemoryType.DOCUMENTATION,
          tags: ['testtag'],
          metadata: expect.objectContaining({
            source: 'test-source',
            project: 'test-project'
          })
        })
      );
    });
  });

  it('calls onSave with correct data for existing memory', async () => {
    const user = userEvent.setup();
    const existingMemory: Memory = {
      id: '1',
      title: 'Existing Memory',
      content: 'Existing content',
      type: MemoryType.NOTE,
      tags: ['existing'],
      metadata: { source: 'existing' },
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    };

    render(<MockedMemoryEditor onSave={mockOnSave} onCancel={mockOnCancel} memory={existingMemory} />);
    
    // Modify the title
    const titleInput = screen.getByDisplayValue('Existing Memory');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Memory');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          title: 'Updated Memory',
          content: 'Existing content',
          createdAt: existingMemory.createdAt,
          updatedAt: expect.any(Date)
        })
      );
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<MockedMemoryEditor onSave={mockOnSave} onCancel={mockOnCancel} memory={null} />);
    
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('disables save button when form is invalid', async () => {
    render(<MockedMemoryEditor onSave={mockOnSave} onCancel={mockOnCancel} memory={null} />);
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    
    // Should be disabled initially (no title or content)
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when form is valid', async () => {
    const user = userEvent.setup();
    render(<MockedMemoryEditor onSave={mockOnSave} onCancel={mockOnCancel} memory={null} />);
    
    // Fill in required fields
    await user.type(screen.getByLabelText(/title/i), 'Valid Title');
    await user.type(screen.getByLabelText(/content/i), 'Valid content');
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });

  it('shows loading state during save', async () => {
    const user = userEvent.setup();
    const slowSave = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<MockedMemoryEditor onSave={slowSave} onCancel={mockOnCancel} memory={null} />);
    
    // Fill in required fields
    await user.type(screen.getByLabelText(/title/i), 'Test Title');
    await user.type(screen.getByLabelText(/content/i), 'Test content');
    
    // Click save
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Should show loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    
    // Wait for save to complete
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });
});