
document.addEventListener("DOMContentLoaded", () => {
  const mapElement = document.getElementById("listing-map");

  // Only run on an individual listing page with coordinates.
  if (!mapElement) return;

  const latitude = Number(mapElement.dataset.latitude);
  const longitude = Number(mapElement.dataset.longitude);
  const title = mapElement.dataset.title;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    console.error("Invalid listing coordinates.");
    return;
  }

  // Initialise the map.
  const map = L.map("listing-map").setView(
    [latitude, longitude],
    14
  );

  // Add OpenStreetMap tiles.
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Add a marker at the saved listing location.
  const marker = L.marker([latitude, longitude]).addTo(map);

  // Display the listing title safely in the popup.
  const popupContent = document.createElement("div");
  popupContent.textContent = title;

  marker.bindPopup(popupContent).openPopup();

  // Fix map sizing.
  setTimeout(() => {
    map.invalidateSize();
  }, 200);
});
