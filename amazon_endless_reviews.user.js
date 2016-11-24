// ==UserScript==
// @name         Amazon - Endless Reviews
// @namespace    http://tampermonkey.net/
// @downloadURL  https://github.com/LenAnderson/Amazon-Endless-Reviews/raw/master/amazon_endless_reviews.user.js
// @version      0.1
// @author       LenAnderson
// @match        https://www.amazon.com/*product-reviews/*
// @match        https://www.amazon.co.uk/*product-reviews/*
// @match        https://www.amazon.de/*product-reviews/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var loading = false;
    var spinner = document.createElement('div');
    spinner.style.backgroundImage = 'url("https://images-na.ssl-images-amazon.com/images/G/01/amazonui/loading/spinner_4x._V1_.gif")';
    spinner.style.backgroundPosition = 'center';
    spinner.style.backgroundRepeat = 'no-repeat';
    spinner.style.height = '64px';
    spinner.style.display = 'none';
    addEventListener('scroll', function() {
        if (loading) return;
        var pageBar = document.querySelector('#cm_cr-pagination_bar');
        if (!pageBar || pageBar.querySelector('.a-last').classList.contains('a-disabled')) return;
        var rect = pageBar.getClientRects()[0];
        if (rect.top > innerHeight) return;
        console.log('load');
        loading = true;
        var list = document.querySelector('#cm_cr-review_list');
        var currLink = pageBar.querySelector('li.page-button.a-selected > a');
        var asin = currLink.href.replace(/^.+\/product-reviews\/([^\/]+)\/.+$/, '$1');
        var page = currLink.textContent.trim();
        list.insertBefore(spinner, pageBar.parentNode.parentNode);
        page++;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/ss/customer-reviews/ajax/reviews/get/ref=cm_cr_arp_d_paging_btm_' + page, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
        xhr.addEventListener('load', function() {
            console.log('loaded');
            loading = false;
            spinner.style.display = 'none';
            window.responseText = xhr.responseText;
            var frag = document.createDocumentFragment();
            xhr.responseText.split(/\s*\r?\n\s*&&&\s*\r?\n\s*/).filter(function(it){return it.trim();}).map(JSON.parse).filter(function(it) { return it[0] == 'append'; }).forEach(function(it) {
                var html = document.createElement('div');
                html.innerHTML = it[2];
                frag.appendChild(html.firstChild);
            });
            list.replaceChild(frag, list.querySelector('.a-form-actions.a-spacing-top-extra-large'));
            pageBar = document.querySelector('#cm_cr-pagination_bar');
            list.insertBefore(spinner, pageBar.parentNode.parentNode);
        });
        var query = {};
        currLink.href.replace(/^[^\?]+\?/, '').split('&').forEach(function(it) { var kv = it.split('='); query[kv[0]] = kv[1]; });
        var data = [];
        data.push(['sortBy', query.sortBy || 'recent']);
        data.push(['reviewerType', query.reviewerType || 'all_reviews']);
        data.push(['formatType', query.formatType || '']);
        data.push(['filterByStar', query.filterByStar || '']);
        data.push(['pageNumber', page]);
        data.push(['filterByKeyword', query.filterByKeyword || '']);
        data.push(['shouldAppend', 'undefined']);
        data.push(['deviceType', query.deviceType || 'desktop']);
        data.push(['reftag', 'cm_cr_arp_d_paging_btm_' + page]);
        data.push(['pageSize', query.pageSize || '10']);
        data.push(['asin', asin]);
        data.push(['scope', 'reviewsAjax0']);
        xhr.send(data.map(function(it){return it.join('=');}).join('&'));
    });
})();
