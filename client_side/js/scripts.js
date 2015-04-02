kirk={
  calculateDistance: function(lon,lat){
    // Haversine Method
    var R = 6371; // Radius of the earth in km (3960 miles)
    var dLat = kirk._degToRad(kirk.locLatitude-lat);  // deg2rad below
    var dLon = kirk._degToRad(kirk.locLongitude-lon); 
    var lat1 = kirk._degToRad(lat)
    var lat2 = kirk._degToRad(kirk.locLatitude)

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2)
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    var dis = R * c; // Distance in km
    return dis;
  },

  _degToRad: function(d) {
    return d * (Math.PI/180);
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
    for (var i = 0; i<kirk.filtered[stop]["services"].length; i++){
      stop_id = kirk.filtered[stop]["stop_id"];
      stopDistance = kirk.filtered[stop]["distance"];
      services = services + "<a href =\"#\" + onClick=kirk.getTimetable(" + stop_id +','+stopDistance+ ")>" + kirk.filtered[stop]["services"][i] + "</a>" + ", "
    }
    return services.substring(0,services.length-2);
  },

  _isCloseEnough: function(point, distance) {
    return point.distance < distance;
  },

  getTimetable: function(service, distance) {
    $.get( "api/timetable/"+service, function( data ) {
      console.log("Timetable", data);
      kirk.timetable = data.departures.slice(0, 10);
      kirk.timeTableStopID = service;
      kirk.timeTableStopDistance = distance;
      kirk.displayTimetable();
      return data;
    });
  },

  expandTable: function(){
    $(".has-expansion").click(function() {
      console.log("expansion");
      $(this).toggleClass("showing");
      $(this).parent('legend').siblings('.expansion').slideToggle(500);
    });
  },

  displayTimetable: function(){
    $( "#timeTable" ).dynatable(
      {
        features: {
          pushState: true,
          search: false,
          paginate: true,
          perPageSelect: false
        },

         writers: {
          _rowWriter: timeWriter
        }
    })

    var snaptime = $('#timeTable').data('dynatable');
    snaptime.settings.dataset.originalRecords = kirk.timetable;
    snaptime.paginationPage.set(1); // Go to page 1
    snaptime.paginationPerPage.set(5);
    snaptime.process();


    // Start Writers for timetable info table -------------------
    function timeWriter(rowIndex, record, columns, cellWriter) {
      var tr = '';
      // grab the record's attribute for each column
        console.log(columns);
        tr += timeCellWriter(columns[0], columns[1], record);
       
        tr += cellWriter(columns[1], record);
       
      return '<tr style="font-weight:bold">' + tr + '</tr>';
    }

    //use for writing the services tags
    function timeCellWriter(column, timeInfo, record) {
      var html = column.attributeWriter(record),
          td = '<td';
          var time = console.log(record.time);
      html = '<span style="cursor: pointer;color:blue" onclick="startTimer('+record.distance+','+time+   ')">'+html+'</span>';
       
      if (column.hidden || column.textAlign) {
        td += ' style="max-width:113px;font-weight:normal;word-wrap:normal;';

        // keep cells aligned as their column headers are aligned
        if (column.textAlign) {
          td += 'text-align: ' + column.textAlign + ';';
        }
        td += '"';
      }
      return td +'>' + html + '</td>';
    };
    // End Writers for timetable info table  --------------------------         



  },

  changeTable: function(){
    $( "#busTable" ).dynatable(
      {
        features: {
          pushState: true,
          search: false,
          paginate: true,
          perPageSelect: false,
          sort: true
        },
       
        writers: {
          _rowWriter: ulWriter
        }

    })

    var snap = $('#busTable').data('dynatable');
    snap.settings.dataset.originalRecords = kirk.filtered;
   // console.log(snap.sorts);

    snap.paginationPage.set(1); // Go to page 1
    snap.paginationPerPage.set(5);
    snap.sorts.add('distance',1)
    snap.process();

    // Writers for main bus info table -------------------
    function ulWriter(rowIndex, record, columns, cellWriter) {
      var tr = '';
      // grab the record's attribute for each column
     
        tr += editedCellWriter(columns[0], record);

       
        tr += cellWriter(columns[1], record);
       
      return '<tr style="font-weight:bold">' + tr + '</tr>';
    }

    //use for writing the Stop Names row
    function editedCellWriter(column, record) {
      var html = column.attributeWriter(record),
          td = '<td';
      html = '<span style="cursor: pointer;color:blue" onclick="kirk.getTimetable('+record.stop_id+',' +record.distance +' )">'+html+'</span>';
      if (column.hidden || column.textAlign) {
        td += ' style="max-width:113px;font-weight:normal;word-wrap:normal;';

        // keep cells aligned as their column headers are aligned
        if (column.textAlign) {
          td += 'text-align: ' + column.textAlign + ';';
        }
        td += '"';
      }
      return td +'>' + html + '</td>';
    };
    // End Writers for main bus info table  --------------------------
   


  } 
  
    
}

function startTimer(distance, time){
  var averagekph = 5;
var timeToGetThere = (kirk.timeTableStopDistance/averagekph)*3600;
var timeToGo = timeToGetThere;

console.log(timeToGo);

var clock = $('.clock').FlipClock(timeToGo, {
    clockFace: 'MinuteCounter',
    autoStart: true,
    countdown: true
  });

}


var clock;
$(document).ready(function(){
  clock = $('.clock').FlipClock(0000, {
    clockFace: 'MinuteCounter',
    autoStart: false,
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
  }).then(function(){
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
