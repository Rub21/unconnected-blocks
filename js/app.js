var host = 'http://localhost:3019/';
L.mapbox.accessToken = 'pk.eyJ1IjoicnViZW4iLCJhIjoiYlBrdkpRWSJ9.JgDDxJkvDn3us36aGzR6vg';
var map = L.mapbox.map('map', 'ruben.lep7846b')
  .setView([37.9504, -84.3767], 6);
var popup = new L.Popup({
  autoPan: false
});
var hash = L.hash(map);
var statesLayer = L.geoJson(block, {
  style: getStyle,
  onEachFeature: onEachFeature
}).addTo(map);

function getStyle(feature) {
  return {
    weight: 0.2,
    opacity: 1,
    color: '#444',
    fillOpacity: 1,
    fillColor: getColor(feature.properties.num)
  };
}

function getColor(d) {
  return d > 10 ? '#003110' :
    d >= 5 ? '#107B21' :
    d >= 3 ? '#73AD39' :
    d >= 1 ? '#D6E752' : '#DDDDDD';
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseout: mouseout,
    click: zoomToFeature
  });
}
var closeTooltip;

function mouseout(e) {
  statesLayer.resetStyle(e.target);
  closeTooltip = window.setTimeout(function() {
    map.closePopup();
  }, 100);
}

function zoomToFeature(e) {
  $.ajax(host + e.target.feature.properties.gid, {
    success: function(d) {
      var flag = false;
      var data = d;
      for (var i = 0; i < d.features.length; i++) {
        data.features[i].geometry;
        var p1 = data.features[i].geometry.coordinates[0][0];
        var p2 = data.features[i].geometry.coordinates[0][1];
        var p3 = data.features[i].geometry.coordinates[0][2];
        var p4 = data.features[i].geometry.coordinates[0][3];
        var url = 'http://localhost:8111/load_and_zoom?select=node' + data.features[i].properties.node_id + '&left=' + p1[0] + '&right=' + p3[0] + '&top=' + p2[1] + '&bottom=' + p4[1];
        $.ajax(url);
      }

      var data = {};
      data.gid = e.target.feature.properties.gid;
      $.ajax21(host + 'endpoint', data, function(res) {
        console.log(res);
        console.log(e.target.feature.properties);
        e.target.feature.properties.num = 0
        statesLayer.resetStyle(e.target);
      });
      map.fitBounds(e.target.getBounds());
    }
  });
}
jQuery.ajax21 = function(purl, pdata, psuccess) {
  console.log(pdata);
  $.ajax({
    type: 'POST',
    data: JSON.stringify(pdata),
    'Content-Type': 'application/json',
    url: purl,
    success: psuccess,
    error: function(a, b, c) {
      console.log(jQuery.parseJSON(a.responseText).Message, location.href, purl, "");
    }
  });
}