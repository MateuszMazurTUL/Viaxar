$(document).ready(function () {
    $('#button-submit-data-form').click(function(){
        //zapisujemy dane wyszukiwania wpisane w formularzu do sessionStorage
        sessionStorage.setItem('cName',$('#cName').val()); //nazwa miasta
        
        //lista atrakcji
        var checkedValue = []
        var inputElements = document.getElementsByClassName('checkbox1');
        for(var i=0; inputElements[i]; ++i){
          if(inputElements[i].checked){
               checkedValue.push(inputElements[i].value);
          }
        }
        if(checkedValue.length<1) //jeśli nic nie zaznaczono
        {
            //typy obiektów, które będziemy wyświetlać  TODO: przejrzeć i dopisać typy obiektów
            //https://developers.google.com/maps/documentation/places/web-service/supported_types
            let typesOfPlace = ["aquarium", "museum", "cemetery", "city_hall", "art_gallery", "park", "synagogue", "church"];
            checkedValue=typesOfPlace
        }
        
        sessionStorage.setItem('attrList',checkedValue); //lista atrakcji
        sessionStorage.setItem('radiusNearbySearch',$('#radiusNearbySearch').val()); //zasiąg wyszukiwania

        //redirect
        window.location = 'app_main.html';
        
    });
});