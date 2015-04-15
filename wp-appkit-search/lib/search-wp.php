<?php

class WpakSearch {
	
	protected static $default_search_component_types = array( 'posts-list' );
	
	public static function hooks() {
		add_filter( 'wpak_live_query', array( __CLASS__, 'search_query'), 20, 3 );
	}

	public static function search_query( $service_answer, $query_params, $app_id ){
		
		if ( isset( $query_params['wpak_search'] ) && $query_params['wpak_search'] === 'true' ) {

			$service_answer = array(
				'globals' => array( 'search-results' => array() ),
				'items_ids' => array(),
				'totals' => array( 'components' => array(), 'total' => 0 )
			);
			
			$app_id = WpakApps::get_app_id( $app_id );

			$search_string = !empty( $query_params['wpak_search_s'] ) ? sanitize_text_field( $query_params['wpak_search_s'] ) : '';
			
			if ( !empty( $query_params['wpak_search_component'] ) ) {
				
				$components_slugs = is_array( $query_params['wpak_search_component'] ) ? $query_params['wpak_search_component'] : array( $query_params['wpak_search_component'] );
				
				foreach ( $components_slugs as $component_slug ) {
					
					if ( WpakComponentsStorage::component_exists( $app_id, $component_slug ) ) {
						
						$component = WpakComponentsStorage::get_component( $app_id, $component_slug );
						if( !empty($component) ) {
							
							if( in_array( $component->type, self::$default_search_component_types ) ) {
								
								if( $component->type == 'posts-list' ) {
									add_filter( 'wpak_posts_list_query_args', array( __CLASS__, 'add_posts_list_search_query_args'), 20, 2 );
									add_filter( 'wpak_posts_list_posts_per_page', array( __CLASS__, 'posts_list_search_nb_results'), 20, 4 );
								}
								
								/**
								 * Use this hook to customize what will be retured by WpakComponents::get_component_data().
								 * For example to add 'wpak_posts_list_query_args' filters that will alter get_component_data()'s WP_Query.
								 */
								do_action( 'wpak_search_addon_before_get_component_data', $component, $query_params, $app_id );
								
								$component_data = WpakComponents::get_component_data( $app_id, $component_slug );
								if ( !empty( $component_data ) && !empty( $component_data['globals'] ) ) {
									foreach ( $component_data['globals'] as $global => $items ) {
										foreach ( $items as $k => $item ) {
											$service_answer['globals']['search-results'][$k] = $item;
											$service_answer['items_ids'][] = $k;
										}
									}
									
									$service_answer['items_ids'] = array_values( array_unique( $service_answer['items_ids'] ) );

									if( isset($component_data['component']['data']['total']) ) {
										$service_answer['totals']['components'][$component_slug] = $component_data['component']['data']['total'];
									}
								}
							}
							
							/**
							 * Use this hook to handle manually what should be the search result for the given $component.
							 */
							$service_answer = apply_filters( 'wpak_search_addon_component_service_answer', $service_answer, $component, $query_params, $app_id ); 
							
						}
					}
				}
				
				if ( count( $components_slugs ) > 1 ) {
					//When we retrieve search results from more that one component, the "total search results including pagination > 1"
					//can't be summed because the same posts can be in more than one component results. 
					//This is too bad, but we have to return just the first search page result page (of each component) total :
					$service_answer['totals']['total'] = count ( $service_answer['globals']['search-results'] );
				} else {
					$service_answer['totals']['total'] = $service_answer['totals']['components'][reset($components_slugs)];
				}
				
			} else if ( 
				( !empty( $query_params['wpak_search_taxonomies'] ) && is_array( $query_params['wpak_search_taxonomies'] ) )
				|| ( !empty( $query_params['wpak_search_post_type'] ) )
			) {
				
				$tax_query = array();
				
				if ( !empty( $query_params['wpak_search_taxonomies'] ) ) {
					$tax_query_raw = $query_params['wpak_search_taxonomies'];
					foreach ( $tax_query_raw as $tax_query_element ) {
						if ( !empty( $tax_query_element['relation'] ) ) {
							$tax_query['relation'] = $tax_query_element['relation'];
						} else if ( !empty( $tax_query_element['taxonomy'] ) ) {
							$tax_query[] = $tax_query_element;
						}
					}
				}
				
				if ( !empty( $tax_query ) ) {
					$query_args['tax_query'] = $tax_query;
				}
				
				if ( !empty( $search_string ) ) {
					$query_args['s'] = $search_string;
				}
				
				if ( !empty( $query_params['wpak_search_post_type'] ) ) {
					$query_args['post_type'] = $query_params['wpak_search_post_type'];
				} else {
					$query_args['post_type'] = 'post'; //Or WP searches also in 'pages' and 'attachments'
				}
				
				if ( !empty( $query_params['wpak_search_orderby'] ) ) {
					//Note : when 's' arg is provided, default WP ordering is : 
					// ORDER BY wp_posts.post_title LIKE '%search_string%' DESC, wp_posts.post_date DESC 
					$query_args['orderby'] = $query_params['wpak_search_orderby'];
				}
				
				if ( !empty( $query_params['wpak_search_order'] ) ) {
					$query_args['order'] = $query_params['wpak_search_order'];
				}
				
				if ( !empty( $query_params['wpak_search_page'] ) 
					 && is_numeric( $query_params['wpak_search_page'] ) 
					 && intval( $query_params['wpak_search_page'] ) > 1
					) {
					$query_args['paged'] = $query_params['wpak_search_page'];
				}
				
				$service_answer = self::wp_query_search( $query_args, $query_params );
				
			}
			
			$service_answer = apply_filters( 'wpak_search_addon_service_answer', $service_answer, $query_params, $app_id ); 
		}

		return $service_answer;
	}
	
	public static function add_posts_list_search_query_args ( $query_args, $component ) {

		$search_string = WpakWebServiceContext::getClientAppParam( 'wpak_search_s' );
		
		if ( !empty( $search_string ) ) {

			$component_slug = WpakWebServiceContext::getClientAppParam( 'wpak_search_component' );
			$component_slugs = !is_array( $component_slug ) ? array( $component_slug ) : $component_slug;

			if ( in_array( $component->slug, $component_slugs ) ) {
				$query_args['s'] = $search_string;
			}
		}
		
		return $query_args;
	}
	
	public static function posts_list_search_nb_results ( $nb_search_results, $component, $options, $args ) {
		if ( self::is_search() ) {
			//TODO : set a default nb search results from user option
			$nb_search_results = apply_filters( 'wpak_search_nb_search_results', $nb_search_results, $component, $options);
		}
		return $nb_search_results;
	}
	
	public static function is_search() {
		return WpakWebServiceContext::getClientAppParam( 'wpak_search' ) === 'true';
	}
	
	protected static function wp_query_search( $query_args, $query_params = array() ) {
		
		$search_query_component = new WpakComponent( 'wpak-search-query', 'Search Query', 'wpak-search-query' ); //Internal (fake) component
		
		//TODO : set a default nb search results from user option
		$query_args['posts_per_page'] = apply_filters('wpak_search_nb_search_results', WpakSettings::get_setting( 'posts_per_page' ), $search_query_component, $query_args );

		$query_args = apply_filters( 'wpak_search_custom_query_args', $query_args, $query_params );

		$posts_query = new WP_Query( $query_args );
		
		$service_answer['items_ids'] = array();
		$posts_by_ids = array();
		if ( !empty( $posts_query->posts ) ) {
			foreach ( $posts_query->posts as $post ) {
				$posts_by_ids[$post->ID] = WpakComponentsUtils::get_post_data( $post, $search_query_component );
				$service_answer['items_ids'][] = $post->ID;
			}
		}
		
		$service_answer['items_ids'] = array_values( array_unique( $service_answer['items_ids'] ) );
		
		$service_answer['globals']['search-results'] = $posts_by_ids;
		
		$service_answer['totals']['total'] = !empty( $posts_query->found_posts ) ? $posts_query->found_posts : 0;
		
		return $service_answer;
	}
	
}

WpakSearch::hooks();

