
document.addEventListener("DOMContentLoaded", () => {
  const mapElement = document.getElementById("map-picker");

  // Do nothing if this page does not contain the map.
  if (!mapElement) return;

  const locationInput = document.getElementById("location");
  const searchButton = document.getElementById("search-location");
  const resultsContainer = document.getElementById("location-results");
  const statusElement = document.getElementById("location-selection-status");

  const latitudeInput = document.getElementById("latitude");
  const longitudeInput = document.getElementById("longitude");

  const form = mapElement.closest("form");

  if (
    !locationInput ||
    !searchButton ||
    !resultsContainer ||
    !statusElement ||
    !latitudeInput ||
    !longitudeInput ||
    !form
  ) {
    console.error("Map picker: One or more required HTML elements are missing.");
    return;
  }

  // Read existing coordinates when editing a listing.
  const existingLat = Number(mapElement.dataset.latitude);
  const existingLng = Number(mapElement.dataset.longitude);

  const hasExistingCoordinates =
    mapElement.dataset.latitude !== "" &&
    mapElement.dataset.longitude !== "" &&
    Number.isFinite(existingLat) &&
    Number.isFinite(existingLng) &&
    existingLat >= -90 &&
    existingLat <= 90 &&
    existingLng >= -180 &&
    existingLng <= 180;

  // Default map position: India.
  const defaultPosition = [20.5937, 78.9629];

  const map = L.map("map-picker").setView(
    hasExistingCoordinates
      ? [existingLat, existingLng]
      : defaultPosition,
    hasExistingCoordinates ? 13 : 5
  );

  // OpenStreetMap tiles.
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  let marker = null;
  let selectedLocation = hasExistingCoordinates;

  // Create or move the draggable marker.
  function placeMarker(lat, lng) {
    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng], {
        draggable: true,
      }).addTo(map);

      marker.on("dragend", () => {
        const position = marker.getLatLng();

        latitudeInput.value = position.lat;
        longitudeInput.value = position.lng;

        selectedLocation = true;
        statusElement.textContent =
          "Marker position updated. Coordinates will be saved with your listing.";
      });
    }

    latitudeInput.value = lat;
    longitudeInput.value = lng;
    selectedLocation = true;
  }

  // Load the saved marker when editing an existing listing.
  if (hasExistingCoordinates) {
    placeMarker(existingLat, existingLng);

    statusElement.textContent =
      "Saved location loaded. You can search again or drag the marker.";
  } else {
    latitudeInput.value = "";
    longitudeInput.value = "";

    statusElement.textContent =
      "Please search and select a location.";
  }

  // Search for locations using our backend route.
  searchButton.addEventListener("click", async () => {
    const query = locationInput.value.trim();

    if (query.length < 3) {
      statusElement.textContent =
        "Please enter at least 3 characters to search.";
      return;
    }

    searchButton.disabled = true;
    searchButton.textContent = "Searching...";
    resultsContainer.replaceChildren();

    try {
      const response = await fetch(
        `/listings/search-location?q=${encodeURIComponent(query)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Location search failed.");
      }

      if (!Array.isArray(data) || data.length === 0) {
        statusElement.textContent =
          "No locations found. Try a different search.";
        return;
      }

      data.forEach((place) => {
        const resultButton = document.createElement("button");

        resultButton.type = "button";
        resultButton.className =
          "list-group-item list-group-item-action";

        // Use textContent to safely display external location names.
        resultButton.textContent = place.display_name;

        resultButton.addEventListener("click", () => {
          const lat = Number(place.latitude);
          const lng = Number(place.longitude);

          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
          ) {
            statusElement.textContent =
              "Invalid coordinates. Please select another result.";
            return;
          }

          placeMarker(lat, lng);

          map.setView([lat, lng], 15);

          statusElement.textContent =
            "Location selected! You can drag the marker to adjust its position.";

          resultsContainer.replaceChildren();
        });

        resultsContainer.appendChild(resultButton);
      });

      statusElement.textContent =
        "Select a location from the search results.";
    } catch (error) {
      console.error("Location search error:", error);

      statusElement.textContent =
        error.message || "Unable to search locations. Please try again.";
    } finally {
      searchButton.disabled = false;
      searchButton.textContent = "Search";
    }
  });

  // If the user changes the location text, require a fresh selection.
  locationInput.addEventListener("input", () => {
    selectedLocation = false;

    latitudeInput.value = "";
    longitudeInput.value = "";

    if (marker) {
      map.removeLayer(marker);
      marker = null;
    }

    resultsContainer.replaceChildren();

    statusElement.textContent =
      "Search and select the new location before submitting.";
  });

  // Prevent submitting a listing without a selected map location.
  form.addEventListener("submit", (event) => {
    if (
      !selectedLocation ||
      latitudeInput.value === "" ||
      longitudeInput.value === ""
    ) {
      event.preventDefault();

      statusElement.textContent =
        "Please search and select a location on the map first.";

      mapElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  });

  // Ensure Leaflet calculates the map dimensions correctly.
  setTimeout(() => {
    map.invalidateSize();
  }, 200);
});
