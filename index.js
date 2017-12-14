'use strict';

const Constants = require( './constants' );
const ObjectId = require( 'mongodb' ).ObjectId;
const util = require( 'util' );
const fs = require( 'fs' );
const path = require( 'path' );
const ip = require( 'ip' );
const ipv6 = require( 'ip-address' ).Address6;
const deepmerge = require( 'deepmerge' );
const objectpath = require( 'object-path' );

const REDACTED_FIELDS = [
  'password',
  'private',
  'secret',
  'token'
];

module.exports = {
  api: api,
  trace: trace,
  buildError: buildError,
  getFiles: getFiles,
  noop: noop,
  validateObject: validateObject,
  validateOwner: validateOwner,
  replaceCharInObjectKeys: replaceCharInObjectKeys,
  isSameIP: isSameIP,
  regexEscape: regexEscape,
  isFunction: isFunction,
  arrayMergePreserveSource: arrayMergePreserveSource,
  checkRole: checkRole,
  redact: redact
};

function api( client, API ) {

  return {
    validateAudio: validateAudio,
    validateOwner: validateOwner,
    getOwners: getOwners
  };

  function validateAudio( fn, multiple ) {
    return function ( data, done ) {

      var args = arguments;

      if ( !Array.isArray( data.audio ) ) {
        data.audio = [ data.audio ];
      }

      // Owner checking is not appropriate for workers or any role higher than user
      if ( Constants.roles[ client.role.type ] > Constants.roles.user ||
           Constants.roles[ client.role.type ] === Constants.roles.worker ) {

        // Ensure client has access to each audio
        (function nextAudio( i, n ) {

          if ( i >= n ) {
            return fn.apply( null, args );
          }

          API.storage.audio.get(
            {
              audio: deepmerge(
                data.audio[ i ] || {},
                {
                  states: {
                    removed: false
                  }
                }
              )
            },
            function ( err, result ) {

              if ( err ) {
                return done( err, null );
              }

              data.audio[ i ] = deepmerge( data.audio[ i ] || {}, result.audio );

              if ( multiple ) {
                return nextAudio( i + 1, n );
              }

              data.audio = data.audio[ i ];
              fn.apply( null, args );

            }
          );

        })( 0, data.audio.length );

      }
      else {

        // Get owners associated with client
        getOwners( function ( err, associated_owners ) {

          if ( err ) {
            return done( err, null );
          }

          // Ensure client has access to each audio
          (function nextAudio( i, n ) {

            if ( i >= n ) {
              return fn.apply( null, args );
            }

            API.storage.audio.get(
              {
                audio: deepmerge(
                  data.audio[ i ] || {},
                  {
                    owner: associated_owners,
                    states: {
                      removed: false
                    }
                  },
                  {
                    arrayMerge: function ( dst, src ) {
                      return src;
                    }
                  }
                )
              },
              function ( err, result ) {

                if ( err ) {
                  return done( err, null );
                }

                data.audio[ i ] = deepmerge( data.audio[ i ] || {}, result.audio );

                if ( multiple ) {
                  return nextAudio( i + 1, n );
                }

                data.audio = data.audio[ i ];
                fn.apply( null, args );

              }
            );

          })( 0, data.audio.length );

        } );

      }

    };
  }

  function validateOwner( path, fn ) {
    return function ( data, done ) {

      var args = arguments;

      // Owner checking is not appropriate for workers or any role higher than user
      if ( Constants.roles[ client.role.type ] > Constants.roles.user ||
           Constants.roles[ client.role.type ] === Constants.roles.worker ) {
        return fn.apply( null, args );
      }

      // Ensure not removed
      var entity = objectpath.set( data, path, objectpath.get( data, path, {} ) );
      entity.states = entity.states || {};
      entity.states.removed = false;

      getOwners( function ( err, associated_owners ) {

        if ( err ) {
          return done( err, null );
        }

        // If owner is not specified, set it to all client-associated owners
        if ( !entity.owner ) {
          entity.owner = associated_owners;
          return fn.apply( null, args );
        }

        // Otherwise, we need to ensure each specified owner is associated with the client
        var owners = entity.owner;
        entity.owner = [];

        // If owner is not an array, turn it into a singleton array
        if ( !Array.isArray( owners ) ) {
          owners = [ owners ];
        }

        // Validate each owner in owners
        for ( var i = 0, n = owners.length; i < n; ++i ) {
          try {

            var owner = validateObject( owners[ i ], {
              _id: { type: 'string', required: true },
              type: { type: [ Constants.types.owner ], required: true }
            } );

            // Search for owner in associated_owners
            var found = associated_owners.reduce( function ( found, associated_owner ) {
              return found || ( owner._id === associated_owner._id && owner.type === associated_owner.type );
            }, false );

            if ( !found ) {
              return done(
                {
                  code: 400,
                  type: 'validation',
                  field: 'owner[' + i + ']',
                  reason: 'Not associated with owner.',
                  err: new Error( 'Invalid input.' )
                }
              );
            }

            entity.owner.push( owner );

          }
          catch ( err ) {
            return done(
              {
                code: 400,
                type: 'validation',
                field: 'owner[' + i + ']',
                reason: 'Found malformed owner object.',
                err: new Error( 'Invalid input.' )
              },
              null
            );
          }
        }

        fn.apply( null, args );

      } );

    };
  }

  function getOwners( done ) {

    var owners = [];

    // Add client
    owners.push( client.role );

    // Add organizations associated with client
    API.directory.organization.list(
      {
        organization: {
          users: {
            _id: client.role._id
          },
          states: {
            removed: false
          }
        }
      },
      function ( err, result ) {

        if ( err ) {
          return done( err, null );
        }

        result.organizations.forEach( function ( organization ) {
          owners.push( { _id: organization._id, type: 'organization' } );
        } );

        done( null, owners );

      }
    );

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
    return deepmerge( err, tmp, { arrayMerge: arrayMergePreserveSource } );
  }

  // If there error has been caught, traced, and returned through another API server elsewhere it won't have a .err or
  // .stack
  if ( err.message && !err.stack ) {
    var tmp = buildError( new Error( err.message ) );
    return deepmerge( err, tmp, { arrayMerge: arrayMergePreserveSource } );
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

function validateObject( data, structure ) {

  const query = {};

  // Ensure data and structure are objects
  if ( data !== null && structure !== null && typeof data === 'object' && typeof structure === 'object' ) {

    // Loop through all base properties in structure
    for ( const p in structure ) {
      if ( structure.hasOwnProperty( p ) ) {

        const prop = structure[ p ];

        // Ensure property is defined properly
        if ( prop && typeof prop === 'object' ) {

          // Check if property exists in data
          if ( p in data ) {
            validate( p, prop );
          }
          else {

            // Check if this is a required property
            if ( prop.required ) {

              // Required property doesn't exist, so let's complain about it
              throw new Error( util.format( 'Missing required property: %s.', p ) );

            }

            // Set default if defined
            if ( 'default' in prop ) {
              query[ p ] = prop.default;
            }

          }

        }

        // Invalid property definition; let's complain about it
        else {
          throw new Error( util.format( 'Invalid definition for property: %s.', p ) );
        }

      }
    }

    return query;

  }

  // Shouldn't get here; let's complain about it
  throw new Error( 'Invalid usage. Ensure arguments are objects.' );

  function validate( p, prop ) {

    // Allow property to be renamed if new name is valid
    var q = p;
    if ( prop.name ) {

      // Check if the new property name isn't already in use
      if ( !( prop.name in query ) ) {
        q = prop.name;
      }
      else {

        // New property name is in use; let's complain about it
        throw new Error( util.format(
          'Unable to rename property from "%s" to "%s" because it already exists.',
          p, prop.name
        ) );

      }

    }

    // If a property type is defined, ensure the data matches
    if ( !prop.type || typeof data[ p ] === ( typeof prop.type === 'object' ? 'object' : prop.type ) ||
         Array.isArray( prop.type ) ) {

      if ( Array.isArray( prop.type ) ) {

        let found = false;

        for ( let i in prop.type ) {
          if ( prop.type.hasOwnProperty( i ) ) {
            try {
              if ( Array.isArray( prop.type[ i ] ) && prop.type[ i ].indexOf( data[ p ] ) != -1 ) {
                found = true;
                break;
              }
              else if ( prop.type[ i ] === typeof data[ p ] ) {
                found = true;
                break;
              }
              else if ( typeof prop.type[ i ] === 'object' && !Array.isArray( prop.type[ i ] ) &&
                        ( data[ p ] = validateObject( data[ p ], prop.type[ i ] ) ) ) {
                found = true;
                break;
              }
            }
            catch ( err ) {
            }
          }
        }

        // If the type was not found throw an exception otherwise continue with the filtering
        if ( !found ) {

          // Invalid property type, so let's complain about it
          throw new Error( util.format(
            'Received invalid type for property: %s. Expected: %s. Found: %s.',
            p, prop.type, typeof data[ p ]
          ) );

        }
      }

      // Property exists; let's apply the filter
      if ( typeof prop.filter === 'function' ) {

        // Apply the filter function
        const res = prop.filter( data[ p ] );

        // Don't set property if it is undefined
        if ( typeof res !== 'undefined' ) {
          query[ q ] = res;
        }

      }

      // Apply pre-defined filters
      else if ( typeof prop.filter === 'string' ) {

        // Attempt to convert to number
        if ( prop.filter === 'number' ) {
          query[ q ] = parseFloat( data[ p ] ) || 0;
        }

        // Convert to string
        else if ( prop.filter === 'string' ) {
          query[ q ] = ( data[ p ] || '' ).toString();
        }

        // Trim off bounding whitespace
        else if ( prop.filter === 'trim' ) {
          if ( data[ p ] ) {

            const trimmed = data[ p ].trim();

            if ( trimmed ) {
              query[ q ] = trimmed;
            }

          }
        }

        // Convert to Mongo ObjectId
        else if ( prop.filter === 'MongoId' ) {
          query[ q ] = ObjectId( ( data[ p ] || '' ).toString() );
        }

        // Convert to Date object
        else if ( prop.filter === 'Date' ) {
          query[ q ] = new Date( ( data[ p ] || '' ).toString() );
        }

        // Run regex
        else if ( prop.filter === 'regex' ) {
          if ( data[ p ] ) {
            query[ q ] = new RegExp( regexEscape( data[ p ].toString().trim() ), 'i' );
          }
        }

        // Handle projection fields
        else if ( prop.filter === 'projection' ) {

          query[ p ] = validateObject( data[ p ], prop.type );

          // Ensure all property values are false
          const keys = Object.keys( query[ p ] );
          for ( let i = 0, n = keys.length; i < n; ++i ) {
            if ( query[ p ][ keys[ i ] ] !== false ) {
              throw new Error( 'Invalid projection value.' );
            }
          }

        }

        // Invalid filter; let's complain about it
        else {
          throw new Error( util.format( 'Invalid filter name: %s, for property: %s.', prop.filter, p ) );
        }

      }
      else if ( typeof prop.type === 'object' && !Array.isArray( prop.type ) ) {

        // Recursively validate object
        var obj = validateObject( data[ p ], prop.type );

        // Check if we need to flatten properties
        if ( prop.flatten ) {

          // Loop through all props in obj
          Object.keys( obj ).forEach( function ( o ) {

            q = p + '.' + o;

            // Check if the flattened property name isn't already in use
            if ( q in query ) {

              // New property name is in use; let's complain about it
              throw new Error( util.format(
                'Unable to flatten property %s under "%s" to "%s" because it already exists.',
                o, p, q
              ) );

            }

            query[ q ] = obj[ o ];

          } );

        }
        else {
          query[ q ] = obj;
        }

      }
      else {

        // Pass the value through
        query[ q ] = data[ p ];

      }

    }
    else {

      // Invalid property type, so let's complain about it
      throw new Error( util.format(
        'Received invalid type for property: %s. Expected: %s. Found: %s.',
        p, prop.type, typeof data[ p ]
      ) );

    }

    if ( !( q in query ) && prop.required ) {
      throw new Error( util.format( 'Missing required post-filter property: %s.', p ) );
    }

  }

}

function validateOwner( data, criteria ) {

  // If owner is defined, we need to validate it
  if ( !( 'owner' in data ) ) {
    return;
  }

  var owners = { $in: [] };

  var _owners = data.owner;

  // If owner is not an array, turn it into a singleton array
  if ( !Array.isArray( _owners ) ) {
    _owners = [ _owners ];
  }

  // Validate each element in the array
  for ( var i = 0, n = _owners.length; i < n; ++i ) {

    // Validate the owner object
    var owner = validateObject( _owners[ i ], {
      _id: { type: 'string', required: true },
      type: { type: [ Constants.types.owner ], required: true }
    } );

    // Add owner object to our match criteria
    owners.$in.push( owner );

  }

  criteria.owner = owners;

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

function checkRole( role, allowed ) {

  var checkObject = function ( role, allowed ) {

    if ( 'not' in allowed ) {
      return role !== allowed.not;
    }

    // If both provided with both bounds use more restrictive option
    if ( 'gt' in allowed && 'gte' in allowed ) {
      delete allowed.gte;
    }
    if ( 'lt' in allowed && 'lte' in allowed ) {
      delete allowed.lte;
    }

    // Only less than
    if ( ( 'lt' in allowed || 'lte' in allowed ) && !( 'gt' in allowed || 'gte' in allowed ) ) {
      return role < allowed.lt || role <= allowed.lte;
    }

    // Only greater than
    if ( !( 'lt' in allowed || 'lte' in allowed ) && ( 'gt' in allowed || 'gte' in allowed ) ) {
      return role > allowed.gt || role >= allowed.gte;
    }

    // Within range
    if ( ( 'lt' in allowed ? allowed.lt : 'lte' in allowed ? allowed.lte : false ) >=
         ( 'gt' in allowed ? allowed.gt : 'gte' in allowed ? allowed.gte : false ) ) {
      return ( role < allowed.lt || role <= allowed.lte ) && ( role > allowed.gt || role >= allowed.gte );
    }

    // Outside range
    if ( ( 'lt' in allowed ? allowed.lt : 'lte' in allowed ? allowed.lte : true ) <
         ( 'gt' in allowed ? allowed.gt : 'gte' in allowed ? allowed.gte : false ) ) {
      return ( role < allowed.lt || role <= allowed.lte ) || ( role > allowed.gt || role >= allowed.gte );
    }

    // invalid object or check failure case
    return false;

  };

  if ( typeof allowed === 'number' ) {
    return role === allowed;
  }

  if ( Array.isArray( allowed ) ) {

    var matched = false;

    allowed.forEach( function ( e ) {

      // If object then check object
      if ( typeof e === 'object' && !matched ) {
        if ( checkObject( role, e ) ) {
          matched = true;
        }
      }
      else if ( e === role && !matched ) {
        matched = true;
      }

    } );

    return matched;

  }

  if ( typeof allowed === 'object' ) {
    return checkObject( role, allowed );
  }

  return false;

}

function redact( data ) {
  return JSON.parse(
    JSON.stringify( data, ( k, v ) => REDACTED_FIELDS.some( f => k.indexOf( f ) !== -1 ) ? 'REDACTED' : v
    ) );
}
