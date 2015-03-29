import json
import re
# Python script to convert stops.json into a kml file to be processed by google

json_data=open('stops.json')

f = open('stops.kml','w')

f.write('<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n')

data = json.load(json_data)
for stops in data["stops"]:

	stop_id = stops["stop_id"]
	atco_code = stops["atco_code"]
	name = re.sub(r'[^\w]', '',stops["name"])
	identifier = stops["identifier"]
	locality = stops["locality"]
	orientation = stops["orientation"]
	direction = stops["direction"]
	latitude = stops["latitude"]
	longitude = stops["longitude"]
	destinations = stops["destinations"]
	services = stops["services"]

	f.write('<Placemark>\n')
	f.write('<name>'+ str(stop_id) + " " + name + " " + direction + '</name>\n')
	f.write('<description>\n'+"destinations: " + str(destinations) + '\n' + "services: " + str(services) + '\n' + '</description>\n')
	f.write('<Point>\n<coordinates>' + str(longitude) + ',' + str(latitude) + '</coordinates>\n</Point>\n') 
	f.write('</Placemark>\n')


f.write('</Document>\n</kml>')

f.close()
json_data.close()