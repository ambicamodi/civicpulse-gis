import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMapEvents,
  useMap
} from "react-leaflet";

import { useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import mockIssues from "./data/mockIssues";

function getMarkerColor(priority) {
  if (priority >= 80) return "red";
  if (priority >= 60) return "orange";
  return "green";
}

function createIcon(priority) {
  const color = getMarkerColor(priority);

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
}

/* Detects manual clicks on the map */
function LocationPicker({ onSelect, selecting }) {
  useMapEvents({
    click: (e) => {
      if (!selecting) return;

      onSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    }
  });

  return null;
}

/* Moves the map to a selected/current location */
function MapController({ location }) {
  const map = useMap();

  if (location) {
    map.setView([location.lat, location.lng], 15);
  }

  return null;
}

/* Browser current-location button */
function CurrentLocationButton({ onLocationFound }) {
  const handleLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        onLocationFound(location);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          alert("Location permission was denied.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          alert("Your location is currently unavailable.");
        } else if (error.code === error.TIMEOUT) {
          alert("Location request timed out.");
        } else {
          alert("Unable to get your current location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <button
      type="button"
      className="current-location-button"
      onClick={handleLocation}
    >
      ◎ Use My Location
    </button>
  );
}

/* Reset map to default view */
function ResetMapButton() {
  const map = useMap();

  const handleReset = () => {
    map.setView([19.0760, 72.8777], 13);
  };

  return (
    <button
      type="button"
      className="reset-map-button"
      onClick={handleReset}
    >
      ↺ Reset Map
    </button>
  );
}

/* Finds the 3 geographically closest issues */
function getNearbyIssues(location, issues) {
  if (!location) return [];

  return issues
    .map((issue) => {
      const latDiff = issue.latitude - location.lat;
      const lngDiff = issue.longitude - location.lng;

      const distance = Math.sqrt(
        latDiff * latDiff + lngDiff * lngDiff
      );

      return {
        ...issue,
        distance
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);
}

function MapView() {
  const mapCenter = [19.0760, 72.8777];

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectingLocation, setSelectingLocation] = useState(false);

  const filteredIssues = mockIssues.filter((issue) => {
    const categoryMatch =
      categoryFilter === "All" ||
      issue.category === categoryFilter;

    const priorityMatch =
      priorityFilter === "All" ||
      (priorityFilter === "High" && issue.priority >= 80) ||
      (priorityFilter === "Medium" &&
        issue.priority >= 60 &&
        issue.priority < 80) ||
      (priorityFilter === "Low" && issue.priority < 60);

    const statusMatch =
      statusFilter === "All" ||
      issue.status === statusFilter;

    return categoryMatch && priorityMatch && statusMatch;
  });

  const nearbyIssues = getNearbyIssues(
    selectedLocation,
    mockIssues
  );

  const totalIssues = mockIssues.length;

  const highPriorityCount = mockIssues.filter(
    (issue) => issue.priority >= 80
  ).length;

  const pendingCount = mockIssues.filter(
    (issue) => issue.status === "PENDING"
  ).length;

  return (
    <div className="gis-layout">

      {/* SIDEBAR */}
      <aside className="gis-sidebar">
        <h2 className="sidebar-title">Filters</h2>

        <div className="filter-group">
          <label>Category</label>

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value)
            }
          >
            <option value="All">All Categories</option>
            <option value="Pothole">Pothole</option>
            <option value="Garbage">Garbage</option>
            <option value="Streetlight">Streetlight</option>
            <option value="Drainage">Drainage</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Priority</label>

          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value)
            }
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status</label>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="All">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        <button
          type="button"
          className="reset-button"
          onClick={() => {
            setCategoryFilter("All");
            setPriorityFilter("All");
            setStatusFilter("All");
          }}
        >
          Reset Filters
        </button>

        <div className="sidebar-divider" />

        <div className="legend">
          <h3>Map Legend</h3>

          <div className="legend-item">
            <span className="legend-dot high"></span>
            High Priority
          </div>

          <div className="legend-item">
            <span className="legend-dot medium"></span>
            Medium Priority
          </div>

          <div className="legend-item">
            <span className="legend-dot low"></span>
            Low Priority
          </div>

          <div className="legend-item">
            📍 Selected Location
          </div>

          <div className="legend-item">
            🔥 Issue Hotspot
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="gis-main">

        {/* STATS */}
        <div className="stats-row">
          <div className="stat-card">
            <span>Total Issues</span>
            <strong>{totalIssues}</strong>
          </div>

          <div className="stat-card">
            <span>High Priority</span>
            <strong>{highPriorityCount}</strong>
          </div>

          <div className="stat-card">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>

          <div className="stat-card">
            <span>Showing</span>
            <strong>{filteredIssues.length}</strong>
          </div>
        </div>

        {/* LOCATION BAR */}
        <div className="location-bar">
          <div>
            <strong>📍 Location Selection</strong>

            <p>
              {selectingLocation
                ? "Click anywhere on the map to select a location."
                : selectedLocation
                ? `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`
                : "Select a location to view nearby civic issues."}
            </p>
          </div>

          <div className="location-actions">
            <button
              type="button"
              className="location-button"
              onClick={() =>
                setSelectingLocation(!selectingLocation)
              }
            >
              {selectingLocation
                ? "Click on Map"
                : "📍 Select Location"}
            </button>

            <CurrentLocationButton
              onLocationFound={(location) => {
                setSelectedLocation(location);
                setSelectingLocation(false);
              }}
            />
          </div>
        </div>

        {/* MAP */}
        <div className="map-wrapper">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{
              height: "560px",
              width: "100%"
            }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Automatically center map when location changes */}
            <MapController location={selectedLocation} />

            {/* Reset map */}
            <ResetMapButton />

            {/* Manual location selection */}
            <LocationPicker
              selecting={selectingLocation}
              onSelect={(location) => {
                setSelectedLocation(location);
                setSelectingLocation(false);
              }}
            />

            {/* HOTSPOT */}
            <Circle
              center={[19.0768, 72.8781]}
              radius={220}
              pathOptions={{
                color: "#dc2626",
                fillColor: "#ef4444",
                fillOpacity: 0.18,
                weight: 3
              }}
            >
              <Popup>
                <div className="hotspot-popup">
                  <div className="hotspot-title">
                    🔥 Issue Hotspot
                  </div>

                  <p>
                    Multiple civic issues are concentrated
                    in this area.
                  </p>

                  <div className="hotspot-stats">
                    <div>
                      <strong>5</strong>
                      <span>Total Reports</span>
                    </div>

                    <div>
                      <strong>3</strong>
                      <span>High Priority</span>
                    </div>

                    <div>
                      <strong>2</strong>
                      <span>Departments</span>
                    </div>
                  </div>

                  <div className="hotspot-note">
                    High issue concentration detected
                  </div>
                </div>
              </Popup>
            </Circle>

            {/* ISSUE MARKERS */}
            {filteredIssues.map((issue) => (
              <Marker
                key={issue.id}
                position={[
                  issue.latitude,
                  issue.longitude
                ]}
                icon={createIcon(issue.priority)}
              >
                <Popup>
                  <div className="issue-popup">
                    <div className="popup-header">
                      <div>
                        <span className="popup-id">
                          {issue.id}
                        </span>

                        <h3>{issue.category}</h3>
                      </div>

                      <span
                        className={`popup-priority ${
                          issue.priority >= 80
                            ? "high-badge"
                            : issue.priority >= 60
                            ? "medium-badge"
                            : "low-badge"
                        }`}
                      >
                        {issue.priority >= 80
                          ? "HIGH"
                          : issue.priority >= 60
                          ? "MEDIUM"
                          : "LOW"}
                      </span>
                    </div>

                    <p className="popup-description">
                      {issue.description}
                    </p>

                    <div className="popup-details">
                      <div>
                        <span>Status</span>
                        <strong>{issue.status}</strong>
                      </div>

                      <div>
                        <span>Department</span>
                        <strong>{issue.department}</strong>
                      </div>

                      <div>
                        <span>Priority Score</span>
                        <strong>{issue.priority}</strong>
                      </div>

                      <div>
                        <span>Citizen Reports</span>
                        <strong>
                          {issue.reports_count}
                        </strong>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* SELECTED / CURRENT LOCATION */}
            {selectedLocation && (
              <Marker
                position={[
                  selectedLocation.lat,
                  selectedLocation.lng
                ]}
              >
                <Popup>
                  <strong>📍 Selected Location</strong>
                  <br />
                  Latitude:{" "}
                  {selectedLocation.lat.toFixed(6)}
                  <br />
                  Longitude:{" "}
                  {selectedLocation.lng.toFixed(6)}
                </Popup>
              </Marker>
            )}
          </MapContainer>

          <div className="map-badge">
            Showing {filteredIssues.length} issues
          </div>
        </div>

        {/* BOTTOM PANELS */}
        <div className="bottom-grid">

          {/* SELECTED LOCATION */}
          <div className="info-card">
            <h3>Selected Location</h3>

            {selectedLocation ? (
              <>
                <div className="coordinate">
                  {selectedLocation.lat.toFixed(6)}
                </div>

                <div className="coordinate">
                  {selectedLocation.lng.toFixed(6)}
                </div>

                <span className="success-badge">
                  ✓ Location selected
                </span>
              </>
            ) : (
              <p className="muted">
                Select a location or use your current
                location to begin.
              </p>
            )}
          </div>

          {/* NEARBY ISSUES */}
          <div className="info-card">
            <div className="card-heading">
              <h3>Nearby Issues</h3>

              {selectedLocation && (
                <span>
                  {nearbyIssues.length} found
                </span>
              )}
            </div>

            {!selectedLocation ? (
              <p className="muted">
                Select a location to see nearby issues.
              </p>
            ) : nearbyIssues.length === 0 ? (
              <p className="muted">
                No nearby issues found.
              </p>
            ) : (
              <div className="nearby-list">
                {nearbyIssues.map((issue) => (
                  <div
                    className="nearby-item"
                    key={issue.id}
                  >
                    <div>
                      <strong>{issue.id}</strong>
                      <p>{issue.category}</p>
                    </div>

                    <div className="nearby-right">
                      <span
                        className={`priority-badge ${
                          issue.priority >= 80
                            ? "high-badge"
                            : issue.priority >= 60
                            ? "medium-badge"
                            : "low-badge"
                        }`}
                      >
                        {issue.priority >= 80
                          ? "HIGH"
                          : issue.priority >= 60
                          ? "MEDIUM"
                          : "LOW"}
                      </span>

                      <span className="status-text">
                        {issue.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default MapView;