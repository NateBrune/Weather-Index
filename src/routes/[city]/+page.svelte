
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
  let selectedTimescale = 'daily';

  async function handleTimescaleChange(timescale) {
    selectedTimescale = timescale;
    const response = await fetch(`/api/weather-cities/${data.city}?timescale=${timescale}`);
    const newData = await response.json();
    data.data = newData;
  }
  
  $: chartData = {
    labels: [...data.data].reverse().map(d => new Date(d.observation_timestamp).toLocaleString()),
    datasets: [{
      label: 'Temperature (°C)',
      data: [...data.data].reverse().map(d => d.temperature),
      borderColor: 'rgb(255, 99, 132)',
      tension: 0.4,
      cubicInterpolationMode: 'monotone',
      borderWidth: 2
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
        text: `Temperature History for ${data.city}`
      }
    }
  };
</script>

<div class="min-h-screen bg-base-200 p-4">
  <div class="max-w-4xl mx-auto">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title text-primary">{data.city} Temperature History</h2>
          <div class="join shadow-lg">
            <button 
              class="join-item btn btn-sm {selectedTimescale === 'daily' ? 'btn-primary' : 'btn-ghost'} hover:btn-primary transition-colors"
              on:click={() => handleTimescaleChange('daily')}>
              Daily
            </button>
            <button 
              class="join-item btn btn-sm {selectedTimescale === 'weekly' ? 'btn-primary' : 'btn-ghost'} hover:btn-primary transition-colors"
              on:click={() => handleTimescaleChange('weekly')}>
              Weekly
            </button>
            <button 
              class="join-item btn btn-sm {selectedTimescale === 'monthly' ? 'btn-primary' : 'btn-ghost'} hover:btn-primary transition-colors"
              on:click={() => handleTimescaleChange('monthly')}>
              Monthly
            </button>
            <button 
              class="join-item btn btn-sm {selectedTimescale === 'yearly' ? 'btn-primary' : 'btn-ghost'} hover:btn-primary transition-colors"
              on:click={() => handleTimescaleChange('yearly')}>
              Yearly
            </button>
          </div>
        </div>
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
