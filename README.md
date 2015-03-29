[ec-team-kirk](http://www.teamkirk.tk/)
===

- Project page: http://www.teamkirk.tk/

##Localhost
- Dependencies: Node.js, `$ npm install`
- Start:  `$ node web.js`
- Homepage: http://localhost:3000/
- Map: http://localhost:3000/maps

##APIs
- Stops (once a day): http://localhost:3000/api/stops
- Services (once a day): http://localhost:3000/api/services
- Timetables (once a day): http://localhost:3000/api/timetables/{stop_id}
> e.g., http://localhost:3000/api/timetable/36232897
- Journeys (once a day): http://localhost:3000/api/journeys/{service_name}
> e.g., http://localhost:3000/api/journeys/1
- Status (every minute): http://localhost:3000/api/status
- Vehicle Locations (every 15 seconds): http://localhost:3000/api/vehicle_locations

##Direction Querying
- Directions: http://localhost:3000/directions/{start}}/{finish}}/{date}/{time_mode}
> e.g., http://localhost:3000/directions/55.961236,-3.186641/55.958775,-3.183715/1420631207/LeaveAfter
 - loc_start: float,float (starting location coordinates)
 - loc_finish: float,float (destination coordinates)
 - date: int (Unix time format)
 - time_mode: string (`LeaveAfter` or `ArriveBy`)

##To-Do
- (Mac) display marker
- (Brad) display services info (verbose toggle)
- (Sara) calculate the distance into km
- (Paul) function to calculate the distance from current position to destination (routes)
- (Brad) trigger timer after click on specific bus time 
- (Sara) show the time table underneath the stops 
- (Paul) Change table after submitted the postal code
- Report
- Cross-platform testing
