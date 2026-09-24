// create map and layers for app
require([
  'esri/Map',
  'esri/views/MapView',
  'esri/widgets/BasemapGallery',
  'esri/widgets/Expand',
  'esri/widgets/BasemapGallery/support/PortalBasemapsSource',
  'esri/widgets/Search',
  'esri/widgets/Legend',
  'esri/layers/FeatureLayer',
  'esri/layers/MapImageLayer',
  'esri/PopupTemplate',
  'esri/tasks/QueryTask',
  'esri/tasks/support/Query',
  'esri/layers/GraphicsLayer',
  'esri/core/watchUtils',
], function (
  Map,
  MapView,
  BasemapGallery,
  Expand,
  PortalSource,
  Search,
  Legend,
  FeatureLayer,
  MapImageLayer,
  PopupTemplate,
  QueryTask,
  Query,
  GraphicsLayer,
  watchUtils,
) {
  // create map
  app.map = new Map({
    basemap: 'topo',
  });

  //create map view
  app.view = new MapView({
    container: 'viewDiv',
    center: [-85.60171841068595, 37.5230849952084],
    zoom: 7,
    map: app.map,
    // add popup window to map view for map clicks
    popup: {
      collapseEnabled: false,
      dockEnabled: true,
      dockOptions: {
        buttonEnabled: false,
        breakpoint: false,
      },
    },
  });

  //create basemap widget
  const allowedBasemapTitles = ['Topographic', 'Imagery Hybrid', 'Streets'];
  const source = new PortalSource({
    // filtering portal basemaps
    filterFunction: (basemap) =>
      allowedBasemapTitles.indexOf(basemap.portalItem.title) > -1,
  });
  var basemapGallery = new BasemapGallery({
    view: app.view,
    source: source,
    container: document.createElement('div'),
  });
  var bgExpand = new Expand({
    view: app.view,
    content: basemapGallery,
  });
  app.view.ui.add(bgExpand, {
    position: 'top-right',
  });
  // close expand when basemap is changed
  app.map.watch(
    'basemap.title',
    function (newValue, oldValue, property, object) {
      bgExpand.collapse();
    },
  );

  //create search widget
  const searchWidget = new Search({
    view: app.view,
    locationEnabled: false,
    container: document.createElement('div'),
  });
  var srExpand = new Expand({
    view: app.view,
    content: searchWidget,
  });
  app.view.ui.add(srExpand, {
    position: 'top-right',
  });

  // move zoom controls to top right
  app.view.ui.move(['zoom'], 'top-right');

  // Map old service IDs to new sources.
  // Vectors: HUC watersheds → Cirrus_Watersheds FeatureServer (KY layers)
  //          Supporting layers → Cirrus_KY FeatureServer
  // Rasters: → CCS_Rasters_1 MapServer
  var layerMapping = {
    0: {
      type: 'vector',
      url: 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/Cirrus_KY/FeatureServer/0',
    }, // HUC8
    1: {
      type: 'vector',
      url: 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/Cirrus_KY/FeatureServer/1',
    }, // HUC12
    2: {
      type: 'vector',
      url: 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/Cirrus_KY/FeatureServer/2',
    }, // NHDcatchment
    6: {
      type: 'vector',
      url: 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/Cirrus_KY/FeatureServer/6',
    }, // PADUS_plus_NCED
    7: {
      type: 'vector',
      url: 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/Cirrus_KY/FeatureServer/7',
    }, // FEMA_flood_zones
    10: {
      type: 'vector',
      url: 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/Cirrus_KY/FeatureServer/10',
    }, // physiographic_regions
    3: { type: 'raster', rasterId: 594 }, // floodplains_1in5year
    4: { type: 'raster', rasterId: 595 }, // floodplains_1in100year
    5: { type: 'raster', rasterId: 596 }, // floodplains_1in500year
    8: { type: 'raster', rasterId: 597 }, // soils_poordrainage
    9: { type: 'raster', rasterId: 598 }, // NLCD_2019
    11: { type: 'raster', rasterId: 599 }, // hydric_soils
  };

  // Build raster sublayer config from app.mapImageLayers initial visibility
  var rasterSublayers = app.mapImageLayers
    .filter(function (lc) {
      return layerMapping[lc.id] && layerMapping[lc.id].type === 'raster';
    })
    .map(function (lc) {
      return {
        id: layerMapping[lc.id].rasterId,
        visible: lc.visible,
        opacity: lc.opacity,
      };
    });

  app.rasterLayer = new MapImageLayer({
    url: 'https://cumulus-ags.tnc.org/arcgis/rest/services/nascience/CCS_Rasters_1/MapServer',
    sublayers: rasterSublayers,
  });
  // Add raster layer first so it renders beneath vector layers
  app.map.add(app.rasterLayer);

  // Create layerMap and add layers in explicit render order:
  //   1. rasterLayer (bottom) — already added above
  //   2. HUC watershed layers
  //   3. Supporting vector layers (top, just below results graphics)
  app.layerMap = {};

  // Pass 1: raster sublayers — stored in layerMap, rendered via app.rasterLayer
  [3, 4, 5, 8, 9, 11].forEach(function (id) {
    app.layerMap[id] = app.rasterLayer.findSublayerById(
      layerMapping[id].rasterId,
    );
  });

  // Pass 2: HUC watershed layers — added next, render above rasters
  [0, 1, 2].forEach(function (id) {
    var lc = app.mapImageLayers.find(function (l) {
      return l.id === id;
    });
    app.layerMap[id] = new FeatureLayer({
      url: layerMapping[id].url,
      visible: lc.visible,
      opacity: lc.opacity,
      popupEnabled: false,
    });
    app.map.add(app.layerMap[id]);
  });

  // Pass 3: supporting vector layers — added last, render above HUC layers
  [6, 7, 10].forEach(function (id) {
    var lc = app.mapImageLayers.find(function (l) {
      return l.id === id;
    });
    app.layerMap[id] = new FeatureLayer({
      url: layerMapping[id].url,
      visible: lc.visible,
      opacity: lc.opacity,
      popupEnabled: false,
    });
    app.map.add(app.layerMap[id]);
  });

  // Helper: look up a layer by its old service ID
  app.findLayerById = function (oldId) {
    return app.layerMap[oldId];
  };
  // HUC layer IDs used when toggling watershed visibility
  app.hucLayerIds = [0, 1, 2];

  // graphics layer for map click graphics
  app.resultsLayer = new GraphicsLayer();
  app.map.add(app.resultsLayer);

  // create legend
  app.legend = new Legend({
    view: app.view,
    // layerInfos:[{
    //    layer: app.layers,
    //    title: "Legend"
    // }],
    container: document.createElement('div'),
  });
  app.lgExpand = new Expand({
    view: app.view,
    content: app.legend,
  });
  app.view.ui.add(app.lgExpand, {
    position: 'bottom-left',
  });
  app.lgExpand.expand();
  // change legend based on window size
  var x = window.matchMedia('(max-width: 700px)');
  mobilePortrait(x); // Call listener function at run time
  x.addListener(mobilePortrait); // Attach listener function on state changes

  // change legend based on window size
  var y = window.matchMedia('(orientation:landscape)');
  mobileLandscape(y); // Call listener function at run time
  y.addListener(mobileLandscape); // Attach listener function on state changes

  // listen for poup close button
  watchUtils.whenTrue(app.view.popup, 'visible', function () {
    watchUtils.whenFalseOnce(app.view.popup, 'visible', function () {
      app.resultsLayer.removeAll();
    });
  });

  // call event listener for map clicks
  mapClick();

  // trigger button clicks on startup
  document
    .querySelectorAll("#top-controls input[name='huc']")
    .forEach((input) => {
      if (input.value == app.obj.hucLayer) {
        input.click();
      }
    });
  document
    .querySelectorAll("#top-controls input[name='floodFreq']")
    .forEach((input) => {
      if (input.value == app.obj.floodFreq) {
        input.click();
      }
    });

  // trigger control clicks from app.obj
  buildFromState();
});

function clearGraphics() {
  app.map.layers.removeAll();
}

function mobilePortrait(x) {
  if (x.matches) {
    app.lgExpand.collapse();
    app.mobile = true;
    if (document.querySelector(`#side-nav`).clientWidth == 0) {
      document
        .querySelector(`#side-nav`)
        .classList.toggle('hide-side-nav-width');
      document.querySelectorAll(`#map-toggle span`).forEach((span) => {
        span.classList.toggle('hide');
      });
    }
  } else {
    app.lgExpand.expand();
    app.mobile = false;
  }
}
function mobileLandscape(y) {
  if (y.matches) {
    app.lgExpand.expand();
    if (document.querySelector(`#side-nav`).clientHeight == 0) {
      document
        .querySelector(`#side-nav`)
        .classList.toggle('hide-side-nav-height');
      document.querySelectorAll(`#map-toggle span`).forEach((span) => {
        span.classList.toggle('hide');
      });
    }
  } else {
  }
}
