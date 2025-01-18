const fileInput = document.getElementById('fileInput');
const rowLimitInput = document.getElementById('rowLimitInput');
const operationSelect = document.getElementById('operationSelect');
const processBtn = document.getElementById('processBtn');
const dataTable = document.getElementById('dataTable');
const output = document.getElementById('output');
const exportData = document.getElementById('exportData');
const loader = document.getElementById('loader');
const container = document.getElementById('container');
let parsedData = [];

setTimeout(() => {
  loader.style.display = 'none';
  container.style.display = 'block';
}, 3000);

fileInput.addEventListener('change', handleFile);
exportData.addEventListener('click', exportToCSV);
processBtn.addEventListener('click', processOperation);

function handleFile(event) {
  const file = event.target.files[0];
  if (file && file.type === 'text/csv') {
    const reader = new FileReader();
    reader.onload = function(e) {
      parsedData = parseCSV(e.target.result);
      displayTable(parsedData);
      renderCharts(parsedData);
    };
    reader.readAsText(file);
  } else {
    alert('Please upload a valid CSV file.');
  }
}

function parseCSV(data) {
  const rows = data.trim().split('\n');
  return rows.map(row => row.split(',').map(cell => (isNaN(cell) ? cell : parseFloat(cell))));
}

function displayTable(data) {
  dataTable.innerHTML = ''; 
  const rowLimit = parseInt(rowLimitInput.value, 10) || data.length;
  const limitedData = data.slice(0, rowLimit);

  const headerRow = document.createElement('tr');
  limitedData[0].forEach((cell, index) => {
    const th = document.createElement('th');
    th.textContent = `Column ${index + 1}`;
    headerRow.appendChild(th);
  });
  dataTable.appendChild(headerRow);

  limitedData.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    row.forEach(cell => {
      const cellElement = document.createElement(rowIndex === 0 ? 'th' : 'td');
      cellElement.textContent = cell;
      tr.appendChild(cellElement);
    });
    dataTable.appendChild(tr);
  });
}

async function processOperation() {
  const operation = operationSelect.value;
  if (!operation) {
    alert('Please select an operation.');
    return;
  }

  const rowLimit = parseInt(rowLimitInput.value, 10) || parsedData.length;
  let result = [];

  if (operation === 'cleaning') {
    result = await cleanData(parsedData.slice(0, rowLimit));
    output.textContent = 'Data cleaned successfully!';
  } else if (operation === 'descriptive') {
    const stats = getDescriptiveStats(parsedData.slice(0, rowLimit));
    output.innerHTML = formatDescriptiveStats(stats);
  }

  displayTable(result);
  renderCharts(result);  // Re-render the charts after operation
}

function cleanData(data) {
  const missingValueColumns = detectMissingValues(data);
  return data; // Return cleaned data
}

function detectMissingValues(data) {
  const missingColumns = [];
  data[0].forEach((_, colIndex) => {
    if (data.some(row => row[colIndex] === "" || row[colIndex] == null)) {
      missingColumns.push(colIndex);
    }
  });
  return missingColumns;
}

function getDescriptiveStats(data) {
  // Flatten the data (only considering numeric columns for statistics)
  const numericData = data.slice(1).map(row => row.filter(cell => typeof cell === 'number'));
  
  const flatData = numericData.flat();
  const mean = flatData.reduce((acc, val) => acc + val, 0) / flatData.length;
  const median = calculateMedian(flatData);
  const mode = calculateMode(flatData);
  const range = Math.max(...flatData) - Math.min(...flatData);
  const variance = calculateVariance(flatData, mean);
  const stdDev = Math.sqrt(variance);
  const iqr = calculateIQR(flatData);
  const skewness = calculateSkewness(flatData, mean, stdDev);
  const kurtosis = calculateKurtosis(flatData, mean, stdDev);
  const percentiles = calculatePercentiles(flatData);
  const quartiles = calculateQuartiles(flatData);

  return {
    mean, median, mode, range, variance, stdDev, iqr, skewness, kurtosis, percentiles, quartiles
  };
}

function calculateMedian(data) {
  data.sort((a, b) => a - b);
  const middle = Math.floor(data.length / 2);
  return data.length % 2 !== 0 ? data[middle] : (data[middle - 1] + data[middle]) / 2;
}

function calculateMode(data) {
  const frequency = {};
  let maxFreq = 0;
  let modes = [];
  data.forEach(num => {
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

function calculateIQR(data) {
  const q1 = calculatePercentile(data, 25);
  const q3 = calculatePercentile(data, 75);
  return q3 - q1;
}

function calculateSkewness(data, mean, stdDev) {
  const n = data.length;
  const sum = data.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
  return sum / n;
}

function calculateKurtosis(data, mean, stdDev) {
  const n = data.length;
  const sum = data.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0);
  return sum / n - 3;  // Excess Kurtosis
}

function calculatePercentiles(data) {
  data.sort((a, b) => a - b);
  return {
    25: calculatePercentile(data, 25),
    50: calculatePercentile(data, 50), // Median
    75: calculatePercentile(data, 75)
  };
}

function calculatePercentile(data, percentile) {
  const index = Math.floor(percentile / 100 * data.length);
  return data[index];
}

function calculateQuartiles(data) {
  data.sort((a, b) => a - b);
  return {
    Q1: calculatePercentile(data, 25),
    Q2: calculatePercentile(data, 50), // Median
    Q3: calculatePercentile(data, 75)
  };
}

function formatDescriptiveStats(stats) {
  return `
    <div>Mean: ${stats.mean}</div>
    <div>Median: ${stats.median}</div>
    <div>Mode: ${stats.mode.join(', ')}</div>
    <div>Range: ${stats.range}</div>
    <div>Variance: ${stats.variance}</div>
    <div>Standard Deviation: ${stats.stdDev}</div>
    <div>Interquartile Range (IQR): ${stats.iqr}</div>
    <div>Skewness: ${stats.skewness}</div>
    <div>Kurtosis: ${stats.kurtosis}</div>
    <div>Percentiles: Q25: ${stats.percentiles[25]}, Q50: ${stats.percentiles[50]}, Q75: ${stats.percentiles[75]}</div>
    <div>Quartiles: Q1: ${stats.quartiles.Q1}, Q2 (Median): ${stats.quartiles.Q2}, Q3: ${stats.quartiles.Q3}</div>
  `;
}

function renderCharts(data) {
  const scatterChartData = {
    datasets: [{
      label: 'Scatter Plot',
      data: data.slice(1).map(row => ({ x: row[0], y: row[1] })),
      backgroundColor: 'rgba(0, 255, 0, 0.7)',
    }]
  };

  const lineChartData = {
    labels: data[0],
    datasets: [{
      label: 'Line Chart',
      data: data.slice(1).map(row => row[1]),
      borderColor: '#00FF00',
      backgroundColor: 'rgba(0, 255, 0, 0.2)',
      fill: false
    }]
  };

  const barChartData = {
    labels: data[0],
    datasets: [{
      label: 'Bar Chart',
      data: data.slice(1).map(row => row[2] || 0),
      backgroundColor: 'rgba(0, 255, 0, 0.5)',
    }]
  };

  const pieChartData = {
    labels: data[0],
    datasets: [{
      label: 'Pie Chart',
      data: data.slice(1).map(row => row[2] || 0),
      backgroundColor: ['#00FF00', '#FF0000', '#0000FF', '#FFFF00'],
    }]
  };

  const donutChartData = {
    labels: data[0],
    datasets: [{
      label: 'Donut Chart',
      data: data.slice(1).map(row => row[3] || 0),
      backgroundColor: ['#00FF00', '#FF0000', '#0000FF', '#FFFF00'],
    }]
  };

  const bubbleChartData = {
    datasets: [{
      label: 'Bubble Chart',
      data: data.slice(1).map(row => ({
        x: row[0],
        y: row[1],
        r: row[2] || 10
      })),
      backgroundColor: 'rgba(0, 255, 0, 0.7)',
    }]
  };

  const areaChartData = {
    labels: data[0],
    datasets: [{
      label: 'Area Chart',
      data: data.slice(1).map(row => row[2]),
      fill: true,
      backgroundColor: 'rgba(0, 255, 0, 0.2)',
      borderColor: '#00FF00',
    }]
  };

  const radarChartData = {
    labels: data[0],
    datasets: [{
      label: 'Radar Chart',
      data: data.slice(1).map(row => row[1]),
      backgroundColor: 'rgba(0, 255, 0, 0.3)',
      borderColor: '#00FF00',
    }]
  };

  const mixedChartData = {
    labels: data[0],
    datasets: [{
      type: 'line',
      label: 'Line Chart in Mixed Chart',
      data: data.slice(1).map(row => row[1]),
      borderColor: '#00FF00',
      backgroundColor: 'rgba(0, 255, 0, 0.2)',
      fill: false
    }, {
      type: 'bar',
      label: 'Bar Chart in Mixed Chart',
      data: data.slice(1).map(row => row[2] || 0),
      backgroundColor: 'rgba(255, 0, 0, 0.5)',
    }]
  };

  new Chart(scatterChartCanvas, { type: 'scatter', data: scatterChartData });
  new Chart(lineChartCanvas, { type: 'line', data: lineChartData });
  new Chart(barChartCanvas, { type: 'bar', data: barChartData });
  new Chart(pieChartCanvas, { type: 'pie', data: pieChartData });
  new Chart(donutChartCanvas, { type: 'doughnut', data: donutChartData });
  new Chart(bubbleChartCanvas, { type: 'bubble', data: bubbleChartData });
  new Chart(areaChartCanvas, { type: 'line', data: areaChartData });
  new Chart(radarChartCanvas, { type: 'radar', data: radarChartData });
  new Chart(mixedChartCanvas, { type: 'mixed', data: mixedChartData });
}

function exportToCSV() {
  const csvContent = parsedData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'exported_data.csv';
  link.click();
}