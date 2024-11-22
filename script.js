mapboxgl.accessToken = 'pk.eyJ1IjoiZ2F1cmF2bmciLCJhIjoiY20xdGx3ODhuMDNzNTJ0cHI2YWphY2p1ZCJ9.DCncOYgA91GXOkejz0CilQ';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [77.216721, 28.644800], // Default to Delhi coordinates
    zoom: 10
});

function searchLocation() {
    const searchInput = document.getElementById('search').value;

    fetch(`https://api.mapbox.com/search/geocode/v6/forward?q=${searchInput}&access_token=${mapboxgl.accessToken}`)
        .then(response => response.json())
        .then(data => {
            const coordinates = data.features[0].geometry.coordinates;
            map.flyTo({
                center: coordinates,
                essential: true
            });

            new mapboxgl.Marker()
                .setLngLat(coordinates)
                .addTo(map);
            
            document.getElementById('results').innerHTML = `<h3>Found: ${data.features[0].place_name}</h3>`;
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('results').innerHTML = `<p>Error finding location</p>`;
        });
}

function calculateDistance() {
    const startLocation = document.getElementById('start-location').value;
    const endLocation = document.getElementById('end-location').value;

    const accessToken = mapboxgl.accessToken;

    // Fetch coordinates for the start location
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${startLocation}.json?access_token=${accessToken}`)
        .then(response => response.json())
        .then(data => {
            const startCoordinates = data.features[0].geometry.coordinates;

            // Fetch coordinates for the end location
            fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${endLocation}.json?access_token=${accessToken}`)
                .then(response => response.json())
                .then(data => {
                    const endCoordinates = data.features[0].geometry.coordinates;

                    // Calculate distance between start and end points (in kilometers)
                    const distance = calculateHaversineDistance(startCoordinates, endCoordinates);

                    // Display the distance
                    document.getElementById('distanceResults').innerHTML = `<h4>Distance: ${distance.toFixed(2)} km</h4>`;
                });
        })
        .catch(error => console.error('Error fetching locations:', error));
}

// Haversine formula to calculate distance between two coordinates
function calculateHaversineDistance([lon1, lat1], [lon2, lat2]) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in km
}



function getDirections() {
    const startLocation = document.getElementById('start-location').value;
    const endLocation = document.getElementById('end-location').value;

    const accessToken = mapboxgl.accessToken;

    // Fetch coordinates for the start location
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${startLocation}.json?access_token=${accessToken}`)
        .then(response => response.json())
        .then(startData => {
            const startCoordinates = startData.features[0].geometry.coordinates;

            // Fetch coordinates for the end location
            fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${endLocation}.json?access_token=${accessToken}`)
                .then(response => response.json())
                .then(endData => {
                    const endCoordinates = endData.features[0].geometry.coordinates;

                    // Call the Mapbox Directions API to get route between the coordinates
                    fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${startCoordinates[0]},${startCoordinates[1]};${endCoordinates[0]},${endCoordinates[1]}?geometries=geojson&access_token=${accessToken}`)
                        .then(response => response.json())
                        .then(routeData => {
                            const route = routeData.routes[0].geometry.coordinates;

                            // Add the route to the map
                            map.addSource('route', {
                                'type': 'geojson',
                                'data': {
                                    'type': 'Feature',
                                    'properties': {},
                                    'geometry': {
                                        'type': 'LineString',
                                        'coordinates': route
                                    }
                                }
                            });

                            map.addLayer({
                                'id': 'route',
                                'type': 'line',
                                'source': 'route',
                                'layout': {
                                    'line-join': 'round',
                                    'line-cap': 'round'
                                },
                                'paint': {
                                    'line-color': '#3887be',
                                    'line-width': 5
                                }
                            });

                            // Zoom to fit the route on the map
                            const bounds = new mapboxgl.LngLatBounds();
                            route.forEach(coord => bounds.extend(coord));
                            map.fitBounds(bounds, {
                                padding: 50
                            });

                            document.getElementById('directionsResults').innerHTML = `<h4>Route Found!</h4>`;
                        })
                        .catch(error => {
                            console.error('Error getting route:', error);
                            document.getElementById('directionsResults').innerHTML = `<p>Error getting directions</p>`;
                        });
                });
        })
        .catch(error => {
            console.error('Error fetching locations:', error);
            document.getElementById('directionsResults').innerHTML = `<p>Error finding locations</p>`;
        });
}
