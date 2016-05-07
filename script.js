

function groupBy(items, name, def) {
  var data = [];
    for (var k in items) {
      var item = items[k];
      var group = item.hasOwnProperty(name) ? item[name] : def;
      if (!data.hasOwnProperty(group)) {
          data[group] = [];
      }
      data[group].push(item);
    }
  return Object.keys(data).map(function(k) { return {key: k, values: data[k]};});
}


function createData(players, x, y, value, countries) {
  var data = players.map(function (item) {
    return {
      x: $.isNumeric(item[x]) ? item[x] : 0,
      y: $.isNumeric(item[y]) ? item[y] : 0,
      size: $.isNumeric(item[value]) ? item[value] : 0,
      shape: 'circle',
      country: item['Country'],
      name: item['Player'],
      axis: x,
      value: value
    };
  });

  data = data.filter(function (item) {
    return countries.indexOf(item.country) >= 0;
  });

  return groupBy(data, 'country', 'Others');
}

function plot(players, x, y, countries) {
  nv.addGraph(function() {
    var chart = nv.models.scatterChart()
        .color(d3.scale.category10().range());

    chart.xAxis.axisLabel(x);
    chart.xAxis.tickFormat(d3.format('f'));
    chart.yAxis.axisLabel(y);
    chart.yAxis.tickFormat(d3.format('f'));
    chart.tooltip.contentGenerator(function(d) {
      if (d === null) {
        return '';
      }

      var table = d3.select(document.createElement("table"));
      var theadEnter = table.selectAll("thead")
          .data([d])
          .enter().append("thead");

      theadEnter.append("tr")
          .append("td")
          .attr("colspan", 3)
          .append("strong")
          .classed("x-value", true)
          .html(d.point.name);

      var tbodyEnter = table.selectAll("tbody")
          .data([d])
          .enter().append("tbody");

      var trowEnter = tbodyEnter.selectAll("tr")
          .data(function(p) { return p.series})
          .enter()
          .append("tr")
          .classed("highlight", function(p) { return p.highlight});

      trowEnter.append("td")
          .classed("legend-color-guide",true)
          .append("div")
          .style("background-color", function(p) { return p.color});

      trowEnter.append("td")
          .classed("value",true)
          .html(function(p, i) { return p.key });

      trowEnter.append("td")
          .classed("key",true)
          .html(function(p, i) { return d.point.axis + ': '});

      trowEnter.append("td")
          .classed("value",true)
          .html(function(p, i) { return d.point.x });

      trowEnter.append("td")
          .classed("key",true)
          .html(function(p, i) { return d.point.value + ': '});

      trowEnter.append("td")
          .classed("value",true)
          .html(function(p, i) { return d.point.y });


      trowEnter.selectAll("td").each(function(p) {
        if (p.highlight) {
          var opacityScale = d3.scale.linear().domain([0,1]).range(["#fff",p.color]);
          var opacity = 0.6;
          d3.select(this)
              .style("border-bottom-color", opacityScale(opacity))
              .style("border-top-color", opacityScale(opacity))
          ;
        }
      });

      var html = table.node().outerHTML;
      if (d.footer !== undefined)
        html += "<div class='footer'>" + d.footer + "</div>";
      return html;
    });
    var data = createData(players, x, y, y, countries);
    d3.select('#chart svg')
        .datum(data)
        .transition().duration(500)
        .call(chart);

    nv.utils.windowResize(chart.update);

    return chart;
  });
}

new Vue({
  el: '#app',
  data:  function() {
    return {
      y: 'Runs',
      x: 'Matches',
      countries: ['India'],
      players: [],
      dataBatting: ['Average', 'Runs', 'Highest Score', '100s', '50s', '0s'],
      dataBowling: ['Matches', 'Average', 'Runs', '100s', '50s', '0s'],
      dataCountries: [],
      ready: false
    }
  },
  computed: {
    plot: function () {
      if (this.ready) {
        console.log('Plotting it!');
        plot(this.players, this.x, this.y, this.countries)
      }
      return this.y + ' vs ' + this.x + ' for ' + (this.countries.length ? this.countries.join(', ') : 'None')
    }
  },
  ready: function () {
    this.$http.get('database.json').then(function (response) {
      this.$set('players', response.data);
      var countries = {};
      for (var i in response.data) {
        countries[response.data[i].Country] = true;
      }
      this.$set('dataCountries', Object.keys(countries));
      this.$set('ready', true);
      plot(this.players, this.x, this.y, this.countries)
    }).catch(function () {
      window.alert('There is some error!')
    })
  }
});
