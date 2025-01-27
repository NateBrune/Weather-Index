<script>
  export let data = []; // Initialize data as an empty array
  import { onMount } from 'svelte';

  onMount(async () => {
    const html = document.querySelector('html');
    html.setAttribute('data-theme', 'light');

    //Simulate fetching data
    const response = await fetch('/api/city-weather'); // Replace with your actual API endpoint
    data = await response.json();
  });

  function toggleTheme() {
    const html = document.querySelector('html');
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
  }
</script>

<svelte:head>
  <title>City Weather Statistics</title>
  <meta name="description" content="Weather statistics by city" />
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
  <script src="https://cdn.tailwindcss.com"></script>
</svelte:head>

<div class="min-h-screen bg-base-200 p-4">
  <div class="max-w-4xl mx-auto">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-bold text-primary">City Weather Statistics</h1>
      <button class="btn btn-circle" on:click={toggleTheme}>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th class="text-primary">City</th>
              <th class="text-primary">Station Count</th>
              <th class="text-primary">Average Temperature</th>
              <th class="text-primary">24h Change</th>
            </tr>
          </thead>
          <tbody>
            {#each data as city}
              <tr class="hover">
                <td class="font-medium">{city.city}</td>
                <td class="text-center">
                  <div class="badge badge-info">{city.station_count}</div>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="text-error">{city.avg_temperature}°C</span>
                    <progress 
                      class="progress progress-error w-20" 
                      value={Math.max(0, Math.min(40, parseFloat(city.avg_temperature) + 20 || 0))} 
                      max="40"
                    ></progress>
                  </div>
                </td>
                <td class="text-{city.temperature_change_24h > 0 ? 'error' : 'success'}">
                  {city.temperature_change_24h > 0 ? '+' : ''}{city.temperature_change_24h}°C
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>