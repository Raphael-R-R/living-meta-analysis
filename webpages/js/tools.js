(function (document, window) {
  var lima = window.lima = window.lima || {};
  var _ = window.lima._ = {};

  /*
   * param root is optional
   */
  _.findEl = function findEl(root, selector) {
    if (!(root instanceof Node)) {
      selector = root;
      root = document;
    }
    return root.querySelector(selector);
  }

  /*
   * param root is optional
   */
  _.findEls = function findEls(root, selector) {
    if (!(root instanceof Node)) {
      selector = root;
      root = document;
    }
    return _.array(root.querySelectorAll(selector));
  }

  _.byId = function byId(id) {
    return document.getElementById(id);
  }

  _.cloneTemplate = function cloneTemplate(template) {
    if (!(template instanceof Node)) template = _.byId(template);
    if (!template) return void 0;

    return template.content.cloneNode(true);
  }

  _.array = function array(arr) {
      return [].slice.call(arr);
  }

  function valOrFun(val, param) {
    return (typeof val === 'function' && val.valOrFun !== 'val') ? val(param) : val;
  }

  _.fillEls = function fillEls(root, selector, value) {
    if (!(root instanceof Node)) {
      value = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function (el) { el.textContent = valOrFun(value, el); });
  }

  _.setProps = function setProps(root, selector, attr, value) {
    if (!(root instanceof Node)) {
      value = attr;
      attr = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function (el) { el[attr] = valOrFun(value, el); });
  }

  _.addClass = function addClass(root, selector, value) {
    if (!(root instanceof Node)) {
      value = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function(el){el.classList.add(valOrFun(value, el));});
  }

  _.removeClass = function removeClass(root, selector, value) {
    if (!(root instanceof Node)) {
      value = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function(el){el.classList.remove(valOrFun(value, el));});
  }

  _.addEventListener = function addEventListener(root, selector, event, f) {
    if (!(root instanceof Node)) {
      f = event;
      event = selector;
      selector = root;
      root = document;
    }
    _.findEls(root, selector).forEach(function(el){el.addEventListener(event, f);});
  }

  _.notFound = function notFound() {
    document.body.innerHTML = '';
    fetch('/404')
    .then(_.fetchText)
    .catch(function (err) {
      console.error('error getting 404');
      console.error(err);
      return '404 not found';
    })
    .then(function (text) {
      document.open();
      document.write(text);
      document.close();
    })
  }

  var months = ['Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sep ', 'Oct ', 'Nov ', 'Dec '];

  _.formatNiceDate = function formatNiceDate(d) {
    if (typeof d !== "object") d = new Date(+d);
    return months[d.getMonth()] + d.getDate() + ', ' + d.getFullYear();
  }

  _.formatDate = function formatDate(d) {
    if (typeof d !== "object") d = new Date(+d);
    return d.getFullYear() + "-" + twoDigits((d.getMonth()+1)) + "-" + twoDigits(d.getDate());
  }

  _.formatTime = function formatTime(d) {
    if (typeof d !== "object") d = new Date(+d);
    return twoDigits(d.getHours()) + ":" + twoDigits(d.getMinutes());
  }

  _.formatDateTime = function formatDateTime(d) {
    return _.formatDate(d) + " " + _.formatTime(d);
  }

  function twoDigits(x) {
    return x < 10 ? "0" + x : "" + x;
  }


  /*
   * if the currently logged-in user matches the user the page is about,
   * use "your" and "you" in some places in the whole document,
   * otherwise use "Jo's" or "Jo" if the fname of the user the page is about is "Jo".
   *
   * The places to change are elements with the following classes (case is significant):
   * fnOrYour, fnOryou
   */
  _.setYouOrName = function setYouOrName() {
    lima.onSignInChange(setYouOrName);

    var currentUser = null;
    try {
      if (window.gapi.auth2.getAuthInstance().currentUser.get().isSignedIn()) {
        currentUser = window.gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getEmail();
      }
    } catch (e) {console.info(e);} // any errors mean no current user

    if (!lima.userPageIsAbout) {
      if (lima.whenUserPageIsAboutIsKnown) {
        lima.whenUserPageIsAboutIsKnown(setYouOrName);
        return;
      } else {
        console.error('setNameOfYou can\'t be called on a page that\'s not about a user');
        return;
      }
    }

    var y = (currentUser == lima.userPageIsAbout.email);
    var n = lima.userPageIsAbout.name.givenName || 'User';

    lima.pageAboutYou = y;

    document.body.classList[y ? 'add' : 'remove']('page-about-you');

    _.fillEls('.fnOrYour', y ? 'Your' : n + "'s");
    _.fillEls('.fnOryou',  y ? 'you'  : n       );
  }


  /*
   * with fetch API, get the response JSON, but if the HTTP code wasn't 2xx, make the response a rejected promise
   */
  _.fetchJson = function fetchJson(response) {
    if (response.ok) return response.json();
    else return Promise.reject(response);
  }

  /*
   * with fetch API, get the response as text, but if the HTTP code wasn't 2xx, make the response a rejected promise
   */
  _.fetchText = function fetchText(response) {
    if (response.ok) return response.text();
    else return Promise.reject(response);
  }

  _.idTokenToFetchOptions = function idTokenToFetchOptions(idToken) {
    return idToken ? { headers: _.idTokenToFetchHeaders(idToken) } : void 0;
  }

  _.idTokenToFetchHeaders = function idTokenToFetchHeaders(idToken, extraHeaders) {
    var retval = {};
    if (extraHeaders) {
      Object.keys(extraHeaders).forEach(function (key) { retval[key] = extraHeaders[key]; });
    }
    if (idToken) retval.Authorization = "Bearer " + idToken;
    return retval;
  }


  lima.apiFail = lima.apiFail || function apiFail() {
    document.body.innerHTML = '';
    fetch('/apifail')
    .then(_.fetchText)
    .catch(function (err) {
      console.error('error getting apifail page');
      console.error(err);
      return 'sorry, the server is temporarily unhappy (API failure)';
    })
    .then(function (text) {
      document.open();
      document.write(text);
      document.close();
    })
  }

  _.fillTags = function fillTags(root, selector, tags) {
    if (!(root instanceof Node)) {
      tags = selector;
      selector = root;
      root = document;
    }
    if (!tags) tags = [];

    var tagTemplate = _.byId('tag-template');
    _.findEls(root, selector).forEach(function (el) {
      el.innerHTML = '';
      tags.forEach(function (tag) {
        var tagEl = _.cloneTemplate(tagTemplate);
        _.fillEls(tagEl, '.tag', tag);
        el.appendChild(tagEl);
      });
    });
  }

  /*
   * Move item `i` in array `arr` to the left or right.
   * `left` indicates direction; if `most`, move to the beginning (left) or end (right) of the array.
   */
  _.moveInArray = function moveInArray(arr, i, left, most) {
    var moveTo = undefined;
    if (left) {
      if (i === 0) return arr;
      moveTo = most ? 0 : i-1;
    } else {
      if (i === arr.length - 1) return arr;
      moveTo = most ? arr.length - 1 : i+1;
    }

    _.moveArrayElement(arr, i, moveTo);
    return arr;
  }

  _.moveArrayElement = function moveArrayElement(arr, oldIndex, newIndex) {
    if (oldIndex === newIndex || !Array.isArray(arr)) return arr;
    var content = arr[oldIndex];
    arr.splice(oldIndex, 1);
    arr.splice(newIndex, 0, content);
    return arr;
  }

})(document, window);
