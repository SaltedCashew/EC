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
    kirk.timetable = [];
    kirk.displayTimetable();

    for(var i = 0; i<kirk.data.length; i++){
      var point = kirk.data[i]
      point.distance = kirk.calculateDistance(point.longitude, point.latitude);
      point.distance = (point.distance * 1.609344).toFixed(2);
    }
  },
  openMarker: function(id){
    for(var i = 0; i< stops_markers.length; i++){
      if(stops_markers[i].title == id)
        google.maps.event.trigger(stops_markers[i], 'click');
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
      services = services + "<a href =\"#\" + onClick=kirk.getTimetableService(" + stop_id +','+stopDistance+',\''+kirk.filtered[stop]["services"][i]+"\')>" + kirk.filtered[stop]["services"][i] + "</a>" + ", "
    }
    return services.substring(0,services.length-2);
  },

  _isCloseEnough: function(point, distance) {
    return point.distance < distance;
  },
  getTimetableService: function(stop_id, distance,service) {
    $.get( "api/timetable/"+stop_id, function( data ) {
      console.log("Timetable", data);
      var timetable = [];
      for (var i = 0; i<data.departures.length; i++){
        if (kirk.compareTime(data.departures[i]["time"]) && data.departures[i]["day"] == kirk.getDay() && data.departures[i]["service_name"] == service){
          timetable.push(data.departures[i]);
        }
      }
      kirk.timetable = timetable.slice(0, 10);
      kirk.timeTableStopID = stop_id;
      kirk.timeTableStopDistance = distance;
      kirk.displayTimetable();
      return data;
    });
  },

  getTimetable: function(stop_id, distance) {
    $.get( "api/timetable/"+stop_id, function( data ) {
      var timetable = [];
      for (var i = 0; i<data.departures.length; i++){
        if (kirk.compareTime(data.departures[i]["time"]) && data.departures[i]["day"] == kirk.getDay()){
          timetable.push(data.departures[i]);
        }
      }
      kirk.timetable = timetable.slice(0, 10);
      kirk.timeTableStopID = stop_id;
      kirk.timeTableStopDistance = distance;
      kirk.displayTimetable();
      return data;
    });
  },
  compareTime: function(time){ //checks current time with input, returns true if the time hasn't passed and false otherwise.
    //buiding in a  buffer - return false if current time less than 10 minutes prior to input
    var d = new Date();

    var buffer = 0; //3 minute buffer
    var bufferDate = new Date(d.getTime() + buffer*60000);

    curr_hours = bufferDate.getHours();
    curr_minutes = bufferDate.getMinutes();
    
    time_hours = time.substring(0,time.length-3);
    time_minutes = time.substring(time.length-2,time.length);
    if (curr_hours > time_hours){
      return false;
    }
    else if (curr_hours == time_hours){
      if (curr_minutes > time_minutes){
        return false;
      }
      else{
        return true;
      }
    }
    else{
      return true;
    }
  },
  getDay: function(){
    var d = new Date();
    day = d.getDay();

    if (day == 6){
      return 5;
    }
    else if (day == 0){
      return 6;
    }
    else {
      return 0;
    }
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
        tr += timeCellWriter(columns[0], columns[1], record);
       
        tr += cellWriter(columns[1], record);
       
      return '<tr style="font-weight:bold">' + tr + '</tr>';
    }

    function checkWalkingTime(unixtime){
      /* This function is used to check if the user can make it to the bus stop
       * If the user can't, return false and it'll be printed as red on the timetable, otherwise return true
       */
      var averagekph = 5;
      var timeToGetThere = (kirk.timeTableStopDistance/averagekph)*3600;
      var timeToGo = timeToGetThere + 60;

      var timetable_date = new Date(unixtime*1000);
      var timetable_secs = timetable_date.getSeconds() + (60 * timetable_date.getMinutes()) + (60 * 60 * timetable_date.getHours());

      var current_date = new Date();
      var curr_secs = current_date.getSeconds() + (60 * current_date.getMinutes()) + (60 * 60 * current_date.getHours());

      var leave_offset = 60; // Time taken to leave location
      var wait_offset = 60; // Estimated waiting time
      var buffer = 60;

      console.log("currsecs",curr_secs);
      console.log("timeTableStopDistance",kirk.timeTableStopDistance);
      console.log("timeToGo",timeToGo);
      console.log("timetable_secs",timetable_secs );


      console.log("timeToGo",timeToGo);
      if (curr_secs + timeToGo + leave_offset + wait_offset + buffer >= timetable_secs){
        return false;
      }
      else {
        return true;
      }
    }

    //use for writing the services tags
    function timeCellWriter(column, timeInfo, record) {
      var html = column.attributeWriter(record),
      td = '<td';
      var d = new Date();
      var n = d.toDateString();
      var timeString = n + ' ' + record.time;
      var time = console.log(record.time);
      var unixtime = Date.parse(timeString)/1000; // A Number, representing the number of milliseconds between the specified date-time and midnight January 1, 1970 (/1000)
      if(checkWalkingTime(unixtime)){
        html = '<span style="cursor: pointer;color:blue" onclick="startTimer('+time+','+kirk.timeTableStopID+','+unixtime + ')">'+html+'</span>';
      }
      else{
        html = '<span style="cursor: pointer;color:red" onclick="alert(\'Warning. It may not be possible to catch the bus for this time.\')">'+html+'</span>';
      }

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

    });

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
      console.log(record)
      var html = column.attributeWriter(record) + " " + "(" + record.direction + ")",
      td = '<td';
      html = '<span style="cursor: pointer;color:blue" onclick="kirk.getTimetable('+record.stop_id+',' +record.distance +' );kirk.openMarker(\''+ record.name +' ('+record.direction+')\' )">'+html+'</span>';
          if (column.hidden || column.textAlign) {
            td += ' style="max-width:113px;font-weight:normal;word-wrap:normal;';

            // keep cells aligned as their column headers are aligned
            if (column.textAlign) {
              td += 'text-align: ' + column.textAlign + ';';
            }
            td += '"';
          }
          return td +'>' + html + '</td>';
    }
    // End Writers for main bus info table  --------------------------

  } 
  
    
}

function startTimer(time,service,unixtime){
  curr_loc = kirk.locLatitude+","+kirk.locLongitude;
  var timetable_date = new Date(unixtime*1000);
  var timetable_secs = timetable_date.getSeconds() + (60 * timetable_date.getMinutes()) + (60 * 60 * timetable_date.getHours());

  var current_date = new Date();
  var curr_secs = current_date.getSeconds() + (60 * current_date.getMinutes()) + (60 * 60 * current_date.getHours());

  var leave_offset = 60; // Time taken to leave location
  var wait_offset = 60; // Estimated waiting time
  
 

  for( var i=0; i<kirk.filtered.length; i++){
      if(kirk.filtered[i]["stop_id"] == service){
        dest_loc = kirk.filtered[i]["latitude"]+","+kirk.filtered[i]["longitude"];
        break;
      }
  }
  $.get( "directions/time/"+curr_loc+"/"+dest_loc, function( data ) {

    var traveling_time = data["routes"]["0"]["legs"]["0"]["duration"]["value"];

    timeToGo = timetable_secs - curr_secs -leave_offset - traveling_time - wait_offset;
    console.log(timeToGo);
    clock.setTime(timeToGo);
    clock.start();
  });




}

var clock;
var stops_markers = []; // collection of stop markers
function addStopsMarkers(marker) {
  stops_markers.push(marker);
}
function removeAllStopsMarkers(){
  stops_markers = [];
}
function clearMarkers(){
  for(var i = 0; i< stops_markers.length; i++){
    stops_markers[i].setMap(null);
  }
  stops_markers = [];
  return;
}

var audio = new Audio('alert.mp3');


$(document).ready(function(){
  clock = $('.clock').FlipClock(0000, {
    clockFace: 'MinuteCounter',
    autoStart: false,
    countdown: true,
     callbacks: {
        interval: function() {
          var time = this.factory.getTime().time;
          if (time == 0){
            audio.play();
            alert("You should be leaving your location now to catch your bus on time.")
          }
        }
      }
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
          draggable: true,
          title: 'You are here.',
          dragend: function(e) {     
            latitude = this.getPosition().lat();
            longitude = this.getPosition().lng();
            map.removePolygons();
            map.drawCircle({
              lat: latitude,
              lng: longitude,
              radius: 320,  //320 meters
              strokeColor: '#0f69b4',
              strokeOpacity: 1,
              strokeWeight: 2,
              fillColor: '#0f69b4',
              fillOpacity: 0.35
            });

            clearMarkers();

            kirk.locLatitude = latitude;
            kirk.locLongitude = longitude;
            kirk.init();
            kirk.filterMarkers(0.5);
            kirk.changeTable();

            for(var i = 0; i< kirk.filtered.length; i++){
              var stops_marker_move = map.addMarker({
                lat: kirk.filtered[i]["latitude"],
                lng: kirk.filtered[i]["longitude"],
                icon: "http://gmapsmarkergenerator.eu01.aws.af.cm/getmarker?scale=1&color=00ff00",
                title: kirk.filtered[i]["name"] + " ("+kirk.filtered[i]["direction"]+")" ,
                infoWindow: { content: "<b>" + kirk.filtered[i]["name"] + " (" + kirk.filtered[i]["direction"] + ")"+ "</b>" + "<br>" + "Services: " + kirk.parseServices(i)}
              });
              addStopsMarkers(stops_marker_move);
            }
          },
          infoWindow: { content: 'You are here!'    }
        });
        map.drawCircle({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          radius: 320,  //320 meters
          strokeColor: '#0f69b4',
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: '#0f69b4',
          fillOpacity: 0.35
        });
        kirk.locLatitude = map["map"]["center"]["k"];
        kirk.locLongitude = map["map"]["center"]["D"];
        kirk.init();
        kirk.filterMarkers(0.5);
        kirk.changeTable();
        for(var i = 0; i< kirk.filtered.length; i++){
          var stop_marker = map.addMarker({
            click: function(){
              if(this["stop_id"]){
                kirk.getTimetable(this["stop_id"], this["dist"]);
              }
            },
            stop_id: kirk.filtered[i]["stop_id"],
            dist: kirk.filtered[i]["distance"],
            lat: kirk.filtered[i]["latitude"],
            lng: kirk.filtered[i]["longitude"],
            
            icon: "http://gmapsmarkergenerator.eu01.aws.af.cm/getmarker?scale=1&color=00ff00",
            title: kirk.filtered[i]["name"] + " ("+kirk.filtered[i]["direction"]+")" ,
            infoWindow: { content: "<b>" + kirk.filtered[i]["name"] + " (" + kirk.filtered[i]["direction"] + ")"+ "</b>" + "<br>" + "Services: " + kirk.parseServices(i)}
          });
          stops_markers.push(stop_marker);
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
            lng: latlng.lng(),
            draggable: true,
            dragend: function(e) {
              latitude = this.getPosition().lat();
              longitude = this.getPosition().lng();
              map.removePolygons();
              map.drawCircle({
                lat: latitude,
                lng: longitude,
                radius: 320,  //320 meters
                strokeColor: '#0f69b4',
                strokeOpacity: 1,
                strokeWeight: 2,
                fillColor: '#0f69b4',
                fillOpacity: 0.35
              });

              clearMarkers();

              kirk.locLatitude = latitude;
              kirk.locLongitude = longitude;
              kirk.init();
              kirk.filterMarkers(0.5);
              kirk.changeTable();

              for(var i = 0; i< kirk.filtered.length; i++){
                var address_marker_move = map.addMarker({
                  lat: kirk.filtered[i]["latitude"],
                  lng: kirk.filtered[i]["longitude"],
                  click: function(){
                    if(this["stop_id"]){
                      kirk.getTimetable(this["stop_id"], this["dist"]);
                    }
                  },
                  stop_id: kirk.filtered[i]["stop_id"],
                  dist: kirk.filtered[i]["distance"],
                  icon: "http://gmapsmarkergenerator.eu01.aws.af.cm/getmarker?scale=1&color=00ff00",
                  title: kirk.filtered[i]["name"] + " ("+kirk.filtered[i]["direction"]+")" ,
                  infoWindow: { content: "<b>" + kirk.filtered[i]["name"] + " (" + kirk.filtered[i]["direction"] + ")" + "</b>" + "<br>" + "Services: " + kirk.parseServices(i)}
                });
                addStopsMarkers(address_marker_move);
              }
            }
          });

          map.removePolygons();
          map.drawCircle({
            lat: latlng.lat(),
            lng: latlng.lng(),
            radius: 320,  //320 meters
            strokeColor: '#0f69b4',
            strokeOpacity: 1,
            strokeWeight: 2,
            fillColor: '#0f69b4',
            fillOpacity: 0.35
          });
          kirk.locLatitude = map["map"]["center"]["k"];
          kirk.locLongitude = map["map"]["center"]["D"];
          kirk.init();
          kirk.filterMarkers(0.5);
          kirk.changeTable();
          for(var i = 0; i< kirk.filtered.length; i++){
            var addressbox_marker = map.addMarker({
              lat: kirk.filtered[i]["latitude"],
              lng: kirk.filtered[i]["longitude"],
              click: function(){
                if(this["stop_id"]){
                  kirk.getTimetable(this["stop_id"], this["dist"]);
                }
              },
              stop_id: kirk.filtered[i]["stop_id"],
              dist: kirk.filtered[i]["distance"],
              icon: "http://gmapsmarkergenerator.eu01.aws.af.cm/getmarker?scale=1&color=00ff00",
              title: kirk.filtered[i]["name"] + " ("+kirk.filtered[i]["direction"]+")" ,
              infoWindow: { content: "<b>" + kirk.filtered[i]["name"] + " (" + kirk.filtered[i]["direction"] + ")"+ "</b>" + "<br>" + "Services: " + kirk.parseServices(i)}
            });
            addStopsMarkers(addressbox_marker);
          }
        }
      }
    });
  });
});
