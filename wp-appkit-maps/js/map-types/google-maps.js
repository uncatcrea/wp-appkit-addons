define( function( require ) {

	"use strict";

	var $   = require( 'jquery' ),
		_   = require( 'underscore' ),
		ThemeApp = require( 'core/theme-app' );
		
	var map = {};
	
	var googleMap = null;

	map.create = function( args ) {
		require( ['async!http://maps.google.com/maps/api/js?sensor=false'], function() {
			
			googleMap = new google.maps.Map( $(args.el)[0], args.vendor_options );
			
			var bounds_markers = [];
			
			if( args.items.length ) {
				
				_.each( args.items, function( item ) {
					var lat_lng = new google.maps.LatLng( item.lat, item.lng );
					
					var marker_args = {
						position: lat_lng,
						map: googleMap,
						title: item.label +' - '+ item.address
					};
					
					if( item.link && args.options.item_link == 'single') {
						marker_args.url = item.link;
					}
					
					var marker = new google.maps.Marker(marker_args);
					
					if( marker_args.url ) {
						google.maps.event.addListener( marker, 'click', function() {
							ThemeApp.navigate( marker.url );
						} );
					}
					
					bounds_markers.push(marker);
				} );
				
			}
			
			if( args.options.show_current_pos && !_.isEmpty(args.current_pos) ) {
				
				var markerOpts = {
					'clickable': false,
					'cursor': 'pointer',
					'draggable': false,
					'flat': true,
					'icon': {
						'url': 'http://chadkillingsworth.github.io/geolocation-marker/images/gpsloc.png',
						'size': new google.maps.Size( 34, 34 ),
						'scaledSize': new google.maps.Size( 17, 17 ),
						'origin': new google.maps.Point( 0, 0 ),
						'anchor': new google.maps.Point( 8, 8 )
					},
					// This marker may move frequently - don't force canvas tile redraw
					'optimized': false,
					'position': new google.maps.LatLng( 0, 0 ),
					'title': 'Current location',
					'zIndex': 2
				};
				
				var circleOpts = {
					'clickable': false,
					'radius': 0,
					'strokeColor': '1bb6ff',
					'strokeOpacity': .4,
					'fillColor': '61a0bf',
					'fillOpacity': .4,
					'strokeWeight': 1,
					'zIndex': 1
				};
				
				var marker = new google.maps.Marker(markerOpts);
				var circle = new google.maps.Circle(circleOpts);
  
				var lat_lng = new google.maps.LatLng( args.current_pos.lat, args.current_pos.lng );
				
				marker.setPosition( lat_lng );
				circle.setCenter( lat_lng );
				circle.setRadius( args.current_pos.accuracy );
				
				marker.setMap( googleMap );
				circle.setMap( googleMap );
				
				if( args.options.current_pos_in_bounds ) {
					bounds_markers.push( marker );
				}
			}
			
			if( bounds_markers.length ) {
				var google_bounds = new google.maps.LatLngBounds();
				_.each( bounds_markers, function( marker ) {
					google_bounds.extend( marker.getPosition() );
				} );
				googleMap.fitBounds(google_bounds);
			}
			
			//If the map has not been setted correctly, set a default position :
			if ( !googleMap.getCenter() ) {
				googleMap.setCenter( new google.maps.LatLng( 46.613071, 2.466174 ) ); //Center of France ;)
				googleMap.setZoom( 6 );
			}
			
		});
	};

	return map;
} );