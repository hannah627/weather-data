var varSelect = d3.select('#varSelect').node(); // Get current value of variable select element
var variable = varSelect.options[varSelect.selectedIndex].value;

function onVarChanged() {
    variable = varSelect.options[varSelect.selectedIndex].value;
    updateChart();
}


var monthSelect = d3.select('#monthSelect').node(); // Get current value of month select element
var month = monthSelect.options[monthSelect.selectedIndex].value;
var monthName = monthSelect.options[monthSelect.selectedIndex].label;

function onMonthChanged() {
    month = monthSelect.options[monthSelect.selectedIndex].value;
    monthName = monthSelect.options[monthSelect.selectedIndex].label;
    updateChart();
}


// function to help ensure loaded data has the correct type
function dataPreprocessor(row) {
    return {
        date: row.date, // returns in format "2014-7-1"
        mean_temp: +row.actual_mean_temp, // mean temperature for that day
        max_temp: +row.actual_max_temp,
        min_temp: +row.actual_min_temp
    };
}

function convertCelsius(f) {
    // takes fahrenheit temperature and converts it to celsius
    let c = (5/9) * (f-32);
    return c
}


var svg = d3.select('svg');

// // Get layout parameters
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

var padding = {t: 30, r: 10, b: 30, l: 50};

// Compute chart dimensions
var chartWidth = svgWidth - padding.l - padding.r;
var chartHeight = svgHeight - padding.t - padding.b

// Create a group element for appending chart elements
var chartG = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');

var yScale = d3.scaleLinear()
    .domain([0, 110])
    .range([chartHeight, 0]);

// x-axis label
chartG.append('text')
    .text('Days of the Month')
    .attr('class', 'axis-label')
    .attr('transform', 'translate(400, 565)');

// y-axis
chartG.append('g')
    .attr('class', 'y-axis')
    .attr('transform', 'translate(0, -10)')
    .call(d3.axisLeft(yScale));

// y-axis label
chartG.append('text')
    .text('Mean Daily Temperature (Degrees Fahrenheit)')
    .attr('class', 'axis-label')
    .attr('transform', 'translate(-30, 400) rotate(270)');


// creating tooltip using external library
var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-5, 0])
    .html(function(d) {
        return "<div class='tooltip'><h2>"+d[variable]+"&deg</h2><h3>"+d.city+" - "+monthName+" "+d.day+"</h3></div>"
    });
svg.call(toolTip); // instantiating the tooltip on the svg


var parseDate = d3.timeParse('%Y-%m-%e'); // to convert string in dataset to a date object
var formatMonth = d3.timeFormat('%m') // to get the month (07, 08, etc.) out of date, for grouping
var formatDay = d3.timeFormat('%d') // to get the day out of date, for labeling on axis


// to be updated with the data for each city when it loads (allows it to be accessed by other functions)
var seaYearData = [];
var houYearData = [];
var nycYearData = [];
var phxYearData = [];
var jaxYearData = [];

var cities = ["Seattle", "New York City", "Houston", "Phoenix", "Jacksonville"];
var datasets = [seaYearData, nycYearData, houYearData, phxYearData, jaxYearData];

// the IBM color-blind-accessible palette, found on https://davidmathlogic.com/colorblind/
var color_palette = ["#648fff","#634AD5","#dc267f","#fe6100","#ffb000"];


Promise.all([
    d3.csv("data/SEA.csv", dataPreprocessor),
    d3.csv("data/NYC.csv", dataPreprocessor),
    d3.csv("data/HOU.csv", dataPreprocessor),
    d3.csv("data/PHX.csv", dataPreprocessor),
    d3.csv("data/JAX.csv", dataPreprocessor)
]).then(function(files) {
    for (let i = 0; i < files.length; i++) {

        var dataset = files[i];
        var curr_city = cities[i];

        for (let j = 0; j < dataset.length; j++) {
            d = dataset[j];
            d.date = parseDate(d.date);
            d.month = formatMonth(d.date);
            d.day = +formatDay(d.date);
            d.city = curr_city;
            // for potentially converting to celsius and back later
            d.c_mean_temp = convertCelsius(d.mean_temp);
            d.c_max_temp = convertCelsius(d.max_temp);
            d.c_min_temp = convertCelsius(d.min_temp);
        }

        // nests data, i.e. groups it by month (because we get data for whole year)
        datasets[i] = d3.nest()
            .key(c => c.month)
            .entries(dataset);
    }

    updateChart();
})


d3.selectAll('.legendBox').on('click', toggleFocus) // to grey out/ remove other lines and "focus" this one
var focusedCity = ""; // variable to track which line is currently "focused" (if none, = "")

function toggleFocus() {
    /*
    allows users to click on a line or a box in the legend and "focus" one city by lowering the opacity
    of the lines and boxes representing the other cities. Users can click the same line or box again to "unfocus"
    that line/city, resetting the opacity of the others to 100%
    */

    let clickedCity = this.parentNode.id; // city (i.e. "Seattle")
    let lineGroups = d3.selectAll('.lineGroup')._groups[0]; // the groups containing the lines and points for each city
    let legendEntries = d3.selectAll('.legendEntry')._groups[0]; // the divs that make the colored boxes in the legend

    for (let i = 0; i < lineGroups.length; i++) {
        let currCity = lineGroups[i].id;
        // if no line is currently focused, 'unfocus' all lines except the one that was clicked
        if ((focusedCity == "") && (clickedCity != currCity)) {
            lineGroups[i].classList.add('unfocused');
            legendEntries[i].classList.add('unfocused');
        }
        // if the clicked line is currently focused, 're-focus' all other lines
        else if (focusedCity == clickedCity) {
            lineGroups[i].classList.remove('unfocused');
            legendEntries[i].classList.remove('unfocused');
        } // else (a different city is already focused - do nothing)
    }

    // if there was no focused city, make the clicked city the focused city
    if (focusedCity == "") {
        focusedCity = clickedCity;
    }
    // else if the user clicked on the already-focused city, go back to no city being focused
    else if (focusedCity == clickedCity) {
        focusedCity = "";
    }

}


var tempFormat = 'fahrenheit';
function toggleTemp() {
    console.log('temp toggled')
    if (tempFormat === 'fahrenheit') {
        console.log('fahrenheit');
    } else {
        console.log('celsius now');
    }
}


function updateChart() {
    // don't need to pass anything because "month" & "datasets" are global variables and we filter here

    // removing things that need to be replaced - maybe update to use "enter update exit" later?
    chartG.selectAll('.x-axis').remove();
    chartG.selectAll('.lineGroup').remove();
    chartG.selectAll('.line').remove()
    chartG.selectAll('.dot').remove();


    // ensuring that if user has "focused" a line and then updates the chart with a new variable or month,
    // that the legend resets along with the lines
    focusedCity = "";
    let legendEntries = d3.selectAll('.legendEntry')._groups[0];
    for (let i = 0; i < legendEntries.length; i++) {
        legendEntries[i].classList.remove('unfocused');
    };


    // filtering data and making line for each city
    for (let i = 0; i < datasets.length; i++) {
        var yearData = datasets[i];

        // to get data for current month, need index of object in nested with key month
        var index = yearData.map(function(m) { return m.key; }).indexOf(month);
        var month_data = yearData[index].values;
        var numDays = month_data.length;

        var xScale = d3.scaleLinear()
            .domain([1, numDays])
            .range([0, chartWidth]);

        // making groups to hold lines and points
        var lineGroup = chartG.append('g')
            .data(month_data)
            .attr('class', 'lineGroup')
            .attr('id', function(d) { return d.city });

        // making the lines
        lineGroup.append('path')
            .datum(month_data)
            .attr("d", d3.line()
                .x(function(d) { return xScale(d.day) })
                .y(function(d) { return yScale(d[variable]) })
            )
            .attr('class', 'line')
            .attr('fill', 'none')
            .attr('stroke', function() { return color_palette[i] });

        // getting the name for the city, which is used to not overwrite other city's points
        var className = month_data[i].city + "_point";

        // making the dots on each line
        lineGroup.selectAll(className).data(month_data).enter().append('circle')
            .attr('class', 'dot')
            .style("fill", function() { return color_palette[i]})
            .attr('r', 2.5)
            .on('mouseover', toolTip.show)
            .on('mouseout', toolTip.hide)
            .on('click', toggleFocus) // to grey out/ remove other lines and "focus" this one
            .attr('cx', function(d) { return xScale(d.day) })
            .attr('cy', function(d) { return yScale(d[variable]) });

    }

    // x-axis
    chartG.append('g')
    .attr('class', 'x-axis')
    .attr('transform', 'translate(0, 530)')
    .call(d3.axisBottom(xScale).ticks(numDays));

}