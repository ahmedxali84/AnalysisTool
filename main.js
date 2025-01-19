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
      displayTable(parsedData); // Initial display of the entire table
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
  limitedData[0].forEach((header) => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  dataTable.appendChild(headerRow);

  limitedData.slice(1).forEach((row) => {
    const tr = document.createElement('tr');
    row.forEach((cell) => {
      const td = document.createElement('td');
      td.textContent = cell;
      tr.appendChild(td);
    });
    dataTable.appendChild(tr);
  });
}

// Process operation based on user selection
function processOperation() {
  const operation = operationSelect.value;
  if (!operation) {
    alert('Please select an operation.');
    return;
  }

  const rowLimit = parseInt(rowLimitInput.value, 10) || parsedData.length;
  const limitedData = parsedData.slice(0, rowLimit);
  const headers = limitedData[0]; // First row as headers

  if (operation === 'cleaning') {
    const cleanedData = cleanData(limitedData);
    displayTable(cleanedData);
    output.textContent = 'Data cleaned successfully!';
    renderCharts(cleanedData);
  } else if (operation === 'descriptive') {
    const stats = getDescriptiveStats(limitedData);
    output.innerHTML = formatDescriptiveStats(stats);
    renderCharts(limitedData);
  } else if (operation === 'regression') {
    const xColumnName = prompt(`Enter the column name for the independent variable (X): \nAvailable columns: ${headers.join(', ')}`);
    const yColumnName = prompt(`Enter the column name for the dependent variable (Y): \nAvailable columns: ${headers.join(', ')}`);

    try {
      const regressionResult = calculateLinearRegressionForColumnsByName(limitedData, headers, xColumnName, yColumnName);
      output.innerHTML = regressionResult;
      renderCharts(regressionResult.validData, regressionResult);
    } catch (error) {
      alert(error.message);
    }
  } else if (operation === 'correlation') {
    const xColumnName = prompt(`Enter the column name for the first variable: \nAvailable columns: ${headers.join(', ')}`);
    const yColumnName = prompt(`Enter the column name for the second variable: \nAvailable columns: ${headers.join(', ')}`);

    try {
      // Ensure that xColumnName and yColumnName are valid column names
      console.log('xColumnName:', xColumnName);
      console.log('yColumnName:', yColumnName);
  
      // Check that the headers array contains the column names
      console.log('Headers:', headers);
      
      // Call the function to calculate correlation
      const correlation = calculateCorrelationForColumns(limitedData, headers, xColumnName, yColumnName);
      
      // Display the correlation result
      output.innerHTML = `Correlation: ${correlation.toFixed(2)}`;
      
      // Render charts with the data
      renderCharts(limitedData);
  
  } catch (error) {
      // Log the error message to the console for more detailed debugging
      console.error('Error occurred:', error);
      
      // Show an alert with the error message
      alert(error.message);
  }
  
  } else if (operation === 'normalize') {
    const normalizedData = normalizeData(limitedData);
    displayTable(normalizedData);
    output.textContent = 'Data normalized successfully!';
    renderCharts(normalizedData);
  } else if (operation === 'transform') {
    const columnToTransform = prompt(`Enter the column name to apply transformation (log/sqrt): \nAvailable columns: ${headers.join(', ')}`);
    const transformedData = transformData(limitedData, columnToTransform);
    displayTable(transformedData);
    output.textContent = `Data transformed successfully (log/sqrt applied to ${columnToTransform})!`;
    renderCharts(transformedData);
  } else if (operation === 'outlier') {
    const outlierData = detectOutliers(limitedData);
    displayTable(outlierData);
    output.textContent = 'Outlier detection complete!';
    renderCharts(outlierData);
  } else if (operation === 'clustering') {
    const k = parseInt(prompt('Enter the number of clusters (K):'), 10);
    const clusteredData = applyKMeansClustering(limitedData, k);
    displayTable(clusteredData);
    output.textContent = `Clustering completed with ${k} clusters!`;
    renderCharts(clusteredData);
  }
}

// Data Cleaning
function cleanData(data) {
  return data.filter(row => row.every(cell => cell !== ''));
}

// Descriptive Stats
function getDescriptiveStats(data) {
  const numericData = data.slice(1).map(row => row.filter(cell => typeof cell === 'number' && !isNaN(cell)));
  const stats = numericData.map(col => {
    const mean = col.reduce((a, b) => a + b, 0) / col.length;
    const variance = col.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / col.length;
    const stdDev = Math.sqrt(variance);
    return { mean, variance, stdDev };
  });
  return stats;
}

// Format Descriptive Stats
function formatDescriptiveStats(stats) {
  return stats.map(stat => `
    <p>Mean: ${stat.mean.toFixed(2)}, Variance: ${stat.variance.toFixed(2)}, Std Dev: ${stat.stdDev.toFixed(2)}</p>
  `).join('');
}

// Normalize Data (Min-Max)
function normalizeData(data) {
  const numericColumns = data[0].map((_, colIndex) => data.slice(1).map(row => row[colIndex]).filter(cell => typeof cell === 'number'));
  const minMax = numericColumns.map(col => {
    const min = Math.min(...col);
    const max = Math.max(...col);
    return { min, max };
  });
  return data.map((row, rowIndex) => row.map((cell, colIndex) => {
    if (typeof cell === 'number') {
      const { min, max } = minMax[colIndex];
      return (cell - min) / (max - min);
    }
    return cell;
  }));
}

// Transform Data (Log)
function transformData(data, columnName) {
  const columnIndex = data[0].indexOf(columnName);
  return data.map(row => {
    const transformedValue = Math.log(row[columnIndex]);
    row[columnIndex] = transformedValue;
    return row;
  });
}

// Outlier Detection
function detectOutliers(data) {
  const colIndex = data[0].length - 1; // Last column for simplicity
  const values = data.slice(1).map(row => row[colIndex]);
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  return data.filter(row => row[colIndex] >= lowerFence && row[colIndex] <= upperFence);
}

// Calculate Quantile
function quantile(arr, q) {
  arr.sort((a, b) => a - b);
  const pos = (arr.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return arr[base] + rest * (arr[base + 1] - arr[base]);
}

// K-Means Clustering
function applyKMeansClustering(data, k) {
  const centroids = initializeCentroids(data, k);
  let prevCentroids;
  let clusters;
  let iterations = 0;
  do {
    prevCentroids = centroids;
    clusters = assignPointsToClusters(data, centroids);
    centroids = updateCentroids(clusters);
    iterations++;
  } while (!centroidsEqual(prevCentroids, centroids) && iterations < 10);
  return clusters;
}

// Initialize Centroids
function initializeCentroids(data, k) {
  return Array.from({ length: k }, () => data[Math.floor(Math.random() * data.length)]);
}

// Assign points to clusters
function assignPointsToClusters(data, centroids) {
  return data.map((point) => {
    const distances = centroids.map((centroid) => distance(point, centroid));
    const closestCentroidIndex = distances.indexOf(Math.min(...distances));
    return { point, cluster: closestCentroidIndex };
  });
}

// Euclidean distance
function distance(a, b) {
  return Math.sqrt(a.reduce((sum, value, index) => sum + Math.pow(value - b[index], 2), 0));
}

// Update Centroids
function updateCentroids(clusters) {
  const k = Math.max(...clusters.map((cluster) => cluster.cluster)) + 1;
  const newCentroids = [];
  for (let i = 0; i < k; i++) {
    const clusterPoints = clusters.filter(cluster => cluster.cluster === i).map(cluster => cluster.point);
    const newCentroid = clusterPoints[0].map((_, colIndex) => clusterPoints.reduce((sum, point) => sum + point[colIndex], 0) / clusterPoints.length);
    newCentroids.push(newCentroid);
  }
  return newCentroids;
}

// Check if centroids are equal
function centroidsEqual(centroids1, centroids2) {
  return centroids1.every((centroid, index) => centroid.every((value, valueIndex) => value === centroids2[index][valueIndex]));
}

// Render charts
function renderCharts(data) {
  new Chart(scatterChartCanvas, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Scatter Plot',
        data: data.slice(1).map(row => ({ x: row[0], y: row[1] })),
      }],
    },
  });

  new Chart(histogramChartCanvas, {
    type: 'bar',
    data: {
      labels: data.slice(1).map(row => row[0]),
      datasets: [{
        label: 'Histogram',
        data: data.slice(1).map(row => row[1]),
      }],
    },
  });

  new Chart(pieChartCanvas, {
    type: 'pie',
    data: {
      labels: ['Label 1', 'Label 2', 'Label 3'],
      datasets: [{
        data: [10, 20, 30],
      }],
    },
  });

  new Chart(lineChartCanvas, {
    type: 'line',
    data: {
      labels: data.slice(1).map(row => row[0]),
      datasets: [{
        label: 'Line Chart',
        data: data.slice(1).map(row => row[1]),
      }],
    },
  });
}

// Export Data to CSV
function exportToCSV() {
  const csv = parsedData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'processed_data.csv';
  a.click();
}
