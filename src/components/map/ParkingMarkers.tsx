import React from 'react';
import { Marker } from 'react-leaflet';
import { ParkingLot } from '../../types';
import { ParkingIcon } from './MapIcons';

interface ParkingMarkersProps {
  parkingLots: ParkingLot[];
  editingComponent: { type: 'car' | 'zone' | 'parking'; id: string; } | null;
  mode: 'addCar' | 'addZone' | 'addParking' | 'directions' | 'edit' | null;
  onParkingSelect: (parking: ParkingLot) => void;
  onComponentMove: (id: string, newPosition: { lat: number; lng: number }) => void;
}

const ParkingMarkers: React.FC<ParkingMarkersProps> = ({
  parkingLots,
  editingComponent,
  mode,
  onParkingSelect,
  onComponentMove
}) => {
  return (
    <>
      {parkingLots.map((lot) => (
        <Marker
          key={lot.id}
          position={[lot.position.lat, lot.position.lng]}
          icon={ParkingIcon}
          draggable={editingComponent?.type === 'parking' && editingComponent.id === lot.id}
          eventHandlers={{
            click: (e) => {
              e.originalEvent.stopPropagation();
              if (mode === 'edit') {
                onParkingSelect(lot);
              }
            },
            dragend: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();
              onComponentMove(lot.id, { lat: position.lat, lng: position.lng });
            }
          }}
        />
      ))}
    </>
  );
};

export default ParkingMarkers; 