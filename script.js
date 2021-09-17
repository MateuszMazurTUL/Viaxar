var API_Key = 'PASTE_API_KEY_HERE'; //PASTE_API_KEY_HERE;

//display error
class ErrorHandling { 
    constructor(msg,div,time){
        $('#'+div).append('<div class="error">'+msg+'</div>');
    }
}

//list of error code
var errCode = {
    err1: 'Google Maps JavaScript API error: InvalidKeyMapError\nhttps://developers.google.com/maps/documentation/javascript/error-messages#invalid-key-map-error',
    err1_msg: 'Invalid API Key, check readme!',
    err20: 'ZERO_RESULTS',
    err20_msg: 'Wrong city name',
    err22: 'No places to show',
    err22_msg: 'No places to show',
    
};

//catch error from console
var logOfConsole = [];

var _log = console.log,
    _warn = console.warn,
    _error = console.error;

console.log = function() {
    switch(console.log.arguments[0]) {
      case errCode.err20:
        new ErrorHandling(errCode.err20_msg,'errorDiv',1)
        break;
      case errCode.err22:
        new ErrorHandling(errCode.err22_msg,'errorDiv',1)
        break;
      default:
        new ErrorHandling('Unknow error','errorDiv',1)
    }
    return _log.apply(console, arguments);
};
console.warn = function() {
    return _warn.apply(console, arguments);
};
console.error = function() {
    switch(console.error.arguments[0]) {
      case errCode.err1:
        new ErrorHandling(errCode.err1_msg,'errorDiv',1)
        break;
      default:
        new ErrorHandling('Unknow error','errorDiv',1)
    }
    return _error.apply(console, arguments);
};



class GMA {
    map;
    service;
    infowindow;
    centerLocation;
    timesDW;
    originT;
    destinationT;
    waypointsT;
    
    constructor(){
       
    }
    //Inicjalizacji google maps
    lunch_gmapapp() {
         return new Promise(function (resolve, reject) {

                //Dodajemy skrypt do pliku html
                let script = document.createElement('script');
                script.src = 'https://maps.googleapis.com/maps/api/js?key=' + API_Key + '&libraries=places&callback=initMap';
                document.head.appendChild(script);
             
             
            //Dodajemy mapę do strony
            window.initMap = function () {
                //Konfigurujemy ustawienia
                this.infowindow = new google.maps.InfoWindow();

                GMA.map = new google.maps.Map(document.getElementById("map"), {
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
                GMA.map.setOptions({ styles: styles["hide"] });
                resolve(document.head);
             };
         });
    }

    //Funckja która przyjmuje jako parametr wpisane miasto
    findPlace(place) {
        return new Promise(function (resolve, reject) {

            //Utworzenie serwisu do wyszukiwania miejsc
            GMA.service = new google.maps.places.PlacesService(GMA.map);
            var request = {
                query: place,
                fields: ['name', 'geometry'],
            };

            GMA.service.findPlaceFromQuery(request, function (results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {

                    //Centrujemy mapę oraz zapisujemy środek miasta
                    GMA.centerLocation = new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());
                    GMA.map.setCenter(GMA.centerLocation, 12);

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
    findNearby(cord, type, radius) {
        return new Promise(function (resolve, reject) {

            //Budujemy zapytanie o atrakcje
            const request = {
                location: cord,
                radius: radius,
                rankby: 'prominence',
                type: type,
            };

            //Tworzymy serwis i wywołujemy zapytanie
            GMA.service = new google.maps.places.PlacesService(GMA.map);
            GMA.service.nearbySearch(request, function (results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    resolve(results);
                } else {
                    //bez tago występuje bug i w przypadku gdy dane miasto nie ma wszystkich zadanych typów obiektów to zacina program, jednym słowem -> TODO: ERROR HANDLING!!
                    resolve(results);
                }
            });
        });
    }


    filterNearby(places) {
        let filteredPlaces = new Array;
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
    matrixNearby(places,date = Date.now()) {
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
    matrixOfAddresses(matrix) {
        var iterration = matrix.rows.length;
        var orginPath = [];
        
        //TODO: algorytm drogi
        for (let i = 0; i < iterration; i++) {
            orginPath.push(matrix.originAddresses[i])
        }

        return orginPath;
    }

    //Tworzymy droge atrakcji
    makeRoute(origin, destination, waypoints) {
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
            map: GMA.map,
            suppressMarkers: false,
            polylineOptions: polylineDotted,
            preserveViewport: true
        };

        GMA.originT=origin
        GMA.destinationT= destination
        GMA.waypointsT =  waypoints

        //Tworzymy serwisy
        const serviceDirections = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer(rendererOptions);

        //Dodajemy wygenerowaną mapę do renderu
        directionsRenderer.setMap(GMA.map);

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
        GMA.timesDW = new Array();
        //Zapytanie o trasę
        serviceDirections.route(request)
            .then((response) => {

                //console.log(response)
                //Wyświetlenie trasy
                let map = directionsRenderer.getMap();
                directionsRenderer.setDirections(response);

                for (let i = 0; i < response.routes[0].legs.length; i++) {
                    GMA.timesDW.push(response.routes[0].legs[i].duration.text)
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
                        GMA.timesDW.push(response.routes[0].legs[i].duration.text)
                    }
                    resolve(GMA.timesDW);
                })
                //Poprawa widoczności mapy
                map.setZoom(12);

            })
            .catch((e) => window.alert("Directions request failed due to " + e));
    })

    }
}


$(document).ready(function () {

    //Wywołujemy skrypt map google
        
    var gma = new GMA; // google maps api
    
    gma.lunch_gmapapp().then(function () {
            //pobieramy dane wyszukiwania, wpisane w formularzu, z sessionStorage
            var city = sessionStorage.getItem('cName');
            
            var checkedValue1 = sessionStorage.getItem('attrList'); //lista atrakcji
            var checkedValue = checkedValue1.split(',');//string to array
            
            var radiusNearbySearch = sessionStorage.getItem('radiusNearbySearch'); //zasiąg wyszukiwania

            //Pobieramy parametr wyszukiwania - wywołujemy metodę find place
            gma.findPlace(city).then(function (place) {

                //Zapisujemy wynik do zmiennych
                cityname = place.cityname;
                coord = place.coord;

                //Znajdujemy wszystkie najbliższe miejsca i przekazujemy do funkcji
                var fn = function findNearbytypesOfPlace(types) {
                    return new Promise(
                        resolve => gma.findNearby(coord, types, radiusNearbySearch)
                            .then(function (places) {
                                resolve(places);
                            })
                    );
                };
                
                //Wywołujemy funkcję która zwraca wszystkie miejsca
                Promise.all(checkedValue.map(fn)).catch(function (err) {
                    console.log('Error A122: A promise findPlace failed to resolve ', err);
                }).then(values => {

                    //Budujemy tablicę miejsca
                    var allPlaces = new Array;
                    values.forEach(placeArr => {
                        placeArr.forEach(place => {
                            allPlaces.push(place)
                        });
                    });
                    //Filtrujemy znalezione miejsca
                    allPlaces = gma.filterNearby(allPlaces);
                    
                    //error22
                    if(allPlaces.length == 0) console.log('No places to show');
                    
                    //Wyznaczamy odpowiednie trasy
                    gma.matrixNearby(allPlaces).then(function (matrix) {
                        let arr = gma.matrixOfAddresses(matrix);
                        return gma.makeRoute(arr[0], arr[arr.length - 1], arr.slice(1, -1));
                    }).then(
                        function (data) {
                            var flag = true
                            var iterator = 0;
                            var iterator2 = data.length / 2
                            $('.city_name').append(cityname);
                            allPlaces.forEach(place => {
                                if (flag) {
                                    $('.attraction_list').append("<p class=\"attract\">Początek: " + place.name + "</p>")
                                    flag = false;
                                }
                                else {
                                    $('.attraction_list').append("<p class=\"attract\">" + place.name + "</p>")
                                        .append("<p class=\"timeattract\">Samochodem: " + data[iterator] + "</p>")
                                        .append("<p class=\"timeattract\">Pieszo: " + data[iterator2] + "</p>")
                                    iterator = iterator + 1;
                                    iterator2 = iterator2 + 1;
                                }
                            });
                        }
                    );

                    //Resetujemy style mapya
                    $('#map').css('position', '');
                    $('#map').css('overflow', '');


                    //Wyświetlamy komponent z atrakcjami

                });
            });
        });
});