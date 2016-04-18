# cpsc-490

### Configuration
This application has a 3-step configuration process. 

#### ODL REST Configuration
The default values for this project assume OpenDayLight is running a version from 2015 or later (Beryllium, Helium, and Lithium should all work). OpenDayLight features to install are: odl-dlux-all, odl-restconf-all, odl-netconf-connector-all, odl-l2switch-all, odl-netconf-mdsal, odl-bgpcep-bgp-all, odl-bgpcep-pcep-all, odl-netconf-all


In app/updateDatabase.controller.js, edit the object ‘$scope.userConfig’.
+ ctrlHost points to the controller’s IP address
+ ctrlPort points to the controller’s port
+ ctrlUsername and ctrlPassword are the login information for OpenDayLight authorization

#### Database Configuration
You must have MySQL installed on your computer. app/node\_modules/mysql contains node-mysql, a Node driver for MySQL, which allows Node.js to interface with MySQL. See Design Documentation->The Database->Setting Up The Database for particulars on creating a database and tables. In app/server.js, edit the object ‘userConfig’. 
+ dbUsername -- your MySQL username
+ dbPassword -- your MySQL password
+ database -- the name of the database your tables are in

#### Running GUI
1. Have Node.js installed on your computer
2. In terminal, navigate to the root folder of the project and run `node server.js` 
3. Use a browser to go to http://{{ip-for-GUI}}:{{port-for-GUI}}. By default this link is http://localhost:8080
