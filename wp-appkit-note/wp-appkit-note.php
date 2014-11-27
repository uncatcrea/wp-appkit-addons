<?php
/*
  Plugin Name: WP AppKit Note Addon
  Description: Add App Stores notation module to WP AppKit plugin
  Version: 0.1
 */

if ( !class_exists( 'WpAppKitNote' ) ) {

	class WpAppKitNote {

		const slug = 'wp-appkit-note';
		const i18n_domain = 'wpak_note_domain';
		const meta_id = '_wpak_note_settings';

		public static function hooks() {
			add_filter( 'wpak_addons', array( __CLASS__, 'wpak_addons' ) );
			if ( is_admin() ) {
				add_action( 'add_meta_boxes', array( __CLASS__, 'add_meta_box' ), 30, 2 );
				add_action( 'save_post', array( __CLASS__, 'save_post' ) );
			}
		}

		public static function wpak_addons( $addons ) {
			$addon = new WpakAddon( 'WP AppKit Note', self::slug );

			$addon->set_location( __FILE__ );

			$addon->add_js( 'wpak-note.js', 'module' );
			$addon->add_js( 'wpak-note-app.js', 'theme', 'before' );

			$addon->add_html( 'wpak-note-dialog-boxes.html', 'layout', 'before', array(
				'messages' => array(
					'first_question' => __( "Thank you for using this app, are you satisfied?" ),
					'vote_question' => __( "Do you want to take the time to note the app?" ),
					'tell_problems' => __( "Do you want to share your problems with us?" ),
					'yes' => __( "Yes" ),
					'no' => __( "No" ),
					'later' => __( "Later" )
				)
			) );

			$addon->add_css( 'wpak-note.css' );
			
			$addon->add_app_data( array( __CLASS__, 'add_app_data' ) );

			$addons[] = $addon;

			return $addons;
		}

		public static function add_meta_box( $post_type, $post ) {
			
			if( WpakAddons::addon_activated_for_app( self::slug, $post->ID ) ) {
				
				add_meta_box(
					'wpak_note_settings', 
					__( 'Notation settings', self::i18n_domain ), 
					array( __CLASS__, 'inner_note_box' ), 
					'wpak_apps', 
					'side', 
					'default'
				);
				
			}
			
		}

		public static function inner_note_box( $post ) {
			$settings = self::get_settings( $post->ID );
			?>
			<label><?php _e( 'Number of app openings before inviting to vote', self::i18n_domain ) ?></label> : <br/>
			<input type="text" name="nb_openings_before_first_launch" value="<?php echo $settings['nb_openings_before_first_launch'] ?>" />
			<br/><br/>
			<label><?php _e( 'Number of app openings before asking again when the user choosed to note later', self::i18n_domain ) ?></label> : <br/>
			<input type="text" name="nb_openings_before_asking_again" value="<?php echo $settings['nb_openings_before_asking_again'] ?>" />
			<?php wp_nonce_field( 'wpak-note-settings-' . $post->ID, 'wpak-note-nonce' ) ?>
			<?php
		}

		protected static function get_settings( $app_id ) {
			$settings = get_post_meta( $app_id, self::meta_id, true );
			$settings = wp_parse_args(
					$settings, array(
						'nb_openings_before_first_launch' => 5,
						'nb_openings_before_asking_again' => 3,
					)
			);
			return $settings;
		}
		
		public static function add_app_data( $app_id ){
			return self::get_settings( $app_id );
		}

		public static function save_post( $post_id ) {

			if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
				return;
			}

			if ( empty( $_POST['post_type'] ) || $_POST['post_type'] != 'wpak_apps' ) {
				return;
			}

			if ( !current_user_can( 'edit_post', $post_id ) && !current_user_can( 'wpak_edit_apps', $post_id ) ) {
				return;
			}

			if( !WpakAddons::addon_activated_for_app( self::slug, $post_id ) ) {
				return;
			}
			
			if ( !check_admin_referer( 'wpak-note-settings-' . $post_id, 'wpak-note-nonce' ) ) {
				return;
			}

			if ( isset( $_POST['nb_openings_before_first_launch'] ) && isset( $_POST['nb_openings_before_asking_again'] )
			) {

				$settings = array(
					'nb_openings_before_first_launch' => intval( $_POST['nb_openings_before_first_launch'] ),
					'nb_openings_before_asking_again' => intval( $_POST['nb_openings_before_asking_again'] ),
				);

				update_post_meta( $post_id, self::meta_id, $settings );
			}
		}

	}

	WpAppKitNote::hooks();
}