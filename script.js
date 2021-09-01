$.ready(){
    //dodajemy skrypt z google api
    $.getScript('gmapapp.js', function(){
        lunch_gmapapp();
    });

    //$('#appboard').append

    findPlace('lodz');
};
