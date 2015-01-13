/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

define([
    'angular',
    'ng-sir-trevor'
], function(angular) {
    'use strict';
    angular
    .module('SirTrevorBlocks', [])
        .config(['SirTrevorProvider', function(SirTrevor) {
            // Add toMeta method to all blocks.
            SirTrevor.Block.prototype.toMeta = function(){return;};
            SirTrevor.Block.prototype.getOptions = function(){return SirTrevor.$get().getInstance(this.instanceID).options;};

            SirTrevor.Blocks.Link =  SirTrevor.Block.extend({
                type: 'link',
                title: function(){ return 'Link'; },
                icon_name: 'link',
                editorHTML: function() {
                    return [
                        '<div class="st-required st-link-block link-input"',
                        ' placeholder="url" contenteditable="true"></div>'
                    ].join('\n');
                },
                onBlockRender: function() {
                    var that = this;
                    // create and trigger a 'change' event for the $editor which is a contenteditable
                    this.$editor.filter('[contenteditable]').on('focus', function(ev) {
                        var $this = $(this);
                        $this.data('before', $this.html());
                    });
                    this.$editor.filter('[contenteditable]').on('blur keyup paste input', function(ev) {
                        var $this = $(this);
                        if ($this.data('before') !== $this.html()) {
                            $this.data('before', $this.html());
                            $this.trigger('change');
                        }
                    });
                    // when the link field changes
                    this.$editor.on('change', function() {
                        var $this = $(this);
                        var url = $this.text().trim();
                        // exit if the url is empty. Not needed to disturb the service
                        if (url === '') {
                            return false;
                        }
                        that.getOptions().embedService.get(url)
                            .then(function loadData(data) {
                                var link_data = {
                                    url: url,
                                    title: data.title,
                                    description: data.description,
                                    thumbnail_width: data.thumbnail_width,
                                    thumbnail_height: data.thumbnail_height,
                                    embed_code: data.html,
                                    cover: data.thumbnail_url
                                };
                                if (data.type === 'photo') {
                                    link_data.cover = data.url;
                                    link_data.thumbnail_width = data.width;
                                    link_data.thumbnail_height = data.height;
                                }
                                if (data.media_url !== undefined) {
                                    link_data.cover = data.media_url;
                                    link_data.embed_code = undefined;
                                    link_data.thumbnail_width = data.width;
                                    link_data.thumbnail_height = data.height;
                                }
                                that.data = link_data;
                                that.loadData(link_data);
                            });
                    });
                },
                isEmpty: function() {
                    return _.isEmpty(this.retrieveData().url);
                },
                retrieveData: function() {
                    // retrieve new data from editor
                    var data = {
                        embed_code: this.$('.embed-preview').html(),
                        cover: this.$('.cover-preview').css('background-image').slice(5, -2),
                        title: this.$('.title-preview').text(),
                        description: this.$('.description-preview').text(),
                        url: this.$('.link-preview').attr('href')
                    };
                    // remove empty string
                    _.forEach(data, function(value, key) {
                        if (typeof(value) === 'string' && value.trim() === '') {
                            delete data[key];
                        }
                    });
                    // add data which are not in the editor but has been saved before (like thumbnail_width)
                    _.merge(this.data, data);
                    return this.data;
                },
                renderCard: function(data) {
                    var card_class = 'liveblog--card';
                    var html = $([
                        '<div class="'+card_class+' hidden">',
                        '  <div class="hidden st-link-block embed-preview"></div>',
                        '  <div class="hidden st-link-block cover-preview-handler">',
                        '    <div class="st-link-block cover-preview"></div>',
                        '  </div>',
                        '  <div class="hidden st-link-block title-preview" contenteditable="true"></div>',
                        '  <div class="hidden st-link-block description-preview" contenteditable="true"></div>',
                        '  <a class="hidden st-link-block link-preview"></a>',
                        '</div>'
                    ].join('\n'));
                    // but this html to the DOM (neeeded to use jquery)
                    $('body > .'+card_class).remove();
                    $('body').append(html);
                    html = $('body > .'+card_class);
                    // hide everything
                    html.find(
                        ['.embed-preview',
                        '.cover-preview-handler',
                        '.title-preview',
                        '.description-preview'].join(', ')
                    ).addClass('hidden');
                    // set the link
                    html.find('.link-preview')
                        .attr('href', data.url)
                        .html(data.url)
                        .removeClass('hidden');
                    // set the embed code
                    if (data.embed_code !== undefined) {
                        html.find('.embed-preview')
                            .html(data.embed_code).removeClass('hidden');
                    }
                    // set the cover illustration
                    if (data.embed_code === undefined && data.cover !== undefined) {
                        var ratio = data.thumbnail_width / data.thumbnail_height;
                        var cover_width = Math.min(447, data.thumbnail_width);
                        var cover_height = cover_width / ratio;
                        html.find('.cover-preview').css({
                            'background-image': 'url('+data.cover+')',
                            width: cover_width,
                            height: cover_height
                        });
                        html.find('.cover-preview-handler').removeClass('hidden');
                    }
                    // set the title
                    if (data.title !== undefined) {
                        html.find('.title-preview')
                            .html(data.title).removeClass('hidden');
                    }
                    // set the description
                    if (data.description !== undefined) {
                        html.find('.description-preview')
                            .html(data.description).removeClass('hidden');
                    }
                    // retrieve the final html code
                    var html_to_return = '';
                    html_to_return = '<div class="'+card_class+'">';
                    html_to_return += html.get(0).innerHTML;
                    html_to_return += '</div>';
                    // remove html from the DOM
                    html.remove();
                    return html_to_return;
                },
                loadData: function(data) {
                    this.$('.link-input')
                        .addClass('hidden')
                        .after(this.renderCard(data));
                },
                focus: function() {
                    this.$('.link-input').focus();
                },
                // toMarkdown: function(markdown) {},
                toHTML: function() {
                    var data = this.retrieveData();
                    return this.renderCard(data);
                },
                toMeta: function() {
                    return this.retrieveData();
                }
            });

            SirTrevor.Blocks.Quote =  SirTrevor.Block.extend({
                type: 'quote',
                title: function(){ return window.i18n.t('blocks:quote:title'); },
                icon_name: 'quote',
                editorHTML: function() {
                    var template = _.template([
                        '<div class="st-required st-quote-block quote-input" ',
                        ' placeholder="quote" contenteditable="true"></div>',
                        '<div contenteditable="true" name="cite" placeholder="<%= i18n.t("blocks:quote:credit_field") %>"',
                        ' class="js-cite-input st-quote-block"></div>'
                    ].join('\n'));
                    return template(this);
                },
                focus: function() {
                    this.$('.quote-input').focus();
                },
                retrieveData: function() {
                    return {
                        quote: this.$('.quote-input').text() || undefined,
                        credit: this.$('.js-cite-input').text() || undefined
                    };
                },
                loadData: function(data){
                    this.$('.quote-input').text(SirTrevor.toHTML(data.text, this.type));
                    this.$('.js-cite-input').text(data.credit);
                },
                isEmpty: function() {
                    return _.isEmpty(this.retrieveData().quote);
                },
                toMarkdown: function(markdown) {
                    return markdown.replace(/^(.+)$/mg,'> $1');
                },
                toHTML: function(html) {
                    var data = this.retrieveData();
                    return [
                        '<blockquote><p>',
                        data.quote,
                        '</p><ul><li>',
                        data.credit,
                        '</li></ul></blockquote>'
                    ].join('');
                },
                toMeta: function() {
                    return this.retrieveData();
                }
            });

            // Image Block
            var upload_options = {
            // NOTE: responsive layout is currently disabled. so row and col-md-6 are useless
                html: [
                    '<div class="row st-block__upload-container">',
                    '    <input type="file" type="st-file-upload" />',
                    '    <div class="col-md-6">',
                    '        <button class="btn btn-default"><%= i18n.t("general:upload") %></button>',
                    '    </div>',
                    '</div>'
                ].join('\n')
            };
            SirTrevor.DEFAULTS.Block.upload_options = upload_options;
            SirTrevor.Locales.en.general.upload = 'Select from folder';
            SirTrevor.Blocks.Image =  SirTrevor.Block.extend({
                type: 'image',
                title: function() {
                    return 'Image';
                },
                droppable: true,
                uploadable: true,
                icon_name: 'image',
                loadData: function(data) {
                    var file_url = (typeof(data.file) !== 'undefined') ? data.file.url : data.media._url;
                    this.$editor.html($('<img>', {
                        src: file_url
                    })).show();
                    this.$editor.append($('<div>', {
                        name: 'caption',
                        class: 'st-image-block',
                        contenteditable: true,
                        placeholder: 'Add a description'
                    }).html(data.caption));
                    this.$editor.append($('<div>', {
                        name: 'credit',
                        class: 'st-image-block',
                        contenteditable: true,
                        placeholder: 'Add author / photographer'
                    }).html(data.credit));
                },
                onBlockRender: function() {
                    // assert we have an uploader function in options
                    if (typeof(this.getOptions().uploader) !== 'function') {
                        throw 'Image block need an `uploader` function in options.';
                    }
                    // setup the upload button
                    this.$inputs.find('button').bind('click', function(ev) {
                        ev.preventDefault();
                    });
                    this.$inputs.find('input').on('change', _.bind(function(ev) {
                        this.onDrop(ev.currentTarget);
                    }, this));
                },
                onDrop: function(transferData) {
                    var that = this;
                    var file = transferData.files[0];
                    var urlAPI = window.URL;
                    if (typeof urlAPI === 'undefined') {
                        urlAPI = window.webkitURL;
                    }
                    // Handle one upload at a time
                    if (/image/.test(file.type)) {
                        this.loading();
                        // Show this image on here
                        this.$inputs.hide();
                        this.loadData({
                            file: {
                                url: urlAPI.createObjectURL(file)
                            }
                        });
                        this.getOptions().uploader(
                            file,
                            function(data) {
                                that.setData(data);
                                that.ready();
                            },
                            function(error) {
                                var message = error || window.i18n.t('blocks:image:upload_error');
                                that.addMessage(message);
                                that.ready();
                            }
                        );
                    }
                },
                retrieveData: function() {
                    return {
                        media: this.getData().media,
                        caption: this.$('[name=caption]').text(),
                        credit: this.$('[name=credit]').text()
                    };
                },
                toHTML: function() {
                    var data = this.retrieveData();
                    return [
                        '<figure>',
                        '    <img src="' + data.media._url + '" alt="' + data.caption + '"/>',
                        '    <figcaption>' + data.caption + (data.credit === '' ? '' : ' from ' + data.credit) +'</figcaption>',
                        '</figure>'
                    ].join('');
                },
                toMeta: function() {
                    return this.retrieveData();
                }
            });

            // Add toHTML to existing Text Block.
            SirTrevor.Blocks.Text.prototype.toHTML = function() {
                return this.getTextBlock().html();
            };

            var Strikethrough = SirTrevor.Formatter.extend({
                title: 'strikethrough',
                iconName: 'strikethrough',
                cmd: 'strikeThrough',
                text: 'S'
            });
            SirTrevor.Formatters.Strikethrough = new Strikethrough();

            var OrderedList = SirTrevor.Formatter.extend({
                title: 'orderedlist',
                iconName: 'link',
                cmd: 'insertOrderedList',
                text: 'orderedlist'
            });
            SirTrevor.Formatters.NumberedList = new OrderedList();

            var UnorderedList = SirTrevor.Formatter.extend({
                title: 'unorderedlist',
                iconName: 'link',
                cmd: 'insertUnorderedList',
                text: 'unorderedlist'
            });
            SirTrevor.Formatters.BulletList = new UnorderedList();

        }]);
});
