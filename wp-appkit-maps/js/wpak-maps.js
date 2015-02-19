define( function( require ) {

	"use strict";

	var $ = require( 'jquery' ),
		_ = require( 'underscore' ),
		App = require( 'core/app' ),
		TplTags = require( 'core/theme-tpl-tags' ),
		Geoloc = require( 'core/phonegap/geolocation' );

	var maps = { };

	var map = null;
	
	var createMapType = function( map_type, args, cb_ok, cb_error ) {
		if ( map_type == 'google-map' ) {
			require( [ 'addons/wp-appkit-maps/js/map-types/google-maps' ], function( GoogleMaps ) {
				map = GoogleMaps.create( args );
				if( cb_ok ){
					cb_ok( map );
				}
			} );
		}
	};

	maps.createMap = function( args, cb_ok, cb_error ) {

		var defaults = {
			component: null,
			items: [ ],
			current_pos: { },
			el: '#wpak-maps-map',
			options: {
				show_current_pos: true,
				item_link: 'single',
				current_pos_in_bounds: true
			},
			vendor_options: {},
			type: 'google-map'
		};

		args = _.extend( defaults, args );

		if ( args.hasOwnProperty( 'component' ) ) {
			var component_id = args.component;
			var component = App.getComponentData( component_id );
			
			if ( component ) {
				var items = [ ];
				if ( component.view_data.hasOwnProperty('posts') && component.view_data.posts.length ) {
					component.view_data.posts.each( function( item ) {
						var item_id = item.get('id');
						var map_item = { lat: 0, lng: 0, label: '', address: '', id: item_id, link: TplTags.getPostLink( item_id, component.global )  };
						var position = item.get( 'position' );
						if ( position && position.hasOwnProperty( 'lat' ) && position.hasOwnProperty( 'lng' ) ) {
							map_item.lat = position.lat;
							map_item.lng = position.lng;
							if ( position.hasOwnProperty( 'address' ) ) {
								map_item.address = position.address;
								map_item.label = item.get('title');
							}
							items.push( map_item );
						}
					} );
				}
				args.items = items;
			}
		}

		if ( args.options.show_current_pos ) {
			Geoloc.getCurrentPosition( function( current_position ) {
				args.current_pos = current_position;
				createMapType( args.type, args, cb_ok, cb_error );
			} );
		} else {
			createMapType( args.type, args, cb_ok, cb_error );
		}
		
	};

	return maps;
} );

