define( [ 'jquery', 'core/theme-app', 'addons/wp-appkit-note/wpak-note' ], function( $, App, WpakNote ) {

	var $first_box = $('#wpak-note-first-box');
	var $satisfied_box = $('#wpak-note-satisfied-box');
	var $not_satisfied_box = $('#wpak-note-not-satisfied-box');

	WpakNote.setActions({
		display_first_box: function(){
			$first_box.show();
		},
		display_satisfied_box: function(){
			$first_box.hide();
			$satisfied_box.show();
		},
		display_not_satisfied_box: function(){
			$first_box.hide();
			$not_satisfied_box.show();
		},
		answer_to_first_box_later: function(){
			$first_box.hide();
		},
		answer_to_first_box_dont_ask_again: function(){
			$first_box.hide();
		},
		ok_to_vote: function(){
			$satisfied_box.hide();
		},
		not_ok_to_vote: function(){
			$satisfied_box.hide();
		},
		ok_to_email: function(){
			$not_satisfied_box.hide();
		},
		not_ok_to_email: function(){
			$not_satisfied_box.hide();
		},
		closed_box: function(){
			$first_box.hide();
			$satisfied_box.hide();
			$not_satisfied_box.hide();
		}
	});

	App.on( 'info:app-ready', function( ) {
		
		WpakNote.launchIfNeeded();

	} );

	$('a#wpak-note-first-box-yes', $first_box).click(function(e){
		e.preventDefault();
		WpakNote.answerToFirstBox('yes');
	});

	$('a#wpak-note-first-box-no', $first_box).click(function(e){
		e.preventDefault();
		WpakNote.answerToFirstBox('no');
	});
	
	$('a#wpak-note-first-box-later', $first_box).click(function(e){
		e.preventDefault();
		WpakNote.answerToFirstBox('later');
	});
	
	$('a#wpak-note-first-box-dont-ask-again', $first_box).click(function(e){
		e.preventDefault();
		WpakNote.answerToFirstBox('dont_ask_again');
	});	
	
	$('a#wpak-note-satisfied-box-yes', $satisfied_box).click(function(e){
		e.preventDefault();
		WpakNote.answerToSatisfiedBox('yes');
	});	
	
	$('a#wpak-note-satisfied-box-no', $satisfied_box).click(function(e){
		e.preventDefault();
		WpakNote.answerToSatisfiedBox('no');
	});
	
	$('a#wpak-note-not-satisfied-box-yes', $not_satisfied_box).click(function(e){
		e.preventDefault();
		WpakNote.answerToNotSatisfiedBox('yes');
	});
	
	$('a#wpak-note-not-satisfied-box-no', $not_satisfied_box).click(function(e){
		e.preventDefault();
		WpakNote.answerToNotSatisfiedBox('no');
	});
	
	$('a.wpak-note-close').click(function(e){
		e.preventDefault();
		WpakNote.closeBox();
	});
	
} );


