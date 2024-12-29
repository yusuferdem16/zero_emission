import React from 'react';
import { Marker } from 'react-leaflet';
import { Car } from '../../types';
import { AllowedCarIcon, NotAllowedCarIcon, SelectedCarIcon } from './MapIcons';

interface CarMarkersProps {
  cars: Car[];
  selectedCar: Car | null;
  editingComponent: { type: 'car' | 'zone' | 'parking'; id: string; } | null;
  mode: 'addCar' | 'addZone' | 'addParking' | 'directions' | 'edit' | null;
  onCarSelect: (car: Car) => void;
  onComponentMove: (id: string, newPosition: { lat: number; lng: number }) => void;
}

const CarMarkers: React.FC<CarMarkersProps> = ({
  cars,
  selectedCar,
  editingComponent,
  mode,
  onCarSelect,
  onComponentMove
}) => {
  return (
    <>
      {cars.map((car) => (
        <Marker
          key={car.id}
          position={[car.position.lat, car.position.lng]}
          icon={selectedCar?.id === car.id ? SelectedCarIcon : 
                car.type === 'allowed' ? AllowedCarIcon : NotAllowedCarIcon}
          draggable={editingComponent?.type === 'car' && editingComponent.id === car.id}
          eventHandlers={{
            click: (e) => {
              e.originalEvent.stopPropagation();
              onCarSelect(car);
            },
            dragend: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();
              onComponentMove(car.id, { lat: position.lat, lng: position.lng });
            }
          }}
        />
      ))}
    </>
  );
};

export default CarMarkers; 