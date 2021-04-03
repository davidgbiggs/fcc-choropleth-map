import "./styles.scss";
import {
  schemeGreens,
  select,
  scaleQuantize,
  range,
  axisBottom,
  scaleLinear,
} from "d3";
import { geoPath } from "d3-geo";
import * as topojson from "topojson-client";

const width = 1000;
const height = 800;
const countiesUrl =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

function generateTooltipHtml({ bachelorsOrHigher, area_name, state }) {
  const baseHTML = `<div>${area_name}, ${state}: ${bachelorsOrHigher}%</div>`;
  return baseHTML;
}

const svg = select("#svg-container")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("id", "map-svg");

const layer1 = svg.append("g").attr("id", "layer-1");
const layer2 = svg.append("g").attr("id", "layer-2");
const layer3 = svg.append("g").attr("id", "layer-3");

const greenColor = scaleQuantize([0, 6], schemeGreens[7]);
const bachelorsScale = scaleQuantize([3, 66], schemeGreens[7]);

// attach legend
const legendWidth = 170;
const legendHeight = 500;
const legendPadding = 50;

const legend = layer3
  .append("svg")
  .attr("id", "legend")
  .attr("width", legendWidth + 2 * legendPadding)
  .attr("height", legendHeight)
  .attr("x", 600)
  .attr("y", 30);

const legendScale = scaleLinear().domain([3, 66]).range([0, legendWidth]);

const legendAxis = axisBottom(legendScale)
  .tickValues([3, 12, 21, 30, 39, 48, 57, 66])
  .tickFormat((v) => `${v}%`);

legend
  .append("g")
  .attr("transform", `translate(${legendPadding}, ${20})`)
  .attr("id", "legend-axis")
  .call(legendAxis);

legend
  .selectAll("rect")
  .data(range(7))
  .enter()
  .append("rect")
  .attr("width", legendWidth / 6.7)
  .attr("height", 10)
  .attr("y", function (d, i) {
    return Math.floor(i / 10) * 19 + 10;
  })
  .attr("x", function (d, i) {
    return (i % 7) * (legendWidth / 7) + legendPadding;
  })
  .attr("fill", function (d) {
    return greenColor(d);
  });

const path = geoPath();

const tooltip = select("body")
  .append("div")
  .attr("id", "tooltip")
  .style("opacity", 0);

fetch(
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"
)
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    fetch(countiesUrl)
      .then((response) => response.json())
      .then((topology) => {
        const geojsonCounties = topojson.feature(
          topology,
          topology.objects.counties
        );
        const geojsonStates = topojson.feature(
          topology,
          topology.objects.states
        );

        // generate map of county id's to lookup education data while drawing counties
        const fipsMap = {};
        for (let obj of data) {
          fipsMap[obj.fips] = obj;
        }

        // we attach states to the layer above the counties so you can see their outlines
        layer2
          .selectAll("path .state")
          .data(geojsonStates.features)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("class", "state")
          .attr("stroke", "white")
          .attr("fill", "transparent")
          .attr("stroke-width", 2);

        layer1
          .selectAll("path .county")
          .data(geojsonCounties.features)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("class", "county")
          .attr("fill", (d) => {
            const bOrHigher = fipsMap[d.id].bachelorsOrHigher;
            return bachelorsScale(bOrHigher);
          })
          .attr("data-fips", (d) => d.id)
          .attr("data-education", (d) => fipsMap[d.id].bachelorsOrHigher)
          .on("mousemove", (e, d) => {
            tooltip
              .html(generateTooltipHtml(fipsMap[d.id]))
              .style("left", `${e.screenX - 45}px`)
              .style("top", `${e.screenY - 100}px`)
              .attr("data-education", `${fipsMap[d.id].bachelorsOrHigher}`);
            tooltip.transition().duration(50).style("opacity", 1);
          })
          .on("mouseout", () => {
            select(this).transition().duration("50").attr("opacity", "1");

            //Makes the tooltip disappear:
            tooltip.transition().duration("50").style("opacity", 0);
          });
      });
  });
