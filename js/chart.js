function renderDashboardChart(monthlyBorrows, monthlyReturns) {
  const canvas = document.getElementById('statsChart'); // Using your original canvas ID
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // 1. Destroy old chart instance to allow clean redrawing
  if(window.dashChart) { 
    window.dashChart.destroy(); 
  }

  // 2. Theme detection matching your setup
  const isDark = localStorage.getItem('theme') === 'dark';
  const textColor = isDark ? '#e6e6f5' : '#333333';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

  // 3. Create Grouped Bar Chart
  window.dashChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Borrow',
          data: monthlyBorrows,
          backgroundColor: '#d2d6de', // Light gray/silver bar
          borderColor: '#b5bbc8',
          borderWidth: 1,
          barPercentage: 0.8,
          categoryPercentage: 0.5
        },
        {
          label: 'Return',
          data: monthlyReturns,
          backgroundColor: '#00a65a', // Vibrant green bar
          borderColor: '#008d4c',
          borderWidth: 1,
          barPercentage: 0.8,
          categoryPercentage: 0.5
        }
      ]
    },
    // Inside your new Chart(ctx, { ... options: { ... } }) configuration block
    options: {
      responsive: true,
      maintainAspectRatio: false, // <--- CRITICAL: Forces chart engine to fit your 320px height rule
      scales: {
        y: {
          beginAtZero: true,
          ticks: { 
            color: textColor,
            stepSize: 1 // Keeps scale lines ticking uniformly by integers
          },
          grid: { color: gridColor }
        },
        x: {
          ticks: { color: textColor },
          grid: { display: false }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: textColor }
        }
      }
    }
  });
}