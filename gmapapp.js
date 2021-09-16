var map;
var service;
var infowindow;
var centerLocation;
var timesDW;
var originT;
var destinationT;
var waypointsT;

//Inicjalizacji google maps
function lunch_gmapapp() {
     return new Promise(function (resolve, reject) {
        $.get('API_Key.txt', function (data) {

            //Pobieramy API KEY z pliku
            var API_Key = data;

            //Dodajemy skrypt do pliku html
            var script = document.createElement('script');
            script.src = 'https://maps.googleapis.com/maps/api/js?key=' + API_Key + '&libraries=places&callback=initMap';
            document.head.appendChild(script);
        });

        //Dodajemy mapę do strony
        window.initMap = function (place) {
            //Konfigurujemy ustawienia
            infowindow = new google.maps.InfoWindow();
            
            map = new google.maps.Map(document.getElementById("map"), {
                center: new google.maps.LatLng(0, 0),
                zoom: 1,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                mapTypeControl: false,
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
                },
                navigationControl: true,
                navigationControlOptions: {
                    style: google.maps.NavigationControlStyle.SMALL
                }
            });

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
            resolve(document.head);
         };
     });
}

//Funckja która przyjmuje jako parametr wpisane miasto
function findPlace(place) {
    return new Promise(function (resolve, reject) {

        //Utworzenie serwisu do wyszukiwania miejsc
        var service = new google.maps.places.PlacesService(map);

        var request = {
            query: place,
            fields: ['name', 'geometry'],
        };

        service.findPlaceFromQuery(request, function (results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {

                //Centrujemy mapę oraz zapisujemy środek miasta
                centerLocation = new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());
                map.setCenter(centerLocation, 12);

                //Zwracamy informacje o znalezionym miejscu
                let geometryPlace = {
                    cityname: results[0].name,
                    coord: results[0].geometry.location.toJSON()
                }
                resolve(geometryPlace);
            } else console.log(status);
        });
    });
}

//Wyszukujemy atrakcje
function findNearby(cord, type) {
    return new Promise(function (resolve, reject) {

        //Budujemy zapytanie o atrakcje
        const request = {
            location: cord,
            radius: 6000,
            rankby: 'prominence',
            type: type,
        };

        //Tworzymy serwis i wywołujemy zapytanie
        service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, function (results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                resolve(results);
            } else {
                //bez tago występuje bug i w przypadku gdy dane miasto nie ma wszystkich zadanych typów obiektów to zacina program, jednym słowem -> TODO: ERROR HANDLING!!
                resolve(results);
            }
        });
    });
}


function filterNearby(places) {
    var filteredPlaces = new Array;
    places.forEach(place => {
        //Zwraca obiekty z odpowiednimi ustawieniami oraz z wystarczająca dobrą opinią pomijając popularne punkty sprzedażowe
        if (place.business_status = '"OPERATIONAL"' && place.rating > 4.5) {
            if (!place.types.includes('store')) {
                filteredPlaces.push(place);
            }
        }

    });
    //Zwraca posortowana listę najlepszych ośmiu atrakcji
    return filteredPlaces.sort((a, b) => (a.rating > b.rating) ? 1 : ((a.rating < b.rating) ? -1 : 0)).slice(0, 7)
}

//Wylicza dystanse między atrakcjami
function matrixNearby(places,date = Date.now()) {
    return new Promise(function (resolve) {

        const serviceMatrix = new google.maps.DistanceMatrixService();

        var placeLatLng = new Array;
        places.forEach(latlang => {
            placeLatLng.push(latlang.geometry.location);
        });

        const request1 = {
            origins: placeLatLng,
            destinations: placeLatLng,
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false,
            drivingOptions: {
                departureTime: new Date(date)
              },
        };

        const request2 = {
            origins: placeLatLng,
            destinations: placeLatLng,
            travelMode: google.maps.TravelMode.WALKING,
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false,
            drivingOptions: {
                departureTime: new Date(date)
              },
        };


        serviceMatrix.getDistanceMatrix(request1, function (results, status) {
            if (status == google.maps.DistanceMatrixStatus.OK) {
                resolve(results)
            }
        });
    });
}

//Wybranie najlepszej drogi
function matrixOfAddresses(matrix) {
    console.log(matrix)
    var iterration = matrix.rows.length;
    var orginPath = [];

    for (let i = 0; i < iterration; i++) {
        orginPath.push(matrix.originAddresses[i])
    }

    return orginPath;
}

//Tworzymy droge atrakcji
function makeRoute(origin, destination, waypoints) {
return new Promise(function (resolve){
    //Tworzymy tablicę
    waypoints.forEach((wp, index) => {
        waypoints[index] = {
            location: wp,
            stopover: true
        }
    });

    var lineSymbol = {
        path: google.maps.SymbolPath.CIRCLE,
        fillOpacity: 1,
        scale: 3
    };

    var polylineDotted = {
        strokeColor: '#9966ff',
        strokeOpacity: 0,
        fillOpacity: 0,
        icons: [{
            icon: lineSymbol,
            offset: '0',
            repeat: '10px'
        }],
    };

    var rendererOptions = {
        map: map,
        suppressMarkers: false,
        polylineOptions: polylineDotted,
        preserveViewport: true
    };

    originT=origin
    destinationT= destination
    waypointsT =  waypoints

    //Tworzymy serwisy
    const serviceDirections = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer(rendererOptions);

    //Dodajemy wygenerowaną mapę do renderu
    directionsRenderer.setMap(map);

    const request = {
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
        
    };
//  drivingOptions: {
  //  departureTime: new Date(/* now, or future date */),
   // trafficModel: 'pessimistic'
 // },
    var request2
    timesDW = new Array();
    //Zapytanie o trasę
    serviceDirections.route(request)
        .then((response) => {

            console.log(response)
            //Wyświetlenie trasy
            var map = directionsRenderer.getMap();
            directionsRenderer.setDirections(response);

            for (let i = 0; i < response.routes[0].legs.length; i++) {
                timesDW.push(response.routes[0].legs[i].duration.text)
            }
            var order = response.routes[0].waypoints_order
            var waypointsSecond = waypoints
            for (let i = 0; i < order; i++) {
                waypointsSecond[i]=waypoints[order[i]]
            }

            const request2 = {
                origin: origin,
                destination: destination,
                waypoints: waypointsSecond,
                optimizeWaypoints: false,
                travelMode: google.maps.TravelMode.WALKING
            };

            serviceDirections.route(request2)
            .then((response) => {
                for (let i = 0; i < response.routes[0].legs.length; i++) {
                    timesDW.push(response.routes[0].legs[i].duration.text)
                }
                resolve(timesDW);
            })
            //Poprawa widoczności mapy
            map.setZoom(12);
            console.log(timesDW)

        })
        .catch((e) => window.alert("Directions request failed due to " + e));
})
    
}

