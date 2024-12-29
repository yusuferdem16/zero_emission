import React from 'react';

const Legend: React.FC = () => {
  return (
    <div className="legend" style={{
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 1000,
      boxShadow: '0 0 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{ marginBottom: '5px' }}><span style={{ color: 'green' }}>●</span> Allowed Cars</div>
      <div style={{ marginBottom: '5px' }}><span style={{ color: 'red' }}>●</span> Not Allowed Cars</div>
      <div style={{ marginBottom: '5px' }}><span style={{ color: 'blue' }}>●</span> Parking Lots</div>
      <div><span style={{ color: 'red', opacity: 0.5 }}>⬤</span> Restricted Zones</div>
    </div>
  );
};

export default Legend; 