import { getCountryStatsMock } from "./covid/api-connection-mock";
import { getCountryStats } from "./covid/api-connection";
import { matchRegionsHist } from "./covid/covid-manipulation";
import * as d3 from "d3";

interface region {
  location: {
    countryOrRegion: any;
    provinceOrState: any;
    county: any;
    isoCode: any;
    lat: any;
    long: any;
  };
  updatedDateTime: any;
  stats: { history: any[] };
}
async function main() {
  console.log("Covid Stats");
  const MX: region = (await getCountryStatsMock("MX")) as region;
  const US: region = (await getCountryStatsMock("US")) as region;
  const ES: region = (await getCountryStatsMock("ES")) as region;
  const IT: region = (await getCountryStatsMock("IT")) as region;
  //const UK: region = (await getCountryStats("GB")) as region;
  //const CA: region = (await getCountryStats("CA")) as region;
  //const USCA: region = (await getCountryStats("US-CA")) as region;
  console.log({ MX, US });
  const nCases = 0;
  const DAYS = 60;

  const STATUS = "confirmed";
  //const STATUS = "deaths"; //"confirmed";
  const matchedStartingPoint = matchRegionsHist(
    {
      MX: MX.stats.history,
      US: US.stats.history,
      ES: ES.stats.history,
      IT: IT.stats.history
      // UK: UK.stats.history
      // CA: CA.stats.history
      // USCA: USCA.stats.history
    },
    nCases,
    STATUS
  );
  console.log({ matchedStartingPoint });

  var svg = d3.select("#chart"),
    margin = { top: 15, right: 35, bottom: 15, left: 35 },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

  var x = d3
    .scaleLinear()
    .rangeRound([margin.left, width - margin.right])
    .domain([0, DAYS]);

  var y = d3.scaleSymlog().rangeRound([height - margin.bottom, margin.top]);

  var line = d3
    .line()
    .defined(d => !isNaN(d[STATUS]))
    .curve(d3.curveLinear)
    .x(d => x(d.index))
    .y(d => y(d[STATUS]));

  var z = d3.scaleOrdinal(d3.schemeCategory10);

  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + (height - margin.bottom) + ")")
    .call(d3.axisBottom(x));

  svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", "translate(" + margin.left + ",0)");
  var focus = svg
    .append("g")
    .attr("class", "focus")
    .style("display", "none");
  focus
    .append("line")
    .attr("class", "lineHover")
    .style("stroke", "#999")
    .attr("stroke-width", 1)
    .style("shape-rendering", "crispEdges")
    .style("opacity", 0.5)
    .attr("y1", -height)
    .attr("y2", 0);
  focus
    .append("text")
    .attr("class", "lineHoverDate")
    .attr("text-anchor", "middle")
    .attr("font-size", 12);
  var overlay = svg
    .append("rect")
    .attr("class", "overlay")
    .attr("x", margin.left)
    .attr("width", width - margin.right - margin.left)
    .attr("height", height);

  update(nCases);
  function update(cases) {
    var copy = Object.keys(matchedStartingPoint);
    var regions = copy.map(function(id) {
      return {
        id: id,
        values: matchedStartingPoint[id]
      };
    });
    x.domain([0, d3.max(regions, d => d.values.length)]);
    y.domain([
      cases,
      d3.max(regions, d =>
        d3.max(d.values.slice(0, DAYS), c => Number(c[STATUS]))
      )
    ]).nice();

    svg
      .selectAll(".y-axis")
      .transition()
      .duration(0)
      .call(d3.axisLeft(y).tickSize(-width + margin.right + margin.left));

    var city = svg.selectAll(".cities").data(regions);

    city.exit().remove();

    city
      .enter()
      .insert("g", ".focus")
      .append("path")
      .attr("class", "line cities")
      .style("stroke", d => z(d.id))
      .merge(city)
      .transition()
      .duration(0)
      .attr("d", d => line(d.values));

    // This places the labels to the right of each line
    svg
      .selectAll("text.label")
      .data(regions)
      .join("text")
      .attr("class", "label")
      // place the ticks to the right of the chart
      .attr("x", d => x(d.values.length - 1))
      // Place the ticks at the same y position as
      // the last y value of the line (remember, d is our array of points)
      .attr("y", d => y(d.values[d.values.length - 1][STATUS]))
      .attr("dy", "0.35em")
      .style("fill", d => z(d.id))
      .style("font-family", "sans-serif")
      .style("font-size", 12)
      .text(d => d.id);

    //tooltip(copy);
  }
  d3.select("#ncases").on("change", () => {
    console.log("update");
    update(d3.select("#ncases").property("value"));
  });
}

main();
