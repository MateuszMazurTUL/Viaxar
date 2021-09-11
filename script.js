//typy obiektów, które będziemy wyświetlać  TODO: przejrzeć i dopisać typy obiektów
//https://developers.google.com/maps/documentation/places/web-service/supported_types
var typesOfPlace = ["aquarium", "museum", "cemetery", "city_hall", "art_gallery", "park", "synagogue", "church"];

$(document).ready(function () {

    //Wywołujemy skrypt map google
    $.getScript('gmapapp.js', function () {
        lunch_gmapapp();
    });

    //Wyświetlamy wyszukiwanie miasta
    $('#appboard').load('div/1-city-name.html', function () {
        //Jeżeli klikniemy
        $('#button-next-to-date').click(function () {
            var city = $('#input-city-name').val()
            $('#appboard').load('div/getting-date.html', function () {
                
                $('#button-search-city-name').click(function () {
                    var date = $('#input-DATE').val()
                    var checkedValue = []
                    var inputElements = document.getElementsByClassName('checkbox1');
                    for(var i=0; inputElements[i]; ++i){
                      if(inputElements[i].checked){
                           checkedValue.push(inputElements[i].value);
                      }
                    }
                    if(checkedValue.length<1)
                    {
                        checkedValue=typesOfPlace
                    }
                    $('#appboard').load('div/2-loading.html')
                    //Pobieramy parametr wyszukiwania - wywołujemy metodę find place
                    findPlace(city).then(function (place) {

                        //Zapisujemy wynik do zmiennych
                        cityname = place.cityname;
                        coord = place.coord;
    
                        //Znajdujemy wszystkie najbliższe miejsca i przekazujemy do funkcji
                        var fn = function findNearbytypesOfPlace(types) {
                            return new Promise(
                                resolve => findNearby(coord, types)
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
                            allPlaces = filterNearby(allPlaces);
                            //Wyznaczamy odpowiednie trasy
                            matrixNearby(allPlaces, date).then(function (matrix) {
                                let arr = matrixOfAddresses(matrix);
                                return makeRoute(arr[0], arr[arr.length - 1], arr.slice(1, -1));
                            }).then(
                                function (data) {
                                    var flag = true
                                    var iterator = 0;
                                    var iterator2 = data.length / 2
                                    $('#appboard').load('div/3-map.html', function () {
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
            //////////////
        });
    });
});
