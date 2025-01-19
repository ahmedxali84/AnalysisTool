// Reference DOM elements
const fileInput = document.getElementById('fileInput');
const rowLimitInput = document.getElementById('rowLimitInput');
const operationSelect = document.getElementById('operationSelect');
const processBtn = document.getElementById('processBtn');
const dataTable = document.getElementById('dataTable');
const output = document.getElementById('output');
const exportData = document.getElementById('exportData');
const loader = document.getElementById('loader');
const container = document.getElementById('container');
const scatterChartCanvas = document.getElementById('scatterChart');
const histogramChartCanvas = document.getElementById('histogramChart');
const pieChartCanvas = document.getElementById('pieChart');
const lineChartCanvas = document.getElementById('lineChart');

// Variables
let parsedData = [];

// Loader animation
setTimeout(() => {
  loader.style.display = 'none';
  container.style.display = 'block';
}, 3000);

// Event listeners
fileInput.addEventListener('change', handleFile);
exportData.addEventListener('click', exportToCSV);
processBtn.addEventListener('click', processOperation);

// Handle file upload
function handleFile(event) {
  const file = event.target.files[0];
  if (file && file.type === 'text/csv') {
    const reader = new FileReader();
    reader.onload = function (e) {
      parsedData = parseCSV(e.target.result);
      displayTable(parsedData);  // Initial display of the entire table
    };
    reader.readAsText(file);
  } else {
    alert('Please upload a valid CSV file.');
  }
}

// Parse CSV into a 2D array
function parseCSV(data) {
  const rows = data.trim().split('\n');
  return rows.map((row) => row.split(',').map((cell) => (isNaN(cell) ? cell : parseFloat(cell))));
}

// Display data in a table
function displayTable(data) {
  dataTable.innerHTML = ''; // Clear existing table

  const rowLimit = parseInt(rowLimitInput.value, 10) || data.length;
  const limitedData = data.slice(0, rowLimit);

  const headerRow = document.createElement('tr');
  limitedData[0].forEach((_, index) => {
    const th = document.createElement('th');
    th.textContent = `Column ${index + 1}`;
    headerRow.appendChild(th);
  });
  dataTable.appendChild(headerRow);

  limitedData.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    row.forEach((cell) => {
      const cellElement = document.createElement(rowIndex === 0 ? 'th' : 'td');
      cellElement.textContent = cell;
      tr.appendChild(cellElement);
    });
    dataTable.appendChild(tr);
  });
}

// Process operation based on user selection
async function processOperation() {
  const operation = operationSelect.value;
  if (!operation) {
    alert('Please select an operation.');
    return;
  }

  const rowLimit = parseInt(rowLimitInput.value, 10) || parsedData.length;
  const limitedData = parsedData.slice(0, rowLimit);

  if (operation === 'cleaning') {
    const cleanedData = await cleanData(limitedData);
    displayTable(cleanedData);
    output.textContent = 'Data cleaned successfully!';
    renderCharts(cleanedData);
  } else if (operation === 'descriptive') {
    const stats = getDescriptiveStats(limitedData);
    output.innerHTML = formatDescriptiveStats(stats);
    renderCharts(limitedData, stats);
  } else if (operation === 'regression') {
    const columns = await getColumnsForRegression();
    const regressionResult = calculateLinearRegressionForColumns(limitedData, columns.x, columns.y);
    output.innerHTML = formatRegressionStats(regressionResult);
    renderCharts(limitedData, regressionResult);
  } else if (operation === 'correlation') {
    const columns = await getColumnsForCorrelation();
    const correlation = calculateCorrelationForColumns(limitedData, columns.x, columns.y);
    output.innerHTML = `Correlation: ${correlation.toFixed(2)}`;
    renderCharts(limitedData);
  }
}

// Data cleaning function (example: removing rows with missing values)
async function cleanData(data) {
  const confirmed = await confirmDataCleaning();
  if (confirmed === 'remove') {
    return data.filter((row) => row.every((cell) => cell !== null && cell !== ''));
  } else if (confirmed === 'replace') {
    return data.map((row) => row.map((cell, index) => {
      if (cell === null || cell === '') {
        const columnData = data.map(r => r[index]).filter(v => v !== null && v !== '');
        const median = calculateMedian(columnData);
        return median;
      }
      return cell;
    }));
  }
}

// Popup for cleaning confirmation
function confirmDataCleaning() {
  return new Promise((resolve) => {
    const popup = window.confirm('Do you want to remove missing values or replace them with the median? Click "OK" to remove, or "Cancel" to replace with median.');
    resolve(popup ? 'remove' : 'replace');
  });
}

// Descriptive statistics calculation (per column)
function getDescriptiveStats(data) {
  const columns = data[0];
  const stats = {};

  columns.forEach((col, index) => {
    const columnData = data.slice(1).map((row) => row[index]);
    const numericData = columnData.filter((cell) => typeof cell === 'number');

    if (numericData.length > 0) {
      const mean = numericData.reduce((acc, val) => acc + val, 0) / numericData.length;
      const median = calculateMedian(numericData);
      const mode = calculateMode(numericData);
      const range = Math.max(...numericData) - Math.min(...numericData);
      const variance = calculateVariance(numericData, mean);
      const stdDev = Math.sqrt(variance);

      stats[col] = { mean, median, mode, range, variance, stdDev };
    }
  });

  return stats;
}

// Helper functions for statistics
function calculateMedian(data) {
  data.sort((a, b) => a - b);
  const middle = Math.floor(data.length / 2);
  return data.length % 2 !== 0 ? data[middle] : (data[middle - 1] + data[middle]) / 2;
}

function calculateMode(data) {
  const frequency = {};
  let maxFreq = 0;
  let modes = [];
  data.forEach((num) => {
    frequency[num] = (frequency[num] || 0) + 1;
    if (frequency[num] > maxFreq) {
      maxFreq = frequency[num];
    }
  });
  for (let num in frequency) {
    if (frequency[num] === maxFreq) {
      modes.push(Number(num));
    }
  }
  return modes;
}

function calculateVariance(data, mean) {
  return data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
}

// Format descriptive stats for display
function formatDescriptiveStats(stats) {
  let outputHTML = '<h3>Descriptive Statistics:</h3>';
  for (const column in stats) {
    outputHTML += `<b>${column}:</b><br>`;
    const stat = stats[column];
    outputHTML += `Mean: ${stat.mean.toFixed(2)}<br>`;
    outputHTML += `Median: ${stat.median.toFixed(2)}<br>`;
    outputHTML += `Mode: ${stat.mode.join(', ')}<br>`;
    outputHTML += `Range: ${stat.range.toFixed(2)}<br>`;
    outputHTML += `Variance: ${stat.variance.toFixed(2)}<br>`;
    outputHTML += `Standard Deviation: ${stat.stdDev.toFixed(2)}<br><br>`;
  }
  return outputHTML;
}

// Linear regression calculation (simple linear regression: y = mx + b)
function calculateLinearRegressionForColumns(data, xColumnIndex, yColumnIndex) {
  const xValues = data.map((row) => row[xColumnIndex]);
  const yValues = data.map((row) => row[yColumnIndex]);

  const n = xValues.length;
  const xMean = xValues.reduce((acc, val) => acc + val, 0) / n;
  const yMean = yValues.reduce((acc, val) => acc + val, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }

  const m = numerator / denominator;
  const b = yMean - m * xMean;

  return { m, b };
}

// Format regression result
function formatRegressionStats(result) {
  return `<h3>Linear Regression:</h3>Equation: y = ${result.m.toFixed(2)}x + ${result.b.toFixed(2)}`;
}

// Render charts
function renderCharts(data, stats = null) {
  const scatterData = data.map(row => row[0]);
  const scatterLabels = data.map((_, index) => index);

  const scatterChart = new Chart(scatterChartCanvas, {
    type: 'scatter',
    data: {
      labels: scatterLabels,
      datasets: [{
        label: 'Scatter Plot',
        data: scatterData.map((value, index) => ({ x: index, y: value })),
        backgroundColor: 'rgba(75, 192, 192, 1)'
      }]
    }
  });

  const histogramData = data.map(row => row[0]);
  const histogramChart = new Chart(histogramChartCanvas, {
    type: 'bar',
    data: {
      labels: histogramData,
      datasets: [{
        label: 'Histogram',
        data: histogramData,
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }]
    }
  });

  // If stats are available, show box plot or more charts as needed
  if (stats) {
    // Optionally, add a box plot or another relevant chart
  }
}

// Export data to CSV
function exportToCSV() {
  const csvContent = parsedData.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'data.csv';
  link.click();
}

// Get columns for correlation
function getColumnsForCorrelation() {
  return new Promise((resolve) => {
    const col1 = parseInt(prompt('Enter the index (1-based) of the first column you want to correlate:')) - 1;
    const col2 = parseInt(prompt('Enter the index (1-based) of the second column you want to correlate:')) - 1;
    resolve({ x: col1, y: col2 });
  });
}

// Get columns for regression
function getColumnsForRegression() {
  return new Promise((resolve) => {
    const xCol = parseInt(prompt('Enter the index (1-based) of the independent variable (x):')) - 1;
    const yCol = parseInt(prompt('Enter the index (1-based) of the dependent variable (y):')) - 1;
    resolve({ x: xCol, y: yCol });
  });
}
