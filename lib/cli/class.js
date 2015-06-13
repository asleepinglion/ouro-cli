"use strict";

var Ouro = require('ouro');
var npm = require('npm');
var fs = require('fs');
var path = require('path');

module.exports = Ouro.Application.extend({

  _metaFile: function() {
    this._super();
    this._loadMeta(__filename);
  },

  init: function() {
    this._super.apply(this, arguments);
  },

  beforeSetup: function() {

    //maintain a list of commands
    this.commands = {};

  },

  setup: function() {

    //maintain a reference to the instance
    var self = this;

    this.schedule('args', { setup: { modulePath: this._modulePath(__dirname), alias: 'args' } });

  },

  beforeBoot: function() {

    this.log.info("Ouro Version: " + Ouro.version + "\n");
  },

  afterBoot: function() {

    //find commands provided as part of ouro
    this.findCommands( path.resolve(this.paths.cmd + '/../node_modules'));

    //find commands installed into current project
    this.findCommands( path.resolve(this.paths.cwd + '/node_modules'));
  },

  findCommands: function(searchPath) {

    //maintain reference to instance
    var self = this;

    //get list of files in search path
    var nodeModules = fs.readdirSync(searchPath);

    //loop thorugh list of files
    nodeModules.map(function(moduleName) {

      //load modules with the cli prefix as commands
      if( moduleName.indexOf('ouro-cli-') === 0 ) {

        var commandName = moduleName.substr(12, moduleName.length-12);

        self._load(commandName, { setup: { modulePath: searchPath + '/' + moduleName, namespace: 'commands', local: true}});

      } else if( moduleName.indexOf('ouro-') === 0 && fs.existsSync(searchPath + '/' + moduleName + '/node_modules')) {

        //recursively search for other cli command modules inside ouro packages
        self.findCommands(searchPath + '/' + moduleName + '/node_modules');

      }

    });

  },

  routeRequest: function(resolve, reject) {

    //maintain reference to instance
    var self = this;

    //initialize the request object
    self.request = {};
    self.request.command = 'help';
    self.request.params = [];
    self.request.options = {};
    self.request.args = self.args.get();


    for( var arg in self.request.args ) {

      if( arg === '_' && self.request.args._.length > 0 ) {

        //set the requested command
        self.request.command = self.request.args._[0];

        for( var i = 1; i < self.request.args._.length; i++ ) {
          self.request.params.push(self.request.args._[i]);
        }

      } else if( arg !== '$0' ) {

        self.request.options[arg] = self.request.args[arg];
      }

    }

    this.log.debug('new request:', self.request);
    this.log.break();

    if( !self.commands[self.request.command] ) {


      return reject(new Ouro.Error('invalid_request', 'The requested command was not found.'));
    }

    resolve();

  },

  /*
  //process the request by validating and sanitizing parameters
  processRequest: function() {

    //maintain reference to the currrent instance
    var self = this;

    //return promise which is resolved or rejected depending on completion
    return new Promise(function (resolve, reject) {

      //localize a reference to the command
      var command = self.commands[self.request.command];

      //localize a reference to the blueprint
      var blueprint = command.blueprint;

      //maintain lists of validations and sanitzation closures
      var validations = [];
      var sanitizations = [];

      //loop through all the options for this command and
      //append validations and sanitizations to their respective lists
      for( var option in blueprint.options ) {

        if( !self.request.options[option] ) {
          for ( var alias in blueprint.options[option].aliases ) {
            if( self.request.options[blueprint.options[option].aliases[alias]] ) {
              self.request.options[option] = self.request.options[blueprint.options[option].aliases[alias]];
            }
          }
        }


        //set value to default if its not passed
        if( !self.request.options[option] ) {
          self.request.options[option] = blueprint.options[option].default;
        }


        //don't run validations if the attribute has not been provided and its not required
        if( blueprint.options[option].validate.required === true || typeof self.request.options[option] !== 'undefined' ) {
          //setup validations
          validations = validations.concat(self.services.validate.setup(blueprint.options[option].validate, option, self.request.options[option], 'option'));
        }


        //setup sanitizations
        //sanitizations = sanitizations.concat(self.app.services.sanitize.setup(self.blueprint.actions[req.action].params[param].sanitize, parameters, param));

      }

      self.log.debug("processed request:",self.request);
      self.log.debug("performing " + validations.length + " validations, and " + sanitizations.length + " sanitizations...");

      //execute validations
      self.services.validate.process(validations)

        //exectute sanitizations
        //.then(function() {
        //  return self.services.sanitize.process(sanitizations)
        //})


        //resolve if all passed without errors
        .then(function() {

          //store the parameters on the request object
          self.log.debug('verified parameters:', self.request);

          resolve();
        })

        //reject if we caught any errors
        .catch(function(err) {
          reject(err);
        });

    });

  },

  //*/

  errorHandler: function(err) {

    if( err.code ) {

      if( err.code === 'invalid_request' ) {

        this.commands.help.run();

      } else if( err.code === 'validation_error' ) {

        this.log.warn('validation error:',err);
      }

    } else {

      //make the error stack easier to read
      if (typeof err.stack === 'string') {
        err.stack = err.stack.split('\n');
      }

      //delete extra bluebird error object variables
      delete err.__stackCleaned__;
      delete err.isOperational;

      this.log.error("unknown error occured:");
      this.log.object(err);

    }

  },

  ready: function() {

    //maintain reference to instance
    var self = this;

    //this.log.debug('commands loaded:', Object.keys(this.commands));

    //npm.load(function(err, npm) {
    //  npm.commands.ls([], true, function(err, data, lite) {
    //    self.log.object(lite); //or lite for simplified output
    //  });
    //});


    //route the request to the appropriate controller
    this.routeRequest()

      //process the request
      //.then(function() {
      //  return self.processRequest();
      //})

      //execute the request
      .then(function() {
        return self.commands[self.request.command].run(self.request);
      })

      //catch any uncaught errors
      .catch(function(err) {
        self.errorHandler(err);
      });
  }

});
