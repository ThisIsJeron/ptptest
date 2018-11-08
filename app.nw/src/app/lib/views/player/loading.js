(function (App) {
    'use strict';
    var ddone = 'false';
    var Loading = Marionette.View.extend({
        template: '#loading-tpl',
        className: 'app-overlay',
        extPlayerStatusUpdater: null,

        ui: {
            stateTextDownload: '.text_download',
            progressTextDownload: '.value_download',

            stateTextPeers: '.text_peers',
            progressTextPeers: '.value_peers',

            stateTextSeeds: '.text_seeds',
            progressTextSeeds: '.value_seeds',

            seedStatus: '.seed_status',
            bufferPercent: '.buffer_percent',
            loadingInfos: '.loading-info',

            downloadSpeed: '.download_speed',
            uploadSpeed: '.upload_speed',
            progressbar: '#loadingbar-contents',

            title: '.title',
            player: '.player-name',
            streaming: '.external-play',
            controls: '.player-controls',
            cancel_button: '.cancel-button',

            playingbarBox: '.playing-progressbar',
            playingbar: '#playingbar-contents'
        },

        events: {
            'click .cancel-button': 'cancelStreaming',
            'click .open-button': 'tempf',
            'click .pause': 'pauseStreaming',
            'click .stop': 'stopStreaming',
            'click .play': 'resumeStreaming',
            'click .forward': 'forwardStreaming',
            'click .backward': 'backwardStreaming',
            'click .minimize-icon': 'minDetails',
            'click .maximize-icon': 'minDetails',
            'click .maximize-icong': 'minDetails',
            'mousedown .title': 'filenametoclip',
            'click .playing-progressbar': 'seekStreaming'
        },

        initialize: function () {
            var that = this;
            App.vent.trigger('settings:close');
            App.vent.trigger('about:close');

            //If a child was removed from above this view
            App.vent.on('viewstack:pop', function () {
                if (_.last(App.ViewStack) === that.className) {
                    that.initKeyboardShortcuts();
                }
            });

            //If a child was added above this view
            App.vent.on('viewstack:push', function () {
                if (_.last(App.ViewStack) !== that.className) {
                    that.unbindKeyboardShortcuts();
                }
            });

            win.info('Loading torrent');

            this.listenTo(this.model, 'change:state', this.onStateUpdate);
            ddone = 'false';
            $('.button').css('background-color', '#707070');
            $('.button').css('cursor', 'not-allowed');
            $('.button').prop('disabled', true);
            $('.button').css('opacity', '0.2');
            $('#watch-now').prop('disabled', true);
            $('#watch-now2').prop('disabled', true);
            $('.sdow-watchnow').css('background-color', '#707070');
            $('.sdow-watchnow').css('cursor', 'not-allowed');
            $('.sdow-watchnow').prop('disabled', true);
            $('.sdow-watchnow').css('visibility', 'hidden');
            $('.online-search2').css('cursor', 'not-allowed');
            $('.online-search2').css('opacity', '0.2');
            $('.online-search2').prop('disabled', true);
            $('.online-search2').attr('data-original-title', '');
            $('.online-search3').css('cursor', 'not-allowed');
            $('.online-search3').css('opacity', '0.2');
            $('.online-search3').prop('disabled', true);
            $('.online-search3').attr('data-original-title', '');
            $('.result-item').css('cursor', 'not-allowed');
            $('.result-item').css('opacity', '0.7');
            $('.result-item').prop('disabled', true);
            $('.file-item').css('cursor', 'not-allowed');
            $('.file-item').css('opacity', '0.7');
            $('.file-item').prop('disabled', true);
            Mousetrap.bind('ctrl+v', function (e) {
               e.preventDefault();
            });
        },

        initKeyboardShortcuts: function () {
            var that = this;
            Mousetrap.bind(['esc', 'backspace'], function (e) {
                that.cancelStreaming();
            });
        },

        unbindKeyboardShortcuts: function () {
            Mousetrap.unbind(['esc', 'backspace']);
        },

        minDetails: function () {	
           if ($('.minimize-icon').css('visibility') == 'visible') {	
              $('.loading').css('height', '0px');
              $('.loading').css('width', '0px');
              $('.loading').css('float', 'right');
              $('.loading-background').css('visibility', 'hidden');
              $('.minimize-icon').css('visibility', 'hidden');
              if (ddone === 'false') {
                 $('.maximize-icon').css('visibility', 'visible');
              } else {
                 $('.maximize-icong').css('visibility', 'visible');
              };
              $('.filter-bar').show();
           } else if (($('.maximize-icon').css('visibility') == 'visible') || ($('.maximize-icong').css('visibility') == 'visible')) {
              $('.loading').css('height', '100%');
              $('.loading').css('width', '100%');
              $('.loading').css('float', '');
              $('.loading-background').css('visibility', 'visible');
              $('.maximize-icon').css('visibility', 'hidden');
              $('.maximize-icong').css('visibility', 'hidden');
              $('.minimize-icon').css('visibility', 'visible');
              $('.filter-bar').hide();
           } else {
           }
        },

        onAttach: function () {
            $('.filter-bar').hide();
            $('#header').addClass('header-shadow');

            App.LoadingView = this;

            this.initKeyboardShortcuts();
            $('.minimize-icon,#maxic,.open-button,.title').tooltip({
                html: true,
                delay: {
                    'show': 800,
                    'hide': 0
                }
            });
        },

        onStateUpdate: function () {
            var self = this;
            var state = this.model.get('state');
            var streamInfo = this.model.get('streamInfo');
            win.info('Loading torrent:', state);

            this.ui.stateTextDownload.text(i18n.__(state));

            this.listenTo(this.model.get('streamInfo'), 'change', this.onInfosUpdate);

            if ((Settings.activateToolf === true) && (Settings.activateTools === true)) {
                $('.loading .state .title').attr('data-original-title', '<br>' + '&nbsp;&nbsp;&nbsp;&nbsp;' + streamInfo.get('filename') + '&nbsp;&nbsp;-&nbsp;&nbsp;' + Common.fileSize(streamInfo.get('size')) + '&nbsp;&nbsp;&nbsp;&nbsp;' + '<br><br>Stream url:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + streamInfo.get('src').replace('127.0.0.1', Settings.ipAddress) + '<br><br>');
            } else if ((Settings.activateToolf === true) && (Settings.activateTools === false)) {
                $('.loading .state .title').attr('data-original-title', '<br>' + '&nbsp;&nbsp;&nbsp;&nbsp;' + streamInfo.get('filename') + '&nbsp;&nbsp;-&nbsp;&nbsp;' + Common.fileSize(streamInfo.get('size')) + '&nbsp;&nbsp;&nbsp;&nbsp;' + '<br><br>');
            } else if ((Settings.activateToolf === false) && (Settings.activateTools === true)) {
                $('.loading .state .title').attr('data-original-title', '<br>' + '&nbsp;&nbsp;&nbsp;&nbsp;' + 'Stream url:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + streamInfo.get('src').replace('127.0.0.1', Settings.ipAddress) + '&nbsp;&nbsp;&nbsp;&nbsp;' + '<br><br>');
            };

            if (state === 'downloading') {
                this.listenTo(this.model.get('streamInfo'), 'change:downloaded', this.onProgressUpdate);
            }

            if (state === 'playingExternally') {
                this.ui.stateTextDownload.hide();
                this.ui.progressbar.hide();
                if (streamInfo && streamInfo.get('device')) {
                    if (Settings.activateLoCtrl === true) {
                        this.ui.cancel_button.css('visibility', 'hidden');
                        this.ui.controls.css('visibility', 'visible');
                        this.ui.playingbarBox.css('visibility', 'visible');
                    }
                    this.ui.playingbar.css('width', '0%');

                    // Update gui on status update.
                    // uses listenTo so event is unsubscribed automatically when loading view closes.
                    this.listenTo(App.vent, 'device:status', this.onDeviceStatus);
                }
                // The 'downloading' state is not always sent, eg when playing canceling and replaying
                // Start listening here instead when playing externally
                this.listenTo(this.model.get('streamInfo'), 'change:downloaded', this.onProgressUpdate);
            }
        },

        onInfosUpdate: function () {
            var streamInfo = this.model.get('streamInfo');

            this.ui.seedStatus.css('visibility', 'visible');

            if (streamInfo.get('size') && !this.firstUpdate) {
                this.ui.loadingInfos.hide();
                this.checkFreeSpace(streamInfo.get('size'));
                this.firstUpdate = true;
            }
            if (streamInfo.get('backdrop')) {
                $('.loading-background').css('background-image', 'url(' + streamInfo.get('backdrop') + ')');
            }
            if (streamInfo.get('title') !== '') {
                this.ui.title.html(streamInfo.get('title'));
            }
            if (streamInfo.get('player') && streamInfo.get('player').get('type') !== 'local') {
                this.ui.player.text(streamInfo.get('player').get('name'));
                this.ui.streaming.css('visibility', 'visible');
            }
        },

        onProgressUpdate: function () {
            var streamInfo = this.model.get('streamInfo');

            var downloaded = streamInfo.get('downloaded') / (1024 * 1024);
            this.ui.progressTextDownload.text(downloaded.toFixed(2) + ' Mb');

            this.ui.progressTextPeers.text(streamInfo.get('active_peers'));
            this.ui.progressTextSeeds.text(streamInfo.get('total_peers'));
            this.ui.bufferPercent.text(streamInfo.get('downloadedPercent').toFixed() + '%');

            this.ui.downloadSpeed.text(streamInfo.get('downloadSpeed'));
            this.ui.uploadSpeed.text(streamInfo.get('uploadSpeed'));

            this.ui.loadingInfos.show();

            if (this.model.get('state') === 'playingExternally') {
                this.ui.bufferPercent.text(streamInfo.get('downloadedPercent').toFixed() + '%');
                this.ui.stateTextDownload.text(i18n.__('Downloaded')).show();
            }

            if ((ddone === 'false') && (streamInfo.get('downloadedPercent').toFixed() === '100')) {
               ddone = 'true';
               $('.cancel-button').css('background-color', '#27ae60');
               if (Settings.activateTempfl === true) {
                  $('.cancel-button').css('left', '-45px');
                  $('.open-button').css('visibility', 'visible');
               };
            };
            if ((ddone === 'true') && ($('.maximize-icon').css('visibility') == 'visible')) {
               $('.maximize-icong').css('visibility', 'visible');
               $('.maximize-icon').css('visibility', 'hidden');
            };
        },

        onDeviceStatus: function (status) {
            if (status.media !== undefined && status.media.duration !== undefined) {
                // Update playingbar width
                var playedPercent = status.currentTime / status.media.duration * 100;
                this.ui.playingbar.css('width', playedPercent.toFixed(1) + '%');
                win.debug('ExternalStream: %s: %ss / %ss (%s%)', status.playerState,
                    status.currentTime.toFixed(1), status.media.duration.toFixed(), playedPercent.toFixed(1));
            }
            if (!this.extPlayerStatusUpdater && status.playerState === 'PLAYING') {
                // First PLAYING state. Start requesting device status update every 5 sec
                this.extPlayerStatusUpdater = setInterval(function () {
                    App.vent.trigger('device:status:update');
                }, 5000);
            }
            if (this.extPlayerStatusUpdater && status.playerState === 'IDLE') {
                // Media started streaming and is now finished playing
                this.cancelStreaming();
            }
        },

        cancelStreaming: function () {

            // call stop if we play externally
            if (this.model.get('state') === 'playingExternally') {
                if (this.extPlayerStatusUpdater) {
                    clearInterval(this.extPlayerStatusUpdater);
                }
                win.info('Stopping external device');
                App.vent.trigger('device:stop');
            }

            win.info('Closing loading view');
            App.vent.trigger('stream:stop');
            App.vent.trigger('player:close');
            App.vent.trigger('torrentcache:stop');
        },

        tempf: function (e) {
            nw.Shell.openExternal(Settings.tmpLocation);
        },

        filenametoclip: function (e) {
            if ($('.minimize-icon').css('visibility') == 'visible') {
                var streamInfo = this.model.get('streamInfo');
                var clipboard = nw.Clipboard.get();
                if (e.button === 0) {
                    clipboard.set(streamInfo.get('filename'), 'text');
                    $('.notification_alert').text(i18n.__('The filename was copied to the clipboard')).fadeIn('fast').delay(2500).fadeOut('fast');
                } else if (e.button === 2) {
                    clipboard.set(streamInfo.get('src').replace('127.0.0.1', Settings.ipAddress), 'text');
                    $('.notification_alert').text(i18n.__('The stream url was copied to the clipboard')).fadeIn('fast').delay(2500).fadeOut('fast');
                };
            };
        },

        pauseStreaming: function () {
            App.vent.trigger('device:pause');
            $('.pause').removeClass('fa-pause').removeClass('pause').addClass('fa-play').addClass('play');
        },

        resumeStreaming: function () {
            win.debug('Play triggered');
            App.vent.trigger('device:unpause');
            $('.play').removeClass('fa-play').removeClass('play').addClass('fa-pause').addClass('pause');
        },

        stopStreaming: function () {
            this.cancelStreaming();
        },

        forwardStreaming: function () {
            win.debug('Forward triggered');
            App.vent.trigger('device:forward');
        },

        backwardStreaming: function () {
            win.debug('Backward triggered');
            App.vent.trigger('device:backward');
        },

        seekStreaming: function (e) {
            var percentClicked = e.offsetX / e.currentTarget.clientWidth * 100;
            win.debug('Seek (%s%) triggered', percentClicked.toFixed(2));
            App.vent.trigger('device:seekPercentage', percentClicked);
        },

        checkFreeSpace: function (size) {
            if (!size) {
                return;
            }
            size = size / (1024 * 1024 * 1024);
            var reserved = size * 20 / 100;
            reserved = reserved > 0.25 ? 0.25 : reserved;
            var minspace = size + reserved;

            var cmd;

            if (process.platform === 'win32') {
                var drive = Settings.tmpLocation.substr(0, 2);

                cmd = 'dir /-C ' + drive;

                child.exec(cmd, function (error, stdout, stderr) {
                    if (error) {
                        return;
                    }
                    var stdoutParse = stdout.split('\n');
                    stdoutParse = stdoutParse[stdoutParse.length - 1] !== '' ? stdoutParse[stdoutParse.length - 1] : stdoutParse[stdoutParse.length - 2];
                    var regx = stdoutParse.match(/(\d+)/g);
                    if (regx !== null) {
                        var freespace = regx[regx.length - 1] / (1024 * 1024 * 1024);
                        if (freespace < minspace) {
                            $('#player .warning-nospace').css('display', 'block');
                        }
                    }
                });
            } else {
                var path = Settings.tmpLocation;

                cmd = 'df -Pk "' + path + '" | awk \'NR==2 {print $4}\'';

                child.exec(cmd, function (error, stdout, stderr) {
                    if (error) {
                        return;
                    }

                    var freespace = stdout.replace(/\D/g, '') / (1024 * 1024);
                    if (freespace < minspace) {
                        $('#player .warning-nospace').css('display', 'block');
                    }
                });
            }
        },

        onBeforeDestroy: function () {
            $('.filter-bar').show();
            $('#header').removeClass('header-shadow');
            Mousetrap.bind('esc', function (e) {
                App.vent.trigger('show:closeDetail');
                App.vent.trigger('movie:closeDetail');
            });
               $('.button').css('background-color', '');
               $('.button').css('cursor', '');
               $('.button').prop('disabled', false);
               $('.button').css('opacity', '');
               $('#watch-now').prop('disabled', false);
               $('#watch-now2').prop('disabled', false);
               $('.sdow-watchnow').css('background-color', '');
               $('.sdow-watchnow').css('cursor', '');
               $('.sdow-watchnow').prop('disabled', false);
               $('.sdow-watchnow').css('visibility', 'visible');
               $('.online-search2').css('cursor', '');
               $('.online-search2').css('opacity', '');
               $('.online-search2').prop('disabled', false);
               $('.online-search2').attr('data-original-title', 'Open .torrent');
               $('.online-search3').css('cursor', '');
               $('.online-search3').css('opacity', '');
               $('.online-search3').prop('disabled', false);
               $('.online-search3').attr('data-original-title', 'Paste Magnet');
               $('.result-item').css('cursor', '');
               $('.result-item').css('opacity', '');
               $('.result-item').prop('disabled', false);
               $('.file-item').css('cursor', '');
               $('.file-item').css('opacity', '');
               $('.file-item').prop('disabled', false);
               $('.cancel-button').css('background-color', '');
               $('.cancel-button').css('left', '');
               $('.open-button').css('visibility', '');
               Mousetrap.bind('ctrl+v', function (e) {
               });
        }
    });

    App.View.Loading = Loading;
})(window.App);
