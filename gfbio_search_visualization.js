/**
 * This singleton encapsulates the GFBio Search Visualization.
 */
var SearchVisualization = (function() {
    "use strict";

    /**
     * Background Layer
     * @type {ol.layer.Layer}
     */
    const backgroundLayer = new ol.layer.Tile({
        source: new ol.source.OSM({
            wrapX: false
        })
    });

    /**
     * Maximum Zoom Level
     * @const {number}
     */
    const maximumZoomLevel = 3;

    /**
     * Source SRS
     * @const {ol.Projection}
     */
    const sourceSrs = ol.proj.get('EPSG:4326');

    /**
     * Map SRS
     * @const {ol.Projection}
     */
    const mapSrs = ol.proj.get('EPSG:3857');

    /**
     * The map reference.
     * @type {ol.Map}
     */
    let map;

    /**
     * The globally visible extent.
     * @type {ol.Extent}
     */
    let extent = undefined;

    /**
     * Initialize the map.
     */
    function initialize() {
        map = new ol.Map({
            layers: [
                backgroundLayer
            ],
            target: 'map',
            view: new ol.View({
                center: [0, 0],
                zoom: 2,
                projection: mapSrs,
                extent: mapSrs.getExtent()
            })
        });
    }

    /**
     * Receive an event from the portal.
     * @param event
     */
    function receiveMessage(event) {
        // reset map layers and extent
        map.getLayers().clear();
        map.getLayers().push(backgroundLayer);
        extent = undefined;

        const datasets = event.data.selected;
        if (datasets && datasets.length > 0) {
            datasets.forEach(processDataset);

            focus();
        }
    }

    /**
     * Focus on the current extent.
     */
    function focus() {
        const easingDurationMs = 500;

        map.getView().fit(extent, {
            size: map.getSize(),
            maxZoom: maximumZoomLevel,
            duration: easingDurationMs,
        });
    }
    /**
     * Adds the boundaries of a dataset to the map.
     * @param {{
     *      minLongitude: number,
     *      maxLongitude: number,
     *      minLatitude: number,
     *      maxLatitude: number,
     *      title: string,
     *      authors: string,
     *      dataCenter: string,
     *      color: string,
     *      metadataLink: string
     * }} dataset
     */
    function processDataset(dataset) {
        const vectorSource = new ol.source.Vector({
            wrapX: false
        });
        const geometry = getGeometry(dataset.minLongitude, dataset.maxLongitude, dataset.minLatitude, dataset.maxLatitude);
        geometry.applyTransform(ol.proj.getTransform(sourceSrs, mapSrs));
        vectorSource.addFeature(
            new ol.Feature({
                "geometry": geometry,
                "Dataset Title" : dataset.title,
                "Author" : dataset.authors,
                "Data Center" : dataset.dataCenter
            })
        );

        if(extent){
            ol.extent.extend(extent, vectorSource.getExtent());
        } else {
            extent = vectorSource.getExtent();
        }

        const layer = new ol.layer.Vector({
            source: vectorSource,
            style: styleFunction(dataset.color.replace('0x', '#'))
        });

        // append layer
        map.addLayer(layer);
    }

    /**
     * Returns a geometry depending on the extension of the bounds.
     * @param minLon
     * @param maxLon
     * @param minLat
     * @param maxLat
     * @returns {ol.geom.Geometry}
     */
    function getGeometry(minLon, maxLon, minLat, maxLat) {
        const equalLon = minLon === maxLon;
        const equalLat = minLat === maxLat;

        // restrict since -90 and 90 cause problems in openlayer's web mercator projection
        minLat = Math.max(minLat, -89.99999);
        maxLat = Math.min(maxLat, 89.99999);

        if (equalLon && equalLat) {
            return new ol.geom.Point([minLon, minLat]);
        } else {
            return new ol.geom.Polygon([[[minLon, minLat], [minLon, maxLat], [maxLon, maxLat], [maxLon, minLat]]]);
        }
    }

    /**
     * Converts a hex string to rgb.
     * @param hex
     * @returns {{r: number, g: number, b: number}}
     */
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : undefined;
    }


    /**
     * Returns a style function depending on the fill color.
     * @param fillColor
     * @returns {Function}
     */
    function styleFunction(fillColor) {
        const rgbColor = hexToRgb(fillColor);

        const styles = {
            'MultiPoint': [new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 5,
                    fill: new ol.style.Fill({
                        color: fillColor,
                        opacity: 0.6
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#000000',
                        opacity: 0.5,
                        width: 1
                    })
                })
            })],
            'Point': [new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 5,
                    fill: new ol.style.Fill({
                        color: fillColor,
                        opacity: 0.6
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#000000',
                        opacity: 0.5,
                        width: 1
                    })
                })
            })],
            'MultiPolygon': [new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(' + rgbColor.r + ',' + rgbColor.g + ',' + rgbColor.b + ',0.25)'
                }),
                stroke: new ol.style.Stroke({
                    color: fillColor,
                    width: 1
                })
            })],
            'Polygon': [new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(' + rgbColor.r + ',' + rgbColor.g + ',' + rgbColor.b + ',0.25)'
                }),
                stroke: new ol.style.Stroke({
                    color: fillColor,
                    width: 1
                })
            })],
            'LineString': [new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: fillColor,
                    width: 3
                })
            })],
            'MultiLineString': [new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: fillColor,
                    width: 3
                })
            })]
        };

        return function(feature) {
            return styles[feature.getGeometry().getType()];
        };
    }

    return {
        initialize: initialize,
        receiveMessage: receiveMessage
    }
})();
