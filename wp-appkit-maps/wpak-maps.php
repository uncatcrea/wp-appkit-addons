<?php

/*
  Plugin Name: WP AppKit Maps
  Description: WP AppKit support for maps
  Version: 0.1
 */

if ( !class_exists( 'WpAppKitMaps' ) ) {
	
	class WpAppKitMaps {

		const slug = 'wp-appkit-maps';

		public static function hooks() {
			add_filter( 'wpak_addons', array( __CLASS__, 'wpak_addons' ) );
		}

		public static function wpak_addons( $addons ) {
			
			$addon = new WpakAddon( 'WP AppKit Maps', self::slug );

			$addon->set_location( __FILE__ );

			$addon->add_js( 'js/wpak-maps.js', 'module' );
			$addon->add_js( 'js/map-types/google-maps.js', 'module' );
			$addon->add_js( 'js/wpak-maps-functions.js', 'theme' );

			$addon->add_template( 'wpak-map-template.html' );
			
			$addon->require_php( dirname(__FILE__) .'/wpak-maps-component.php' );

			$addons[] = $addon;

			return $addons;
		}

	}

	WpAppKitMaps::hooks();
}

