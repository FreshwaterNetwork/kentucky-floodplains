function eventListeners() {
  var clickCnt = 0;
  // Flood frequency, HUC, and Management Action clicks
  document.querySelectorAll('#top-controls input').forEach((input) =>
    input.addEventListener('click', () => {
      app.resultsLayer.removeAll();
      app.view.popup.close();
      // Find checked inputs and record values
      document.querySelectorAll('#top-controls input').forEach((v) => {
        if (v.checked) {
          var rname = v.getAttribute('name');
          app.obj[rname] = v.value;
          if (rname == 'huc') {
            app.ws = $(v).prop('id').split('-').pop();
          }
        }
      });
      app.fe = app.ws + app.obj.mngmtAction + app.obj.floodFreq;
      app.obj.hucLayer = app.obj.huc;

      // Update range slider min and max values
      var slen = document.querySelectorAll('#mng-act-wrap .slider').length;
      app.ord = '';
      document.querySelectorAll('h4').forEach((h4) => {
        h4.style.display = 'block';
      });
      document.querySelectorAll('#mng-act-wrap .slider').forEach((v, i) => {
        if (slen == i + 1) {
          app.ord = 'last';
        }
        var ben = v.id.split('-').pop();
        var okeys = Object.keys(app.sliderObj[app.fe]);
        Object.entries(okeys).forEach(([k1, v1]) => {
          if (ben == v1) {
            if (app.sliderObj[app.fe][v1].vis) {
              $('#' + v.id)
                .parent()
                .parent()
                .parent()
                .parent()
                .show();
              var min = app.sliderObj[app.fe][v1].min;
              var max = app.sliderObj[app.fe][v1].max;
              $('#' + v.id).slider('option', 'min', min);
              $('#' + v.id).slider('option', 'max', max);
              if (app.sliderObj[app.fe][v1].step) {
                var step = app.sliderObj[app.fe][v1].step;
                $('#' + v.id).slider('option', 'step', step);
              }
              var options = $('#' + v.id).slider('option');
              var val1 = options.min;
              var val2 = options.max;
              if (app.sliderObj[app.fe][v1].values.length > 0) {
                val1 = app.sliderObj[app.fe][v1].values[0];
                val2 = app.sliderObj[app.fe][v1].values[1];
              }
              $('#' + v.id).slider('option', 'values', [val1, val2]);
            } else {
              $('#' + v.id)
                .parent()
                .parent()
                .parent()
                .parent()
                .hide();
              var options = $('#' + v.id).slider('option');
              $('#' + v.id).slider('option', 'values', [
                options.min,
                options.max,
              ]);
              // hide the header above if the filter group is not visible and has no siblings
              $.each(app.filterObj, function (k, v3) {
                $.each(v3.controls, function (k1, v4) {
                  if (v4.field == v1 && v4.single) {
                    $(`h4:contains('${v3.header}')`).hide();
                    return false;
                  }
                });
              });
            }
          }
        });
      });
      // Set definition expressions for visible and enabled radion buttons
      $.each($('.umr-radio-indent input'), function (i, v) {
        var ben = v.name;
        var val = v.name.value;
        var dis = v.disabled;
        if (app.radioObj[app.fe][ben].vis === true) {
          $(v).parent().parent().parent().parent().show();
        } else {
          $(v).parent().parent().parent().parent().hide();
          $(v).prop('disabled', true);
          if ($('#' + app.radioObj[app.fe][ben].cbid).prop('checked')) {
            $('#' + app.radioObj[app.fe][ben].cbid).trigger('click');
          }
        }
      });
      // Update info text
      $.each($('.cntrlWrap'), function (i, v) {
        var obkey = v.id.split('-').pop();
        if (app.sliderObj[app.fe][obkey]) {
          if (app.sliderObj[app.fe][obkey].info) {
            if ($(v).find('.feInfoTextWrap').is(':visible')) {
              $(v).find('.feInfoWrap').hide();
            } else {
              $(v).find('.feInfoWrap').show();
            }
            $(v).find('.feInfoText').html(app.sliderObj[app.fe][obkey].info);
          } else {
            $(v).find('.feInfoWrap').hide();
          }
        }
        if (app.radioObj[app.fe][obkey]) {
          if (app.radioObj[app.fe][obkey].info) {
            $(v).find('.feInfoWrap').show();
            $(v).find('.feInfoText').html(app.radioObj[app.fe][obkey].info);
          } else {
            $(v).find('.feInfoWrap').hide();
          }
        }
      });
      app.layers.sublayers.forEach((sl) => {
        sl.visible = false;
      });
      var layer = app.layers.findSublayerById(parseInt(app.obj.hucLayer));
      layer.visible = true;
      layer.opacity = app.obj.op;
    })
  );
  // opacity slider for watershed layers
  document.querySelectorAll('.opacity-slider').forEach((slider) =>
    slider.addEventListener('mouseup', () => {
      app.obj.op = slider.value;

      let sublayer = app.layers.findSublayerById(parseInt(app.obj.hucLayer));
      sublayer.opacity = app.obj.op;
    })
  );

  // Checkboxes for sliders
  $('#umr-wrap .-slCb').on('click', function (c) {
    if (c.target.checked == true) {
      $('#' + c.target.id)
        .parent()
        .parent()
        .parent()
        .find('.umr-slider-label')
        .removeClass('label-off');
      $('#' + c.target.id)
        .parent()
        .parent()
        .parent()
        .find('.rnum')
        .removeClass('label-off');
      var sl = $('#' + c.target.id)
        .parent()
        .parent()
        .parent()
        .find('.slider')[0].id;
      $('#' + sl).slider('option', 'disabled', false);
      var values = $('#' + sl).slider('option', 'values');
      $('#' + sl).slider('values', values);
    }
    if (c.target.checked == false) {
      $('#' + c.target.id)
        .parent()
        .parent()
        .parent()
        .find('.umr-slider-label')
        .addClass('label-off');
      $('#' + c.target.id)
        .parent()
        .parent()
        .parent()
        .find('.rnum')
        .addClass('label-off');
      var sl = $('#' + c.target.id)
        .parent()
        .parent()
        .parent()
        .find('.slider')[0].id;
      $('#' + sl).slider('option', 'disabled', true);
      var ben = sl.split('-').pop();
      app[ben] = '';
      layerDefs();
    }
    cbChecker();
  });
  // Checkboxes for radio buttons
  $('#umr-wrap .rb_cb').on('click', function (c) {
    if (c.target.checked == true) {
      $.each(
        $('#' + c.target.id)
          .parent()
          .parent()
          .next()
          .find('input'),
        function (i, v) {
          $(v).attr('disabled', false);
          if (v.checked == true) {
            $(v).trigger('click');
          }
        }
      );
    }
    if (c.target.checked == false) {
      var ben = $('#' + c.target.id)
        .parent()
        .parent()
        .next()
        .find('input')[0].name;
      app[ben] = '';
      layerDefs();
      $.each(
        $('#' + c.target.id)
          .parent()
          .parent()
          .next()
          .find('input'),
        function (i, v) {
          $(v).attr('disabled', true);
        }
      );
    }
    cbChecker();
  });
  // Checkboxes for supporting layers
  $('#sup-layers-wrap .sup_cb').on('click', function (c) {
    var sublayer = app.layers.findSublayerById(parseInt(c.target.value));
    sublayer.visible = c.target.checked;
  });
  // Radio button clicks
  $('.umr-radio-indent input').on('click', function (c) {
    var ben = c.target.name;
    var field = c.target.name + '_' + app.obj.mngmtAction + app.obj.floodFreq;
    if (app.radioObj[app.fe][ben].shfld) {
      field = ben;
    }
    var val = c.target.value;
    app[ben] = '( ' + field + ' = ' + val + ' )';
    if (val == 1 && ben == 'TNC') {
      app[ben] = '( ' + field + ' > 0 )';
    }
    layerDefs();
  });
  // Info icon clicks
  $('#mng-act-wrap .feInfo').click(function (c) {
    var e = c.currentTarget;
    $('.feInfoTextWrap').hide();
    $('.feInfoWrap').show();
    if ($(e).hasClass('feInfoOpen')) {
      $(e).parent().parent().find('.feInfoTextWrap').show();
    }
    if ($(e).hasClass('feInfoClose')) {
      $(e).parent().parent().find('.feInfoWrap').show();
    }
    $(e).parent().hide();
  });
  $('#sup-layers-wrap .feInfo').click(function (c) {
    var e = c.currentTarget;
    $('.feInfoTextWrap').hide();
    $('.feInfoWrapSub').show();
    if ($(e).hasClass('feInfoOpen')) {
      console.log($(e).parent().parent().find('.feInfoTextWrap'));
      $(e).parent().parent().find('.feInfoTextWrap').show();
    }
    if ($(e).hasClass('feInfoClose')) {
      $(e).parent().parent().find('.feInfoWrapSub').show();
    }
    $(e).parent().hide();
  });
  // filter section chevron clicks
  $('#mng-act-wrap .chev-oc').click(function (c) {
    if ($(c.currentTarget).hasClass('chev-o')) {
      $(c.currentTarget).parent().find('.chev-o').hide();
      $(c.currentTarget)
        .parent()
        .find('.chev-c')
        .css('display', 'inline-block');
      $(c.currentTarget).parent().next().slideUp();
    }
    if ($(c.currentTarget).hasClass('chev-c')) {
      $(c.currentTarget).parent().find('.chev-c').hide();
      $(c.currentTarget)
        .parent()
        .find('.chev-o')
        .css('display', 'inline-block');
      $(c.currentTarget).parent().next().slideDown();
    }
  });
  // reset filters click
  $(`#resetFilters`).click(function (c) {
    // reset all slider values in app.sliderObj to empty arrays
    $.each(app.sliderObj, function (i, v) {
      $.each(v, function (i1, v1) {
        if (v1.values) {
          v1.values = [];
        }
      });
    });
    // reclick first checked item in top menu - this resets the slider values
    $.each($('#top-controls input'), function (i, v) {
      if (v.checked) {
        $('#' + v.id).trigger('click');
        return false;
      }
    });
    // uncheck slider checkboxes
    $('#umr-wrap .-slCb').each(function (i, v) {
      if (v.checked) {
        $(v).trigger('click');
      }
    });
    // set radio buttons to first input
    $('.umr-radio-indent').each(function (i, v) {
      var ipt = $(v).find('input')[0];
      $(ipt).prop('checked', true);
    });
    // uncheck radio checkboxes
    $(`#umr-wrap .rb_cb`).each(function (i, v) {
      if (v.checked) {
        $(v).trigger('click');
      }
    });
  });
  //download data button
  document.querySelector('#downloadData').addEventListener('click', () => {
    require(['esri/tasks/Geoprocessor'], function (Geoprocessor) {
      $(`.dlssre`).prop('disabled', true);
      $(document.body).css({ cursor: 'wait' });
      var gp = new Geoprocessor({
        url: 'https://cirrus.tnc.org/arcgis/rest/services/FN_AGR/extractWatersheds/GPServer/extractWatersheds',
      });
      let layerName = '';
      if (app.obj.hucLayer == '0') {
        layerName = 'KY_huc8';
      }
      if (app.obj.hucLayer == '1') {
        layerName = 'KY_huc12';
      }
      if (app.obj.hucLayer == '2') {
        layerName = 'KY_catchments';
      }
      var params = { layerName: layerName, where: app.definitionExpression };
      gp.submitJob(params).then(function (jobInfo) {
        var jobid = jobInfo.jobId;
        var options = {
          interval: 1500,
          statusCallback: function (j) {
            console.log('Job Status: ', j.jobStatus);
          },
        };
        gp.waitForJobCompletion(jobid, options).then(function () {
          gp.getResultData(jobid, 'output').then(function (output) {
            let uri = output.value.url;
            let url = uri.replace('scratch/', '');
            var link = document.createElement('a');
            let name = 'output';
            link.setAttribute('download', name);
            link.href = url;
            document.body.appendChild(link);
            link.click();
            link.remove();
            $(document.body).css({ cursor: 'default' });
            $(`.dlssre`).prop('disabled', false);
          });
        });
      });
    });
  });
  // save and share click
  document.querySelector(`#saveAndShare`).addEventListener('click', () => {
    createURL();
  });
}
function sliderChange(e, ui) {
  var ben = e.target.id.split('-').pop();
  var us = '_';
  if (app.sliderObj[app.fe][ben].nounsc) {
    us = '';
  }
  var field = ben + us + app.obj.mngmtAction + app.obj.floodFreq;
  if (app.sliderObj[app.fe][ben].endwp) {
    field = field + 'P';
  }
  if (app.sliderObj[app.fe][ben].shfld) {
    field = ben;
  }
  // slider change was mouse-driven
  if (e.originalEvent) {
    var v0 = ui.values[0];
    var v1 = ui.values[1];
    app.sliderObj[app.fe][ben].values = [v0, v1];
    if (app.sliderObj[app.fe][ben].div) {
      v0 = v0 / app.sliderObj[app.fe][ben].div;
      v1 = v1 / app.sliderObj[app.fe][ben].div;
    }
    if (
      v1 == app.sliderObj[app.fe][ben].max &&
      app.sliderObj[app.fe][ben].gtmax
    ) {
      app[ben] = '(' + field + ' >= ' + v0 + ')';
    } else {
      app[ben] =
        '(' + field + ' >= ' + v0 + ' AND ' + field + ' <= ' + v1 + ')';
    }
    layerDefs();
  }
  //slider change was programmatic
  else {
    var dis = $('#' + e.target.id).slider('option', 'disabled');
    var vis = $('#' + e.target.id).is(':visible');
    if (dis === true) {
      app[ben] = '';
    } else {
      if (vis) {
        var v0 = ui.values[0];
        var v1 = ui.values[1];
        app.sliderObj[app.fe][ben].values = [v0, v1];
        if (app.sliderObj[app.fe][ben].div) {
          v0 = v0 / app.sliderObj[app.fe][ben].div;
          v1 = v1 / app.sliderObj[app.fe][ben].div;
        }
        if (
          v1 == app.sliderObj[app.fe][ben].max &&
          app.sliderObj[app.fe][ben].gtmax
        ) {
          app[ben] = '(' + field + ' >= ' + v0 + ')';
        } else {
          app[ben] =
            '(' + field + ' >= ' + v0 + ' AND ' + field + ' <= ' + v1 + ')';
        }
      } else {
        app[ben] = '';
      }
    }
    sliderSlide(e, ui);
    if (app.ord == 'last') {
      layerDefs();
    }
  }
}
function sliderSlide(e, ui) {
  var ben = e.target.id.split('-').pop();
  $('#' + e.target.id)
    .parent()
    .prev()
    .find('.rnum')
    .each(function (i, v) {
      var sval = ui.values[i];
      if (app.sliderObj[app.fe][ben].div) {
        sval = ui.values[i] / app.sliderObj[app.fe][ben].div;
      }
      if (ui.values[i] > 100000) {
        var val = abbreviateNumber(sval);
      } else {
        var val = commaSeparateNumber(sval);
      }
      if (
        ui.values[i] == app.sliderObj[app.fe][ben].max &&
        app.sliderObj[app.fe][ben].gtmax
      ) {
        $(v).html('<b>></b> ' + val);
      } else {
        $(v).html(val);
      }
    });
}
function cbChecker(t) {
  let n = 0;
  $('#umr-wrap .rb_cb').each(function (i, v) {
    if (v.checked) {
      n = n + 1;
    }
  });
  $(`#umr-wrap .-slCb`).each(function (i, v) {
    if (v.checked) {
      n = n + 1;
    }
  });
  if (n == 0) {
    $(`.dlssre`).prop('disabled', true);
  } else {
    $(`.dlssre`).prop('disabled', false);
  }
}
function layerDefs() {
  app.obj.exp = [
    app.Acres,
    app.iy_tn_del_p,
    app.iy_tp_del_p,
    app.iy_tn_del_farm_p,
    app.iy_tp_del_farm_p,
    app.iy_tn_del_waste_p,
    app.iy_tp_del_waste_p,
    app.nccpi,
    app.drain,
    app.NRCS,
    app.kfact_mean,
    app.GIindex,
    app.cropperc,
    app.karst_perc,
    app.nearProt,
    app.wetspec,
    app.nearIBA,
    app.inTNC,
    app.cumu_hci,
    app.resil,
    app.SWAPCount,
    app.swap1,
    app.swap2,
    app.swap3,
    app.pop,
    app.damages,
    app.SOVI,
  ];
  var exp = '';
  var cnt = 0;
  $.each(app.obj.exp, function (i, v) {
    if (v.length > 0) {
      cnt = cnt + 1;
    }
  });
  if (cnt > 0) {
    exp = '';
    app.obj.exp.unshift(app.obj.ffDef);
    $.each(app.obj.exp, function (i, v) {
      if (v.length > 0) {
        if (exp.length == 0) {
          exp = v;
        } else {
          exp = exp + ' AND ' + v;
        }
      }
    });
  }
  //set definition expression
  app.definitionExpression = exp;
  var layer = app.layers.findSublayerById(parseInt(app.obj.hucLayer));
  layer.definitionExpression = exp;
}
function commaSeparateNumber(val) {
  while (/(\d+)(\d{3})/.test(val.toString())) {
    val = val.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2');
  }
  return val;
}
function abbreviateNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num;
}
