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
const barChartCanvas = document.getElementById('barChart');

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
      displayTable(parsedData);
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
  dataTable.innerHTML = '';
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
    renderCharts(limitedData);
  } else if (operation === 'regression') {
    const regressionResult = calculateLinearRegression(limitedData);
    output.innerHTML = formatRegressionStats(regressionResult);
    renderCharts(limitedData, regressionResult);
  }
}

// Data cleaning function (example: removing rows with missing values)
function cleanData(data) {
  const cleanedData = data.filter((row) => row.every((cell) => cell !== null && cell !== ''));
  return cleanedData;
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

// Linear regression calculation (between column 0 and column 1)
function calculateLinearRegression(data) {
  const x = data.map((row) => row[0]);
  const y = data.map((row) => row[1]);

  const n = x.length;
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

// Format and display regression results
function formatRegressionStats({ slope, intercept }) {
  return `
    <h3>Linear Regression Results</h3>
    <p>Slope (m): ${slope.toFixed(4)}</p>
    <p>Intercept (b): ${intercept.toFixed(4)}</p>
  `;
}

// Format and display descriptive stats
function formatDescriptiveStats(stats) {
  return Object.keys(stats).map((col) => {
    const s = stats[col];
    return `
      <h3>Descriptive Statistics for ${col}</h3>
      <p>Mean: ${s.mean.toFixed(2)}</p>
      <p>Median: ${s.median.toFixed(2)}</p>
      <p>Mode: ${s.mode.join(', ')}</p>
      <p>Range: ${s.range}</p>
      <p>Variance: ${s.variance.toFixed(2)}</p>
      <p>Standard Deviation: ${s.stdDev.toFixed(2)}</p>
    `;
  }).join('');
}

// Render all charts
function renderCharts(data, regressionResult = null) {
  data[0].forEach((_, colIndex) => {
    renderColumnCharts(data, colIndex, regressionResult);
  });
}

// Render charts for each column
function renderColumnCharts(data, colIndex, regressionResult) {
  const columnData = data.slice(1).map((row) => row[colIndex]);

  // Render histogram for the column
  renderHistogramChart(columnData, colIndex);

  // Render pie chart for the column (if categorical data)
  renderPieChart(columnData, colIndex);

  // Render scatter chart for pairwise columns (if numeric)
  if (colIndex < data[0].length - 1) {
    const nextColumnData = data.slice(1).map((row) => row[colIndex + 1]);
    renderScatterChart(columnData, nextColumnData, colIndex);
  }
}

// Render scatter plot
function renderScatterChart(xData, yData, colIndex) {
  const scatterData = xData.map((x, i) => ({ x, y: yData[i] }));
  const scatterChartData = {
    datasets: [
      {
        label: `Scatter Data - Column ${colIndex + 1}`,
        data: scatterData,
        backgroundColor: 'rgba(0, 123, 255, 0.7)',
      },
    ],
  };

  new Chart(scatterChartCanvas, {
    type: 'scatter',
    data: scatterChartData,
  });
}

// Render histogram for column
function renderHistogramChart(data, colIndex) {
  const histogramData = {
    labels: Array.from({ length: 10 }, (_, i) => (i * 10)),
    datasets: [
      {
        label: `Histogram - Column ${colIndex + 1}`,
        data: data.reduce((acc, value) => {
          const bin = Math.floor(value / 10) * 10;
          acc[bin] = (acc[bin] || 0) + 1;
          return acc;
        }, {}),
        backgroundColor: 'rgba(255, 159, 64, 0.7)',
      },
    ],
  };

  new Chart(histogramChartCanvas, {
    type: 'bar',
    data: histogramData,
  });
}

// Render pie chart for categorical data
function renderPieChart(data, colIndex) {
  const categoryCounts = data.reduce((acc, category) => {
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const pieData = {
    labels: Object.keys(categoryCounts),
    datasets: [
      {
        data: Object.values(categoryCounts),
        backgroundColor: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
      },
    ],
  };

  new Chart(pieChartCanvas, {
    type: 'pie',
    data: pieData,
  });
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
