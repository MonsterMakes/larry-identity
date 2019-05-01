'use strict';
const namespace = 'api.api';
const SINGLETON_KEY = Symbol.for(namespace);
const globalSpace = global;

const log = (require('./src/Logger')).getInstance();

const ApiServer = require('./src/ApiServer');
const globalSymbols = Object.getOwnPropertySymbols(globalSpace);
/*************************************************************************************/
/* START PROCESS UNHANDLED METHODS */
/*************************************************************************************/
process.on('unhandledRejection', (reason, p) => {
	log.error('Unhandled Rejection at:', p, 'reason:', reason);
	log.error(`Api Server (api) exiting due to unhandledRejection...`);
	process.exit(1);
});
process.on('uncaughtException', (err) => {
	log.error('Uncaught Exception:', err);
	log.error(`Api Server (api) exiting due to uncaughtException...`);
	process.exit(1);
});
/*************************************************************************************/
/* END PROCESS UNHANDLED METHODS */
/* START WEBSOCKET SERVER AS SINGLETON */
/*************************************************************************************/
//If this is the first time go ahead and create the symbol.
if (globalSymbols.indexOf(SINGLETON_KEY) === -1){
	globalSpace[SINGLETON_KEY] = new ApiServer();
	globalSpace[SINGLETON_KEY].on('ShutdownComplete',(exitCode)=>{
		log.error(`Api Server (api) exiting shutting down with exitCode (${exitCode})...`);
		process.exit(exitCode);
	});
	globalSpace[SINGLETON_KEY].start();
}
module.exports= globalSpace[SINGLETON_KEY];