
<script>
  import { Line } from 'svelte-chartjs';
  import 'chartjs-adapter-date-fns';
  import { temperatureUnit } from '$lib/stores';
  import { goto } from '$app/navigation';

  export let data;

  function handleTimescaleChange(event) {
    const timescale = event.target.value;
    goto(`?timescale=${timescale}`);
  }

  $: chartData = {
    labels: data.data.map(d => new Date(d.observation_timestamp)),
    datasets: [{
      label: `Temperature (°${$temperatureUnit})`,
      data: data.data.map(d => $temperatureUnit === 'C' ? d.temperature : (d.temperature * 9/5) + 32),
      borderColor: 'rgb(255, 99, 132)',
      tension: 0.1
    }]
  };

  $: options = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour'
        }
      }
    }
  };
</script>

<div class="min-h-screen bg-base-200 p-4">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-4xl font-bold text-primary mb-4">Temperature History for {data.state}</h1>
    <div class="mb-4">
      <select 
        class="select select-bordered w-full max-w-xs" 
        value={data.timescale} 
        on:change={handleTimescaleChange}
      >
        <option value="hourly">Hourly</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
    </div>
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <Line data={chartData} options={options} />
      </div>
    </div>
  </div>
</div>
