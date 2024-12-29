import React from 'react';
import { useMapEvents } from 'react-leaflet';

interface MapEventsProps {
  mode: 'addCar' | 'addZone' | 'addParking' | 'directions' | 'edit' | null;
  onMapClick: (lat: number, lng: number) => void;
}

const MapEvents: React.FC<MapEventsProps> = ({ mode, onMapClick }) => {
  useMapEvents({
    click: (e) => {
      if (mode && mode !== 'edit') {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return null;
};

export default MapEvents; 