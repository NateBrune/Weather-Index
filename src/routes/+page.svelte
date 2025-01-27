
<script>
  export let data;
</script>

<svelte:head>
  <title>City Weather Statistics</title>
  <meta name="description" content="Weather statistics by city" />
</svelte:head>

<div class="min-h-screen bg-base-200 p-4">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-4xl font-bold text-center mb-8 text-primary">City Weather Statistics</h1>
    
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th class="text-primary">City</th>
              <th class="text-primary">Station Count</th>
              <th class="text-primary">Average Temperature</th>
            </tr>
          </thead>
          <tbody>
            {#each data.data as city}
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
                      value={parseFloat(city.avg_temperature) + 20} 
                      max="40"
                    ></progress>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<style>
  @import 'tailwindcss/base';
  @import 'tailwindcss/components';
  @import 'tailwindcss/utilities';
</style>
