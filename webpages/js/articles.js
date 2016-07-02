(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var limeta = window.limeta;
  var _ = limeta._;

  limeta.apiFail = limeta.apiFail || function(){};

  limeta.requestAndFillArticleList = function requestAndFillArticleList() {
    limeta.getGapiIDToken(function (err, idToken) {
      if (err) {
        console.err("problem getting ID token from GAPI");
        console.err(err);
        limeta.apiFail();
        return;
      }

      var email = limeta.extractUserProfileEmailFromUrl();

      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/articles/' + email);
      if (idToken) xhr.setRequestHeader("Authorization", "Bearer " + idToken);

      xhr.onload = fillArticlesList;
      xhr.send();

    });
  }

  function fillArticlesList() {
    var xhr = this;
    var articles;
    if (xhr.status === 404) {
      articles = [];
    } else if (xhr.status > 299) {
      limeta.apiFail();
      return;
    }
    articles = articles || JSON.parse(xhr.responseText);
    var list = _.findEl('.article.list > ul');
    list.innerHTML = '';

    if (articles.length) {
      // todo sort
      articles.forEach(function (article) {
        var liTemplate = _.byId('article-list-item-template');
        var li = liTemplate.content.cloneNode(true);
        _.fillEls(li, '.name', article.title);
        _.fillEls(li, '.date', article.published);
        _.fillEls(li, '.description', article.description);
        if (article.tags && article.tags.length) {
          var tags = _.findEl(li, '.tags');
          var tagTemplate = _.byId('tag-template');
          article.tags.forEach(function (tag) {
            var tagEl = tagTemplate.content.cloneNode(true);
            _.fillEls(tagEl, '.tag', tag);
            tags.appendChild(tagEl);
          });
        }
        list.appendChild(li);
      });
    } else {
      list.appendChild(_.byId('empty-article-list-template').content.cloneNode(true));
    }

    _.setNameOrYou();
  }

})(window, document);