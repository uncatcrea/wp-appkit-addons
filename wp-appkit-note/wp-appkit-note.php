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
		const static_settings_meta_id = '_wpak_note_settings';
		const dynamic_settings_meta_id = '_wpak_note_settings_dynamic';

		
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
					'later' => __( "Later" ),
					'dont_ask_again' => __( "Don't ask again")
				)
			) );

			$addon->add_css( 'wpak-note.css' );
			
			$addon->add_app_static_data( array( __CLASS__, 'add_app_static_data' ) );

			$addon->add_app_dynamic_data( array( __CLASS__, 'add_app_dynamic_data' ) );
			
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
			$static_settings = self::get_static_settings( $post->ID );
			$dynamic_settings = self::get_dynamic_settings( $post->ID );
			?>
			
			<?php $campaign_on = intval($dynamic_settings['campaign_on']) ?>
			<label><?php _e( 'Campaign on', self::i18n_domain ) ?></label> : <br/>
			<select name="campaign_on" >
				<option value="1" <?php echo $campaign_on === 1 ? 'selected' : '' ?> ><?php _e( 'Yes', self::i18n_domain ) ?></option>
				<option value="0" <?php echo $campaign_on === 0 ? 'selected' : '' ?> ><?php _e( 'No', self::i18n_domain ) ?></option>
			</select>
			<br/><br/>
			
			<label><?php _e( 'App url in app store', self::i18n_domain ) ?></label> : <br/>
			<input type="text" name="app_url_in_app_store" value="<?php echo $dynamic_settings['app_url_in_app_store'] ?>" />
			<br/><br/>
			
			<label><?php _e( 'Email for not satisfied users feedback', self::i18n_domain ) ?></label> : <br/>
			<input type="text" name="email_not_satisfied" value="<?php echo $dynamic_settings['email_not_satisfied'] ?>" />
			
			<br/><br/>
			<hr/>
			
			<label><?php _e( 'Number of app openings before inviting to vote', self::i18n_domain ) ?></label> : <br/>
			<input type="text" name="nb_openings_before_first_launch" value="<?php echo $static_settings['nb_openings_before_first_launch'] ?>" />
			<br/><br/>
			<label><?php _e( 'Number of app openings before asking again when the user choosed to note later', self::i18n_domain ) ?></label> : <br/>
			<input type="text" name="nb_openings_before_asking_again" value="<?php echo $static_settings['nb_openings_before_asking_again'] ?>" />
			
			<?php wp_nonce_field( 'wpak-note-settings-' . $post->ID, 'wpak-note-nonce' ) ?>
			<?php
		}

		protected static function get_static_settings( $app_id ) {
			$settings = get_post_meta( $app_id, self::static_settings_meta_id, true );
			$settings = wp_parse_args(
					$settings, array(
						'nb_openings_before_first_launch' => 5,
						'nb_openings_before_asking_again' => 3,
					)
			);
			return $settings;
		}
		
		public static function add_app_static_data( $app_id ){
			return self::get_static_settings( $app_id );
		}
		
		protected static function get_dynamic_settings( $app_id ) {
			$dynamic_settings = get_post_meta( $app_id, self::dynamic_settings_meta_id, true );
			$dynamic_settings = wp_parse_args(
					$dynamic_settings, array(
						'campaign_on' => 1,
						'app_url_in_app_store' => '',
						'email_not_satisfied' => ''
					)
			);
			return $dynamic_settings;
		}
		
		public static function add_app_dynamic_data( $app_id ){
			return self::get_dynamic_settings( $app_id );
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

			//Static settings :
			if ( isset( $_POST['nb_openings_before_first_launch'] ) && isset( $_POST['nb_openings_before_asking_again'] ) ) {

				$settings = array(
					'nb_openings_before_first_launch' => intval( $_POST['nb_openings_before_first_launch'] ),
					'nb_openings_before_asking_again' => intval( $_POST['nb_openings_before_asking_again'] ),
				);

				update_post_meta( $post_id, self::static_settings_meta_id, $settings );
			}
			
			//Dynamic settings :
			if ( isset( $_POST['campaign_on'] ) && isset( $_POST['app_url_in_app_store'] ) && isset( $_POST['email_not_satisfied'] ) ) {

				$settings = array(
					'campaign_on' => intval( $_POST['campaign_on'] ),
					'app_url_in_app_store' => esc_url( $_POST['app_url_in_app_store'] ),
					'email_not_satisfied' => sanitize_email( $_POST['email_not_satisfied'] )
				);

				update_post_meta( $post_id, self::dynamic_settings_meta_id, $settings );
			}
			
		}

	}

	WpAppKitNote::hooks();
}