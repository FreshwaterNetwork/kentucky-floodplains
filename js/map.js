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
  watchUtils
) {
  // create map
  app.map = new Map({
    basemap: 'topo',
  });

  //create map view
  app.view = new MapView({
    container: 'viewDiv',
    center: [-168, 46],
    zoom: 3,
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
    }
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

  // create map layers - the source can be a map service or an AGO web map - sublayers are defined in variables.js
  app.layers = new MapImageLayer({
    url: 'https://cirrus.tnc.org/arcgis/rest/services/FN_AGR/KY_Floodplain/MapServer',
    sublayers: app.mapImageLayers,
  });
  // graphics layer for map click graphics
  app.resultsLayer = new GraphicsLayer();
  // add layers to map
  app.map.add(app.layers);
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
