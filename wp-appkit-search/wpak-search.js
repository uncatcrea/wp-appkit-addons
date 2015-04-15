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
		Items = require( 'core/models/items' );
	
	var WpakSearch = {};
	
	var current_search = {
		string : '',
		total : 0,
		query_args : {},
		items_ids : [], //Used to know items order (JSON objects indexed on ids are auto ordered by id, which we don't want).
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
	
	WpakSearch.search = function( options ) {
		
		//Search results pagination :
		//We can't use "before_item" logic (as for posts list components)
		//because WP search ordering is not made on date but on search pertinence :
		//"ORDER BY wp_posts.post_title LIKE '%search_string%' DESC"
		var page = 1;
		var getting_more = false;
		if ( options.get_more && options.get_more === true ) {
			getting_more = true;
		} else if ( options.page ) {
			page = parseInt(options.page);
		}

		var live_query_args = {
			wpak_search : true
		};
		
		if ( !getting_more ) {
			
			current_search.items_ids = [];
			current_search.string = '';
			current_search.total = 0;
			current_search.query_args = {};

			var search_string = options.string ? options.string : '';

			//Search by component : 
			var components_slugs = options.components ? options.components : [];

			//Custom search query :
			var post_type = options.post_type ? options.post_type : ''; //String or array of string
			var tax_query = options.tax_query ? options.tax_query : [];
			var order = options.order ? options.order : '';
			var orderby = options.orderby ? options.orderby : '';

			//If no component provided and no custom search query option set, get all posts-list components :
			if ( ( search_string !== '' && !tax_query.length && post_type === '' ) || components_slugs === 'wpak-all-components' ) {
				components_slugs = _.map( App.getNavigationComponents( { type: 'posts-list' } ), function( component ) { return component.get('id'); } );
			}
			
			if ( search_string !== '' ) {
				live_query_args.wpak_search_s = search_string;
				current_search.string = search_string;
			}

			if ( components_slugs.length ) {
				live_query_args.wpak_search_component = components_slugs;
			}

			if ( post_type !== '' ) {
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

			live_query_args.wpak_search_page = page > 1 ? page : 1;
			
		} else {
			
			//Getting more search results for the same search query :
			live_query_args = current_search.query_args;
			
			//Just increment live_query_args.wpak_search_page :
			live_query_args.wpak_search_page = live_query_args.wpak_search_page + 1;
			
		}
		
		current_search.query_args = live_query_args;
		
		//Trigger or not trigger search route or not after search :
		//By default we redirect to search screen :
		var redirect_after_search = !options.hasOwnProperty('redirect_after_search') || options.redirect_after_search === true;
		
		//Reload or not reload current view after search :
		//If we redirect route, we don't need to reload view.
		//By default, if we don't redirect, we reload view.
		var reload_view_after_search = !redirect_after_search && ( !options.hasOwnProperty('reload_view_after_search') || options.reload_view_after_search === true );

		ThemeApp.liveQuery( 
			live_query_args, 
			{ 
				type: live_query_args.wpak_search_page > 1 ? 'update' : 'replace', 
				persistent: false,
				success: function( answer, update_results ) {
					
					var update_results = update_results.hasOwnProperty( 'search-results' ) ? update_results['search-results'] : {};
					
					if( answer.totals && answer.totals.hasOwnProperty( 'total' ) ) {
						current_search.total = answer.totals.total;
					}
					
					if ( answer.items_ids && answer.items_ids.length ) {
						_.each( answer.items_ids, function( post_id ) {
							current_search.items_ids.push( post_id );
						} );
					}
					
					var nb_left = 0;
					if ( current_search.total > 0 && current_search.total > current_search.items_ids.length ) {
						nb_left = current_search.total - current_search.items_ids.length;
					}
					
					var new_items = [];
					if ( update_results.data && update_results.data.new_items ) {
						new_items = update_results.data.new_items;
					}
							
					if ( redirect_after_search ) {
						ThemeApp.navigate( 'wpak-search' );
					} else if ( reload_view_after_search ) {
						//New search results have been added to the "search-results" global in live-query,
						//so we don't need to add them to the current view here, just re-render it!
						ThemeApp.rerenderCurrentScreen();
					}
					
					if( options.success ) {
						options.success( 
							answer, 
							{ 
								new_items: new_items, 
								nb_left: nb_left, 
								is_last: ( nb_left === 0 ) ,
								total: current_search.total,
								page: current_search.query_args.wpak_search_page
							} 
						);
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
		current_search.query_args = {};
		App.resetGlobalItems( 'search-results' );
	};
	
	WpakSearch.getSearchString = function(){
		return current_search.string;
	};
	
	WpakSearch.getTotalResults = function(){
		return current_search.total;
	};
	
	WpakSearch.getItems = function() {
		var items = new Items.ItemsSlice();
		
		if ( current_search.items_ids.length ) {
			items = App.getGlobalItemsSlice( 'search-results', current_search.items_ids );
		}
		
		return items;
	};
	
	WpakSearch.getNbItemsLeft = function() {
		var nb_left = 0;
		
		if ( current_search.total > current_search.items_ids.length ) {
			nb_left = current_search.total - current_search.items_ids.length;
		}
	
		return nb_left;
	};
	
	WpakSearch.getPaginationData = function() {
		var nb_left = WpakSearch.getNbItemsLeft();
		return { 
			nb_left: nb_left, 
			is_last: ( nb_left === 0 ),
			total: current_search.total,
			page: current_search.query_args.wpak_search_page
		}
	};
	
	return WpakSearch;
} );


