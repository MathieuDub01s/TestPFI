/////////////////////////////////////////////////////////////////////
// This module is the starting point of the http server
/////////////////////////////////////////////////////////////////////
// Author : Nicolas Chourot
// Lionel-Groulx College
/////////////////////////////////////////////////////////////////////

import APIServer from "./APIServer.js";
import RouteRegister from './routeRegister.js';

//get like, toggleLike
RouteRegister.add('GET', 'Bookmarks', 'list');
RouteRegister.add('GET', 'accounts', );

RouteRegister.add('POST', 'likes', );
RouteRegister.add('PUT', 'likes', );
RouteRegister.add('POST', 'likes','register' );
RouteRegister.add('POST', 'usersNames', );
RouteRegister.add('PUT', 'usersNames', );
RouteRegister.add('GET', 'usersNames', );
RouteRegister.add('POST', 'usersNames','register' );
RouteRegister.add('POST', 'accounts', 'register');
RouteRegister.add('GET', 'accounts', 'verify');
RouteRegister.add('GET', 'accounts', 'logout');
RouteRegister.add('PUT', 'accounts', 'modify');
RouteRegister.add('GET', 'accounts', 'remove');
RouteRegister.add('GET', 'accounts', 'conflict');
RouteRegister.add('POST', 'accounts', 'block');
RouteRegister.add('POST', 'accounts', 'promote');


let server = new APIServer();
server.start();