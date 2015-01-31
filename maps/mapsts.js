/// <reference path="./google.maps.d.ts" />
var map;
function initialize() {
    var mapOptions = {
        zoom: 12,
        center: new google.maps.LatLng(55.953252, -3.188267),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    var transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap(map);
    // Hardcoded value to my google drive account which contains the kml file.
    // This file be in the server when fully implemented.
    var georssLayer = new google.maps.KmlLayer('https://docs.google.com/uc?authuser=0&id=0B4lLB-MKo1mSM1BkN09HMHh1U0U&export=download');
    georssLayer.setMap(map);
}
google.maps.event.addDomListener(window, 'load', initialize);
