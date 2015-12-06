/*!
 * jQuery Feeds v0.5
 * https://camagu.github.com/jquery-feeds
 * 
 * Copyright (c) 2012, Camilo Aguilar
 * Dual licensed under the MIT and GPL licenses:
 *     http://www.opensource.org/licenses/mit-license.php
 *     http://www.gnu.org/licenses/gpl.html
 * 
 * Includes a modified version of Simple JavaScript Templating
 * http://ejohn.org/blog/javascript-micro-templating/
 * Copyright (c) John Resig (http://ejohn.org)
 * MIT licensed
 * 
 * Date: 2012-07-12
 */

/*jshint evil: true */
( function( $ ) {
	
	var cache = {};
	
	$.fn.feeds = function( options ) {

		var engine = {
			service: '//ajax.googleapis.com/ajax/services/feed/load?v=1.0',
			
			settings: {
				loadingTemplate: '<p class="feeds-loader">Loading entries ...</p>',
				entryTemplate:	'<div class="feeds-entry feeds-source-<!=source!>">' + 
								'<a class="feed-entry-title" target="_blank" href="<!=link!>" title="<!=title!>"><!=title!></a>' +
								'<div class="feed-entry-date"><!=publishedDate!></div>' + 
								'<div class="feed-entry-content"><!=contentSnippet!></div>' + 
								'</div>',
				feeds: {},
				max: -1,
				ssl: 'auto',
				onComplete: function( entries ) {

				},
				preprocess: function( entry, feed ) {

				}
			},
			
			feeds: { },
			entries: [ ],
			
			feedsLength: 0,
			feedsLoaded: 0,
			
			$element: null,
			$loader: null,
			
			init: function( element, options ) {
				this.settings = $.extend( this.settings, options );
				this.feeds = this.settings.feeds;
				
				for ( var i in this.feeds ) {
					if ( this.feeds.hasOwnProperty( i ) ) {
						this.feedsLength++;
					}
				}
				
				var protocol = this.settings.ssl === 'auto' ? document.location.protocol : this.settings.ssl ? 'https:' : 'http:';
				if ( $.inArray( protocol, [ 'http:', 'https' ]) === -1 ) {
					protocol = 'https:';
				}
				
				this.service = protocol + this.service;
				
				this.$element = $( element );
				
				var render = typeof this.settings.loadingTemplate === 'function' ? this.settings.loadingTemplate : this.tmpl( this.settings.loadingTemplate );
				this.$loader = $( render.call( this, { } ) );
				this.$element.html( this.$loader );
				
				for ( var j in this.feeds ) {
					this.fetchFeed( j, this.feeds[ j ], this.settings.max );
				}
			},
			
			fetchFeed: function( key, feed, max ) {
				var self = this;
				
				var cacheKey = feed + '**' + max;
				if ( typeof cache[ cacheKey ] !== 'undefined' ) {
					self.processResponse( cache[ cacheKey ], key, feed );
					return;
				}
				
				$.ajax( {
					url: this.service,
					dataType: 'jsonp',
					data: {
						q: feed,
						num: max
					},
					beforeSend: function( ) {
						this.feed = feed;
						this.key = key;
					},
					success: function( data ) {
						cache[ cacheKey ] = data;
						self.processResponse( data, this.key, this.feed );
					}
				} );
			},
			
			processResponse: function( data, key, feed ) {
				if ( data.responseStatus !== 200 ) {
					if ( window.console && window.console.log ) {
						console.log( 'Unable to load feed ' + feed + ': (' + data.responseStatus + ') ' + data.responseDetails );
					}
				} else {
					var feedEntries = data.responseData.feed.entries;
					
					for ( var i in feedEntries ) {
						var entry = $.extend( {}, feedEntries[ i ] );
						entry.source = key;
						entry.publishedDateRaw = entry.publishedDate;
						
						entry.feedUrl = data.responseData.feed.feedUrl;
						entry.feedTitle = data.responseData.feed.title;
						entry.feedLink = data.responseData.feed.link;
						entry.feedDescription = data.responseData.feed.description;
						entry.feedAuthor = data.responseData.feed.author;
						
						this.settings.preprocess.call( entry, data.responseData.feed );
						
						this.entries.push( entry );
					}
				}
				
				this.feedsLoaded++;
				this.checkComplete();
			},
			
			checkComplete: function( ) {
				if ( this.feedsLoaded === this.feedsLength ) {
					this.$loader.remove( );
					
					this.entries.sort( function( a, b) {
						var aDate = new Date( a.publishedDateRaw ).getTime( );
						var bDate = new Date( b.publishedDateRaw ).getTime( );

						return bDate - aDate;
					} );
					
					var render = typeof this.settings.entryTemplate === 'function' ? this.settings.entryTemplate : this.tmpl( this.settings.entryTemplate );
					
					for ( var i in this.entries ) {
						var entry = this.entries[ i ];
						
						var html = render.call( this, entry );
						
						this.$element.append( html );
					}
					
					this.settings.onComplete.call( this.$element[ 0 ], this.entries );
				}
			},
			

			// Simple JavaScript Templating (modified)
			// John Resig - http://ejohn.org/ - MIT Licensed
			// @see http://ejohn.org/blog/javascript-micro-templating/
			tmplCache: {},
			tmpl: function tmpl( str, data ) {

				var fn = !/\W/.test( str ) ? this.tmplCache[ str ] = this.tmplCache[ str ] || this.tmpl( document.getElementById( str ).innerHTML ) :

				new Function( "obj",
					"var p=[],print=function(){p.push.apply(p,arguments);};" +

					"with(obj){p.push('" +
					str
						.replace( /[\r\t\n]/g, " " )
						.split( "<!" ).join( "\t" )
						.replace( /((^|!>)[^\t]*)'/g, "$1\r" )
						.replace( /\t=(.*?)!>/g, "',typeof $1 != 'undefined' ? $1 : '','" )
						.split( "\t" ).join( "');" )
						.split( "!>" ).join( "p.push('" )
						.split( "\r" ).join( "\\'" ) +
					"');}return p.join('');"
				);

				return data ? fn( data ) : fn;
			}
		};
		
		return $( this ).each( function( ) {
			engine.init( this, options );
		});
	};
}( jQuery ) );
