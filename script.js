$(document).ready(function(){
    //dodajemy skrypt z google api TODO: error handling
    $.getScript('gmapapp.js', function(){
        lunch_gmapapp();
    });
    
    //wczutujemy pierwszą scene TODO: error handling
    $('#appboard').load('div/1-city-name.html', function(){
        //gdy scena wczytana dodajemy event handler
        $('#button-search-city-name').click(function(){
            //wywołujemy google api dla nazwy wpisanej w #input-city-name
            findPlace($('#input-city-name').val());
            $('#map').css('position', '');
            $('#map').css('overflow', '');
        });
    });
    
});
