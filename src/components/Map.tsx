import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Car, Zone, ParkingLot, LatLng } from '../types';
import { 
  isPointInZone, 
  findNearestParkingLot, 
  findBestParkingLot,
  routeIntersectsAnyZone 
} from '../utils/geometry';
import Legend from './map/Legend';
import EditControls from './map/EditControls';
import MapEvents from './map/MapEvents';
import CarMarkers from './map/CarMarkers';
import ParkingMarkers from './map/ParkingMarkers';
import ZoneMarkers from './map/ZoneMarkers';
import RouteLayer from './map/RouteLayer';

const PARIS_CENTER = { lat: 48.8566, lng: 2.3522 };
const DEFAULT_ZOOM = 12;

interface MapProps {
  mode?: 'addCar' | 'addZone' | 'addParking' | 'directions' | 'edit' | null;
  onMapClick?: (lat: number, lng: number) => void;
  cars?: Car[];
  zones?: Zone[];
  parkingLots?: ParkingLot[];
  drawingPoints?: { lat: number; lng: number }[];
  zoneType?: 'circle' | 'polygon';
  selectedCar?: Car | null;
  onCarSelect?: (car: Car) => void;
  onZoneSelect?: (zone: Zone) => void;
  onParkingSelect?: (parking: ParkingLot) => void;
  editingComponent?: {
    type: 'car' | 'zone' | 'parking';
    id: string;
  } | null;
  onComponentMove?: (id: string, newPosition: { lat: number; lng: number }) => void;
  onZoneEdit?: (id: string, updates: Partial<Zone>) => void;
  onZoneRotate?: (id: string, angle: number) => void;
  onZoneResize?: (id: string, radius: number) => void;
  onZoneAddVertex?: (id: string, point: { lat: number; lng: number }) => void;
  onZoneRemoveVertex?: (id: string, index: number) => void;
}

interface RouteState {
  destination: LatLng;
  alternateDestination?: LatLng;
  isRestrictedZone: boolean;
}

const Map: React.FC<MapProps> = ({ 
  mode = null, 
  onMapClick = () => {}, 
  cars = [], 
  zones = [],
  parkingLots = [],
  drawingPoints = [],
  zoneType = 'circle',
  selectedCar = null,
  onCarSelect = () => {},
  onZoneSelect = () => {},
  onParkingSelect = () => {},
  editingComponent = null,
  onComponentMove = () => {},
  onZoneEdit = () => {},
  onZoneRotate = () => {},
  onZoneResize = () => {},
  onZoneAddVertex = () => {},
  onZoneRemoveVertex = () => {}
}) => {
  const [addingVertex, setAddingVertex] = useState(false);
  const [removingVertex, setRemovingVertex] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [route, setRoute] = useState<RouteState | null>(null);

  // Clear route when mode changes or selected car changes
  useEffect(() => {
    if (mode !== 'directions' || !selectedCar) {
      setRoute(null);
    }
  }, [mode, selectedCar]);

  const handleAddVertex = () => {
    setAddingVertex(true);
    setRemovingVertex(false);
    setRotating(false);
  };

  const handleRemoveVertex = () => {
    setAddingVertex(false);
    setRemovingVertex(true);
    setRotating(false);
  };

  const handleRotate = () => {
    setAddingVertex(false);
    setRemovingVertex(false);
    setRotating(true);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (mode === 'directions' && selectedCar) {
      const clickedPoint = { lat, lng };
      const isRestricted = zones.some(zone => isPointInZone(clickedPoint, zone));
      const routeIntersectsZones = routeIntersectsAnyZone(selectedCar.position, clickedPoint, zones);

      if (selectedCar.type === 'notAllowed' && (isRestricted || routeIntersectsZones)) {
        const bestParking = findBestParkingLot(selectedCar.position, clickedPoint, parkingLots, zones);
        if (bestParking) {
          setRoute({
            destination: clickedPoint,
            alternateDestination: bestParking.position,
            isRestrictedZone: true
          });
        } else {
          setRoute({
            destination: clickedPoint,
            isRestrictedZone: true
          });
        }
      } else {
        setRoute({
          destination: clickedPoint,
          isRestrictedZone: false
        });
      }
    } else {
      onMapClick(lat, lng);
    }
  };

  return (
    <div className="map-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={[PARIS_CENTER.lat, PARIS_CENTER.lng]}
        zoom={DEFAULT_ZOOM}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents mode={mode} onMapClick={handleMapClick} />
        
        <CarMarkers
          cars={cars}
          selectedCar={selectedCar}
          editingComponent={editingComponent}
          mode={mode}
          onCarSelect={onCarSelect}
          onComponentMove={onComponentMove}
        />

        <ParkingMarkers
          parkingLots={parkingLots}
          editingComponent={editingComponent}
          mode={mode}
          onParkingSelect={onParkingSelect}
          onComponentMove={onComponentMove}
        />

        <ZoneMarkers
          zones={zones}
          editingComponent={editingComponent}
          mode={mode}
          onZoneSelect={onZoneSelect}
          onZoneEdit={onZoneEdit}
          onZoneResize={onZoneResize}
          onZoneAddVertex={onZoneAddVertex}
          onZoneRemoveVertex={onZoneRemoveVertex}
          addingVertex={addingVertex}
          removingVertex={removingVertex}
          rotating={rotating}
        />

        {selectedCar && route && (
          <RouteLayer
            start={selectedCar.position}
            end={route.destination}
            alternateEnd={route.alternateDestination}
            isRestrictedZone={route.isRestrictedZone}
          />
        )}

        {/* Show drawing points for polygon */}
        {mode === 'addZone' && zoneType === 'polygon' && drawingPoints.length > 0 && (
          <>
            <Polygon
              positions={drawingPoints.map(p => [p.lat, p.lng])}
              pathOptions={{
                color: 'red',
                fillColor: 'red',
                fillOpacity: 0.2,
                dashArray: '5, 10'
              }}
            />
            {drawingPoints.map((point, index) => (
              <Circle
                key={index}
                center={[point.lat, point.lng]}
                radius={2}
                pathOptions={{
                  color: 'red',
                  fillColor: 'red',
                  fillOpacity: 1
                }}
              />
            ))}
          </>
        )}
        
        <Legend />
      </MapContainer>
      
      {mode === 'edit' && editingComponent?.type === 'zone' && (
        <EditControls
          type={zones.find(z => z.id === editingComponent.id)?.shape || 'circle'}
          onAddVertex={handleAddVertex}
          onRemoveVertex={handleRemoveVertex}
          onRotate={handleRotate}
        />
      )}
      
      {mode && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000,
          boxShadow: '0 0 10px rgba(0,0,0,0.1)'
        }}>
          {mode === 'addCar' ? (
            'Click on the map to add a car'
          ) : mode === 'addParking' ? (
            'Click on the map to add a parking lot'
          ) : mode === 'directions' ? (
            'Click on the map to select your destination'
          ) : mode === 'edit' ? (
            addingVertex ? 'Click on the polygon to add a vertex' :
            removingVertex ? 'Click on a vertex to remove it' :
            rotating ? 'Click and drag to rotate the zone' :
            'Click on any component to edit it'
          ) : (
            zoneType === 'circle' ? 
              'Click on the map to add a circle zone' :
              `Click on the map to add points for the polygon zone (minimum 3 points needed)`
          )}
        </div>
      )}
    </div>
  );
};

export default Map; 