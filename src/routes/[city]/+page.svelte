
<script>
  import { Line } from 'svelte-chartjs';
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    CategoryScale,
    PointElement
  } from 'chart.js';
  
  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    CategoryScale,
    PointElement
  );
  
  export let data;
  export let city;
  
  $: chartData = {
    labels: data.map(d => new Date(d.observation_timestamp).toLocaleString()),
    datasets: [{
      label: 'Temperature (°C)',
      data: data.map(d => d.temperature),
      borderColor: 'rgb(255, 99, 132)',
      tension: 0.1
    }]
  };
  
  $: chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Temperature History for ${city}`
      }
    }
  };
</script>

<div class="min-h-screen bg-base-200 p-4">
  <div class="max-w-4xl mx-auto">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-primary">{city} Temperature History</h2>
        <div class="w-full h-[60vh]">
          <Line data={chartData} options={chartOptions} />
        </div>
        <div class="card-actions justify-end">
          <a href="/" class="btn btn-primary">Back to Cities</a>
        </div>
      </div>
    </div>
  </div>
</div>
