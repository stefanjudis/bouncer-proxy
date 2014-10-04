var _         = require( 'lodash' );
var debug     = require( 'debug' )( 'PROXY' );
var http      = require( 'http' );
var httpProxy = require( 'http-proxy' );
var proxy     = httpProxy.createProxyServer();


/**
 * Default options
 * @type {Object}
 */
var defaults = {
  allowed : [],
  port    : 8000,
  url     : ''
};

/**
 * Constructor
 *
 * @param {Object} options options
 */
var Proxy = function( options ) {
  this.options = _.extend( defaults, options );


  if ( options.url ) {
    this._startServer();
  } else {
    throw new Error( 'options.url is not set.' );
  }
};


/**
 * Start proxy server
 */
Proxy.prototype._startServer = function() {
  debug( 'starting server' );
  debug( '-> options' + JSON.stringify( this.options ) );

  this.server = http.createServer( function( req, res ) {
    req.headers.host = this.options.url.replace( /http(s){0,1}:\/\//, '');

    res.setHeader(
      'Content-Security-Policy', 'default-src \'self\' ' + this.options.allowed.join( ' ' ) + ';'
    );

    proxy.web( req, res, { target : this.options.url } );
  }.bind( this ) );

  this.server.listen( this.options.port );
};


/**
 * Add allowed url to CSP
 *
 * @param {String}   url      url
 * @param {Function} callback callback
 * @param {Object}   context  context
 */
Proxy.prototype.addAllowedUrl = function( url, callback, context ) {
  debug( 'Closing server' );
  this.server.close( function() {
    debug( 'Server closed' );

    this.options.allowed.push( url );
    debug( 'added %s to allowed url hosts', url );

    this._startServer();

    if ( typeof callback === 'function' ) {
      callback.apply( context, [ null, url ] );
    }
  }.bind( this ) );
};


/**
 * Shut down the proxy
 * @param  {Function} callback callback
 * @param  {Object}   context  context
 */
Proxy.prototype.shutDown = function( callback, context ) {
  this.server.close( function() {
    callback.apply( context, [ null ] );
  } );
};


/**
 * Remove allowed URl from CSP
 *
 * @param  {String}   url      url
 * @param  {Function} callback callback
 * @param {Object}   context  context
 */
Proxy.prototype.removeAllowedUrl = function( url, callback, context ) {
  var index = _.indexOf( this.options.allowed, url );

  if ( index !== '-1' ) {
    this.server.close( function() {
      debug( 'Server closed' );

      this.options.allowed.splice( index, 1 );

      debug( 'removed %s from allowed url hosts', url );

      this._startServer();

      if ( typeof callback === 'function' ) {
        callback.apply( context, [ null, url ] );
      }
    }.bind( this ) );
  } else {
    debug( '%s not found', url );
  }
};

module.exports = Proxy;
