var map;
var service;
var infowindow;


function lunch_gmapapp(){
    
    var API_Key = AIzaSyDm5EKc8JBy0_ixYlkCxlQPqnMbaf7LA_A
    
    var script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + API_Key + '&libraries=places&callback=initMap';
    script.async = true;

    // Append the 'script' element to 'head'
    document.head.appendChild(script);
    
    
    // Attach your callback function to the `window` object
    window.initMap = function(place) {
    // JS API is loaded and available
    // var sydney = new google.maps.LatLng(-33.867, 151.195);

        infowindow = new google.maps.InfoWindow();
        
        map = new google.maps.Map(
        document.getElementById('map'), {center: place, zoom: 15});
        //$('#map'),{center: place, zoom: 15});
        
        
        //removing markers
        const styles = {
          default: [],
          hide: [
            {
              featureType: "poi",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "transit",
              elementType: "labels.icon",
              stylers: [{ visibility: "off" }],
            },
          ],
        };
        map.setOptions({ styles: styles["hide"] });
      };
    }


function findPlace(place){
    var geometryPlace;
    var service = new google.maps.places.PlacesService(map);

    var request = {
        query: place,
        fields: ['name', 'geometry'],
      };
    
    service.findPlaceFromQuery(request, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {

          map.setCenter(results[0].geometry.location);
          geometryPlace = results[0].geometry.location.toJSON();
          findNearby(geometryPlace);
          
        }
    });
}

function findNearby(cord){
    const request = {
        location: cord,
        radius: 5000,
        rankby: 'prominence',
        type: ["aquarium","museum","amusement_park","art_gallery","park"] //point_of_interest
    };
    
    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            
                    console.log(results);
            makeMarkers(results);
                
        }
    });
}

function filterNearby(){
    
}

function matrixNearby(){
    const serviceGeocoder = new google.maps.Geocoder();
    const serviceMatrix = new google.maps.DistanceMatrixService();
    
    const request = {
        origins: [, ],
        destinations: [, ],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false,
    };
}

function makeMarkers(places) {
    places.forEach( place => {
        console.log(place.name + " " + place.rating);
        new google.maps.Marker({
            position:place.geometry.location,
            map,
            title: place.name,
            label: {
                color: 'black',
                fontWeight: 'bold',
                text: place.name,
            },
            icon: {
                labelOrigin: new google.maps.Point(11, 50),
                url: 'img/marker_red.png',
                size: new google.maps.Size(22, 40),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(11, 40),
            },
        });
    });
}