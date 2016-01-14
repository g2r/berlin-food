/**
 * @module min-zoom-level
 */
'use strict'

var scale = require('d3-scale');

/**
 * @type {Function}
 * @param {Number} clusterRating
 * @return {Number} minzoom
 */
module.exports = scale
    .scaleLinear()
    .domain([3, 4, 7, 7.001, 10])
    .range([16, 15, 13, 1, 1]);
