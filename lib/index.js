'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const ip = require( 'ip' );
const ipv6 = require( 'ip-address' ).Address6;
const deepmerge = require( 'deepmerge' );

module.exports = {
  array: array,
  inArray: inArray,
  trace: trace,
  buildError: buildError,
  getFiles: getFiles,
  noop: noop,
  replaceCharInObjectKeys: replaceCharInObjectKeys,
  isSameIP: isSameIP,
  regexEscape: regexEscape,
  isFunction: isFunction,
  arrayMergePreserveSource: arrayMergePreserveSource,
  weightedAvg: weightedAvg
};

function array( v ) {
  return v === undefined ? [] : Array.isArray( v ) ? v : [ v ];
}

function inArray( v ) {

  v = array( v );

  if ( v ) {
    return { $in: v };
  }

}

function trace( fn ) {

  // var err = new Error( 'If you are seeing this error message, something is broken!' );
  // var filter = err.stack.split( '\n' ).slice( 2 );
  var tmp = [];

  return function () {

    if ( !arguments[ 0 ] ) {
      return fn.apply( null, arguments );
    }

    // filter.forEach( e => tmp.push( e ) );
    arguments[ 0 ] = buildError( arguments[ 0 ] );
    arguments[ 0 ].stack.reverse().forEach( i => tmp.unshift( i ) );
    arguments[ 0 ].stack = tmp;

    fn.apply( null, arguments );

  };

}

function buildError( err ) {

  if ( err instanceof Error ) {
    return {
      message: err.message,
      stack: err.stack.split( '\n' )
    };
  }

  if ( typeof err !== 'object' || Array.isArray( err ) ) {

    var err2 = new Error( err );

    var tmp2 = err2.stack.split( '\n' );
    tmp2.splice( 1, 1 );

    return { message: JSON.stringify( err ), stack: tmp2 };

  }

  if ( err.err ) {
    var tmp = buildError( err.err );
    return deepmerge( err, tmp, { arrayMerge: arrayMergePreserveSource, clone: false } );
  }

  // If there error has been caught, traced, and returned through another API server elsewhere it won't have a .err or
  // .stack
  if ( err.message && !err.stack ) {
    var tmp = buildError( new Error( err.message ) );
    return deepmerge( err, tmp, { arrayMerge: arrayMergePreserveSource, clone: false } );
  }

  return err;

}

function getFiles( paths, files, ignore_folders, extensions ) {

  if ( !Array.isArray( paths ) ) {
    paths = [ paths ];
  }

  extensions = extensions || [];
  ignore_folders = ignore_folders || [];
  files = files || [];
  var folders = [];

  paths.forEach( function ( p ) {

    fs.readdirSync( p ).forEach( function ( fn ) {

      fn = path.resolve( p, fn );

      var stat = fs.statSync( fn );

      if ( stat.isDirectory() ) {
        if ( ignore_folders.indexOf( path.basename( fn ) ) === -1 ) {
          folders.push( fn );
        }
      }
      else if ( stat.isFile() ) {
        if ( extensions.indexOf( path.extname( fn ) ) !== -1 ) {
          files.push( fn );
        }
      }

    } );

  } );

  if ( folders.length ) {
    getFiles( folders, files, ignore_folders, extensions );
  }

  return files;

}

function noop() {
}

function replaceCharInObjectKeys( data, a, b ) {

  // Check if we have keys that could be replaced
  if ( !data || typeof data !== 'object' || typeof a !== 'string' || typeof b !== 'string' ) {
    return data;
  }

  var _data = {};

  // Loop through all the keys
  Object.keys( data ).forEach( function ( k ) {

    // Replace 'a' with 'b'
    var _k = k.replace( new RegExp( regexEscape( a ), 'g' ), b );

    // Recurse and associate
    _data[ _k ] = replaceCharInObjectKeys( data[ k ], a, b );

  } );

  return _data;

}

function isSameIP( ip1, ip2 ) {

  // Check IPv6
  var ip1_v6 = new ipv6( ip1 );
  var ip2_v6 = new ipv6( ip2 );

  if ( ip1_v6.isValid() ) {

    if ( ip2_v6.isValid() ) {
      return ip1_v6.correctForm() === ip2_v6.correctForm();
    }

    return ip.isEqual( ip1.replace( '::ffff:', '' ), ip2 );

  }
  else if ( ip2_v6.isValid() ) {
    return ip.isEqual( ip1, ip2.replace( '::ffff:', '' ) );
  }

  // Check IPv4
  return ip.isEqual( ip1, ip2 );

}

function regexEscape( str ) {
  // the two opening square brackets might be redundant, might want to replace second one with \[
  return str.replace( /[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&' );
}

function isFunction( functionToCheck ) {
  return functionToCheck && {}.toString.call( functionToCheck ) === '[object Function]';
}

function arrayMergePreserveSource( dest, source, options ) {
  return source;
}

function weightedAvg( a ) {
  const sum = a.reduce( ( [ vs, ws ], [ v, w ] ) => [ vs + v * w, ws + w ], [ 0, 0 ] );
  return sum[ 0 ] / sum[ 1 ];
}
