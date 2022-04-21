function mapClick() {
  require(['esri/tasks/QueryTask', 'esri/tasks/support/Query'], function (
    QueryTask,
    Query
  ) {
    app.view.on('click', function (event) {
      app.view.popup.close();
      // create query
      var queryTask = new QueryTask({
        url:
          'https://cirrus.tnc.org/arcgis/rest/services/FN_AGR/KY_Floodplain/MapServer' +
          app.obj.hucLayer,
      });
      var query = new Query();
      query.returnGeometry = true;
      query.outFields = ['*'];
      query.geometry = app.view.toMap(event);
      queryTask.execute(query).then(function (response) {
        app.resultsLayer.removeAll();
        if (response.features[0]) {
          var features = response.features.map(function (graphic) {
            graphic.symbol = {
              type: 'simple-fill',
              color: [0, 0, 0, 0],
              style: 'solid',
              outline: {
                color: 'blue',
                width: 1,
              },
            };
            return graphic;
          });
          app.resultsLayer.addMany(features);

          let a = response.features[0].attributes;
          console.log(a);
          let unit_ac = a.unit_ac;
          if (unit_ac < 1) {
            unit_ac = unit_ac.toFixed(2);
          } else {
            unit_ac = commaSeparateNumber(Math.round(unit_ac));
          }

          let acres = a['Acres_' + app.obj.floodFreq];
          if (acres < 1) {
            acres = acres.toFixed(2);
          } else {
            acres = commaSeparateNumber(Math.round(acres));
          }

          let pop = commaSeparateNumber(
            Math.round(a['pop_' + app.obj.floodFreq])
          );
          let damages = commaSeparateNumber(
            Math.round(a['damages_' + app.obj.floodFreq])
          );
          let acresLabel = '';
          let popLabel = '';
          let damagesLabel = '';
          if (app.obj.floodFreq == 1) {
            acresLabel = 'Acres of 5-year floodplain';
            popLabel = 'Current population in 5-year floodplain';
            damagesLabel =
              'Projected 2050 damage value ($) in 5-year floodplain';
          }
          if (app.obj.floodFreq == 2) {
            acresLabel = 'Acres of 100-year floodplain';
            popLabel = 'Current population in 100-year floodplain';
            damagesLabel =
              'Projected 2050 damage value ($) in 100-year floodplain';
          }
          if (app.obj.floodFreq == 3) {
            acresLabel = 'Acres of 500-year floodplain';
            popLabel = 'Current population in 500-year floodplain';
            damagesLabel =
              'Projected 2050 damage value ($) in 500-year floodplain';
          }

          let IL_TN = commaSeparateNumber(Math.round(a.IL_TN));
          let IL_TP = commaSeparateNumber(Math.round(a.IL_TP));
          let IL_TN_DEL = commaSeparateNumber(Math.round(a.IL_TN_DEL));
          let TN_farm = a.TN_farm.toFixed(1);
          let IL_TP_DEL = commaSeparateNumber(Math.round(a.IL_TP_DEL));
          let TP_farm = a.TP_farm.toFixed(1);
          let SOVI = a.SOVI.toFixed(3);

          app.view.popup.set('dockOptions', {
            breakpoint: false,
            buttonEnabled: false,
            position: 'top-left',
          });

          app.view.popup.open({
            // Set the popup's title to the coordinates of the location
            title: a.name,
            content: `
							Watershed area (acres): <b>${unit_ac}</b><br>
							${acresLabel}: <b>${acres}</b><br>
							Nitrogen load at outflow (kg/yr): <b>${IL_TN}</b><br>
							Phosphorus load at outflow (kg/yr): <b>${IL_TP}</b><br>
							Nitrogen load to Gulf of Mexico (kg/yr): <b>${IL_TN_DEL}</b><br>
							Nitrogen load from farm fertilizer and manure (%): <b>${TN_farm}</b><br>
							Phosphorus load to Gulf of Mexico (kg/yr): <b>${IL_TP_DEL}</b><br>
							Phosphorus load from farm fertilizer and manure (%): <b>${TP_farm}</b><br>
							${popLabel}: <b>${pop}</b><br>
							${damagesLabel}: <b>$${damages}</b><br>
							Social vulnerability index: <b>${SOVI}</b>
						`,
          });
        }
      });
    });
  });
}
