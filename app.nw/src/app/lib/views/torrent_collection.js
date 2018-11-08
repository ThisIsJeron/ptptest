(function (App) {
    'use strict';

    var clipboard = nw.Clipboard.get(),
        collection = path.join(data_path + '/TorrentCollection/'),
        hidetooltps,
        totresults = -1;

    var TorrentCollection = Marionette.View.extend({
        template: '#torrent-collection-tpl',
        className: 'torrent-collection',

        events: {
            'click .file-item': 'openFileSelector',
            'click .result-item': 'onlineOpen',
            'mousedown .item-delete': 'deleteItem',
            'mousedown .item-rename': 'renameItem',
            'click .magnet-icon': 'openMagnet',
            'click .collection-delete': 'clearCollection',
            'click .collection-open': 'openCollection',
            'click .collection-import': 'importItem',
            'click .notorrents-frame': 'importItem',
            'click .online-search': 'onlineSearch',
            'click .online-search2': 'importItem',
            'click .online-search3': 'onlineSearch3',
            'click .engine-icon1': 'toggleEngine1',
            'click .engine-icon2': 'toggleEngine2',
            'click .engine-icon3': 'toggleEngine3',
            'submit #online-form': 'onlineSearch',
            'click .online-back': 'onlineClose',
            'contextmenu #online-input': 'rightclick_search'
        },

        initialize: function () {
            if (!fs.existsSync(collection)) {
                fs.mkdirSync(collection);
                console.debug('TorrentCollection: data directory created');
            }
            this.files = fs.readdirSync(collection);
            this.searchEngine = 'rarbg';
        },

        onAttach: function () {
            Mousetrap.bind(['esc', 'backspace'], function (e) {
                $('#filterbar-torrent-collection').click();
            });

            $('#movie-detail').hide();
            $('#nav-filters').hide();

            this.render();
        },

        onRender: function () {
            clearTimeout(hidetooltps);
            if (Settings.useleetx === true) {
                $('.engine-icon1').addClass('active');
                $('.engine-icon1').tooltip('hide');
                $('.engine-icon1').attr('title', 'Disable 1337x').tooltip('fixTitle');
            } else {
                $('.engine-icon1').removeClass('active');
                $('.engine-icon1').tooltip('hide');
                $('.engine-icon1').attr('title', 'Enable 1337x').tooltip('fixTitle');
            }
            if (Settings.usetpb === true) {
                $('.engine-icon2').addClass('active');
                $('.engine-icon2').tooltip('hide');
                $('.engine-icon2').attr('title', 'Disable ThePirateBay').tooltip('fixTitle');
            } else {
                $('.engine-icon2').removeClass('active');
                $('.engine-icon2').tooltip('hide');
                $('.engine-icon2').attr('title', 'Enable ThePirateBay').tooltip('fixTitle');
            }
            if (Settings.userarbg === true) {
                $('.engine-icon3').addClass('active');
                $('.engine-icon3').tooltip('hide');
                $('.engine-icon3').attr('title', 'Disable RARBG').tooltip('fixTitle');
            } else {
                $('.engine-icon3').removeClass('active');
                $('.engine-icon3').tooltip('hide');
                $('.engine-icon3').attr('title', 'Enable RARBG').tooltip('fixTitle');
            }
            $('#online-input').focus();
            if (this.files[0]) {
                $('.notorrents-info').css('display', 'none');
                $('.collection-actions').css('display', 'block');
                $('.torrents-info').css('display', 'block');
            }

            this.$('.tooltipped').tooltip({
                delay: {
                    'show': 800,
                    'hide': 100
                }
            });
            if (($('.loading .maximize-icon').css('visibility') == 'visible') || ($('.loading .maximize-icong').css('visibility') == 'visible')) {             
                $('.online-search2').css('cursor', 'not-allowed');
                $('.online-search2').css('opacity', '0.2');
                $('.online-search2').prop('disabled', true);
                $('.online-search2').attr('data-original-title', '');
                $('.online-search3').css('cursor', 'not-allowed');
                $('.online-search3').css('opacity', '0.2');
                $('.online-search3').prop('disabled', true);
                $('.online-search3').attr('data-original-title', '');
                $('.file-item').css('cursor', 'not-allowed');
                $('.file-item').css('opacity', '0.7');
                $('.file-item').prop('disabled', true);
            }
        },

        toggleEngine1: function (e) {
            if (Settings.useleetx === true) {
                AdvSettings.set('useleetx', false);
                $('.engine-icon1').removeClass('active');
                $('.engine-icon1').tooltip('hide');
                $('.engine-icon1').attr('title', 'Enable 1337x').tooltip('fixTitle');
            } else {
                AdvSettings.set('useleetx', true);
                $('.engine-icon1').addClass('active');
                $('.engine-icon1').tooltip('hide');
                $('.engine-icon1').attr('title', 'Disable 1337x').tooltip('fixTitle');
            }
        },

        toggleEngine2: function (e) {
            if (Settings.usetpb === true) {
                AdvSettings.set('usetpb', false);
                $('.engine-icon2').removeClass('active');
                $('.engine-icon2').tooltip('hide');
                $('.engine-icon2').attr('title', 'Enable ThePirateBay').tooltip('fixTitle');
            } else {
                AdvSettings.set('usetpb', true);
                $('.engine-icon2').addClass('active');
                $('.engine-icon2').tooltip('hide');
                $('.engine-icon2').attr('title', 'Disable ThePirateBay').tooltip('fixTitle');
            }
        },

        toggleEngine3: function (e) {
            if (Settings.userarbg === true) {
                AdvSettings.set('userarbg', false)
                $('.engine-icon3').removeClass('active');
                $('.engine-icon3').tooltip('hide');
                $('.engine-icon3').attr('title', 'Enable RARBG').tooltip('fixTitle');
            } else {
                AdvSettings.set('userarbg', true)
                $('.engine-icon3').addClass('active');
                $('.engine-icon3').tooltip('hide');
                $('.engine-icon3').attr('title', 'Disable RARBG').tooltip('fixTitle');
            }
        },

        onlineSearch3: function (e) {
            var data3 = clipboard.get('text');
            handleTorrent(data3, 'text');
        },

        onlineSearch: function (e, retry) {
            clearTimeout(hidetooltps);
            totresults = -1;
            $('.tooltip').tooltip('hide');
            $('.engine-icon1').attr('title', '0').tooltip('fixTitle');
            $('.engine-icon2').attr('title', '0').tooltip('fixTitle');
            $('.engine-icon3').attr('title', '0').tooltip('fixTitle');
            if (e) {
                e.preventDefault();
            }
            var that = this;
            var input = $('#online-input').val();
            var category = $('.online-categories > select').val();
            AdvSettings.set('OnlineSearchCategory', category);
            if (category === 'Series') {
                category = 'tv';
            } else if (category === 'Movies') {
				category = 'movies';
			} else if (category === 'Anime') {
				category = 'anime';
			}
            var current = $('.onlinesearch-info > ul.file-list').html();

            if (input === '' && current === '') {
                return;
            } else if (input === '' && current !== '') {
                this.onlineClose();
                return;
            }

            $('.onlinesearch-info>ul.file-list').html('');

            $('.online-search').removeClass('fa-search').addClass('fa-spin fa-spinner');

            var index = 0;

            var leetx = function () {
                return new Promise(function (resolve) {
                    var results = [];
                    setTimeout(function () {
                        resolve(results);
                    }, 6000);
                    var leet = torrentCollection.leet;
                    leet.search({query:input.toLocaleLowerCase()}).then(function (data) {
                        if (totresults == -1) {
                            console.debug('1337x search: %s results', data.length);
                            $('.engine-icon1').attr('title', data.length).tooltip('fixTitle').tooltip('show');
                            $('.tooltip').css('top', 87 + 'px');
                            var indx = 1, totl = data.length;
                            data.forEach(function (item) {
                                leet.info(item.href).then(function (ldata) {
                                    var itemModel = {
                                        title: ldata.title,
                                        magnet: ldata.download.magnet,
                                        seeds: ldata.seeders,
                                        peers: ldata.leechers,
                                        size: ldata.size,
                                        index: index
                                    };
                                    indx++;
                                    if (item.title.match(/trailer/i) !== null && input.match(/trailer/i) === null) {
                                        return;
                                    }
                                    results.push(itemModel);
                                    index++;
                                }).catch(function (err) {
                                    throw 'nope';
                                });
                            });
                        } else {
                            return;
                        };
                    }).catch(function (err) {
                        console.error('1337x search:', err);
                        resolve(results);
                    });
                });
            };

            var piratebay = function () {
                return new Promise(function (resolve) {
                    var results = [];
                    setTimeout(function () {
                        resolve(results);
                    }, 6000);
                    var tpb = torrentCollection.tpb;
                    tpb.search(input.toLocaleLowerCase(), {
                        category: 0,
                        page : 0,
                        orderBy: 'seeds',
                        sortBy: 'desc'
                    }).then(function (data) {
                        if (totresults == -1) {
                            console.debug('TPB search: %s results', data.length);
                            $('.engine-icon2').attr('title', data.length).tooltip('fixTitle').tooltip('show');
                            $('.tooltip').css('top', 87 + 'px');
                            data.forEach(function (item) {
                                if (!item.category) {
                                    return;
                                }

                                var itemModel = {
                                    title: item.name,
                                    magnet: item.magnetLink,
                                    seeds: item.seeders,
                                    peers: item.leechers,
                                    size: item.size,
                                    index: index
                                };

                                if (item.name.match(/trailer/i) !== null && item.name.match(/trailer/i) === null) {
                                    return;
                                }
                                results.push(itemModel);
                                index++;
                            });
                            resolve(results);
                        } else {
                            return;
                        };
                    }).catch(function (err) {
                        console.error('tpb search:', err);
                        resolve(results);
                    });
                });
            };

            var rarbg = function (retry) {
                return new Promise(function (resolve) {
                    var results1 = [];
                    setTimeout(function () {
                        resolve(results1);
                    }, 6000);
                    var rbg = torrentCollection.rbg;
                    rbg.search({
                        query: input.toLocaleLowerCase(),
                        category: category.toLocaleLowerCase(),
                        sort: 'seeders',
                        verified: false
                    }).then(function (results) {
                        if (totresults == -1) {
                            console.debug('rarbg search: %s results', results.length);
                            $('.engine-icon3').attr('title', results.length).tooltip('fixTitle').tooltip('show');
                            $('.tooltip').css('top', 87 + 'px');
                            results.forEach(function (item) {
                                var itemModel = {
                                    title: item.title,
                                    magnet: item.download,
                                    seeds: item.seeders,
                                    peers: item.leechers,
                                    size: Common.fileSize(parseInt(item.size)),
                                    index: index
                                };

                                if (item.title.match(/trailer/i) !== null && input.match(/trailer/i) === null) {
                                    return;
                                }
                                results1.push(itemModel);
                                index++;
                            });
                            resolve(results1);
                        } else {
                            return;
                        };
                    }).catch(function (err) {
                        console.error('rarbg search:', err);
                        if (!retry) {
                            return resolve(rarbg(true));
                        } else {
                            resolve(results1);
                        }
                    });
                });
            };

            var removeDupes = function (arr) {
                var found = [];
                var unique = [];
                for (var a in arr) {
                    var provider = arr[a];
                    for (var p in provider) {
                        var obj = provider[p];
                        var link = obj.magnet.split('&dn');
                        if (found.indexOf(link[0]) === -1) {
                            found.push(link);
                            unique.push(obj);
                        }
                    }
                }
                return unique;
            };

            var sortBySeeds = function (items) {
                return items.sort(function (a, b) {
                    return b.seeds - a.seeds;
                });
            };

            $('.notorrents-info,.torrents-info').hide();

            const storageProcesses = [];
            if (Settings.userarbg === true) {
                storageProcesses.push(rarbg());
            }
            if (Settings.usetpb === true) {
                storageProcesses.push(piratebay());
            }
            if (Settings.useleetx === true) {
                storageProcesses.push(leetx());
            }

            return Promise.all(storageProcesses).then(function (results) {
                var items = sortBySeeds(removeDupes(results));
                console.log('search providers: %d results', items.length);
                totresults = items.length;
                $('.online-search').attr('title', items.length).tooltip('fixTitle').tooltip('show');
                $('.tooltip').css('top', 86 + 'px');
                hidetooltps = setTimeout(function() {
                $('.tooltip').tooltip('hide');
                }, 4000);

                return Promise.all(items.map(function (item) {
                    that.onlineAddItem(item);
                })).then(function () {
                    $('.online-search').removeClass('fa-spin fa-spinner').addClass('fa-search');
                    $('.onlinesearch-info').show();

                    if (items.length === 0) {
                        $('.onlinesearch-info>ul.file-list').html('<br><br><div style="text-align:center;font-size:30px">' + i18n.__('No results found') + '</div>');
                    }

                    that.$('.tooltipped').tooltip({
                        html: true,
                        delay: {
                            'show': 50,
                            'hide': 50
                        }
                    });
                });
            });
      
        },

        onlineAddItem: function (item) {
            var ratio = item.peers > 0 ? item.seeds / item.peers : +item.seeds;
            $('.onlinesearch-info>ul.file-list').append(
                '<li class="result-item" data-index="' + item.index + '" data-file="' + item.magnet + '">'+
                    '<a>' + item.title + '</a>'+
                    '<div class="item-icon magnet-icon tooltipped" data-toogle="tooltip" data-placement="right" title="' + i18n.__('Magnet link') + '"></div>'+
                    '<i class="online-size tooltipped" data-toggle="tooltip" data-placement="left" title="' + i18n.__('Ratio:') + ' ' + ratio.toFixed(2) + '<br>' + i18n.__('Seeds:') + ' ' + item.seeds + ' - ' + i18n.__('Peers:') + ' ' + item.peers + '">'+
                        item.size+
                    '</i>'+
                '</li>'
            );
            if (item.seeds === 0) { // recalc the peers/seeds
                require('webtorrent-health')(item.magnet, {
                    timeout: 1000,
                    blacklist: Settings.trackers.blacklisted,
                    force: Settings.trackers.forced
                }).then(function (res) {
                    //console.log('torrent index %s: %s -> %s (seeds)', item.index, item.seeds, res.seeds)
                    ratio = res.peers > 0 ? res.seeds / res.peers : +res.seeds;
                    $('.result-item[data-index=' + item.index + '] i').attr('data-original-title', i18n.__('Ratio:') + ' ' + ratio.toFixed(2) + '<br>' + i18n.__('Seeds:') + ' ' + res.seeds + ' - ' + i18n.__('Peers:') + ' ' + res.peers);
                });
            }
            if (($('.loading .maximize-icon').css('visibility') == 'visible') || ($('.loading .maximize-icong').css('visibility') == 'visible')) {        
                $('.result-item').css('cursor', 'not-allowed');
                $('.result-item').css('opacity', '0.7');
                $('.result-item').prop('disabled', true);
            }
        },

        onlineOpen: function (e) {
            $('.tooltip').tooltip('hide');
            var file = e.currentTarget.dataset.file;
            Settings.droppedMagnet = file;
            window.handleTorrent(file);
        },

        onlineClose: function () {
            $('.onlinesearch-info>ul.file-list').html('');
            $('.onlinesearch-info').hide();
            this.render();
        },

        rightclick_search: function (e) {
            e.preventDefault();
            var search_menu = new this.context_Menu(i18n.__('Cut'), i18n.__('Copy'), i18n.__('Paste'));
            search_menu.popup(e.originalEvent.x, e.originalEvent.y);
        },

        context_Menu: function (cutLabel, copyLabel, pasteLabel) {
            var menu = new nw.Menu(),

                cut = new nw.MenuItem({
                    label: cutLabel || 'Cut',
                    click: function () {
                        document.execCommand('cut');
                    }
                }),

                copy = new nw.MenuItem({
                    label: copyLabel || 'Copy',
                    click: function () {
                        document.execCommand('copy');
                    }
                }),

                paste = new nw.MenuItem({
                    label: pasteLabel || 'Paste',
                    click: function () {
                        var text = clipboard.get('text');
                        $('#online-input').val(text);
                    }
                });

            menu.append(cut);
            menu.append(copy);
            menu.append(paste);

            return menu;
        },

        openFileSelector: function (e) {
            var _file = e.currentTarget.innerText,
                file = _file.substring(0, _file.length - 2); // avoid ENOENT

            if (_file.indexOf('.torrent') !== -1) {
                Settings.droppedTorrent = file;
                window.handleTorrent(collection + file);
            } else { // assume magnet
                var content = fs.readFileSync(collection + file, 'utf8');
                Settings.droppedMagnet = content;
                Settings.droppedStoredMagnet = file;
                window.handleTorrent(content);
            }
        },

        openMagnet: function (e) {
            this.$('.tooltip').css('display', 'none');
            e.preventDefault();
            e.stopPropagation();

            var magnetLink;

            if (e.currentTarget.parentNode.className === 'file-item') {
                // stored
                var _file = e.currentTarget.parentNode.innerText,
                    file = _file.substring(0, _file.length - 2); // avoid ENOENT
                magnetLink = fs.readFileSync(collection + file, 'utf8');
            } else {
                // search result
                magnetLink = e.currentTarget.parentNode.attributes['data-file'].value;
            }

            if (e.button === 2) { //if right click on magnet link
                var clipboard = nw.Clipboard.get();
                clipboard.set(magnetLink, 'text'); //copy link to clipboard
                $('.notification_alert').text(i18n.__('The magnet link was copied to the clipboard')).fadeIn('fast').delay(2500).fadeOut('fast');
            } else {
                nw.Shell.openExternal(magnetLink);
            }
        },

        deleteItem: function (e) {
            this.$('.tooltip').css('display', 'none');
            e.preventDefault();
            e.stopPropagation();

            var _file = e.currentTarget.parentNode.innerText,
                file = _file.substring(0, _file.length - 2); // avoid ENOENT

            fs.unlinkSync(collection + file);
            console.debug('Torrent Collection: deleted', file);

            // update collection
            this.files = fs.readdirSync(collection);
            this.render();
        },

        renameItem: function (e) {
            this.$('.tooltip').css('display', 'none');
            e.preventDefault();
            e.stopPropagation();

            var _file = e.currentTarget.parentNode.innerText,
                file = _file.substring(0, _file.length - 2), // avoid ENOENT
                isTorrent = false;

            if (file.endsWith('.torrent')) {
                isTorrent = 'torrent';
            }

            var newName = this.renameInput(file);
            if (!newName) {
                return;
            }

            if (isTorrent) { //torrent
                if (!newName.endsWith('.torrent')) {
                    newName += '.torrent';
                }
            } else { //magnet
                if (newName.endsWith('.torrent')) {
                    newName = newName.replace('.torrent', '');
                }
            }

            if (!fs.existsSync(collection + newName) && newName) {
                fs.renameSync(collection + file, collection + newName);
                console.debug('Torrent Collection: renamed', file, 'to', newName);
            } else {
                $('.notification_alert').show().text(i18n.__('This name is already taken')).delay(2500).fadeOut(400);
            }

            // update collection
            this.files = fs.readdirSync(collection);
            this.render();
        },

        renameInput: function (oldName) {
            var userInput = prompt(i18n.__('Enter new name'), oldName);
            if (!userInput || userInput === oldName) {
                return false;
            } else {
                return userInput;
            }
        },

        clearCollection: function () {
            var btn = confirm(i18n.__('Are you sure you want to clear the entire Torrent Collection ?'));
                if (btn === true) {
                deleteFolder(collection);
                console.debug('Torrent Collection: delete all', collection);
                App.vent.trigger('torrentCollection:show');
            }
        },

        openCollection: function () {
            console.debug('Opening: ' + collection);
            nw.Shell.openItem(collection);
        },

        importItem: function () {
            this.$('.tooltip').css('display', 'none');

            var that = this;
            var input = document.querySelector('.collection-import-hidden');
            input.addEventListener('change', function (evt) {
                var file = $('.collection-import-hidden')[0].files[0];
                that.render();
                window.ondrop({
                    dataTransfer: {
                        files: [file]
                    },
                    preventDefault: function () {}
                });
            }, false);

            input.click();
        },

        onBeforeDestroy: function () {
            Mousetrap.unbind(['esc', 'backspace']);
            $('#movie-detail').show();
            $('#nav-filters').show();
            $('.tooltip').tooltip('hide');
        },

        closeTorrentCollection: function () {
            App.vent.trigger('torrentCollection:close');
        }

    });

    App.View.TorrentCollection = TorrentCollection;
})(window.App);
