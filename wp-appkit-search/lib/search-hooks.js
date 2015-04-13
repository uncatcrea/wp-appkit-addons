define( function( require ) {

	"use strict";

	var ThemeApp = require( 'core/theme-app' ),
		TemplateTags = require( 'core/theme-tpl-tags' ),
		WpakSearch = require( 'addons/wp-appkit-search/wpak-search');
		
	ThemeApp.addCustomRoute( 'wpak-search', 'archive', { 
		total:0, //Default archive template field
		posts:[], //Default archive template field
		list_title: 'Search', //Default archive template field //TODO : handle translation...
		search_string:'', 
		WpakSearch: WpakSearch 
	} ); 
	
	ThemeApp.filter( 'template-args', function( template_args, view_type, view_template ){ 
		var current_screen = TemplateTags.getCurrentScreen();
		
		if( current_screen.item_id == 'wpak-search' ) {
			template_args.posts = WpakSearch.getItems().toJSON();
			template_args.total = WpakSearch.getTotalResults(); 
			template_args.search_string = WpakSearch.getSearchString(); 
		}
		
		//Set WpakSearch module for all templates (must be available in layout.html for example) :
		template_args.WpakSearch = WpakSearch; 
		
		return template_args;
	} );
	
	ThemeApp.filter( 'make-history', function( history_action, history_stack, queried_screen_data, current_screen, previous_screen ){ 
		if( current_screen.item_id == 'wpak-search' && queried_screen_data.screen_type == 'single' ) {
			history_action = 'push';
		}
		return history_action;
	} );
	
	ThemeApp.filter( 'current-screen-global', function( current_screen_global, current_screen, global ){ 
		if( WpakSearch.isSearchScreen( '', current_screen ) ) {
			current_screen_global = 'search-results';
		}
		return current_screen_global;
	} );

} );


