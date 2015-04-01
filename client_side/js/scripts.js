kirk={
  calculateDistance: function(lon,lat){
    lat2 = kirk.locLatitude
    long2 = kirk.locLongitude
    dis = Math.sqrt((lat - lat2) * (lat - lat2) + (lon - long2) * (lon - long2)) * 3960 * 3.141592/180
    return dis;
  },

  init: function(){
    for(var i = 0; i<kirk.data.length; i++){
      var point = kirk.data[i]
      point.distance = kirk.calculateDistance(point.longitude, point.latitude);
      point.distance = (point.distance * 1.609344).toFixed(2);
    }
  },

  filterMarkers: function(distance){
    var filteredPoints = []

    for( var i=0; i<kirk.data.length; i++){
      var point = kirk.data[i]
      if(kirk._isCloseEnough(point, distance)){
        filteredPoints.push(point)
      }
    }
    kirk.filtered = filteredPoints

  },

  parseServices: function(stop){
    var services = ""
    for (var i = 0; i<kirk.data[stop]["services"].length; i++){
      stop_id = kirk.data[stop]["stop_id"];
      services = services + "<a href =\"#\" + onClick=kirk.getTimetable(" + stop_id + ")>" + kirk.data[stop]["services"][i] + "</a>" + ", "
    }
    return services.substring(0,services.length-2);
  },

  _isCloseEnough: function(point, distance) {
    return point.distance < distance;
  },

  getTimetable: function(service) {
    $.get( "api/timetable/"+service, function( data ) {
      console.log("Timetable", data);
      return data;
    });
  },

  changeTable: function(){
    $( "#busTable" ).dynatable(
      {
        features: {
          pushState: true,
          search: false,
          paginate: true,
          perPageSelect: false
        },
        writers: {
        _rowWriter: ulWriter
      },
    })

    var snap = $('#busTable').data('dynatable');
    snap.settings.dataset.originalRecords = kirk.filtered;
    snap.paginationPage.set(1); // Go to page 1
    snap.paginationPerPage.set(5);
    snap.process();

    // Working copy of function to write the table differently -------------------
    function ulWriter(rowIndex, record, columns, cellWriter) {
      var tr = '';
      // grab the record's attribute for each column
      for (var i = 0, len = columns.length-1; i < len; i++) {
        tr += cellWriter(columns[i], record);
      }
      td = editedCellWriter(columns[2], record);
      return '<tr style="font-weight:bold">' + tr + '</tr><tr>'+td+'</td></tr>';
    }

    //use for writing the services row
    function editedCellWriter(column, record) {
      var html = column.attributeWriter(record),
          td = '<td colspan="2"';

      for (var i = 0, len = html.length; i < len; i++) {
      	html[i] = '<span style="cursor: pointer;color:blue" onclick="pullTimeTables(this.innerHTML)">'+html[i]+'</span>';
      } 
      var htmlAsString = html.join(', ');

      if (column.hidden || column.textAlign) {
        td += ' style="max-width:113px;font-weight:normal;word-wrap:break-word;';

        // keep cells aligned as their column headers are aligned
        if (column.textAlign) {
          td += 'text-align: ' + column.textAlign + ';';
        }
        td += '"';
      }
      return td + '>Serving:  ' + htmlAsString + '</td>';
    };
    // End working copy of functions for writing table  --------------------------
  }       
}

function pullTimeTables(text) {
    alert('"YOU CLICKED ON BUS ' + text +'!"');
}

var clock;
$(document).ready(function(){
  clock = $('.clock').FlipClock(3000, {
    clockFace: 'MinuteCounter',
    autoStart: true,
    countdown: true
  });

  map = new GMaps({
    div: '#map',
    lat: 55.952889,
    lng: -3.189591
  });

  kirk.defLatitude = map["map"]["center"]["k"];
  kirk.defLongitude = map["map"]["center"]["D"];

  $.get( "api/stops", function( data ) {
    kirk.data = data;
  });

  GMaps.geolocate({
    success: function(position){
      map.setCenter(position.coords.latitude, position.coords.longitude);
      map.addMarker({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        title: 'You are here.',
        infoWindow: { content: 'You are here!'    }
      });
      kirk.locLatitude = map["map"]["center"]["k"];
      kirk.locLongitude = map["map"]["center"]["D"];
      kirk.init();
      kirk.filterMarkers(0.5);
      kirk.changeTable();
      for(var i = 0; i< kirk.filtered.length; i++){
        map.addMarker({
          lat: kirk.filtered[i]["latitude"],
          lng: kirk.filtered[i]["longitude"],
          icon: "http://gmapsmarkergenerator.eu01.aws.af.cm/getmarker?scale=1&color=00ff00",
          title: kirk.filtered[i]["name"],
          infoWindow: { content: "<b>" + kirk.filtered[i]["name"] + "</b>" + "<br>" + "Services: " + kirk.parseServices(i)}
        })
      }
    },
    error: function(error){
      alert('Geolocation failed: '+error.message);
    },
    not_supported: function(){
      alert("Your browser does not support geolocation");
    }
  });

  $('#addressBox').submit(function(e){
    e.preventDefault();
    GMaps.geocode({
      address: $('#postcode').val().trim(),
      callback: function(results, status){
        if(status=='OK'){
          var latlng = results[0].geometry.location;
          map.setCenter(latlng.lat(), latlng.lng());
          map.removeMarkers();
          map.addMarker({
            lat: latlng.lat(),
            lng: latlng.lng()
          });
          kirk.locLatitude = map["map"]["center"]["k"];
          kirk.locLongitude = map["map"]["center"]["D"];
          kirk.init();
          kirk.filterMarkers(0.5);
          kirk.changeTable();
          for(var i = 0; i< kirk.filtered.length; i++){
            map.addMarker({
              lat: kirk.filtered[i]["latitude"],
              lng: kirk.filtered[i]["longitude"],
              icon: "http://gmapsmarkergenerator.eu01.aws.af.cm/getmarker?scale=1&color=00ff00",
              title: kirk.filtered[i]["name"],
              infoWindow: { content: "<b>" + kirk.filtered[i]["name"] + "</b>" + "<br>" + "Services: " + kirk.parseServices(i)}
            })
          }
        }
      }
    });
  });
});
