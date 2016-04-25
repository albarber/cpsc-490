# Ptolemy: An OpenDaylight Map

## Configuration
This application has a 3-step configuration process. 

### ODL REST Configuration
The default values for this project assume OpenDayLight is running a version from 2015 or later (Beryllium, Helium, and Lithium should all work). OpenDayLight features to install are: odl-dlux-all, odl-restconf-all, odl-netconf-connector-all, odl-l2switch-all, odl-netconf-mdsal, odl-bgpcep-bgp-all, odl-bgpcep-pcep-all, odl-netconf-all


In app/updateDatabase.controller.js, edit the object ‘$scope.userConfig’.
+ ctrlHost points to the controller’s IP address
+ ctrlPort points to the controller’s port
+ ctrlUsername and ctrlPassword are the login information for OpenDayLight authorization

### Database Configuration
You must have MySQL installed on your computer. app/node\_modules/mysql contains node-mysql, a Node driver for MySQL, which allows Node.js to interface with MySQL. See "Setting Up The Database" for particulars on creating a database and tables. In app/server.js, edit the object ‘userConfig’. 
+ dbUsername -- your MySQL username
+ dbPassword -- your MySQL password
+ database -- the name of the database your tables are in

#### Setting Up the Database
In order for this application to run, there must be a MySQL Database with:  
+ A table named _Nodes_  
+ A table named _Links_  

The table data should follow this structure:   
**Node**  
Node\_ID (int 11)  
Node_Name (varchar 100), primary key  
location\_lat (float 10,3)  
location\_lng (float 10,3)  
type (varchar 100)  

MySQL query to create the _Nodes_ Table: 
```SQL
CREATE TABLE IF NOT EXISTS Nodes (Node_id int, Node_name VARCHAR(100), location_lat FLOAT(10,3),location_lng FLOAT(10,3), type VARCHAR (100), PRIMARY KEY(Node_name))
```

**Link**  
Link\_id (int 11), primary key  
Source\_node (varchar 100), foreign key references Nodes(Node\_name)  
Dest\_node (varchar 100), foreign key references Nodes(Node\_name)  
Intensity (float 10, 6),
src_lat (float 10, 3), 
src_lng (float 10, 3),
dest_lat (float 10, 3),
dest_lng (float 10, 3)  

MySQL query to create the _Links_ Table: 
```SQL
CREATE TABLE IF NOT EXISTS Links (Link_id int, source_node VARCHAR(100), dest_node VARCHAR(100), intensity FLOAT(10,6), src_lat FLOAT(10,3), src_lng FLOAT(10,3), dest_lat FLOAT(10,3), dest_lng FLOAT(10,3), PRIMARY KEY(Link_id), FOREIGN KEY(source_node) REFERENCES Nodes(Node_name), FOREIGN KEY(dest_node) REFERENCES Nodes(Node_name))
```

_Note_: the 4 latitude and longitude columns will be set only after topology information about the nodes has been read in. Placing geographic information in both the Nodes and Links tables allows both groups to be treated separately on the map more easily. 


### Running GUI
1. Have Node.js installed on your computer
2. In terminal, navigate to the root folder of the project and run `node server.js` 
3. Use a browser to go to http://{{ip-for-GUI}}:{{port-for-GUI}}. By default this link is http://localhost:8080

On first use, or if the database is not populated, hit the "Reread network topology" button, then reload the map (either by refreshing the window, or hitting the "Reload Map from Data" button). If the database is already populated but you wish to load in new network data, hit the "Reset Databases" button before rereading the network topology and reloading the map. 

#### Customizing the Map
There are several ways to customize the outlook of the map. 

**Customizing the Base Map:**
In app/map.controller.js, in the function $scope.loadMap(), the user can set initial zoom level, map center on load, and the map type (set through options.mapTypeId). These are all Google Maps parameters. 

**Customizing Node Style:**
In index.html, `ui-gmap-markers`, the user can set gridSize (size of grid for which markers will be clustered) and minimumClusterSize.
In app/map.controller.js, the user can set an optional icon for node markers in `createMarkers()` by adding a key-value pair in `var ret` in the form 'icon: [icon image]'

**Customizing Link Style:**
In app/map.controller.js, in the function styleFeature() the user can customize link appearance in two ways.
+ setting `minIntensity` and `maxIntensity`, which will set the values for low (green) traffic and high (red) traffic
+ setting `strokeWeight` and `strokeIntensity` to create wider/thinner or more/less opaque links

