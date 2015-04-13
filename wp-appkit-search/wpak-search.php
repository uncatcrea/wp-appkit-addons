<?php
/*
  Plugin Name: WP AppKit Search
  Description: WP AppKit addon - Adds search feature to WP AppKit apps.
  Version: 0.1
 */

if ( !class_exists( 'WpAppKitSearch' ) ) {

	class WpAppKitSearch {

		public static function hooks() {
			add_filter( 'wpak_addons', array( __CLASS__, 'wpak_addons' ) );
		}

		public static function wpak_addons( $addons ) {
			$addon = new WpakAddon( 'WP AppKit Search', 'wp-appkit-search' );

			$addon->set_location( __FILE__ );

			$addon->add_js('wpak-search.js', 'module');
			$addon->add_js('lib/search-hooks.js', 'init');
			
			$addon->require_php( dirname(__FILE__) .'/lib/search-wp.php' );
			
			$addons[] = $addon;

			return $addons;
		}
		
	}
	
	WpAppKitSearch::hooks();
	
}