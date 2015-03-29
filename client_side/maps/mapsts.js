/// <reference path="./google.maps.d.ts" />
var map;
function initialize() {
    var mapOptions = {
        zoom: 12,
        center: new google.maps.LatLng(55.9520600, -3.1964800)
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    // Hardcoded value to my google drive account which contains the kml file.
    // This file be in the server when fully implemented.
    var georssLayer = new google.maps.KmlLayer('https://docs.google.com/uc?authuser=0&id=0B4lLB-MKo1mSM1BkN09HMHh1U0U&export=download', {
        preserveViewport: true
    });
    georssLayer.setMap(map);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            var infowindow = new google.maps.InfoWindow({
                map: map,
                position: pos,
                content: 'Your Location'
            });
            map.setZoom(17);
            map.setCenter(pos);
        }, function () {
            handleNoGeolocation(true);
        });
    }
    else {
        // Browser doesn't support Geolocation
        handleNoGeolocation(false);
    }
}
function handleNoGeolocation(errorFlag) {
    if (errorFlag) {
        var content = 'Error: The Geolocation service failed.';
    }
    else {
        var content = 'Error: Your browser doesn\'t support geolocation.';
    }
    var options = {
        map: map,
        position: new google.maps.LatLng(55.9520600, -3.1964800),
        content: content
    };
    var infowindow = new google.maps.InfoWindow(options);
    map.setCenter(options.position);
}
google.maps.event.addDomListener(window, 'load', initialize);
