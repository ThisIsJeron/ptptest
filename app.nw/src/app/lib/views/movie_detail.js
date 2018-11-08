(function (App) {
    'use strict';
    // Torrent Health
    var torrentHealth = require('webtorrent-health'),
    cancelTorrentHealth = function () {},
    torrentHealthRestarted = null,
    ytssubt = '',
    opensubt = '',
    flagt = '';

    App.View.MovieDetail = Marionette.View.extend({
        template: '#movie-detail-tpl',
        className: 'movie-detail',

        ui: {
            selected_lang: '.selected-lang',
            bookmarkIcon: '.favourites-toggle',
            watchedIcon: '.watched-toggle'
        },

        events: {
            'click #watch-now': 'startStreaming',
            'click #watch-trailer': 'playTrailer',
            'click .close-icon': 'closeDetails',
            'click #switch-hd-on': 'enableHD',
            'click #switch-hd-off': 'disableHD',
            'click .favourites-toggle': 'toggleFavourite',
            'click .watched-toggle': 'toggleWatched',
            'click .movie-imdb-link': 'openIMDb',
            'mousedown .magnet-link': 'openMagnet',
            'click .sub-dropdown': 'toggleDropdown',
            'click .sub-flag-icon': 'closeDropdown',
            'click .playerchoicemenu li a': 'selectPlayer',
            'click .rating-container': 'switchRating',
            'click .health-icon': 'resetHealth'
        },

        initialize: function () {
            var _this = this;
            this.getMetaData();
            if ((Settings.translateSynopsis) && (Settings.language != 'en')) {
                this.getTranslatedData();
            }

            //Handle keyboard shortcuts when other views are appended or removed

            //If a child was removed from above this view
            App.vent.on('viewstack:pop', function () {
                if (_.last(App.ViewStack) === _this.className) {
                    _this.initKeyboardShortcuts();
                }
            });

            //If a child was added above this view
            App.vent.on('viewstack:push', function () {
                if (_.last(App.ViewStack) !== _this.className) {
                    _this.unbindKeyboardShortcuts();
                }
            });

            App.vent.on('shortcuts:movies', _this.initKeyboardShortcuts);

            this.model.on('change:quality', this.resetHealth(), this);
        },

        onAttach: function () {
            win.info('Show movie detail (' + this.model.get('imdb_id') + ')');
            var self = this;
            this.handleAnime();

            var torrents = this.model.get('torrents');
            if (torrents['720p'] !== undefined && torrents['1080p'] !== undefined) {
                this.model.set('quality', Settings.movies_default_quality);
            } else if (torrents['1080p'] !== undefined) {
                this.model.set('quality', '1080p');
            } else if (torrents['720p'] !== undefined) {
                this.model.set('quality', '720p');
            } else if (torrents['480p'] !== undefined) {
                this.model.set('quality', '480p');
            } else if (torrents['HDRip'] !== undefined) {
                this.model.set('quality', 'HDRip');
            }

            if (Settings.movies_default_quality === '720p' && torrents['720p'] !== undefined && document.getElementsByName('switch')[0] !== undefined) {
                document.getElementsByName('switch')[0].checked = true;
            }

            if (!this.model.get('trailer')) {
                $('#watch-trailer').hide();
            }

            this.getTorrentHealth();

            $('.star-container,.movie-imdb-link,.q720,input,.magnet-link,.sub-dropdown,.metaitem').tooltip({
                html: true
            });

            App.MovieDetailView = this;

            var backgroundUrl = $('.backdrop').attr('data-bgr');

            var bgCache = new Image();
            bgCache.src = backgroundUrl;
            bgCache.onload = function () {
                $('.backdrop').css('background-image', 'url(' + backgroundUrl + ')').addClass('fadein');
                bgCache = null;
            };
            bgCache.onerror = function () {
                $('.backdrop').css('background-image', 'url(images/bg-header.jpg)').addClass('fadein');
                bgCache = null;
            };

            var coverUrl = $('.mcover-image').attr('data-cover');

            var coverCache = new Image();
            coverCache.src = coverUrl;
            coverCache.onload = function () {
                $('.mcover-image').attr('src', coverUrl).addClass('fadein');
                coverCache = null;
            };
            coverCache.onerror = function () {
                $('.mcover-image').attr('src', self.model.get('image')).addClass('fadein');
                coverCache = null;
            };

            // switch to default subtitle
            this.switchSubtitle(Settings.subtitle_language);

            // Bookmarked / not bookmarked
            if (this.model.get('bookmarked') === true) {
                this.ui.bookmarkIcon.addClass('selected').text(i18n.__('Remove from bookmarks'));
            }

            // Seen / Unseen
            if (this.model.get('watched') === true) {
                this.ui.watchedIcon.addClass('selected').text(i18n.__('Seen'));
            }
            var _this = this;
            this.ui.watchedIcon.hover(function () {
                if (_this.model.get('watched')) {
                    _this.ui.watchedIcon.text(i18n.__('Mark as unseen'));
                } else {
                    _this.ui.watchedIcon.text(i18n.__('Mark as Seen'));
                }
            }, function () {
                if (_this.model.get('watched')) {
                    _this.ui.watchedIcon.text(i18n.__('Seen'));
                } else {
                    _this.ui.watchedIcon.text(i18n.__('Not Seen'));
                }
            });

            // display stars or number
            if (AdvSettings.get('ratingStars') === false) {
                $('.star-container').addClass('hidden');
                $('.number-container').removeClass('hidden');
            }

            this.initKeyboardShortcuts();

            App.Device.Collection.setDevice(Settings.chosenPlayer);
            App.Device.ChooserView('#player-chooser').render();
            if (($('.loading .maximize-icon').css('visibility') == 'visible') || ($('.loading .maximize-icong').css('visibility') == 'visible')) {
               $('.button').css('background-color', '#707070');
               $('.button').css('cursor', 'not-allowed');
               $('.button').prop('disabled', true);
               $('.button').css('opacity', '0.2');
               $('#watch-now').prop('disabled', true);
               $('#watch-now2').prop('disabled', true);
            }

            switch (Settings.subtitle_language) {
            case 'en':
                ytssubt = 'flag-gb';
                opensubt = 'eng';
                flagt = 'url("images/flags/english.png")';
                break;
            case 'ar':
                ytssubt = 'flag-sa';
                opensubt = 'ara';
                flagt = 'url("images/flags/arabic.png")';
                break;
            case 'bg':
                ytssubt = 'flag-bg';
                opensubt = 'bul';
                flagt = 'url("images/flags/bulgarian.png")';
                break;
            case 'bs':
                ytssubt = 'flag-notavail';
                opensubt = 'bos';
                flagt = 'url("images/flags/bosnian.png")';
                break;
            case 'cs':
                ytssubt = 'flag-cz';
                opensubt = 'cze';
                flagt = 'url("images/flags/czech.png")';
                break;
            case 'da':
                ytssubt = 'flag-dk';
                opensubt = 'dan';
                flagt = 'url("images/flags/danish.png")';
                break;
            case 'de':
                ytssubt = 'flag-de';
                opensubt = 'ger';
                flagt = 'url("images/flags/german.png")';
                break;
            case 'el':
                ytssubt = 'flag-gr';
                opensubt = 'ell';
                flagt = 'url("images/flags/greek.png")';
                break;
            case 'es':
                ytssubt = 'flag-es';
                opensubt = 'spa';
                flagt = 'url("images/flags/spanish.png")';
                break;
            case 'et':
                ytssubt = 'flag-notavail';
                opensubt = 'est';
                flagt = 'url("images/flags/estonian.png")';
                break;
            case 'eu':
                ytssubt = 'flag-notavail';
                opensubt = 'baq';
                flagt = 'url("images/flags/basque.png")';
                break;
            case 'fa':
                ytssubt = 'flag-ir';
                opensubt = 'per';
                flagt = 'url("images/flags/farsi.png")';
                break;
            case 'fi':
                ytssubt = 'flag-fi';
                opensubt = 'fin';
                flagt = 'url("images/flags/finnish.png")';
                break;
            case 'fr':
                ytssubt = 'flag-fr';
                opensubt = 'fre';
                flagt = 'url("images/flags/french.png")';
                break;
            case 'he':
                ytssubt = 'flag-il';
                opensubt = 'heb';
                flagt = 'url("images/flags/hebrew.png")';
                break;
            case 'hr':
                ytssubt = 'flag-hr';
                opensubt = 'hrv';
                flagt = 'url("images/flags/croatian.png")';
                break;
            case 'hu':
                ytssubt = 'flag-hu';
                opensubt = 'hun';
                flagt = 'url("images/flags/hungarian.png")';
                break;
            case 'id':
                ytssubt = 'flag-id';
                opensubt = 'ind';
                flagt = 'url("images/flags/indonesian.png")';
                break;
            case 'it':
                ytssubt = 'flag-it';
                opensubt = 'ita';
                flagt = 'url("images/flags/italian.png")';
                break;
            case 'lt':
                ytssubt = 'flag-lt';
                opensubt = 'lit';
                flagt = 'url("images/flags/lithuanian.png")';
                break;
            case 'nl':
                ytssubt = 'flag-nl';
                opensubt = 'dut';
                flagt = 'url("images/flags/dutch.png")';
                break;
            case 'no':
                ytssubt = 'flag-no';
                opensubt = 'nor';
                flagt = 'url("images/flags/norwegian.png")';
                break;
            case 'pl':
                ytssubt = 'flag-pl';
                opensubt = 'pol';
                flagt = 'url("images/flags/polish.png")';
                break;
            case 'pt':
                ytssubt = 'flag-pt';
                opensubt = 'por';
                flagt = 'url("images/flags/portuguese.png")';
                break;
            case 'pt-br':
                ytssubt = 'flag-br';
                opensubt = 'pob';
                flagt = 'url("images/flags/brazilian.png")';
                break;
            case 'ro':
                ytssubt = 'flag-ro';
                opensubt = 'rum';
                flagt = 'url("images/flags/romanian.png")';
                break;
            case 'ru':
                ytssubt = 'flag-ru';
                opensubt = 'rus';
                flagt = 'url("images/flags/russian.png")';
                break;
            case 'sl':
                ytssubt = 'flag-si';
                opensubt = 'slv';
                flagt = 'url("images/flags/slovenian.png")';
                break;
            case 'sr':
                ytssubt = 'flag-rs';
                opensubt = 'scc';
                flagt = 'url("images/flags/serbian.png")';
                break;
            case 'sv':
                ytssubt = 'flag-se';
                opensubt = 'swe';
                flagt = 'url("images/flags/swedish.png")';
                break;
            case 'th':
                ytssubt = 'flag-th';
                opensubt = 'tha';
                flagt = 'url("images/flags/thai.png")';
                break;
            case 'tr':
                ytssubt = 'flag-tr';
                opensubt = 'tur';
                flagt = 'url("images/flags/turkish.png")';
                break;
            case 'uk':
                ytssubt = 'flag-notavail';
                opensubt = 'ukr';
                flagt = 'url("images/flags/ukrainian.png")';
                break;
            case 'vi':
                ytssubt = 'flag-vn';
                opensubt = 'vie';
                flagt = 'url("images/flags/vietnamese.png")';
                break;
            case 'zh':
                ytssubt = 'flag-cn';
                opensubt = 'chi,zht,zhe';
                flagt = 'url("images/flags/chinese.png")';
                break;
            default:
                ytssubt = 'flag-notavail';
                opensubt = 'notavail';
                flagt = 'url("images/flags/snone.png")';
            }

            var ytsid = this.model.get('imdb_id');
            var openid = ytsid.slice(2, 100);

            if (flagt !== 'url("images/flags/snone.png")') {
                $('.flag').css({"background-image": flagt, "-webkit-filter": "grayscale(100%) contrast(60%)", "opacity": "0.3"});
                $.get('http://www.yifysubtitles.com/movie-imdb/' + ytsid, function(data) {
                if (~data.indexOf(ytssubt)) {
                    $('.flag').css({"background-image": flagt, "-webkit-filter": "", "opacity": "1"});
                };
                });
                $.get('http://www.opensubtitles.org/en/search/sublanguageid-' + opensubt + '/imdbid-' + openid, function(data) {
                if (~data.indexOf('Movie details')) {
                    $('.flag').css({"background-image": flagt, "-webkit-filter": "", "opacity": "1"});
                };
                });
            } else {
                $('.flag').css('background-image', flagt).hide();
                $('.sub-dropdown').css('opacity', '0.4');
                $('.sub-dropdown span').html(i18n.__("Subtitles Disabled&nbsp;"));
            };
        },

        getMetaData: function () {
            if ((this.model.get('synopsis') == null) || (this.model.get('rating') == null) || (this.model.get('rating') == '0.0') || (this.model.get('runtime') == null) || (this.model.get('runtime') == '0') || (this.model.get('trailer') == null) || (this.model.get('cover') == null) || (this.model.get('cover') == 'images/posterholder.png') || (this.model.get('backdrop') == null) || (this.model.get('backdrop') == 'images/posterholder.png')) {
                var imdb = this.model.get('imdb_id');
                var api_key = Settings.tmdb.api_key;
                var movie = function () {
                    var tmp = null;
                    $.ajax({
                        url: 'http://api.themoviedb.org/3/movie/'+ imdb +'?api_key='+ api_key +'&language=en' + '&append_to_response=videos',
                        type: 'get',
                        dataType: 'json',
                        async: false,
                        global: false,
                        success: function (data) {
                            tmp = data;
                        }
                    });
                    return tmp;
                }();
                if (movie) {
                    if (this.model.get('synopsis') == null) {
                        if (movie.overview) {
                            this.model.set('synopsis', movie.overview);
                        }
                    };
                    if ((this.model.get('rating') == null) || (this.model.get('rating') == '0.0')) {
                        if (movie.vote_average) {
                            this.model.set('rating', movie.vote_average);
                        }
                    };
                    if ((this.model.get('runtime') == null) || (this.model.get('runtime') == '0')) {
                        if (movie.runtime) {
                            this.model.set('runtime', movie.runtime);
                        }
                    };
                    if (this.model.get('trailer') == null) {
                        if (movie.videos.results[0]) {
                            this.model.set('trailer', 'http://www.youtube.com/watch?v=' + movie.videos.results[0].key);
                        } else {
                            this.model.set('trailer', '');
                        }
                    };
                    if ((this.model.get('cover') == null) || (this.model.get('cover') == 'images/posterholder.png')) {
                        if (movie.poster_path) {
                            this.model.set('cover', 'http://image.tmdb.org/t/p/w500' + movie.poster_path);
                        }
                    };
                    if ((this.model.get('backdrop') == null) || (this.model.get('backdrop') == 'images/posterholder.png')) {
                        if (movie.backdrop_path) {
                            this.model.set('backdrop', 'http://image.tmdb.org/t/p/w500' + movie.backdrop_path);
                        } else {
                            if (movie.poster_path) {
                                this.model.set('backdrop', 'http://image.tmdb.org/t/p/w500' + movie.poster_path);
                            }
                        }
                    };
                };
            };
        },

        getTranslatedData: function () {
            var imdb = this.model.get('imdb_id');
            var api_key = Settings.tmdb.api_key;
            var lang = Settings.language;
            var movie = function () {
                var tmp = null;
                $.ajax({
                    url: 'http://api.themoviedb.org/3/movie/'+ imdb +'?api_key='+ api_key +'&language='+ lang,
                    type: 'get',
                    dataType: 'json',
                    async: false,
                    global: false,
                    success: function (data) {
                        tmp = data;
                    }
                });
                return tmp;
            }();
            if (movie) {
                if (movie.overview) {
                    this.model.set('synopsis', movie.overview);
                } 
            };
        },

        handleAnime: function () {
            var id = this.model.get('imdb_id');
            if (id && id.indexOf('mal') === -1) {
                return;
            }

            $('.movie-imdb-link, .rating-container, .magnet-link, .health-icon').hide();
            $('.dot').css('opacity', 0);
        },

        onBeforeDestroy: function () {
            this.unbindKeyboardShortcuts();
        },

        initKeyboardShortcuts: function () {
            Mousetrap.bind(['esc', 'backspace'], this.closeDetails);
            Mousetrap.bind(['enter', 'space'], function (e) {
                $('#watch-now').click();
            });
            Mousetrap.bind('q', this.toggleQuality, 'keydown');
            Mousetrap.bind('f', function () {
                $('.favourites-toggle').click();
            }, 'keydown');
        },

        unbindKeyboardShortcuts: function () { // There should be a better way to do this
            Mousetrap.unbind(['esc', 'backspace']);
            Mousetrap.unbind(['enter', 'space']);
            Mousetrap.unbind('q');
            Mousetrap.unbind('f');
        },

        switchRating: function () {
            $('.number-container').toggleClass('hidden');
            $('.star-container').toggleClass('hidden');
            AdvSettings.set('ratingStars', $('.number-container').hasClass('hidden'));
        },

        switchSubtitle: function (lang) {
            var subtitles = this.model.get('subtitle');

            if (subtitles === undefined || subtitles[lang] === undefined) {
                lang = 'none';
            }

            this.subtitle_selected = lang;
            this.ui.selected_lang.removeClass().addClass('flag toggle selected-lang').addClass(this.subtitle_selected);

            win.info('Subtitles: ' + this.subtitle_selected);
        },

        startStreaming: function () {
            var movieInfo = {
                type: 'movie',
                imdbid: this.model.get('imdb_id')
            };
            var torrent = this.model.get('torrents')[this.model.get('quality')];
            var torrentStart = new Backbone.Model({
                imdb_id: this.model.get('imdb_id'),
                torrent: torrent,
                backdrop: this.model.get('backdrop'),
                subtitle: this.model.get('subtitle'),
                defaultSubtitle: Settings.subtitle_language, //originally: this.subtitle_selected,
                extract_subtitle: movieInfo,
                title: this.model.get('title'),
                quality: this.model.get('quality'),
                type: 'movie',
                device: App.Device.Collection.selected,
                cover: this.model.get('cover')
            });
            App.vent.trigger('stream:start', torrentStart);
         },

        toggleDropdown: function (e) {
            $('.tooltip').tooltip('hide');
            var ytsid = this.model.get('imdb_id');
            var openid = ytsid.slice(2, 100);
            if ($('.sub-dropdown-arrow').is('.down')) {
                this.closeDropdown(e);
                return false;
            } else {
                $('.sub-dropdown-arrow').addClass('down');
                $('.sub-dropdown').attr('data-original-title', i18n.__("Open OpenSubtitles"));
                nw.Shell.openExternal('http://www.yifysubtitles.com/movie-imdb/' + ytsid);
            };
            var self = this;
        },

        closeDropdown: function (e) {
            $('.tooltip').tooltip('hide');
            var ytsid = this.model.get('imdb_id');
            var openid = ytsid.slice(2, 100);
            e.preventDefault();
            $('.sub-dropdown-arrow').removeClass('down');
            $('.sub-dropdown').attr('data-original-title', i18n.__("Open YIFYSubtitles"));
            if (flagt !== 'url("images/flags/snone.png")') {
		nw.Shell.openExternal('http://www.opensubtitles.org/en/search/sublanguageid-' + opensubt + '/imdbid-' + openid);
            } else {
                nw.Shell.openExternal('http://www.opensubtitles.org/en/search/imdbid-' + openid);
            };
        },

        playTrailer: function () {
            var trailer = new Backbone.Model({
                src: this.model.get('trailer'),
                type: 'video/youtube',
                subtitle: null,
                quality: false,
                title: this.model.get('title')
            });
            var tmpPlayer = App.Device.Collection.selected.attributes.id;
            App.Device.Collection.setDevice('local');
            App.vent.trigger('stream:ready', trailer);
            App.Device.Collection.setDevice(tmpPlayer);
        },

        closeDetails: function () {
            App.vent.trigger('movie:closeDetail');
        },

        enableHD: function () {
            var torrents = this.model.get('torrents');

            if (torrents['1080p'] !== undefined) {
                torrents = this.model.get('torrents');
                this.model.set('quality', '1080p');
                win.debug('HD Enabled', this.model.get('quality'));
                AdvSettings.set('movies_default_quality', '1080p');
                this.resetHealth();
            }
        },

        disableHD: function () {
            var torrents = this.model.get('torrents');

            if (torrents['720p'] !== undefined) {
                torrents = this.model.get('torrents');
                this.model.set('quality', '720p');
                win.debug('HD Disabled', this.model.get('quality'));
                AdvSettings.set('movies_default_quality', '720p');
                this.resetHealth();
            }
        },

        toggleFavourite: function (e) {
            if (e.type) {
                e.stopPropagation();
                e.preventDefault();
            }
            var that = this;
            if (this.model.get('bookmarked') === true) {
                that.ui.bookmarkIcon.removeClass('selected').text(i18n.__('Add to bookmarks'));
                that.model.set('bookmarked', false);
            } else {
                that.ui.bookmarkIcon.addClass('selected').text(i18n.__('Remove from bookmarks'));
                that.model.set('bookmarked', true);
            }
            $('li[data-imdb-id="' + this.model.get('imdb_id') + '"] .actions-favorites').click();
        },

        toggleWatched: function (e) {

            if (e.type) {
                e.stopPropagation();
                e.preventDefault();
            }
            var that = this;
            if (this.model.get('watched') === true) {
                that.model.set('watched', false);
                that.ui.watchedIcon.removeClass('selected').text(i18n.__('Not Seen'));
            } else {
                that.model.set('watched', true);
                that.ui.watchedIcon.addClass('selected').text(i18n.__('Seen'));
            }

            $('li[data-imdb-id="' + this.model.get('imdb_id') + '"] .actions-watched').click();
        },

        openIMDb: function () {
            nw.Shell.openExternal('http://www.imdb.com/title/' + this.model.get('imdb_id'));
        },

        openMagnet: function (e) {
            var provider = this.model.get('provider'),
                torrent = this.model.get('torrents')[this.model.get('quality')],
                magnetLink;

            if (torrent.magnet) { // Movies
                magnetLink = torrent.magnet;
            } else { // Anime
                magnetLink = torrent.url;
            }
            if (e.button === 2) { //if right click on magnet link
                var clipboard = nw.Clipboard.get();
                clipboard.set(magnetLink, 'text'); //copy link to clipboard
                $('.notification_alert').text(i18n.__('The magnet link was copied to the clipboard')).fadeIn('fast').delay(2500).fadeOut('fast');
            } else {
                nw.Shell.openExternal(magnetLink);
            }
        },

        toggleQuality: function (e) {
            if ($('#switch-hd-off').is(':checked')) {
                $('#switch-hd-on').trigger('click');
            } else {
                $('#switch-hd-off').trigger('click');
            }
            App.vent.trigger('qualitychange');

            if (e.type) {
                e.preventDefault();
                e.stopPropagation();
            }
        },

        getTorrentHealth: function (e) {
            var torrent = this.model.get('torrents')[this.model.get('quality')],
                magnetLink;

            cancelTorrentHealth();

            // Use fancy coding to cancel
            // pending torrent-tracker-health's
            var cancelled = false;
            cancelTorrentHealth = function () {
                cancelled = true;
            };
            if (torrent) {
            if (torrent.magnet) {
                magnetLink = torrent.magnet;
            } else {
                magnetLink = torrent.url;
            }
            torrentHealth(magnetLink, {
                    timeout: 2000,
                    blacklist: Settings.trackers.blacklisted,
                    trackers: Settings.trackers.forced
                }, function (err, res) {
                  if (err) {
                    win.debug(err);
                  }
                  if (cancelled) {
                        return;
                    }
                    if (res.seeds === 0 && torrentHealthRestarted < 5) {
                        torrentHealthRestarted++;
                        $('.health-icon').click();
                    } else {
                        torrentHealthRestarted = 0;
                        var h = Common.calcHealth({
                            seed: res.seeds,
                            peer: res.peers
                        });
                        var health = Common.healthMap[h].capitalize();
                        var ratio = res.peers > 0 ? res.seeds / res.peers : +res.seeds;

                        $('.health-icon').tooltip({
                                html: true
                            })
                            .removeClass('Bad Medium Good Excellent')
                            .addClass(health)
                            .attr('data-original-title', i18n.__('Health ' + health) + ' - ' + i18n.__('Ratio:') + ' ' + ratio.toFixed(2) + ' <br> ' + i18n.__('Seeds:') + ' ' + res.seeds + ' - ' + i18n.__('Peers:') + ' ' + res.peers)
                            .tooltip('fixTitle');
                    }
                });
                }

        },

        resetHealth: function () {
            $('.health-icon').tooltip({
                    html: true
                })
                .removeClass('Bad Medium Good Excellent')
                .attr('data-original-title', i18n.__('Health Unknown'))
                .tooltip('fixTitle');
            this.getTorrentHealth();
        },

        selectPlayer: function (e) {
            var player = $(e.currentTarget).parent('li').attr('id').replace('player-', '');
            this.model.set('device', player);
            if (!player.match(/[0-9]+.[0-9]+.[0-9]+.[0-9]/ig)) {
                AdvSettings.set('chosenPlayer', player);
            }
        }

    });
})(window.App);
