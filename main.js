console.log('working 6')

var monthSelect = d3.select('#monthSelect').node(); // Get current value of select element
var month = monthSelect.options[monthSelect.selectedIndex].value;

// Global function called when select element is changed
function onMonthChanged() {
    month = monthSelect.options[monthSelect.selectedIndex].value;
    updateChart();
}

// the IBM color-blind-accessible palette, found on https://davidmathlogic.com/colorblind/
var color_palette = ["#648fff","#634AD5","#dc267f","#fe6100","#ffb000"];


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
var chartHeight = svgHeight - padding.t - padding.b

// Create a group element for appending chart elements
var chartG = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');

var yScale = d3.scaleLinear()
    .domain([-10, 120])
    .range([chartHeight, 0]);


// creating tooltip using external library
var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-5, 0])
    .html(function(d) {
        // return "<h5>"+d['day']+"</h5>";
        return "<h5>"+d['city']+" - "+d['temp']+"&deg</h5>"
    });
svg.call(toolTip); // instantiating the tooltip on the svg


var parseDate = d3.timeParse('%Y-%m-%e'); // to convert string in dataset to a date object
var formatMonth = d3.timeFormat('%m') // to get the month (07, 08, etc.) out of date, for grouping
var formatDay = d3.timeFormat('%d') // to get the day out of date, for labeling on axis


// to be updated with the data when it loads (allows it to be accessed by other functions)
// var yearData = []

var seaYearData = []
var houYearData = []

var cities = ["Seattle", "Houston"]
var datasets = [seaYearData, houYearData]


// way to structure with multiple csvs?
// read each csv
// make variable with that city's nested data (name like NYC_yearData)
// make update function go through list of city's, and for each, call another function
// that function has the stuff currently in the update function (like filtering data, drawing line)
// but keep axis stuff in updatechart, not new function, cause don't need to do it 11 times


Promise.all([
    d3.csv("data/SEA.csv", dataPreprocessor),
    d3.csv("data/HOU.csv", dataPreprocessor),
]).then(function(files) {
    // files[0] will contain file1.csv
    // files[1] will contain file2.csv
    for (let i = 0; i < files.length; i++) {

        var dataset = files[i];
        var curr_city = cities[i];

        for (let j = 0; j < dataset.length; j++) {
            d = dataset[j];
            d.date = parseDate(d.date);
            d.month = formatMonth(d.date);
            d.day = +formatDay(d.date);
            d.city = curr_city;
        }

        // nests data, i.e. groups it by month (because we get data for whole year)
        datasets[i] = d3.nest()
            .key(c => c.month)
            .entries(dataset);
    }

    updateChart();
})


function updateChart() {
    // don't need to pass anything because "month" & "datasets" are global variables and we filter here

    // removing things that need to be replaced - maybe update to use "enter update exit" later?
    chartG.selectAll('.x-axis').remove();
    chartG.selectAll('.line').remove()
    chartG.selectAll('.dot').remove();

    //var cities_group = chartG.selectAll('.city').data(cities).enter().append('g');

    // filtering data and making line for each city
    for (let i = 0; i < datasets.length; i++) {
        var yearData = datasets[i];
        var numDays = 0;

        // to get data for current month, need index of object in nested with key month
        var index = yearData.map(function(m) { return m.key; }).indexOf(month);
        var month_data = yearData[index].values;
        var numDays = month_data.length;

        var xScale = d3.scaleLinear()
            .domain([1, numDays])
            .range([0, chartWidth]);

        var className = month_data[i].city + "_point";


        // var line_group = chartG.append('g')
        //     .data(month_data)
        //     .enter();

        // line_group.append('path')
        //     .attr("d", d3.line()
        //         .x(function(d) { return xScale(d.day) })
        //         .y(function(d) { return yScale(d.temp) })
        //     )
        //     .attr('class', 'line')
        //     .attr('fill', 'none')
        //     .attr('stroke', function(d) { return color_palette[i]});


        chartG.append('path')
            .datum(month_data)
            .attr("d", d3.line()
                .x(function(d) { return xScale(d.day) })
                .y(function(d) { return yScale(d.temp) })
            )
            .attr('class', 'line')
            .attr('fill', 'none')
            .attr('stroke', function(d) { return color_palette[i]});

        // making the dots on each line
        //var dotsGroup = chartG.selectAll('g').data(month_data).enter().append('g')

        // var dotsGroup = chartG.selectAll(cities_group)
        // console.log(dotsGroup)

        chartG.selectAll(className).data(month_data).enter().append('circle')
            .attr('class', 'dot')
            .style("fill", function(d) { return color_palette[i]})
            .attr('r', 2.5)
            .on('mouseover', toolTip.show)
            .on('mouseout', toolTip.hide)
            .attr('cx', function(d) { return xScale(d.day) })
            .attr('cy', function(d) { return yScale(d.temp) });

    }



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