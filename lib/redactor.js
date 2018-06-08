'use strict';

class ObjectRedactor {

  constructor( keys ) {
    this.keys = keys;
  }

  redact( data ) {
    return JSON.parse(
      JSON.stringify(
        data,
        ( k, v ) => this.keys.some( f => k.indexOf( f ) !== -1 ) ? 'REDACTED' : v
      )
    );
  }

}

module.exports = {
  object: ObjectRedactor
};
