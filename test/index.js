/* eslint no-magic-numbers: "warn" */

'use strict';

const Utils = require( '..' );

module.exports = function () {

  describe( '.checkRole', function () {

    it( 'should return false with invalid input type for role',
      function ( done ) {

        if ( Utils.checkRole( 'cat', 20 ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false with invalid input type for allowed',
      function ( done ) {

        if ( Utils.checkRole( 20, 'cat' ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false with number type for allowed and mismatched role',
      function ( done ) {

        if ( Utils.checkRole( 12, 20 ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return true with number type for allowed and matching role',
      function ( done ) {

        if ( !Utils.checkRole( 20, 20 ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return false with empty array for allowed and mismatched role',
      function ( done ) {

        if ( Utils.checkRole( 20, [] ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false with array for allowed, containing a single number, and mismatched role',
      function ( done ) {

        if ( Utils.checkRole( 20, [ 13 ] ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return true with array for allowed, containing a single number, and matching role',
      function ( done ) {

        if ( !Utils.checkRole( 20, [ 20 ] ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return false with array for allowed, containing multiple numbers, and mismatched role',
      function ( done ) {

        if ( Utils.checkRole( 20, [ 12, 13, 14 ] ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return true with array for allowed, containing multiple numbers, and matching role',
      function ( done ) {

        if ( !Utils.checkRole( 20, [ 12, 132, 20 ] ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return false with array for allowed, containing an object, and mismatched role',
      function ( done ) {

        if ( Utils.checkRole( 20, [ { lt: 11, gt: 10 } ] ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return true with array for allowed, containing an object, and matching role',
      function ( done ) {

        if ( !Utils.checkRole( 20, [ { lt: 30, gt: 10 } ] ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return false with an array for allowed, containing an invalid type, and a mathcing role',
      function ( done ) {

        if ( Utils.checkRole( 20, [ 'cat' ] ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false with an object for allowed that has an invalid format',
      function ( done ) {

        if ( Utils.checkRole( 20, {} ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false with an object for allowed that has a not parameter and matching role',
      function ( done ) {

        if ( Utils.checkRole( 20, { not: 20 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return true with an object for allowed that has a not parameter and mismatched role',
      function ( done ) {

        if ( !Utils.checkRole( 20, { not: 12 } ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return false with an object for allowed and a gt parameter and mismatched role',
      function ( done ) {

        if ( Utils.checkRole( 20, { gt: 25 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false with an object for allowed and a gt parameter and mismatched role on edge case',
      function ( done ) {

        if ( Utils.checkRole( 20, { gt: 20 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false with an object for allowed and a gte parameter and mismatched role',
      function ( done ) {

        if ( Utils.checkRole( 20, { gte: 21 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false with an object for allowed and both gt and gte parameters and mismatched role',
      function ( done ) {

        if ( Utils.checkRole( 20, { gte: 21, gt: 25 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it(
      'should return false with an object for allowed and both gt and gte parameters and mismatched role and edge case',
      function ( done ) {

        if ( Utils.checkRole( 20, { gte: 21, gt: 20 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return true with an object for allowed and a gt parameter and matching role',
      function ( done ) {

        if ( !Utils.checkRole( 20, { gt: 19 } ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return true with an object for allowed and a gte parameter and matching role',
      function ( done ) {

        if ( !Utils.checkRole( 20, { gte: 19 } ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return true with an object for allowed and a gte parameter and matching role and edge case',
      function ( done ) {

        if ( !Utils.checkRole( 20, { gte: 20 } ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return true with an object for allowed and both gt and gte parameters and matching role',
      function ( done ) {

        if ( !Utils.checkRole( 20, { gt: 19, gte: 25 } ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return false with an object for allowed and a lt parameter and mismatched role',
      function ( done ) {

        if ( Utils.checkRole( 20, { lt: 19 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false with an object for allowed and a lt parameter and mismatched role edge case',
      function ( done ) {

        if ( Utils.checkRole( 20, { lt: 20 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false with an object for allowed and a lte parameter and mismatched role',
      function ( done ) {

        if ( Utils.checkRole( 20, { lte: 19 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false with an object for allowed and both lt and lte parameters and mismatched role',
      function ( done ) {

        if ( Utils.checkRole( 20, { lte: 50, lt: 19 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false with an object for allowed and both lt and lte parameters and mismatched role edge case',
      function ( done ) {

        if ( Utils.checkRole( 20, { lte: 50, lt: 20 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return true with an object for allowed and a lt parameter and matching role',
      function ( done ) {

        if ( !Utils.checkRole( 20, { lt: 21 } ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return true with an object for allowed and a lte parameter and matching role',
      function ( done ) {

        if ( !Utils.checkRole( 20, { lte: 21 } ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return true with an object for allowed and a lte parameter and matching role edge case',
      function ( done ) {

        if ( !Utils.checkRole( 20, { lte: 20 } ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return true with an object for allowed and both lt and lte parameters and matching role',
      function ( done ) {

        if ( !Utils.checkRole( 20, { lt: 21, lte: 5 } ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return false for an object for allowed and a within range comparison with lt and gt and an invalid' +
      ' lower bound for role',
      function ( done ) {

        if ( Utils.checkRole( 10, { lt: 21, gt: 19 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false for an object for allowed and a within range comparison with lt and gt and an invalid' +
      ' lower bound for role edge case',
      function ( done ) {

        if ( Utils.checkRole( 19, { lt: 21, gt: 19 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false for an object for allowed and a within range comparison with lt and gt and an invalid' +
      ' upper bound for role',
      function ( done ) {

        if ( Utils.checkRole( 22, { lt: 21, gt: 19 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false for an object for allowed and a within range comparison with lt and gt and an invalid' +
      ' upper bound for role edge case',
      function ( done ) {

        if ( Utils.checkRole( 21, { lt: 21, gt: 19 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false for an object for allowed and a within range comparison with lte and gt and an invalid' +
      ' upper bound for role',
      function ( done ) {

        if ( Utils.checkRole( 22, { lte: 21, gt: 19 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false for an object for allowed and a within range comparison with lt and gte and an invalid' +
      ' lower bound for role',
      function ( done ) {

        if ( Utils.checkRole( 18, { lt: 21, gte: 19 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return true for an object for allowed and a within range comparison with lt and gt and an valid role',
      function ( done ) {

        if ( !Utils.checkRole( 20, { lt: 21, gt: 19 } ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return true for an object for allowed and a within range comparison with lte and gt and an valid role' +
      ' on upper bound',
      function ( done ) {

        if ( !Utils.checkRole( 21, { lte: 21, gt: 19 } ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return true for an object for allowed and a within range comparison with lt and gte and an valid role' +
      ' on lower bound',
      function ( done ) {

        if ( !Utils.checkRole( 19, { lte: 21, gte: 19 } ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return false for an object for allowed and a outside range comparison with lt and gt and an invalid' +
      ' lower bound for role',
      function ( done ) {

        if ( Utils.checkRole( 20, { lt: 19, gt: 21 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false for an object for allowed and a outside range comparison with lt and gt and an invalid' +
      ' lower bound for role edge case',
      function ( done ) {

        if ( Utils.checkRole( 19, { lt: 19, gt: 21 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false for an object for allowed and a outside range comparison with lt and gt and an invalid' +
      ' upper bound for role edge case',
      function ( done ) {

        if ( Utils.checkRole( 21, { lt: 19, gt: 21 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false for an object for allowed and a outside range comparison with lte and gt and an invalid' +
      ' upper bound for role',
      function ( done ) {

        if ( Utils.checkRole( 20, { lte: 19, gt: 21 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return false for an object for allowed and a outside range comparison with lt and gte and an invalid' +
      ' lower bound for role',
      function ( done ) {

        if ( Utils.checkRole( 20, { lt: 19, gte: 21 } ) ) {
          return done( new Error( 'Expected falsey response' ) );
        }

        done();

      } );

    it( 'should return true for an object for allowed and a outside range comparison with lt and gt and an valid role' +
      ' above',
      function ( done ) {

        if ( !Utils.checkRole( 10, { lt: 19, gt: 21 } ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return true for an object for allowed and a outside range comparison with lt and gt and an valid role' +
      ' below',
      function ( done ) {

        if ( !Utils.checkRole( 30, { lt: 19, gt: 21 } ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return true for an object for allowed and a outside range comparison with lte and gt and an valid' +
      ' role on upper bound',
      function ( done ) {

        if ( !Utils.checkRole( 19, { lte: 19, gt: 21 } ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

    it( 'should return true for an object for allowed and a outside range comparison with lt and gte and an valid' +
      ' role on lower bound',
      function ( done ) {

        if ( !Utils.checkRole( 21, { lt: 19, gte: 21 } ) ) {
          return done( new Error( 'Expected truthy response' ) );
        }

        done();

      } );

  } );

};
