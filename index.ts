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
  var chart = await covidCountryChart.init();
  //activateControls();
  let flag = false;
  let c = 0;
  setInterval(() => {
    flag = !flag;
    chart.switchScale(flag ? "linear" : "log");
    c++;
    if (c > 10) {
      debugger;
    }
  }, 2000);

  //renderCOVID(initialRegions);
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

function activateControls() {
  d3.select("#nCases").on("change", controlHasChange);
  d3.selectAll("input[name='scale']").on("change", controlHasChange);
  d3.select("#stats").on("change", controlHasChange);

  function controlHasChange() {
    const nCases = Number(d3.select("#nCases").property("value"));
    const scale = d3.select('input[name="scale"]:checked').property("value");
    const statsToShow = d3.select("#stats").property("value");
    console.log({ nCases, scale, statsToShow });

    //update(nCases, { scale, statsToShow });
  }
}

const deafultValues = {
  regions: ["MX", "RU", "CA", "EC", "BR", "KR", "TR", "CO", "ES", "IT", "US"],
  matchCases: 20,
  metric: "deaths",
  scale: "log",
  windowSizeIndays: 100,
};

const getData = async ({ regions, matchCases, metric } = deafultValues) => {
  console.log("Data with:", { regions, matchCases, metric });

  const regionResult =
    (await Promise.all(regions.map((r) => getCountryStats(r))).catch(
      console.warn
    )) ||
    (await Promise.all(deafultValues.regions.map((r) => getCountryStats(r)))) ||
    [];
  console.log({ regionResult });

  const data = {};
  for (let i = 0; i < regionResult.length; i++) {
    const { location, stats } = regionResult[i];
    data[location.isoCode] = stats.history;
  }

  const matchedStartingPoint = matchRegionsHist(data, matchCases, metric);
  const copy = Object.keys(matchedStartingPoint);
  const result = copy.map(function (id) {
    return {
      id: id,
      values: matchedStartingPoint[id],
    };
  });
  return result;
};

let covidCountryChart = {
  init: async function () {
    console.log("Init covidCountryChart", this);

    const svg = d3.select("#chart");
    const margin = { top: 15, right: 5, bottom: 15, left: 50 },
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom;

    const scales = {
      linear: d3.scaleLinear(),
      log: d3.scaleLog().base(10),
    };
    Object.keys(scales).forEach((scaleType) => {
      scales[scaleType].rangeRound([height - margin.bottom, margin.top]);
    });
    const x = d3
      .scaleLinear()
      .rangeRound([margin.left, width - margin.right])
      .domain([0, deafultValues.windowSizeIndays]);

    const z = d3.scaleOrdinal(d3.schemeCategory10);

    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + (height - margin.bottom) + ")")
      .call(d3.axisBottom(x));

    svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", "translate(" + margin.left + ",0)");

    // X title
    svg
      .append("text")
      .attr("transform", `translate(${width / 2}, ${height + margin.top + 10})`)
      .style("text-anchor", "middle")
      .text("Días desde 20 casos");

    const data = await getData();
    const y = scales[deafultValues.scale];
    const line = d3
      .line()
      .defined((d) => !isNaN(d[deafultValues.metric]))
      .curve(d3.curveLinear)
      .x((d) => x(d.index))
      .y((d) => y(d[deafultValues.metric]));

    x.domain([0, d3.max(data, (d) => d.values.length)]);
    y.domain([
      deafultValues.matchCases || 1,
      d3.max(data, (d) =>
        d3.max(d.values, (c) => Number(c[deafultValues.metric]))
      ),
    ]).clamp(true);

    let yAxis = d3
      .axisLeft(y)
      .ticks(10)
      .tickFormat(y.tickFormat(10, ""))
      .tickSize(-width + margin.right + margin.left);

    svg.selectAll(".x-axis").transition().duration(1000).call(d3.axisBottom(x));

    svg
      .selectAll(".y-axis")
      .call(yAxis)
      .call((g) =>
        g
          .selectAll(".tick:not(:first-of-type) line")
          .attr("stroke-opacity", 0.2)
          .attr("stroke-dasharray", "2,2")
      );

    const regions = svg.selectAll(".region").data(data).enter().insert("g");

    // Insert lines
    regions
      .append("path")
      .attr("class", "line")
      .style("stroke", (d) => z(d.id))
      .transition()
      .duration(1000)
      .attr("d", (d) => line(d.values));

    // Add circles
    regions
      .append("g")
      .attr("class", "circle")
      .attr("fill", (d) => z(d.id))
      .selectAll("circle")
      .data((d) => d.values)
      .join("circle")
      .attr("cx", (d) => x(d.index))
      .attr("cy", (d) => y(d[deafultValues.metric]))
      .attr("r", 2);

    // Place labels
    regions
      .insert("text")
      .attr("class", "label")
      // place the ticks to the right of the chart
      .attr("x", (d) => x(d.values.length - 1) + 5)
      // Place the ticks at the same y position as
      // the last y value of the line (remember, d is our array of points)
      .attr("y", (d) =>
        y(
          d.values[d.values.length - 1]
            ? d.values[d.values.length - 1][deafultValues.metric]
            : false
        )
      )
      .attr("dy", "0.35em")
      .style("fill", (d) => z(d.id))
      .text((d) => d.id);

    function switchScale(scale = "log") {
      // TODO: no repeat
      const y = scales[scale];
      y.domain([
        deafultValues.matchCases || 1,
        d3.max(data, (d) =>
          d3.max(d.values, (c) => Number(c[deafultValues.metric]))
        ),
      ]).clamp(true);
      let yAxis = d3.axisLeft(y).tickSize(-width + margin.right + margin.left);
      if (scale === "log") {
        yAxis = yAxis.ticks(10).tickFormat(y.tickFormat(10, ""));
      }
      svg
        .selectAll(".y-axis")
        .transition()
        .duration(500)
        .call(yAxis)
        .call((g) =>
          g
            .selectAll(".tick:not(:first-of-type) line")
            .attr("stroke-opacity", 0.2)
            .attr("stroke-dasharray", "2,2")
        );

      //Update line and circles
      const regions = svg.selectAll(".region").data(data).enter().insert("g");

      // Insert lines
      regions
        .append("path")
        .attr("class", "line")
        .style("stroke", (d) => z(d.id))
        .transition()
        .duration(1000)
        .attr("d", (d) => line(d.values));

      // Add circles
      regions
        .append("g")
        .attr("class", "circle")
        .attr("fill", (d) => z(d.id))
        .selectAll("circle")
        .data((d) => d.values)
        .join("circle")
        .attr("cx", (d) => x(d.index))
        .attr("cy", (d) => y(d[deafultValues.metric]))
        .attr("r", 2);
    }
    return Object.assign({}, svg.node(), { switchScale });
  },
};

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
  const nCases = 0;
  d3.select("#nCases").property("value", nCases);
  const DAYS = 100;
  let STATUS = d3.select("#stats").property("value") || "confirmed";

  var svg = d3.select("#chart"),
    margin = { top: 15, right: 5, bottom: 15, left: 50 },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

  var x = d3
    .scaleLinear()
    .rangeRound([margin.left, width - margin.right])
    .domain([0, DAYS]);

  const defaultSelection = [0, DAYS];

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

  let matchedStartingPoint = matchRegionsHist(data, nCases, STATUS);

  console.log({ matchedStartingPoint });

  const radioButton = d3
    .select('input[name="scale"]:checked')
    .property("value");
  controlHasChange();

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

    let yAxis = d3
      .axisLeft(y)
      .ticks(10)
      .tickFormat(y.tickFormat(10, ""))
      .tickSize(-width + margin.right + margin.left);

    svg
      .selectAll(".y-axis")
      .call(yAxis)
      .call((g) =>
        g
          .selectAll(".tick:not(:first-of-type) line")
          .attr("stroke-opacity", 0.2)
          .attr("stroke-dasharray", "2,2")
      );

    var region = svg.selectAll(".regions").data(regions);

    region.exit().remove();

    let reigonG = region.enter().insert("g", ".focus");

    reigonG
      .append("path")
      .attr("class", "line regions")
      .style("stroke", (d) => z(d.id))
      .merge(region)
      .transition()
      .duration(0)
      .attr("d", (d) => line(d.values));

    reigonG
      .append("g")
      .attr("stroke", "white")
      .attr("fill", (d) => z(d.id))
      .selectAll("circle")
      .data((d) => d.values)
      .join("circle")

      .attr("cx", (d) => x(d.index))
      .attr("cy", (d) => y(d[statsToShow]))
      .attr("r", 2);
    // This places the labels to the right of each line
    svg
      .selectAll("text.label")
      .data(regions)
      .join("text")
      .attr("class", "label")
      // place the ticks to the right of the chart
      .attr("x", (d) => x(d.values.length - 1) + 5)
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
      .text((d) => d.id);

    //tooltip(copy);
  }

  d3.select("#nCases").on("change", controlHasChange);
  d3.selectAll("input[name='scale']").on("change", controlHasChange);
  d3.select("#stats").on("change", controlHasChange);

  function controlHasChange() {
    const nCases = Number(d3.select("#nCases").property("value"));
    const scale = d3.select('input[name="scale"]:checked').property("value");
    const statsToShow = d3.select("#stats").property("value");
    console.log({ nCases, scale, statsToShow });

    //update(nCases, { scale, statsToShow });
  }
}

main();
