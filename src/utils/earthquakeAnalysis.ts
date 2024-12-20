import { GeoJSON, Position } from 'geojson';

function calculateDistance(point1: Position, point2: Position): number {
  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;
  
  // Convert to radians
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const lon1Rad = lon1 * Math.PI / 180;
  const lon2Rad = lon2 * Math.PI / 180;

  // Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
           Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function findNearestPointOnLine(point: Position, lineCoords: Position[]): number {
  let minDistance = Infinity;
  
  for (let i = 0; i < lineCoords.length - 1; i++) {
    const start = lineCoords[i];
    const end = lineCoords[i + 1];
    const distance = calculateDistance(point, start);
    minDistance = Math.min(minDistance, distance);
  }
  
  return minDistance;
}

export type DistanceStats = {
  distance: number;
  count: number;
  percentage: number;
};

export function findEarthquakesNearPlates(
  earthquakes: GeoJSON,
  tectonicPlates: GeoJSON
): DistanceStats[] {
  const features = earthquakes.features || [];
  const plateFeatures = tectonicPlates.features || [];
  const distances = [10, 50, 100, 200, 400, 600, 1000];
  const stats: DistanceStats[] = [];
  const totalEarthquakes = features.length;
  
  // Initialize counts for each distance threshold
  const distanceCounts = new Map<number, number>();
  distances.forEach(d => distanceCounts.set(d, 0));
  
  features.forEach(quake => {
    if (quake.geometry.type === 'Point') {
      const quakeCoords = quake.geometry.coordinates as Position;
      let minDistance = Infinity;
      
      // Find minimum distance to any plate boundary
      plateFeatures.forEach(plate => {
        if (plate.geometry.type === 'LineString') {
          const lineCoords = plate.geometry.coordinates as Position[];
          const distance = findNearestPointOnLine(quakeCoords, lineCoords);
          minDistance = Math.min(minDistance, distance);
        }
      });
      
      // Count earthquakes for each distance threshold
      distances.forEach(threshold => {
        if (minDistance <= threshold) {
          distanceCounts.set(threshold, distanceCounts.get(threshold)! + 1);
        }
      });
    }
  });
  
  // Convert counts to stats array
  distances.forEach(distance => {
    const count = distanceCounts.get(distance)!;
    stats.push({
      distance,
      count,
      percentage: (count / totalEarthquakes) * 100
    });
  });
  
  // Log the results
  console.log('Statistics par distance:');
  stats.forEach(stat => {
    console.log(`≤ ${stat.distance}km: ${stat.count} séismes (${stat.percentage.toFixed(1)}%)`);
  });
  
  return stats;
}