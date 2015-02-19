define( [ 'jquery', 'core/theme-app', 'addons/wp-appkit-maps/js/wpak-maps' ], function( $, App, Maps ) {
 
	App.filter( 'component-data', function( component_data, component ) {
		if( component.get('type') == 'maps' ) {
			var data = component.get('data');
			var items = App.getGlobalItems( component.get('global'), data.ids );
			component_data = {
				type: 'maps',
				view_data: {posts:items,title: component.get('label'), total: data.total}, //We will create an archive view > pass archive arguments
				data: data
			};
		}
		return component_data;
	} );
	
	App.filter( 'component-custom-type', function( screen_view_data, component ) {
		if( component.type == 'maps' ) {
			screen_view_data = {
				view_type: 'posts-list', //Create Archive type view
				view_data: component.view_data,
				screen_data: {screen_type:'map',component_id:component.id,item_id:0,global:component.global,data:component.data,label:component.label}
			};
		}
		return screen_view_data;
	} );

	App.filter( 'template', function( template, current_screen ) {
		if ( current_screen.screen_type == 'map' ) {
			template = 'addons/wp-appkit-maps/wpak-map-template';
		}
		return template;
	} );
	
	App.filter( 'make-history', function( history_action, history_stack, queried_screen_data, current_screen, previous_screen ) {
		if( queried_screen_data.screen_type == 'map' ) {
			history_action = 'empty-then-push';
		}else if( queried_screen_data.screen_type == 'single' && current_screen.screen_type == 'map' ){
			history_action = 'push';
		}
		return history_action;
	} );
	
	App.filter( 'is-static-screen', function( is_static, screen ) {
		if( screen.screen_type == 'map' ){
			is_static = true;
		}
		return is_static;
	} );

	App.on( 'screen:showed', function( current_screen, view, first_static_opening ) {
		if ( current_screen.screen_type == 'map' ) {
			var $default_map = $('#wpak-maps-map');
			if( $default_map.length ) {
				$('#app-layout').addClass('wpak-map');
				if( first_static_opening ) {
					$default_map.height($('#app-layout').outerHeight());
					Maps.createMap({
						component: current_screen.component_id
					});
				}
			}
		} 
	} );

	App.on( 'screen:leave', function( current_screen, new_screen, view ) {
		if ( current_screen.screen_type == 'map' ) {
			var $default_map = $('#wpak-maps-map');
			if( $default_map.length ) {
				$('#app-layout').removeClass('wpak-map');
			}
		}
	} );
	
} );