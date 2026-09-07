
(function () {
  'use strict';
  var isWeb = location.protocol === 'http:' || location.protocol === 'https:';
  var q = new URLSearchParams(location.search);
  if (!isWeb && !q.has('stub')) return;
  var stub = 'selftest/popup-preview.js';
  if (q.has('bridge')) stub = 'selftest/popup-bridge-stub.js';
  document.write('<script src="' + stub + '"><\/script>');
})();
