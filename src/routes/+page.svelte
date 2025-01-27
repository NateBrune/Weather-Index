<script>
  export let data;
</script>

<svelte:head>
  <title>City Weather Statistics</title>
  <meta name="description" content="Weather statistics by city" />
  <link
    href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css"
    rel="stylesheet"
    type="text/css"
  />
  <script src="https://cdn.tailwindcss.com"></script>
</svelte:head>

<div class="min-h-screen bg-base-200 p-4">
  <div class="max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-primary">City Weather Statistics</h1>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th class="text-primary">City</th>
              <th class="text-primary">Station Count</th>
              <th class="text-primary">Median Temperature</th>
            </tr>
          </thead>
          <tbody>
            {#each data.data as city}
              <tr class="hover">
                <td class="font-medium">
                  <a href="/{city.city}" class="link link-primary"
                    >{city.city}</a
                  >
                </td>
                <td class="text-center">
                  <div class="badge badge-info">{city.station_count}</div>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="text-error">{city.median_temperature}°C</span>
                    <progress
                      class="progress progress-error w-20"
                      value={Math.max(
                        0,
                        Math.min(
                          40,
                          parseFloat(city.median_temperature) + 20 || 0,
                        ),
                      )}
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
