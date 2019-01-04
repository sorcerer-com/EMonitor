$(function () {
	// data isn't loaded
	try {
		if (data == undefined) {
			throw new ReferenceError("data");
		}
	} catch (e) {
		if (e instanceof ReferenceError) {
			$("header").css("background-color", "#A81919")
				.append("(the data cannot be loaded, please refresh)");
		}
	}

	// add monitors hints
	for (var m = 0; m < data.monitorsCount; m++) {
		$(`.monitor-${m + 1}`).prop("title", data.settings['Monitors Names'][m]);
	}

	// Consumption
	//// Total
	// total
	var total = 0;
	var totalPrice = 0.0;
	var values = [];
	for (var t = 0; t < data.tariffsCount; t++) {
		values.push(0);
		for (var m = 0; m < data.monitorsCount; m++) {
			values[t] += toKilo(data.current.month[m][t]);
		}
		total += values[t];
		totalPrice += values[t] * data.settings['Tariff Prices'][t];
	}
	$(".cr-total-price").html(`${totalPrice.toFixed(2)} ${data.settings['Currency Symbols']}`);
	$(".cr-total-value").html(`(${total.toFixed(2)} kWh)`);
	// by tariffs
	if (total == 0) total = 1;
	for (var t = 0; t < data.tariffsCount; t++) {
		$(`.cr-total.tariff-${t + 1}`)
			.append(`${values[t].toFixed(2)} kWh (${Math.round(values[t] / total * 100)} %)`);
	}
	// by monitors
	for (var m = 0; m < data.monitorsCount; m++) {
		var value = 0;
		for (var t = 0; t < data.tariffsCount; t++) {
			value += toKilo(data.current.month[m][t]);
		}
		$(`.cr-total.monitor-${m + 1}`)
			.append(`${value.toFixed(2)} kWh (${Math.round(value / total * 100)} %)`);
	}
	// prev month
	var prevBillMonth = getBillMonth() - 1;
	if (prevBillMonth < 1) prevBillMonth += 12;
	var total = 0;
	var totalPrice = 0.0;
	var values = [];
	for (var t = 0; t < data.tariffsCount; t++) {
		values.push(0);
		for (var m = 0; m < data.monitorsCount; m++) {
			values[t] += toKilo(data.months[m][t][prevBillMonth - 1]);
		}
		total += values[t];
		totalPrice += values[t] * data.settings['Tariff Prices'][t];
	}
	$(".cr-total-prevMonth-price")
		.append(`${totalPrice.toFixed(2)} ${data.settings['Currency Symbols']}`);
	$(".cr-total-prevMonth-value")
		.append(` (${total.toFixed(2)} kWh, ${values.map(function (a) { return a.toFixed(2); }).join(" / ")})`);


	//// Last 24 Hours
	// total
	var total = 0;
	var values = [];
	for (var m = 0; m < data.monitorsCount; m++) {
		values.push(0);
		for (var h = 0; h < 24; h++) {
			values[m] += toKilo(data.hours[m][h]);
		}
		total += values[m];
	}
	$(`.cr-last-24-hours-total`).append(`${total.toFixed(2)} kWh`);
	$(`.cr-last-24-hours-average`)
		.append(`${(total / 24).toFixed(2)} kWh (${values.map(function (a) { return (a / 24).toFixed(2); }).join("/")})`);
	// by tariffs
	var values = [];
	for (var t = 0; t < data.tariffsCount; t++) {
		values.push(0);
	}
	for (var h = 0; h < 24; h++) {
		var value = 0;
		for (var m = 0; m < data.monitorsCount; m++) {
			value += toKilo(data.hours[m][h]);
		}

		if (h >= data.settings['Tariff Start Hours'][0] && h < data.settings['Tariff Start Hours'][1])
			values[0] += value;
		else if (h >= data.settings['Tariff Start Hours'][1] && h < data.settings['Tariff Start Hours'][2])
			values[1] += value;
		else if (h >= data.settings['Tariff Start Hours'][2] || h < data.settings['Tariff Start Hours'][0])
			values[2] += value;
	}
	if (total == 0) total = 1;
	for (var t = 0; t < data.tariffsCount; t++) {
		$(`.cr-last-24-hours.tariff-${t + 1}`)
			.append(`${values[t].toFixed(2)} kWh (${Math.round(values[t] / total * 100)} %)`);
	}
	// by monitors
	for (var m = 0; m < data.monitorsCount; m++) {
		var value = 0;
		for (var h = 0; h < 24; h++) {
			value += toKilo(data.hours[m][h]);
		}
		$(`.cr-last-24-hours.monitor-${m + 1}`)
			.append(`${value.toFixed(2)} kWh (${Math.round(value / total * 100)} %)`);
	}
	// current hour
	var total = 0;
	var values = [];
	for (var m = 0; m < data.monitorsCount; m++) {
		values.push(toKilo(data.current.hour[m]))
		total += values[m];
	}
	$(`.cr-last-24-hours-current`)
		.append(`${total.toFixed(2)} kWh (${values.map(function (a) { return a.toFixed(2); }).join("/")})`);

	//// Last Month
	// total
	var total = 0;
	var values = [];
	var dt = new Date(data.time);
	var daysCount = new Date(dt.getUTCFullYear(), dt.getUTCMonth(), 0).getDate(); // get previous month length
	for (var t = 0; t < data.tariffsCount; t++) {
		values.push(0);
		for (var d = 0; d < daysCount; d++) {
			for (var m = 0; m < data.monitorsCount; m++) {
				values[t] += toKilo(data.days[m][t][d]);
			}
		}
		total += values[t];
	}
	$(`.cr-last-month-total`).append(`${total.toFixed(2)} kWh`);
	$(`.cr-last-month-average`)
		.append(`${(total / daysCount).toFixed(2)} kWh (${values.map(function (a) { return (a / daysCount).toFixed(2); }).join("/")})`);
	if (total == 0) total = 1;
	// by tariffs
	for (var t = 0; t < data.tariffsCount; t++) {
		var value = 0;
		for (var d = 0; d < daysCount; d++) {
			for (var m = 0; m < data.monitorsCount; m++) {
				value += toKilo(data.days[m][t][d]);
			}
		}
		$(`.cr-last-month.tariff-${t + 1}`)
			.append(`${value.toFixed(2)} kWh (${Math.round(value / total * 100)} %)`);
	}
	// by monitors
	for (var m = 0; m < data.monitorsCount; m++) {
		var value = 0;
		for (var d = 0; d < daysCount; d++) {
			for (var t = 0; t < data.tariffsCount; t++) {
				value += toKilo(data.days[m][t][d]);
			}
		}
		$(`.cr-last-month.monitor-${m + 1}`)
			.append(`${value.toFixed(2)} kWh (${Math.round(value / total * 100)} %)`);
	}
	// current day
	var total = 0;
	var values = [];
	for (var t = 0; t < data.tariffsCount; t++) {
		values.push(0);
		for (var m = 0; m < data.monitorsCount; m++) {
			values[t] += toKilo(data.current.day[m][t]);
		}
		total += values[t];
	}
	$(`.cr-last-month-current`)
		.append(`${total.toFixed(2)} kWh (${values.map(function (a) { return a.toFixed(2); }).join("/")})`);

	// Current
	//// Current Usage
	var total = 0;
	for (var m = 0; m < data.monitorsCount; m++) {
		total += data.current.energy[m];
	}
	if (total == 0) total = 1;
	for (var m = 0; m < data.monitorsCount; m++) {
		var value = data.current.energy[m];
		$(`.cs-current-usage.monitor-${m + 1}`)
			.append(`${value.toFixed(2)} W (${Math.round(value / total * 100)} %)`);
	}

	//// Current Hour
	var total = 0;
	for (var m = 0; m < data.monitorsCount; m++) {
		total += toKilo(data.current.hour[m]);
	}
	if (total == 0) total = 1;
	for (var m = 0; m < data.monitorsCount; m++) {
		var value = toKilo(data.current.hour[m]);
		$(`.cs-current-hour.monitor-${m + 1}`)
			.append(`${value.toFixed(2)} kWh (${Math.round(value / total * 100)} %)`);
	}

	//// Current Day
	// total
	var total = 0;
	for (var m = 0; m < data.monitorsCount; m++) {
		for (var t = 0; t < data.tariffsCount; t++) {
			total += toKilo(data.current.day[m][t]);
		}
	}
	$(`.cs-current-day-total`)
		.append(`${total.toFixed(2)} kWh`);
	if (total == 0) total = 1;
	// by monitors
	for (var m = 0; m < data.monitorsCount; m++) {
		var value = 0;
		for (var t = 0; t < data.tariffsCount; t++) {
			value += toKilo(data.current.day[m][t]);
		}
		$(`.cs-current-day.monitor-${m + 1}`)
			.append(`${value.toFixed(2)} kWh (${Math.round(value / total * 100)} %)`);
	}
	// by tariffs
	for (var t = 0; t < data.tariffsCount; t++) {
		var value = 0;
		for (var m = 0; m < data.monitorsCount; m++) {
			value += toKilo(data.current.day[m][t]);
		}
		$(`.cs-current-day.tariff-${t + 1}`)
			.append(`${value.toFixed(2)} kWh (${Math.round(value / total * 100)} %)`);
	}

	//// Last month per monitor
	for (var m = 0; m < data.monitorsCount; m++) {
		if (data.settings['Monitors Names'][m] != "") {
			$(`.section-title.last-month-monitor-${m + 1}`).append(` (${data.settings['Monitors Names'][m]})`);
		}

		// total
		var total = 0;
		var values = [];
		var dt = new Date(data.time);
		var daysCount = new Date(dt.getUTCFullYear(), dt.getUTCMonth(), 0).getDate(); // get previous month length
		for (var t = 0; t < data.tariffsCount; t++) {
			values.push(0);
			for (var d = 0; d < daysCount; d++) {
				values[t] += toKilo(data.days[m][t][d]);
			}
			total += values[t];
		}
		$(`.cs-last-month-monitor-${m + 1}-total`).append(`${total.toFixed(2)} kWh`);
		$(`.cs-last-month-monitor-${m + 1}-average`)
			.append(`${(total / daysCount).toFixed(2)} kWh (${values.map(function (a) { return (a / daysCount).toFixed(2); }).join("/")})`);
		if (total == 0) total = 1;
		// by tariffs
		for (var t = 0; t < data.tariffsCount; t++) {
			var value = 0;
			for (var d = 0; d < daysCount; d++) {
				value += toKilo(data.days[m][t][d]);
			}
			$(`.cs-last-month-monitor-${m + 1}.tariff-${t + 1}`)
				.append(`${value.toFixed(2)} kWh (${Math.round(value / total * 100)} %)`);
		}
	}



	// History
	//// Year
	var total = 0;
	for (var t = 0; t < data.tariffsCount; t++) {
		total += lastYear(t);
	}
	$(".ch-year-total.all-monitors").append(`${total.toFixed(2)} kWh`);
	$(".ch-month-average.all-monitors").append(`${(total / 12).toFixed(2)} kWh`);
	if (total == 0) total = 1;
	for (var t = 0; t < data.tariffsCount; t++) {
		var value = lastYear(t);
		$(`.ch-year-tariff-${t + 1}.all-monitors`)
			.append(`${value.toFixed(2)} kWh (${Math.round(value / total * 100)} %)`);
	}

	//// Year per monitor
	for (var m = 0; m < data.monitorsCount; m++) {
		if (data.settings['Monitors Names'][m] != "") {
			$(`.section-title.year-monitor-${m + 1}`).append(` (${data.settings['Monitors Names'][m]})`);
		}

		var total = 0;
		for (var t = 0; t < data.tariffsCount; t++) {
			total += lastYear(t, m);
		}
		$(`.ch-year-total.year-monitor-${m + 1}`).append(`${total.toFixed(2)} kWh`);
		$(`.ch-month-average.year-monitor-${m + 1}`).append(`${(total / 12).toFixed(2)} kWh`);
		if (total == 0) total = 1;
		for (var t = 0; t < data.tariffsCount; t++) {
			var value = lastYear(t, m);
			$(`.ch-year-tariff-${t + 1}.year-monitor-${m + 1}`)
				.append(`${value.toFixed(2)} kWh(${Math.round(value / total * 100)} %)`);
		}
	}
});

// Current
function drawTotalConsumption(canvasName) {
	// sum by tariffs
	var values = [];
	for (var t = 0; t < data.tariffsCount; t++) {
		values.push(0);
		for (var m = 0; m < data.monitorsCount; m++) {
			values[t] += toKilo(data.current.month[m][t]);
		}
	}

	drawDonutChart(
		canvasName,
		values,
		{
			sectionsWidth: 25,
			label: "Total",
			units: "kWh",
			colors: ["#ec96a4", "#63b59c", "#68829e"]
		});
}

function drawCurrentUsage(canvasName) {
	var maxValue = Math.max.apply(Math, data.current.energy);
	drawCircularChart(
		canvasName,
		data.current.energy,
		maxValue * 1.2,
		{
			radius: 75,
			label: "Total",
			units: "W"
		});
}

function drawLast24Hours(canvasName) {
	var labels = [];
	var values = [];
	var colors = [];
	var dt = new Date(data.time);
	for (var h = 0; h < 24; h++) {
		var hour = (dt.getUTCHours() + h) % 24;
		labels.push(hour);
		values.push(0);
		for (var m = 0; m < data.monitorsCount; m++) {
			values[h] += toKilo(data.hours[m][hour]);
		}

		if (hour >= data.settings['Tariff Start Hours'][0] && hour < data.settings['Tariff Start Hours'][1])
			colors.push("#ec96a4");
		else if (hour >= data.settings['Tariff Start Hours'][1] && hour < data.settings['Tariff Start Hours'][2])
			colors.push("#63b59c");
		else if (hour >= data.settings['Tariff Start Hours'][2] || hour < data.settings['Tariff Start Hours'][0])
			colors.push("#68829e");
	}

	drawBarChart(
		canvasName,
		labels,
		values,
		{ colors: colors });
}

function drawLastMonth(canvasName, monitorIdx) {
	var labels = [];
	var dt = new Date(data.time);
	var daysCount = new Date(dt.getUTCFullYear(), dt.getUTCMonth(), 0).getDate(); // get previous month length
	for (var d = 0; d < daysCount; d++) {
		var dt2 = new Date(dt);
		dt2.setDate(dt.getDate() - daysCount + d);
		labels.push(dt2.getUTCDate());
	}

	var values = [];
	for (var t = 0; t < data.tariffsCount; t++) {
		values.push([]);
		for (var d = 0; d < daysCount; d++) {
			var dt2 = new Date(dt);
			dt2.setDate(dt.getDate() - daysCount + d);

			values[t].push(0);
			if (monitorIdx != undefined) {
				values[t][d] = toKilo(data.days[monitorIdx][t][dt2.getUTCDate() - 1]);
			}
			else {
				for (var m = 0; m < data.monitorsCount; m++) {
					values[t][d] += toKilo(data.days[m][t][dt2.getUTCDate() - 1]);
				}
			}
		}
	}
	values.reverse();

	drawLineChart(
		canvasName,
		labels,
		values);
}

// Sections
function drawCurrentHour(canvasName) {
	var values = [];
	for (var m = 0; m < data.monitorsCount; m++) {
		values.push(toKilo(data.current.hour[m]));
	}

	drawDonutChart(
		canvasName,
		values,
		{
			label: "Total",
			units: "kWh"
		});
}

function drawCurrentDay(canvasName) {
	var labels = [];
	var values = [];
	for (var m = 0; m < data.monitorsCount; m++) {
		labels.push("Monitor " + m);
		values.push([]);
		for (var t = 0; t < data.tariffsCount; t++) {
			values[m].push(toKilo(data.current.day[m][t]));
		}
	}

	drawVerticalMultiBarsChart(
		canvasName,
		labels,
		values,
		{ units: "kWh" });
}

// History
function drawLastYear(canvasName, monitorIdx) {
	// sum by tariffs
	var values = [];
	for (var t = 0; t < data.tariffsCount; t++) {
		values.push([]);
		for (var i = 0; i < 12; i++) {
			values[t].push(0);

			if (monitorIdx != undefined) {
				values[t][i] = toKilo(data.months[monitorIdx][t][i]);
			}
			else {
				for (var m = 0; m < data.monitorsCount; m++) {
					values[t][i] += toKilo(data.months[m][t][i]);
				}
			}
		}
	}
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Noe", "Dec"];

	// shift array so values to be ordered backward from last month
	for (var m = 0; m < getBillMonth() - 1; m++) {
		months.push(months[0]);
		months.shift();
		for (var t = 0; t < data.tariffsCount; t++) {
			values[t].push(values[t][0]);
			values[t].shift();
		}
	}
	months.reverse();
	for (var t = 0; t < data.tariffsCount; t++) {
		values[t].reverse();
	}

	drawVerticalSplitBarChart(
		canvasName,
		months,
		values,
		{ units: "kWh" }
	);
}


function toFloat(value) {
	return value / 100.0;
}

function toKilo(value) {
	return toFloat(value) / 1000.0;
}

function getBillMonth() {
	var dt = new Date(data.time);
	var month = dt.getUTCMonth() + 1;
	if (dt.getUTCDate() < data.settings['Bill Day'])
		month--;
	if (month < 1)
		month += 12;
	return month;
}

function lastYear(tariffIdx, monitorIdx) {
	var result = 0;
	for (var i = 0; i < 12; i++) {
		if (monitorIdx != undefined) {
			result += toKilo(data.months[monitorIdx][tariffIdx][i]);
		}
		else {
			for (var m = 0; m < data.monitorsCount; m++) {
				result += toKilo(data.months[m][tariffIdx][i]);
			}
		}
	}
	return result;
}