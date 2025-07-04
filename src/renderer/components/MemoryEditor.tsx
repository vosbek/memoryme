import React, { useState, useEffect } from 'react';
import { Memory, MemoryType, MemoryMetadata } from '../../shared/types';
import { Save, X, Plus, Tag, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from './Toast';

interface MemoryEditorProps {
  memory: Memory | null;
  onSave: (memory: Memory) => void;
  onCancel: () => void;
}

const MemoryEditor: React.FC<MemoryEditorProps> = ({
  memory,
  onSave,
  onCancel,
}) => {
  const { showError } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: MemoryType.NOTE,
    tags: [] as string[],
    metadata: {
      source: '',
      project: '',
      url: '',
    } as MemoryMetadata,
  });
  const [newTag, setNewTag] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (memory) {
      setFormData({
        title: memory.title || '',
        content: memory.content || '',
        type: memory.type || MemoryType.NOTE,
        tags: Array.isArray(memory.tags) ? [...memory.tags] : [],
        metadata: memory.metadata ? { ...memory.metadata } : {},
      });
    } else {
      setFormData({
        title: '',
        content: '',
        type: MemoryType.NOTE,
        tags: [],
        metadata: {
          source: '',
          project: '',
          url: '',
        },
      });
    }
  }, [memory]);

  const validateInput = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length > 200) {
      errors.title = 'Title must be less than 200 characters';
    }
    
    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    } else if (formData.content.trim().length > 100000) {
      errors.content = 'Content must be less than 100,000 characters';
    }
    
    if (formData.metadata.url && formData.metadata.url.trim()) {
      try {
        new URL(formData.metadata.url.trim());
      } catch {
        errors.url = 'Invalid URL format';
      }
    }
    
    return errors;
  };

  // Real-time validation
  useEffect(() => {
    const errors = validateInput();
    setValidationErrors(errors);
  }, [formData]);

  const handleSave = async () => {
    const errors = validateInput();
    if (Object.keys(errors).length > 0) {
      showError('Validation Error', 'Please fix the errors below before saving.');
      return;
    }

    setIsLoading(true);
    try {
      const memoryToSave: any = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        type: formData.type,
        tags: formData.tags || [],
        metadata: {
          ...formData.metadata,
          source: formData.metadata.source?.trim() || undefined,
          project: formData.metadata.project?.trim() || undefined,
          url: formData.metadata.url?.trim() || undefined,
        },
      };

      // Only add id, createdAt, updatedAt for existing memories
      if (memory?.id) {
        memoryToSave.id = memory.id;
        memoryToSave.createdAt = memory.createdAt;
        memoryToSave.updatedAt = new Date();
      }

      await onSave(memoryToSave);
    } catch (error) {
      console.error('Failed to save memory:', error);
      showError('Save Failed', 'Unable to save the memory. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === document.activeElement) {
      e.preventDefault();
      if (e.target === e.currentTarget) {
        handleAddTag();
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {memory ? 'Edit Memory' : 'New Memory'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="btn-secondary"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || Object.keys(validationErrors).length > 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-1" />
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`input-field ${validationErrors.title ? 'border-red-500 focus:border-red-500' : ''}`}
              placeholder="Enter a descriptive title..."
              autoFocus
            />
            {validationErrors.title && (
              <div className="flex items-center mt-1 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                {validationErrors.title}
              </div>
            )}
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as MemoryType }))}
              className="select-field"
            >
              <option value={MemoryType.NOTE}>Note</option>
              <option value={MemoryType.CODE_SNIPPET}>Code Snippet</option>
              <option value={MemoryType.DOCUMENTATION}>Documentation</option>
              <option value={MemoryType.MEETING_NOTES}>Meeting Notes</option>
              <option value={MemoryType.DECISION}>Decision</option>
              <option value={MemoryType.API_CALL}>API Call</option>
              <option value={MemoryType.DEBUG_SESSION}>Debug Session</option>
              <option value={MemoryType.PROJECT_CONTEXT}>Project Context</option>
              <option value={MemoryType.KUBERNETES_RESOURCE}>Kubernetes Resource</option>
              <option value={MemoryType.COMMAND}>Command</option>
              <option value={MemoryType.LINK}>Link</option>
            </select>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Content *
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className={`textarea-field h-64 ${validationErrors.content ? 'border-red-500 focus:border-red-500' : ''}`}
              placeholder="Enter your memory content..."
            />
            {validationErrors.content && (
              <div className="flex items-center mt-1 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                {validationErrors.content}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(formData.tags || []).map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  <Tag className="w-3 h-3" />
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="input-field flex-1"
                placeholder="Add a tag..."
              />
              <button
                onClick={handleAddTag}
                className="btn-secondary"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              <input
                type="text"
                id="source"
                value={formData.metadata.source || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, source: e.target.value }
                }))}
                className="input-field"
                placeholder="e.g., VSCode, Terminal, Browser"
              />
            </div>

            <div>
              <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
                Project
              </label>
              <input
                type="text"
                id="project"
                value={formData.metadata.project || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, project: e.target.value }
                }))}
                className="input-field"
                placeholder="Project name"
              />
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                URL/Link
              </label>
              <input
                type="url"
                id="url"
                value={formData.metadata.url || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, url: e.target.value }
                }))}
                className={`input-field ${validationErrors.url ? 'border-red-500 focus:border-red-500' : ''}`}
                placeholder="https://..."
              />
              {validationErrors.url && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.url}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryEditor;