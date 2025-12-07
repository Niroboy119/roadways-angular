import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

@Component({
  selector: 'app-home',
  imports: [FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private map!: L.Map;
  private routeLayer?: L.Polyline;
  private startMarker?: L.Marker;
  private endMarker?: L.Marker;

  // City coordinates for Sri Lankan cities
  private cityCoordinates: { [key: string]: [number, number] } = {
    'Colombo': [6.9271, 79.8612],
    'Kandy': [7.2906, 80.6337],
    'Galle': [6.0535, 80.2210],
    'Jaffna': [9.6615, 80.0255],
    'Negombo': [7.2008, 79.8737],
    'Anuradhapura': [8.3114, 80.4037],
    'Trincomalee': [8.5874, 81.2152],
    'Batticaloa': [7.7310, 81.6747],
    'Matara': [5.9549, 80.5550],
    'Kurunegala': [7.4863, 80.3647],
    'Ratnapura': [6.6828, 80.3992],
    'Badulla': [6.9934, 81.0550],
    'Nuwara Eliya': [6.9497, 80.7891],
    'Polonnaruwa': [7.9403, 81.0188],
    'Dambulla': [7.8675, 80.6517],
    'Hikkaduwa': [6.1395, 80.1063],
    'Mirissa': [5.9485, 80.4718],
    'Ella': [6.8667, 81.0466],
    'Sigiriya': [7.9570, 80.7603],
    'Hambantota': [6.1429, 81.1212],
    'Chilaw': [7.5758, 79.7953],
    'Kalmunai': [7.4167, 81.8167],
    'Vavuniya': [8.7514, 80.4971],
    'Mannar': [8.9810, 79.9044],
    'Ampara': [7.2975, 81.6820]
  };

  cities: string[] = Object.keys(this.cityCoordinates);

  startLocation = '';
  endLocation = '';
  isLoading = false;

  constructor(private cdr: ChangeDetectorRef) {}

  // Custom icons for markers
  private startIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  private endIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  ngOnInit() {
    this.initMap();
  }

  private initMap() {
    // Center on Sri Lanka
    this.map = L.map('map').setView([7.8731, 80.7718], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);
  }

  findRoute() {
    if (!this.startLocation || !this.endLocation) {
      alert('Please select both start and end locations');
      return;
    }

    if (this.startLocation === this.endLocation) {
      alert('Start and end locations must be different');
      return;
    }

    // Clear previous route and markers
    this.clearRoute();

    const startCoords = this.cityCoordinates[this.startLocation];
    const endCoords = this.cityCoordinates[this.endLocation];

    // Add markers for start and end locations
    this.startMarker = L.marker(startCoords, { icon: this.startIcon })
      .addTo(this.map)
      .bindPopup(`<b>Start:</b> ${this.startLocation}`)
      .openPopup();

    this.endMarker = L.marker(endCoords, { icon: this.endIcon })
      .addTo(this.map)
      .bindPopup(`<b>End:</b> ${this.endLocation}`);

    // Fetch route from OSRM
    this.fetchRoute(startCoords, endCoords);
  }

  private async fetchRoute(start: [number, number], end: [number, number]) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    this.isLoading = true;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const routeCoordinates = data.routes[0].geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as L.LatLngTuple
        );

        // Draw the route on the map
        this.routeLayer = L.polyline(routeCoordinates, {
          color: '#3388ff',
          weight: 5,
          opacity: 0.8
        }).addTo(this.map);

        // Fit map to show entire route
        const bounds = L.latLngBounds([start, end]);
        this.map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        alert('Could not find a route between the selected locations');
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      alert('Error fetching route. Please try again.');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private clearRoute() {
    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
      this.routeLayer = undefined;
    }
    if (this.startMarker) {
      this.map.removeLayer(this.startMarker);
      this.startMarker = undefined;
    }
    if (this.endMarker) {
      this.map.removeLayer(this.endMarker);
      this.endMarker = undefined;
    }
  }
}
