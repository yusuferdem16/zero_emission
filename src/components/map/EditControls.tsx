import React from 'react';

interface EditControlsProps {
  type: 'circle' | 'polygon';
  onAddVertex?: () => void;
  onRemoveVertex?: () => void;
  onRotate?: () => void;
}

const EditControls: React.FC<EditControlsProps> = ({ type, onAddVertex, onRemoveVertex, onRotate }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '60px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 1000,
      display: 'flex',
      gap: '8px',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)'
    }}>
      {type === 'polygon' && (
        <>
          <button
            onClick={onAddVertex}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#4caf50',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Add Vertex
          </button>
          <button
            onClick={onRemoveVertex}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#f44336',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Remove Vertex
          </button>
        </>
      )}
      <button
        onClick={onRotate}
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          border: 'none',
          backgroundColor: '#ff9800',
          color: 'white',
          cursor: 'pointer'
        }}
      >
        Rotate
      </button>
    </div>
  );
};

export default EditControls; 