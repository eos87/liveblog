'use strict';
var angular = require("angular")
  , _ = require('./lodash-custom')
  , _log = require("./log");

module.exports = function($rootScope, $window, $timeout, resizeIframes, config) {
  var timeline = document.getElementsByClassName("lb-timeline")[0];
  timeline.classList.remove("mod--hide"); // Fade in timeline after all js has loaded

  $rootScope._log = _log(config); // Logging helper
  $window.onload = function() {
    $timeout(resizeIframes, 1000); // Hacky, hacky
    angular.element($window).bind('resize', 
      _.debounce(resizeIframes, 1000));
  };
}