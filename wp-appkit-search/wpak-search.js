/**
 * WpakSearch Module : loaded on app init, can be used in any template, 
 * in function.js, or in any function.js sub-module to launch a search 
 * and retrieve info about the current search.
 */
define( function( require ) {

	"use strict";

	var _ = require( 'underscore' ),
		App = require( 'core/app' ),
		ThemeApp = require( 'core/theme-app' ),
		TemplateTags = require( 'core/theme-tpl-tags' ),
		Items = require('core/models/items');
	
	var WpakSearch = {};
	
	var current_search = {
		string : '',
		total : 0,
		items_ids : [] //Used to know items order (JSON objects indexed on ids are auto ordered by id, which we don't want).
	};
	
	/**
	 * Test if the current (or given) screen is a search screen.
	 * 
	 * @param {string} screen_type (Optional) Can be 'results' or 'single' to check a specific search screen.
	 * @param {type} screen (Optional) If provided, will check the given screen, if not will check the current screen.
	 * @returns {Boolean} True if the current (or given) screnn is a search screen.
	 */
	WpakSearch.isSearchScreen = function( screen_type, screen ){
		var is_search_screen = false;
		
		screen = screen === undefined ? TemplateTags.getCurrentScreen() : screen;
		
		var screen_type_undefined = ( screen_type === undefined || screen_type === '' );
		
		if ( screen.item_id === 'wpak-search' ) {
			is_search_screen = screen_type_undefined || screen_type === 'results'; 
		} else if ( screen.screen_type === 'single' && screen.global === 'search-results' ) {
			is_search_screen = screen_type_undefined || screen_type === 'single'; 
		}
		
		return is_search_screen;
	};
	
	WpakSearch.getSearchString = function(){
		return current_search.string;
	};
	
	WpakSearch.getTotalResults = function(){
		return current_search.total;
	};
	
	WpakSearch.search = function( options ) {
		
		current_search.string = '';
		current_search.total = 0;
		
		var search_string = options.string ? options.string : '';
		
		//Search by component : 
		var components_slugs = options.components ? options.components : [];
		
		//Custom search query :
		var post_type = options.post_type ? options.post_type : ''; //String or array of string
		var tax_query = options.tax_query ? options.tax_query : [];
		var order = options.order ? options.order : '';
		var orderby = options.orderby ? options.orderby : '';

		var redirect_after_search = !options.hasOwnProperty('redirect_after_search') || options.redirect_after_search === true;

		//If no component provided and no custom search query option set, get all posts-list components :
		if ( ( search_string != '' && !tax_query.length && post_type === '' ) || components_slugs == 'wpak-all-components' ) {
			components_slugs = _.map( App.getComponents( { type: 'posts-list' } ), function( model ) { return model.get('id'); } );
		}
		
		var live_query_args = {
			wpak_search : true,
		};
		
		if ( search_string != '' ) {
			live_query_args.wpak_search_s = search_string;
			current_search.string = search_string;
		}
		
		if ( components_slugs.length ) {
			live_query_args.wpak_search_component = components_slugs;
		}
		
		if ( post_type != '' ) {
			live_query_args.wpak_search_post_type = post_type;
		}
		
		if ( tax_query.length ) {
			live_query_args.wpak_search_taxonomies = tax_query;
		}
		
		if ( order.length ) {
			live_query_args.wpak_search_order = order;
		}
		
		if ( orderby.length ) {
			live_query_args.wpak_search_orderby = orderby;
		}
		
		ThemeApp.liveQuery( 
			live_query_args, 
			{ 
				type: 'replace', 
				persistent: false,
				success: function( answer ) {
					
					if( answer.totals && answer.totals.hasOwnProperty( 'total' ) ) {
						current_search.total = answer.totals.total;
					}
					
					if ( answer.items_ids && answer.items_ids.length ) {
						_.each( answer.items_ids, function( post_id ){
							current_search.items_ids.push( post_id );
						} );
					}
					
					if ( redirect_after_search ) {
						ThemeApp.navigate( 'wpak-search' );
					}
					
					if( options.success ) {
						options.success( answer );
					}
				},
				error: function( error_data ) {
					if ( options.error ) {
						options.error( error_data );	
					}
				}
			}
		);

	};
	
	WpakSearch.reset = function(){
		current_search.string = '';
		current_search.total = 0;
		current_search.items_ids = [];
		App.resetGlobalItems( 'search-results' );
	};
	
	WpakSearch.getItems = function() {
		var items = new Items.ItemsSlice();
		
		if ( current_search.items_ids.length ) {
			items = App.getGlobalItemsSlice( 'search-results', current_search.items_ids );
		}
		
		return items;
	};
	
	return WpakSearch;
} );


