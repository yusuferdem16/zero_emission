import { useState } from 'react';
import { Container, Drawer, List, ListItem, ListItemText, Popover, Box } from '@mui/material';
import Map from './components/Map';
import { Car, Zone, CircleZone, PolygonZone, ParkingLot, LatLng } from './types';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [mode, setMode] = useState<'addCar' | 'addZone' | 'addParking' | 'directions' | 'edit' | null>(null);
  const [carType, setCarType] = useState<'allowed' | 'notAllowed'>('allowed');
  const [zoneType, setZoneType] = useState<'circle' | 'polygon'>('circle');
  const [carAnchorEl, setCarAnchorEl] = useState<HTMLElement | null>(null);
  const [zoneAnchorEl, setZoneAnchorEl] = useState<HTMLElement | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [drawingPoints, setDrawingPoints] = useState<{ lat: number; lng: number }[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [editingComponent, setEditingComponent] = useState<{
    type: 'car' | 'zone' | 'parking';
    id: string;
  } | null>(null);

  const handleCarButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    setCarAnchorEl(event.currentTarget);
    setZoneAnchorEl(null);
    setMode(null);
    setEditingComponent(null);
  };

  const handleZoneButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    setZoneAnchorEl(event.currentTarget);
    setCarAnchorEl(null);
    setMode(null);
    setEditingComponent(null);
  };

  const handleParkingButtonClick = () => {
    setMode('addParking');
    setCarAnchorEl(null);
    setZoneAnchorEl(null);
    setEditingComponent(null);
  };

  const handleEditButtonClick = () => {
    if (mode === 'edit') {
      setMode(null);
      setEditingComponent(null);
    } else {
      setMode('edit');
    }
    setCarAnchorEl(null);
    setZoneAnchorEl(null);
  };

  const handleCarTypeSelect = (newType: 'allowed' | 'notAllowed') => {
    setCarType(newType);
    setMode('addCar');
    setCarAnchorEl(null);
  };

  const handleZoneTypeSelect = (type: 'circle' | 'polygon') => {
    setZoneType(type);
    setMode('addZone');
    setZoneAnchorEl(null);
    setDrawingPoints([]);
  };

  const handlePopoverClose = () => {
    setCarAnchorEl(null);
    setZoneAnchorEl(null);
  };

  const handleCarSelect = (car: Car) => {
    if (mode === 'edit') {
      setEditingComponent({ type: 'car', id: car.id });
    } else {
      setSelectedCar(car);
      setMode(null);
    }
  };

  const handleZoneSelect = (zone: Zone) => {
    if (mode === 'edit') {
      setEditingComponent({ type: 'zone', id: zone.id });
    }
  };

  const handleParkingSelect = (parking: ParkingLot) => {
    if (mode === 'edit') {
      setEditingComponent({ type: 'parking', id: parking.id });
    }
  };

  const handleComponentMove = (id: string, newPosition: { lat: number; lng: number }) => {
    if (!editingComponent) return;

    if (editingComponent.type === 'car') {
      setCars(cars.map(car => 
        car.id === id ? { ...car, position: newPosition } : car
      ));
    } else if (editingComponent.type === 'parking') {
      setParkingLots(parkingLots.map(lot =>
        lot.id === id ? { ...lot, position: newPosition } : lot
      ));
    }
  };

  const handleGetDirections = () => {
    if (selectedCar) {
      setMode('directions');
      setEditingComponent(null);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (mode === 'addCar') {
      const newCar: Car = {
        id: uuidv4(),
        position: { lat, lng },
        type: carType
      };
      setCars([...cars, newCar]);
      setMode(null);
    } else if (mode === 'addZone') {
      if (zoneType === 'circle') {
        const newZone: CircleZone = {
          id: uuidv4(),
          shape: 'circle',
          center: { lat, lng },
          radius: 500
        };
        setZones([...zones, newZone]);
        setMode(null);
      } else {
        const newPoints = [...drawingPoints, { lat, lng }];
        setDrawingPoints(newPoints);
        
        if (newPoints.length >= 3) {
          const newZone: PolygonZone = {
            id: uuidv4(),
            shape: 'polygon',
            points: newPoints
          };
          setZones([...zones, newZone]);
          setDrawingPoints([]);
          setMode(null);
        }
      }
    } else if (mode === 'addParking') {
      const newParkingLot: ParkingLot = {
        id: uuidv4(),
        position: { lat, lng },
        name: `Parking ${parkingLots.length + 1}`
      };
      setParkingLots([...parkingLots, newParkingLot]);
      setMode(null);
    } else if (mode === 'directions') {
      console.log('Getting directions from', selectedCar?.position, 'to', { lat, lng });
      setMode(null);
    }
  };

  const handleZoneEdit = (id: string, updates: Partial<Zone>) => {
    setZones(zones.map(zone => {
      if (zone.id === id) {
        if (zone.shape === 'circle' && 'center' in updates) {
          return { ...zone, ...updates } as CircleZone;
        } else if (zone.shape === 'polygon' && 'points' in updates) {
          return { ...zone, ...updates } as PolygonZone;
        }
      }
      return zone;
    }));
  };

  const handleZoneRotate = (id: string, angle: number) => {
    setZones(zones.map(zone => {
      if (zone.id === id && zone.shape === 'circle') {
        return { ...zone, angle } as CircleZone;
      }
      return zone;
    }));
  };

  const handleZoneResize = (id: string, radius: number) => {
    setZones(zones.map(zone => {
      if (zone.id === id && zone.shape === 'circle') {
        return { ...zone, radius } as CircleZone;
      }
      return zone;
    }));
  };

  const handleZoneAddVertex = (id: string, point: LatLng) => {
    setZones(zones.map(zone => {
      if (zone.id === id && zone.shape === 'polygon') {
        return {
          ...zone,
          points: [...zone.points, point]
        } as PolygonZone;
      }
      return zone;
    }));
  };

  const handleZoneRemoveVertex = (id: string, index: number) => {
    setZones(zones.map(zone => {
      if (zone.id === id && zone.shape === 'polygon') {
        const newPoints = [...zone.points];
        newPoints.splice(index, 1);
        return {
          ...zone,
          points: newPoints
        } as PolygonZone;
      }
      return zone;
    }));
  };

  return (
    <Container maxWidth={false} disableGutters sx={{ height: '100vh', display: 'flex' }}>
      {/* Control Buttons */}
      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        gap: '10px',
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)'
      }}>
        <button 
          onClick={handleCarButtonClick}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: mode === 'addCar' ? '#1565c0' : '#1976d2',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Add Car
        </button>
        <button 
          onClick={handleZoneButtonClick}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: mode === 'addZone' ? '#1565c0' : '#1976d2',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Add Zone
        </button>
        <button 
          onClick={handleParkingButtonClick}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: mode === 'addParking' ? '#1565c0' : '#1976d2',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Add Parking Lot
        </button>
        <button 
          onClick={handleGetDirections}
          disabled={!selectedCar}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: !selectedCar ? '#ccc' : mode === 'directions' ? '#1565c0' : '#1976d2',
            color: 'white',
            cursor: selectedCar ? 'pointer' : 'not-allowed',
            opacity: selectedCar ? 1 : 0.7
          }}
        >
          Get Directions
        </button>
        <button 
          onClick={handleEditButtonClick}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: mode === 'edit' ? '#1565c0' : '#1976d2',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          {mode === 'edit' ? 'Exit Edit' : 'Edit'}
        </button>
      </div>

      {/* Car Type Selection Popover */}
      <Popover
        open={Boolean(carAnchorEl)}
        anchorEl={carAnchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <button
            onClick={() => handleCarTypeSelect('allowed')}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#4caf50',
              color: 'white',
              cursor: 'pointer',
              width: '150px'
            }}
          >
            Allowed Car
          </button>
          <button
            onClick={() => handleCarTypeSelect('notAllowed')}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#f44336',
              color: 'white',
              cursor: 'pointer',
              width: '150px'
            }}
          >
            Not Allowed Car
          </button>
        </Box>
      </Popover>

      {/* Zone Type Selection Popover */}
      <Popover
        open={Boolean(zoneAnchorEl)}
        anchorEl={zoneAnchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <button
            onClick={() => handleZoneTypeSelect('circle')}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#ff9800',
              color: 'white',
              cursor: 'pointer',
              width: '150px'
            }}
          >
            Circle Zone
          </button>
          <button
            onClick={() => handleZoneTypeSelect('polygon')}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#ff9800',
              color: 'white',
              cursor: 'pointer',
              width: '150px'
            }}
          >
            Polygon Zone
          </button>
        </Box>
      </Popover>

      <Map 
        mode={mode} 
        onMapClick={handleMapClick} 
        cars={cars}
        zones={zones}
        parkingLots={parkingLots}
        drawingPoints={drawingPoints}
        zoneType={zoneType}
        selectedCar={selectedCar}
        onCarSelect={handleCarSelect}
        onZoneSelect={handleZoneSelect}
        onParkingSelect={handleParkingSelect}
        editingComponent={editingComponent}
        onComponentMove={handleComponentMove}
        onZoneEdit={handleZoneEdit}
        onZoneRotate={handleZoneRotate}
        onZoneResize={handleZoneResize}
        onZoneAddVertex={handleZoneAddVertex}
        onZoneRemoveVertex={handleZoneRemoveVertex}
      />
    </Container>
  );
}

export default App;
