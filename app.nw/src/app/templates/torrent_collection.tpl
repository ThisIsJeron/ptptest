<div class="torrent-collection-container">
    <div class="margintop"></div>
    <div class="content">

        <div class="onlinesearch">
            <div class="engine-selector">
                <div id="leetx-icon" data-id="leetx" class="engine-icon1 tooltipped" data-toggle="tooltip" data-container="body" data-placement="bottom" data-delay='{"show":"800", "hide":"100"}'></div>
                <div id="tpb-icon" data-id="tpb" class="engine-icon2 tooltipped" data-toggle="tooltip" data-container="body" data-placement="bottom" data-delay='{"show":"800", "hide":"100"}'></div>
                <div id="rarbg-icon" data-id="rarbg" class="engine-icon3 tooltipped" data-toggle="tooltip" data-container="body" data-placement="bottom" data-delay='{"show":"800", "hide":"100"}'></div>
            </div>
            <div class="dropdown online-categories">
                    <%
                        var arr_categories = ["Movies","Series","Anime"];

                        var select_category = "";
                        for(var key in arr_categories) {
                            select_category += "<option "+(Settings.OnlineSearchCategory == arr_categories[key]? "selected='selected'":"")+" value='"+arr_categories[key]+"'>"+i18n.__(arr_categories[key])+"</option>";
                        }
                    %>
                <select id="online-category" name="online-category"><%=select_category%></select>
                <div class="dropdown-arrow"></div>
            </div>
            <form id="online-form">
                <input id="online-input" autocomplete="off" size="34" type="text" name="keyword" placeholder="<%= i18n.__('Search for torrent') %>">
                <i class="fa fa-search online-search tooltipped" data-toggle="tooltip" data-container="body" data-placement="bottom" data-delay='{"show":"800", "hide":"100"}'></i>
                <i class="fa fa-folder-open online-search2 tooltipped" data-toggle="tooltip" data-placement="bottom" title="<%= i18n.__("Open .torrent") %>"></i>
                <i class="fa fa-clipboard online-search3 tooltipped" data-toggle="tooltip" data-placement="bottom" title="<%= i18n.__("Paste Magnet") %>"></i>
            </form>
        </div>

        <div class="notorrents-info">
                <i class="fa fa-users" style="font-size:300px;opacity:0.07;width:50%;margin-left:25%;margin-top:0%;text-align:center;"></i>
        </div>

        <div class="torrents-info">
            <ul class="file-list">
                <% _.each(fs.readdirSync(data_path + '/TorrentCollection/'), function(file, index) { %>
                    <li class="file-item" data-index="<%=file.index%>" data-file="<%=index%>">
                        <a><%=file%></a>

                   <% if (file.indexOf('.torrent') !== -1) { %>
                        <div class="item-icon torrent-icon"></div>
                   <% } else { %>
                        <div class="item-icon magnet-icon tooltipped" data-toogle="tooltip" data-placement="right" title="<%=i18n.__("Magnet link") %>"></div>
                    <% } %>
                        <i class="fa fa-trash-o item-delete tooltipped" data-toggle="tooltip" data-placement="left" title="<%= i18n.__("Remove this torrent") %>"></i>
                        <i class="fa fa-pencil item-rename tooltipped" data-toggle="tooltip" data-placement="left" title="<%= i18n.__("Rename this torrent") %>"></i>
                        </a>
                    </li>
                <% }); %>
            </ul>
        </div>

        <div class="onlinesearch-info">
            <i class="fa fa-arrow-circle-left online-back"></i>
            <ul class="file-list">
            </ul>
        </div>

        <div class="collection-actions">
            <div class="collection-open fa fa-folder-open-o tooltipped" data-toggle="tooltip" data-placement="left" title="<%= i18n.__("Torrent Collection Folder") %>"></div>
            <input class="collection-import-hidden" style="display:none" type="file" accept=".torrent"/>
        </div>
    </div>
</div>
