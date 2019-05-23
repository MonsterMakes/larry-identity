'use strict';
const log = (require('../Logger')).getInstance();
const _ = require('lodash');
//load underscore string library
_.mixin(require('underscore.string').exports());

const STATUS = {
	UNKNOWN:'UNKNOWN',
	INITIALIZING: 'INITIALIZING',
	STARTING:'STARTING',
	STARTED:'STARTED',
	START_FAILED: 'START_FAILED',
	SHUTTING_DOWN: 'SHUTTING_DOWN',
	SHUTDOWN:'SHUTDOWN',
	SHUTDOWN_FAILED:'SHUTDOWN_FAILED'
};
Object.freeze(STATUS);

class BaseInjectable {
	constructor(context){
		this._setStatus(this.STATUS_STATES.INITIALIZING);
		//create private variables for all the injectables in a _lowerCamelCaseFormat
		Object.keys(context).forEach((injectableName)=>{
			this[`_${_.camelize(injectableName,true)}`] = context[injectableName];
		});
	}
	/*************************************************************************************/
	/* START PRIVATE METHODS */
	/*************************************************************************************/
	_setStatus(status){
		if(this.STATUS_STATES.hasOwnProperty(status)){      
			this._status = status;
		}
		else{
			throw new Error(`Unknown Status, cannot set the status of the Injectable to ${status}`);
		}
	}
	_handleStart(){
		//override this method to implement startup logic without having to manage the statuses, see start() method
	}
	_handleShutdown(){
		//override this method to implement shutdown logic without having to manage the statuses, see shutdown() method
	}
	/*************************************************************************************/
	/* END PRIVATE METHODS */
	/* START PUBLIC API METHODS */
	/*************************************************************************************/
	get STATUS_STATES(){
		return STATUS;
	}
	getStatus(){
		return this._status;
	}
	start(){
		return Promise.resolve()
			//start listening on port 8080 and register all the common listeners
			.then(()=>{
				//Check if its already started
				switch(this.getStatus()){
				case this.STATUS_STATES.STARTING:
				case this.STATUS_STATES.STARTED:
					return this._startingProm;
				default:
					this._setStatus(this.STATUS_STATES.STARTING);
					this._startingProm = Promise.resolve()
						.then(()=>{
							return this._handleStart();
						})
						.then(()=>{
							this._setStatus(this.STATUS_STATES.STARTED);
						})
						.catch((e)=>{
							log.error({error:e},`Injectable (${this.constructor.name}) failed to startup`);
							this._setStatus(this.STATUS_STATES.START_FAILED);
							return Promise.reject(e);
						});
					return this._startingProm;
				}
			});
	}
	shutdown(err){
		return Promise.resolve()
			.then(()=>{
				//Check if its already shutdown
				switch(this.getStatus()){
				case this.STATUS_STATES.START_FAILED:	
				case this.STATUS_STATES.SHUTTING_DOWN:
				case this.STATUS_STATES.SHUTDOWN:
					return this._shuttingdownProm;
				default:
					this._setStatus(this.STATUS_STATES.SHUTTING_DOWN);
					if(err){
						log.error({error:err},`Injectable (${this.constructor.name}) encountered a failure scenario and is being shutdown...`);
					}
					this._shuttingdownProm = Promise.resolve()
						.then(()=>{
							return this._handleShutdown();
						})
						.catch((e)=>{
							log.error({error:e},`Injectable (${this.constructor.name}) failed to shutdown, please make sure things do not need atttending...`);
						});
					return this._shuttingdownProm;
				}
			})
			.catch((e)=>{//eslint-disable-line
				this._setStatus(this.STATUS_STATES.SHUTDOWN_FAILED);
			});
	}
	/*************************************************************************************/
	/* END PUBLIC API METHODS */
	/*************************************************************************************/
}
module.exports = BaseInjectable;