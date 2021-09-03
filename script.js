//typy obiektów, które będziemy wyświetlać  TODO: przejrzeć i dopisać typy obiektów
//https://developers.google.com/maps/documentation/places/web-service/supported_types
var typesOfPlace = ["aquarium","museum","cemetery","city_hall","art_gallery","park","synagogue","church"];

$(document).ready(function(){
    //dodajemy skrypt z google api TODO: error handling
    $.getScript('gmapapp.js', function(){
        lunch_gmapapp();
    });
    
    //wczutujemy pierwszą scene TODO: error handling
    $('#appboard').load('div/1-city-name.html', function(){
        //gdy scena wczytana dodajemy event handler
        $('#button-search-city-name').click( function(){
            
            //wczutujemy druga scene TODO: error handling
            $('#appboard').load('div/2-loading.html')
            
            //wywołujemy google api dla nazwy wpisanej w #input-city-name
            findPlace($('#input-city-name').val()).then(function(coord){
                //wyciągamy nazwe miasta - aby na końcu ją wyświetlić - i koordynaty dla następnego skryptu, może starczy sama nazwa miast?
                cityname = coord.cityname;
                coord = coord.coord;
                
                //tutaj trzeba zsynchronizować tyle wywołań asynchronicznych ile jest typesOfPlace
                var fn = function findNearbytypesOfPlace(tOP){
                    return new Promise(
                        resolve => findNearby(coord, tOP)
                        .then(function(places){
                            resolve(places);
                        })
                    );
                };
                
                //wywołujemy zapytanie o typesOfPlace
                Promise.all(typesOfPlace.map(fn)).catch(function(err) {
                    console.log('Error A122: A promise findPlace failed to resolve ', err);
                }).then(values => {
                    
                    var allPlaces = new Array; 
                    //scalamy odpowiedzi z zapytań w jedną tablice
                    values.forEach(placeArr =>{
                        placeArr.forEach(place =>{
                            allPlaces.push(place)
                        }); 
                    }); 
                    //filtrujemy miejsca patrz gmapapp.js
                    allPlaces = filterNearby(allPlaces);
                    
                    //matrixApi ma ograniczenie względem ilości wyników. skracamy tablice TODO: ulepszyć skrypt, aby można było ostatecznie wyświetlić więcej atrakcji
                    allPlaces.length = 8;
                    matrixNearby(allPlaces).then(function(matrix){
                        let arr = matrixBestWay(matrix);
                        //wytyczamy trase między wybranymi atrakcjami
                        makeRoute(arr[0],arr[arr.length-1],arr.slice(1, -1));  
                    });

                    //trzeba wyczyścić style #map aby wyświetliła się mapa google
                    $('#map').css('position', '');
                    $('#map').css('overflow', '');
                    
                    //wczutujemy trzecia scene TODO: error handling
                    $('#appboard').load('div/3-map.html',function(){
                        //dodajemy nazwe miasta
                        $('.city_name').append(cityname);
                        
                        //dodajemy nazwy atrakcji TODO: sprawdzić i posegregować nazwy wg. kolejności
                        allPlaces.forEach(place => {
                            $('.attraction_list').append("<p>"+place.name+"</p>");
                        });
                    });
                });
            });
        });
    });
});
