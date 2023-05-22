console.log('working 4')

var monthSelect = d3.select('#monthSelect').node(); // Get current value of select element
var month = monthSelect.options[monthSelect.selectedIndex].value;

// Global function called when select element is changed
function onMonthChanged() {
    month = monthSelect.options[monthSelect.selectedIndex].value;
    updateChart();
}

// function to help ensure loaded data has the correct type
function dataPreprocessor(row) {
    return {
        //date: row.date.substring(5), // returns date in format "7-1" (removes year - original format "2014-7-1")
        date: row.date,
        temp: +row.actual_mean_temp
    };
}

var svg = d3.select('svg');

// // Get layout parameters
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

var padding = {t: 30, r: 10, b: 30, l: 50};

// Compute chart dimensions
var chartWidth = svgWidth - padding.l - padding.r;
var chartHeight = svgHeight - padding.t - padding.b;

// // Compute the spacing for bar bands based on all 26 letters
// var barBand = chartHeight / 26;
// var barHeight = barBand * 0.7;

// Create a group element for appending chart elements
var chartG = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');

var yScale = d3.scaleLinear()
    .domain([-10, 120])
    .range([chartHeight, 0]);


var parseDate = d3.timeParse('%Y-%m-%e'); // to convert string in dataset to a date object
var formatMonth = d3.timeFormat('%m') // to get the month (07, 08, etc.) out of date, for grouping
var formatDay = d3.timeFormat('%d') // to get the day out of date, for labeling on axis


// to be updated with the data when it loads (allows it to be accessed by other functions)
var yearData = []


// way to structure with multiple csvs?
// read each csv
// make variable with that city's nested data (name like NYC_yearData)
// make update function go through list of city's, and for each, call another function
// that function has the stuff currently in the update function (like filtering data, drawing line)
// but keep axis stuff in updatechart, not new function, cause don't need to do it 11 times


d3.csv('data/KHOU.csv', dataPreprocessor).then(function(dataset) {

    // formatting data
    for (let i = 0; i < dataset.length; i++) {
        d = dataset[i];
        d.date = parseDate(d.date);
        d.month = formatMonth(d.date);
        d.day = +formatDay(d.date);
    };

    // nests data, i.e. groups it by month (because we get data for whole year)
    yearData = d3.nest()
        .key(c => c.month)
        .entries(dataset);


    // add data to the chart (data is sent through global variable and filtered in update function)
    updateChart();
});


function updateChart() {
    // don't need to pass anything because "month" & "monthData" are global variables and we filter here
    chartG.selectAll('.x-axis').remove();
    chartG.selectAll('.line').remove()

    // to get data for current month, need index of object in nested with key month
    var index = yearData.map(function(m) { return m.key; }).indexOf(month);
    var current_data = yearData[index].values;
    console.log(current_data);

    var numDays = current_data.length;

    var xScale = d3.scaleLinear()
        .domain([1, numDays])
        .range([0, chartWidth]);

    // making the line
    chartG.append('path')
        .datum(current_data)
        .attr("d", d3.line()
            .x(function(d) { return xScale(d.day) })
            .y(function(d) { return yScale(d.temp) })
        )
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke', "black");

    // x-axis
    chartG.append('g')
        .attr('class', 'x-axis')
        .attr('transform', 'translate(0, 530)')
        .call(d3.axisBottom(xScale).ticks(numDays));

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

}