define( function( require ) {

	var $ = require('jquery'),
		_ = require( 'underscore' ),
		Phonegap = require( 'core/phonegap-utils' ),
		Utils = require( 'core/app-utils' ),
		Addons = require( 'core/addons' ),
		Flags = require( 'core/modules/flags' ),
		LocalStorage = require( 'core/modules/persistent-storage' ),
		Hooks = require('core/lib/hooks');
	
	var actions_callbacks = {
		display_first_box: null,
		display_satisfied_box: null,
		display_not_satisfied_box: null,
		answer_to_first_box_later: null,
		answer_to_first_box_dont_ask_again: null,
		ok_to_vote: null,
		not_ok_to_vote: null,
		ok_to_email: null,
		not_ok_to_email: null
	};
	
	var app_static_data = Addons.getAppStaticData( 'wp-appkit-note' );
	var app_dynamic_data = Addons.getAppDynamicData('wp-appkit-note' );
	
	var tried_to_launch = false; //Used to avoid calling incrementCountOpen() twice in launchIfNeeded().
	
	var set_trigger_count = function(trigger_count){
		LocalStorage.set( 'wpak_note', 'trigger_count', trigger_count );
	};
	
	var get_trigger_count = function(){
		return LocalStorage.get( 'wpak_note', 'trigger_count', app_static_data.nb_openings_before_first_launch );
	};
	
	var set_count_open = function(count_open){
		LocalStorage.set( 'wpak_note', 'count_open', count_open );
	};
	
	var get_count_open = function(){
		return LocalStorage.get( 'wpak_note', 'count_open', 0 );
	};
	
	Hooks.addAction('debug-panel-render', function(debug_panel_view){
		
		$( "#wpak-note-reset-data" ).on( 
			"touchend", 
			{
				callback: function(){
					debug_panel_view.displayFeedback('WP AppKit Note addon data successfully reset');
				}
			}, 
			wpak_note.resetData 
		);

		$( "#wpak-note-view-data" ).on( 
			"touchend", 
			function(){
				var message = 'WP AppKit Note addon data : <br/>';
				message += 'Campaign on : '+ Addons.getAppDynamicData('wp-appkit-note','campaign_on') +'<br/>';
				message += 'count_open : '+ get_count_open() +'<br/>';
				message += 'trigger_count : '+ get_trigger_count() +'<br/>';
				message += 'Flag wpak_note_go : '+ Flags.isUp('wpak_note_go') +'<br/>';
				message += 'State : '+ wpak_note.getState() +'<br/>';

				debug_panel_view.displayFeedback(message,'',10000);

				Utils.log('WP AppKit Note addon data :');
				Utils.log('Campaign on', Addons.getAppDynamicData('wp-appkit-note','campaign_on'));
				Utils.log('wpak note count_open', get_count_open());
				Utils.log('wpak note trigger_count', get_trigger_count());
				Utils.log('Flag wpak_note_go', Flags.isUp('wpak_note_go'));
				Utils.log('State', wpak_note.getState());
			}
		);

	});
	
	var wpak_note = {};
	
	wpak_note.setActions = function(actions){
		_.each(actions, function(value, key){
			if( actions_callbacks.hasOwnProperty(key) ){
				actions_callbacks[key] = value;
			}
		});
	};
	
	wpak_note.incrementCountOpen = function(){
		var count_open = get_count_open();
		count_open += 1;
		set_count_open(count_open);
	};
	
	wpak_note.launchIfNeeded = function(){
		
		if( wpak_note.getState().indexOf('finished') === -1 && !tried_to_launch ){
			
			tried_to_launch = true;
			
			wpak_note.incrementCountOpen();

			if ( wpak_note.canLaunch() ) {
				wpak_note.setOkToGo();
				wpak_note.launch();
			}
		}
		
	};
	
	wpak_note.canLaunch = function(){
		if( app_dynamic_data.email_not_satisfied === '' ){
			Utils.log('WPAK Note error : please set an email for not satisfied users');
		}
		if( app_dynamic_data.app_url_in_app_store === '' ){
			Utils.log('WPAK Note error : please set the app store\'s app url');
		}
		return parseInt(app_dynamic_data.campaign_on) === 1 
				&& app_dynamic_data.email_not_satisfied !== ''
				&& app_dynamic_data.app_url_in_app_store !== ''
				&& ( get_count_open() == get_trigger_count() || Flags.isUp('wpak_note_go') ); 
	};
	
	wpak_note.setOkToGo = function(){
		Flags.raise('wpak_note_go');
	};
	
	wpak_note.launch = function(){
		if( Phonegap.getNetworkState() === 'online' ){
			Utils.log('WPAK Note : display first box');
			wpak_note.setState('first-box');
			actions_callbacks.display_first_box();
		}else{
			Utils.log('WPAK Note : did not display first box because the app is offline! Will retry later');
		}
	};
	
	wpak_note.answerToFirstBox = function(answer){
		if( answer == 'yes' ){
			actions_callbacks.display_satisfied_box();
		}else if( answer == 'no' ){
			actions_callbacks.display_not_satisfied_box();
		}else if( answer == 'later' ){
			wpak_note.setState('later');
			Flags.lower('wpak_note_go');
			set_trigger_count(app_static_data.nb_openings_before_asking_again);
			set_count_open(0);
			actions_callbacks.answer_to_first_box_later();
		}else if( answer == 'dont_ask_again' ){
			Flags.lower('wpak_note_go');
			wpak_note.setState('finished:dont-ask-again');
			actions_callbacks.answer_to_first_box_dont_ask_again();
		}
	};
	
	wpak_note.answerToSatisfiedBox = function(answer){
		if( answer == 'yes' ){
			wpak_note.setState('finished:satisfied:note-yes');
			Flags.lower('wpak_note_go');
			actions_callbacks.ok_to_vote();
			document.location.href = app_dynamic_data.app_url_in_app_store;
		}else if( answer == 'no' ){
			wpak_note.setState('finished:satisfied:note-no');
			Flags.lower('wpak_note_go');
			actions_callbacks.not_ok_to_vote();
		}
	};
	
	wpak_note.answerToNotSatisfiedBox = function(answer){
		if( answer == 'yes' ){
			wpak_note.setState('finished:not-satisfied:mail-yes');
			Flags.lower('wpak_note_go');
			actions_callbacks.ok_to_email();
			document.location.href = "mailto:"+ app_dynamic_data.email_not_satisfied;
		}else if( answer == 'no' ){
			wpak_note.setState('finished:not-satisfied:mail-no');
			Flags.lower('wpak_note_go');
			actions_callbacks.not_ok_to_email();
		}
	};
	
	wpak_note.getState = function(){
		return LocalStorage.get('wpak_note','state','new');
	};
	
	wpak_note.setState = function(state){
		LocalStorage.set('wpak_note','state',state);
	};
	
	wpak_note.resetData = function(event){
		LocalStorage.clear( 'wpak_note', 'count_open' );
		LocalStorage.clear( 'wpak_note', 'trigger_count' );
		wpak_note.setState( 'new' );
		if( event !== undefined 
			&& event.hasOwnProperty('data') 
			&& event.data.hasOwnProperty('callback') ){
			event.data.callback();
		}
	};
	
	return wpak_note;
} );


