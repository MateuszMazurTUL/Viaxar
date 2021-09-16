

$(document).ready(function () {

    //Wywołujemy skrypt map google
    $.getScript('gmapapp.js', function () {
        lunch_gmapapp().then(function (as) {
            //pobieramy dane wyszukiwania, wpisane w formularzu, z sessionStorage
            var city = sessionStorage.getItem('cName');
            
            var checkedValue1 = sessionStorage.getItem('attrList'); //lista atrakcji
            var checkedValue = checkedValue1.split(',');//string to array
            
            var radiusNearbySearch = sessionStorage.getItem('radiusNearbySearch'); //zasiąg wyszukiwania


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
                    matrixNearby(allPlaces).then(function (matrix) {
                        let arr = matrixOfAddresses(matrix);
                        return makeRoute(arr[0], arr[arr.length - 1], arr.slice(1, -1));
                    }).then(
                        function (data) {
                            var flag = true
                            var iterator = 0;
                            var iterator2 = data.length / 2
                            //$('#appboard').load('div/3-map.html', function () {
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
                            //});

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

    

});