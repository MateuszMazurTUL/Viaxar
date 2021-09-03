var map;
var service;
var infowindow;


function lunch_gmapapp(){
    
    //IMPORTANT! Take your google api key from API_Key.txt Make sure you have turn on appropriate services
    $.get('API_Key.txt', function(data) {
        var API_Key = data;
    
        //add googleapis script to our project
        var script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=' + API_Key + '&libraries=places&callback=initMap';

        // Append the 'script' element to 'head'
        document.head.appendChild(script);
    });    

    // Attach your callback function to the `window` object
    window.initMap = function(place) {

        //TODO
        infowindow = new google.maps.InfoWindow();
        
        //Add map object to div
        map = new google.maps.Map(
        document.getElementById('map'), {center: place, zoom: 15});
        //$('#map'),{center: place, zoom: 15});
        
        
        //removing default markers
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

//znajdz miejsce na podstawie nazwy wprowadzonej przez użytkownika TODO: error handling!!
function findPlace(place){
    return new Promise(function(resolve, reject) {
        var service = new google.maps.places.PlacesService(map);

        var request = {
            query: place,
            fields: ['name', 'geometry'],
          };

         service.findPlaceFromQuery(request, function(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                //centrujemy mape na wyszukanym miejscu
              map.setCenter(results[0].geometry.location);
                //zwracamy dokładną nazwe miasta (poprawioną przez google api) i koordynaty geograficzne
              let geometryPlace = {
                  cityname: results[0].name,
                  coord: results[0].geometry.location.toJSON()
              }
              
              resolve(geometryPlace);
            }
        });
    });
}

//wyszukujemy miejsca w pobliżu
/*
    Tutaj należy się pare słów wyjaśnienia. Google API zwraca zam 20 wyników danego zapytania.
    W zapytaniu podajemy koordynaty geograficzne (identyfikator miejsca), 
    typ obiektu - bez tego wyświetli nam wszystkie typy włącznie z samym miastem czy dzielnicą, bo to też są obiekty,
    a przez to kończy nam się limit zwróconych wyników (20).
    Google przewidziało opcje pagination dzięki, której moża by wyświetlić ponownie dane zapytanie ale z kolejnymi 20 wynikami (czyli następną stroną),
    niemniej zaprzestałem implementacji tego rozwiązania na tym etapie. 20 wyników z danej kategorii to świat.
*/
function findNearby(cord,type,nextPage){
    return new Promise(function(resolve, reject) {
        //wyłączamy opcje Pagination
        nextPage = false;
        
        const request = {
            location: cord,
            radius: 10000, // zasięg(promień) od podanej lokalizacji (centrum miasta), gdzie będziemy szukać miejsc TODO: stworzyć zmienną wynieść do parametru i dostosować wartość zależne od miejsca, wielkie miasto, wyspa, miasteczko powinny mieć różne promienie
            rankby: 'prominence',
            type: type, //point_of_interest ["aquarium","museum","amusement_park","art_gallery","park"]
            pageToken: 'next-page-token',// pozostałość PAGITATION
        };
        
        service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, function(results, status,pagination) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {

                //filterNearby(results);
                if(pagination.hasNextPage && nextPage) pagination.nextPage();
                else  resolve(results);
            } else {
                //bez tago występuje bug i w przypadku gdy dane miasto nie ma wszystkich zadanych typów obiektów to zacina program, jednym słowem -> TODO: ERROR HANDLING!!
                resolve(results);
            }
        });
    });
}

//pozostałość po niedokończonej implementacji pagination
function getAllPage(results){
    
}

function filterNearby(places){
    //TODO: dopisać sortowanie po ratingu
    //TODO: usunąć duplikaty, tworzy to błędy przy wytyczaniu scieżki i nie daje pełnej ilości miejsc
    var filteredPlaces = new Array;
    places.forEach(place => {
        //aktualnie ustawione filtry na rating (ocena w gwiadkach na google maps) i status operational, co wyrzuca z rezultatów takie obiekty jak miasto czy dzielnica,
        //z tym że jak teraz pomyślę to zadanie zapytania w findNearby o konkretne typy obiektów niweluje nam te typy. Przy findNearby type point_of_interest, wyświetliły by się tego typu obiekty
        if( place.business_status = '"OPERATIONAL"' && place.rating > 4.5) {
            filteredPlaces.push(place);          
        }
        
    });
    return filteredPlaces;
}

//tworzy tablice dystansu między danymi lokalizacjami
function matrixNearby(places){
    return new Promise(function(resolve, reject) {
        //const serviceGeocoder = new google.maps.Geocoder();
        const serviceMatrix = new google.maps.DistanceMatrixService();

        //przyjmujemy tablice z dokładnymi danymi a potrzebujemy lokalizacji latlng
        var placeLatLng = new Array;
        places.forEach(latlang => {
            placeLatLng.push (latlang.geometry.location);
        });

        const request = {
            origins: placeLatLng,
            destinations: placeLatLng,
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false,
        };
        //TODO: error handling
        serviceMatrix.getDistanceMatrix(request, function(results, status){
            if (status == google.maps.DistanceMatrixStatus.OK){
                resolve(results)
            }
        });
    });
}

//algorytm wybierający najlepszą trasę między naszymi miejscami. Aktualnie jest to jedynie iteracja i wybór najkrótszego odcinka. Ani efektywne, ani efektowne.
function matrixBestWay(matrix){
    
    var iterration = matrix.rows.length;
    var orginPath = [];
    
    //TODO: Zawsze zaczyna z punktu A  tj. matrix.originAddresses[0], dobrze byłoby przeiterować po każdym punkcie początkowym
    var lowestDestDistanceDest = matrix.originAddresses[0];
    
    for(let i=0; i < iterration; i++){
        orginPath.push(lowestDestDistanceDest)
        var lowestDestDistanceValue = null;
        var lowestDestDistanceDest = null;
        //TODO: sprawdzić nie tylko odległość ale i czas podróży
        for(let j = 0; j < iterration; j++){
            if(i!=j){
                if(lowestDestDistanceValue == null || matrix.rows[i].elements[j].distance.value < lowestDestDistanceValue ){
                    lowestDestDistanceValue = matrix.rows[i].elements[j].distance.value;
                    lowestDestDistanceDest = matrix.originAddresses[j];
                }
            }
        }
        
    }
    
    return orginPath;
}

//tworzymy połączenia między punktami i renderujemy je na mapie
function makeRoute(origin,destination, waypoints) {
    //funkcja wymaga obiektu, więc korygujemy tablice
    waypoints.forEach((wp,index) => {
        waypoints[index] = {
            location: wp,
            stopover: true
        }
    });
    
    const serviceDirections = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    
    //dodajemy wcześnie utworzoną mape do renderu
    directionsRenderer.setMap(map);
    
    const request = {
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        optimizeWaypoints: false, // google może zoptymalizować drogę ale mamy własną funkcje matrixBestWay
        travelMode: google.maps.TravelMode.DRIVING
    };
    //zapytanie o trase
    serviceDirections.route(request)
    .then((response) => {
        //render trasy
      directionsRenderer.setDirections(response);
    })
    .catch((e) => window.alert("Directions request failed due to " + e)); //a tutaj nawet jakiś przykładowy error handling ;-)
    
}

//dodajemy własne markery na mapie, w momencie gdy render przy makeRoute() dodał własne znaczniki te są zbędne
function makeMarkers(places) {
    places.forEach( place => {
        
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