(function (window, document) { // eslint-disable-line no-unused-vars
  'use strict';
  var lima = window.lima;
  var _ = lima._;

  lima.apiFail = lima.apiFail || function(){};

  lima.requestAndFillMetaanalysisList = function requestAndFillMetaanalysisList() {
    lima.getGapiIDToken()
    .then(function (idToken) {
      var email = lima.extractUserProfileEmailFromUrl();
      return fetch('/api/metaanalyses/' + email, _.idTokenToFetchOptions(idToken));
    })
    .then(function (response) {
      if (response.status === 404) return [];
      else return _.fetchJson(response);
    })
    .then(fillMetaanalysissList)
    .catch(function (err) {
      console.error("problem getting metaanalyses");
      console.error(err);
      lima.apiFail();
    });
  }

  function fillMetaanalysissList(metaanalyses) {
    var list = _.findEl('.metaanalysis.list > ul');
    list.innerHTML = '';

    if (metaanalyses.length) {
      // todo sort
      metaanalyses.forEach(function (metaanalysis) {
        var li = _.cloneTemplate('metaanalysis-list-item-template');
        _.fillEls(li, '.name', metaanalysis.title);
        _.fillEls(li, '.date', metaanalysis.published);
        _.fillEls(li, '.description', metaanalysis.description);
        _.setProps(li, '.description', 'title', metaanalysis.description);
        _.setProps(li, 'a.mainlink', 'href', metaanalysis.title);
        _.fillTags(li, '.tags', metaanalysis.tags);
        list.appendChild(li);
      });
    } else {
      list.appendChild(_.cloneTemplate('empty-list-template'));
    }

    _.setYouOrName();
  }

})(window, document);
