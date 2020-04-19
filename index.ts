import { getCountryStatsMock } from "./covid/api-connection-mock";
import { getCountryStats } from "./covid/api-connection";
import { matchRegionsHist } from "./covid/covid-manipulation";
import {
  renderCountriesSelection,
  appendCountrySelectionToNode,
  getChecked,
} from "./country/countries";
import * as d3 from "d3";

const initialRegions = ["MX", "CA", "BR", "EC", "KR", "TR", "RU"];

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
  prepareChart();
  renderCOVID(initialRegions);
  const countryForm = appendCountrySelectionToNode(
    document.querySelector("div.container"),
    { initialValue: initialRegions }
  );
  countryForm.addEventListener("change", () => {
    const res = getChecked(countryForm);
    console.log(res);
    renderCOVID(res);
  });
}
function prepareChart() {
  
}
async function renderCOVID(regions = initialRegions) {
  console.log("Covid Stats");

  const regionResult = await Promise.all(
    regions.map((r) => getCountryStats(r))
  );
  console.log({ regionResult });

  let data = {};
  for (let i = 0; i < regionResult.length; i++) {
    const { location, stats } = regionResult[i];
    data[location.isoCode] = stats.history;
  }
  /* 
  const MX: region = (await getCountryStats("MX")) as region;
  const US: region = (await getCountryStats("US")) as region;
  const ES: region = (await getCountryStats("ES")) as region;
  const IT: region = (await getCountryStats("IT")) as region;
  const CH: region = (await getCountryStats("CH")) as region;

  const UK: region = (await getCountryStats("GB")) as region;
  const CA: region = (await getCountryStats("CA")) as region;
  const USCA: region = (await getCountryStats("US-CA")) as region;
  const RU: region = (await getCountryStats("RU")) as region;

  const data = {
    MX: MX.stats.history,
    US: US.stats.history,
    ES: ES.stats.history,
    RU: RU.stats.history,
    UK: UK.stats.history,
    CH: CH.stats.history,
    IT: IT.stats.history,
    CA: CA.stats.history,
    USCA: USCA.stats.history,
  }; */

  const nCases = 0;
  d3.select("#nCases").property("value", nCases);
  const DAYS = 60;

  let STATUS = d3.select("#stats").property("value") || "confirmed";
  //const STATUS = "deaths"; //"confirmed";

  var svg = d3.select("#chart"),
    margin = { top: 15, right: 5, bottom: 15, left: 40 },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

  var x = d3
    .scaleLinear()
    .rangeRound([margin.left, width - margin.right])
    .domain([0, DAYS]);
  const defaultSelection = [0, DAYS];

  /*
  const brush = d3
    .brushX()
    .extent([
      [margin.left, 0.5],
      [width - margin.right, height - margin.bottom + 0.5]
    ])
    .on("brush", brushed)
    .on("end", brushended);

  const gb = svg
    .append("g")
    .call(brush)
    .call(brush.move, defaultSelection);
  function brushed() {
    if (d3.event.selection) {
      svg.property(
        "value",
        d3.event.selection.map(x.invert, x).map(d3.utcDay.round)
      );
      svg.dispatch("input");
    }
  }

  function brushended() {
    if (!d3.event.selection) {
      gb.call(brush.move, defaultSelection);
    }
  }
  */

  var yLog = d3.scaleLog().rangeRound([height - margin.bottom, margin.top]);
  var yOrginal = d3
    .scaleLinear()
    .rangeRound([height - margin.bottom, margin.top]);

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
  /* var focus = svg
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
    .attr("height", height);*/
  let matchedStartingPoint = matchRegionsHist(data, nCases, STATUS);
  console.log({ matchedStartingPoint });
  const radioButton = d3
    .select('input[name="scale"]:checked')
    .property("value");
  update(nCases, { scale: radioButton });

  function update(cases, options?: { scale?: string; statsToShow?: string }) {
    const { scale = "log", statsToShow = "confirmed" } = options;
    let y;
    if (scale === "log") {
      y = yLog;
    } else {
      y = yOrginal;
    }
    var line = d3
      .line()
      .defined((d) => !isNaN(d[statsToShow]))
      .curve(d3.curveLinear)
      .x((d) => x(d.index))
      .y((d) => y(d[statsToShow]));

    matchedStartingPoint = matchRegionsHist(data, cases, statsToShow);
    var copy = Object.keys(matchedStartingPoint);
    var regions = copy.map(function (id) {
      return {
        id: id,
        values: matchedStartingPoint[id],
      };
    });
    x.domain([0, d3.max(regions, (d) => d.values.length)]);
    y.domain([
      cases == 0 ? 1 : cases,
      d3.max(regions, (d) => d3.max(d.values, (c) => Number(c[statsToShow]))),
    ]).clamp(true);

    svg
      .selectAll(".y-axis")
      .transition()
      .duration(0)
      .call(
        d3
          .axisLeft(y)
          .scale(y)
          .tickSize(-width + margin.right + margin.left)
      );

    var region = svg.selectAll(".regions").data(regions);

    region.exit().remove();

    region
      .enter()
      .insert("g", ".focus")
      .append("path")
      .attr("class", "line regions")
      .style("stroke", (d) => z(d.id))
      .merge(region)
      .transition()
      .duration(0)
      .attr("d", (d) => line(d.values));

    // This places the labels to the right of each line
    svg
      .selectAll("text.label")
      .data(regions)
      .join("text")
      .attr("class", "label")
      // place the ticks to the right of the chart
      .attr("x", (d) => x(d.values.length - 1))
      // Place the ticks at the same y position as
      // the last y value of the line (remember, d is our array of points)
      .attr("y", (d) =>
        y(
          d.values[d.values.length - 1]
            ? d.values[d.values.length - 1][statsToShow]
            : false
        )
      )
      .attr("dy", "0.35em")
      .style("fill", (d) => z(d.id))
      .style("font-family", "sans-serif")
      .style("font-size", 12)
      .text((d) => d.id);

    //tooltip(copy);
  }
  d3.select("#nCases").on("change", controlHasChange);
  d3.selectAll("input[name='scale']").on("change", controlHasChange);
  var stats = d3.select("#stats").on("change", controlHasChange);

  function controlHasChange() {
    const nCases = Number(d3.select("#nCases").property("value"));
    const scale = d3.select('input[name="scale"]:checked').property("value");
    const statsToShow = d3.select("#stats").property("value");
    update(nCases, { scale, statsToShow });
  }
}

main();
