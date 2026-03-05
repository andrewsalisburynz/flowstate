import React, { useState, useEffect } from 'react';
import './EditCardModal.css';

interface Card {
  id: string;
  title: string;
  description: string;
  storyPoints?: number;
  priority?: 'low' | 'medium' | 'high';
  acceptanceCriteria?: string[];
  column: string;
  position: number;
  aiGenerated?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CardUpdatePayload {
  title: string;
  description: string;
  storyPoints: number;
  priority: 'low' | 'medium' | 'high';
  acceptanceCriteria: string[];
}

interface ValidationErrors {
  title?: string;
  storyPoints?: string;
  priority?: string;
}

interface EditCardModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardId: string, updates: CardUpdatePayload) => Promise<void>;
}

const EditCardModal: React.FC<EditCardModalProps> = ({ card, isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [storyPoints, setStoryPoints] = useState<number | undefined>(undefined);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | undefined>(undefined);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Initialize form state when modal opens
  useEffect(() => {
    if (isOpen && card) {
      setTitle(card.title);
      setDescription(card.description);
      setStoryPoints(card.storyPoints);
      setPriority(card.priority);
      setAcceptanceCriteria(card.acceptanceCriteria?.join('\n') || '');
      setIsSaving(false);
      setError(null);
      setErrors({});
    }
  }, [isOpen, card]);

  // Validate form fields
  const validateForm = (): boolean => {
    const validationErrors: ValidationErrors = {};

    // Validate title
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      validationErrors.title = 'Title is required';
    } else if (title.length > 60) {
      validationErrors.title = 'Title must be 60 characters or less';
    }

    // Validate story points
    if (!storyPoints) {
      validationErrors.storyPoints = 'Story points must be selected';
    }

    // Validate priority
    if (!priority) {
      validationErrors.priority = 'Priority must be selected';
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!card) return;

    // Validate
    if (!validateForm()) {
      return;
    }

    // Clear errors
    setErrors({});
    setError(null);
    setIsSaving(true);

    try {
      // Prepare payload
      const payload: CardUpdatePayload = {
        title: title.trim(),
        description: description.trim(),
        storyPoints: storyPoints!,
        priority: priority!,
        acceptanceCriteria: acceptanceCriteria
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
      };

      // Call onSave prop
      await onSave(card.id, payload);

      // Success - close modal
      onClose();
    } catch (err: any) {
      // Display error
      setError(err.message || 'Failed to save card');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (!isSaving) {
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSaving) {
      handleCancel();
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isSaving) {
      handleCancel();
    }
  };

  // Don't render if not open or no card
  if (!isOpen || !card) {
    return null;
  }

  return (
    <div 
      className="modal-backdrop" 
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      data-testid="edit-card-modal"
    >
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Card</h2>
        </div>

        {error && (
          <div className="api-error" role="alert">
            {error}
          </div>
        )}

        <div className="modal-body">
          {/* Title Field */}
          <div className="form-field">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              placeholder="Enter card title"
              disabled={isSaving}
              data-testid="edit-card-title-input"
            />
            <div className="char-counter" style={{ color: title.length > 60 ? '#d32f2f' : '#666' }}>
              {title.length}/60
            </div>
            {errors.title && (
              <div className="error-message" role="alert">{errors.title}</div>
            )}
          </div>

          {/* Description Field */}
          <div className="form-field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Enter card description"
              disabled={isSaving}
              data-testid="edit-card-description-textarea"
            />
          </div>

          {/* Story Points Field */}
          <div className="form-field">
            <label htmlFor="storyPoints">Story Points *</label>
            <select
              id="storyPoints"
              value={storyPoints || ''}
              onChange={(e) => setStoryPoints(e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={isSaving}
              data-testid="edit-card-storypoints-select"
            >
              <option value="">Select story points</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="8">8</option>
              <option value="13">13</option>
            </select>
            {errors.storyPoints && (
              <div className="error-message" role="alert">{errors.storyPoints}</div>
            )}
          </div>

          {/* Priority Field */}
          <div className="form-field">
            <label htmlFor="priority">Priority *</label>
            <select
              id="priority"
              value={priority || ''}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high' | undefined)}
              disabled={isSaving}
              data-testid="edit-card-priority-select"
            >
              <option value="">Select priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            {errors.priority && (
              <div className="error-message" role="alert">{errors.priority}</div>
            )}
          </div>

          {/* Acceptance Criteria Field */}
          <div className="form-field">
            <label htmlFor="acceptanceCriteria">Acceptance Criteria</label>
            <textarea
              id="acceptanceCriteria"
              value={acceptanceCriteria}
              onChange={(e) => setAcceptanceCriteria(e.target.value)}
              rows={6}
              placeholder="Enter acceptance criteria (one per line)"
              disabled={isSaving}
              data-testid="edit-card-acceptancecriteria-textarea"
            />
            <div className="field-hint">Enter one criterion per line</div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="btn-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn-save"
            data-testid="edit-card-save-button"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCardModal;
