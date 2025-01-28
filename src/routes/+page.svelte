
<script>
  export let data;
  let activeTab = 'all';
  
  $: uniqueStates = [...new Set(data.data.map(city => city.state))].filter(Boolean);
  $: uniqueCountries = [...new Set(data.data.map(city => city.country))].filter(Boolean);
  $: selectedState = '';
  $: selectedCountry = '';
  
  $: aggregatedData = data.data.reduce((acc, item) => {
    if (activeTab === 'state') {
      const key = item.state;
      if (!acc[key]) {
        acc[key] = {
          state: item.state,
          station_count: 0,
          median_temperature: 0,
          count: 0
        };
      }
      acc[key].station_count += item.station_count;
      acc[key].median_temperature += item.median_temperature;
      acc[key].count++;
    } else if (activeTab === 'country') {
      const key = item.country;
      if (!acc[key]) {
        acc[key] = {
          country: item.country,
          station_count: 0,
          median_temperature: 0,
          count: 0
        };
      }
      acc[key].station_count += item.station_count;
      acc[key].median_temperature += item.median_temperature;
      acc[key].count++;
    } else {
      acc[item.city] = item;
    }
    return acc;
  }, {});

  $: filteredData = activeTab === 'all' ? data.data : Object.values(aggregatedData);
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
      
      <div class="tabs tabs-boxed mt-4">
        <button class="tab {activeTab === 'all' ? 'tab-active' : ''}" 
          on:click={() => activeTab = 'all'}>All Cities</button>
        <button class="tab {activeTab === 'state' ? 'tab-active' : ''}" 
          on:click={() => activeTab = 'state'}>By State</button>
        <button class="tab {activeTab === 'country' ? 'tab-active' : ''}" 
          on:click={() => activeTab = 'country'}>By Country</button>
      </div>
      
      {#if activeTab === 'state'}
        <select class="select select-bordered w-full max-w-xs mt-4" bind:value={selectedState}>
          {#each uniqueStates as state}
            <option value={state}>{state}</option>
          {/each}
        </select>
      {/if}
      
      {#if activeTab === 'country'}
        <select class="select select-bordered w-full max-w-xs mt-4" bind:value={selectedCountry}>
          {#each uniqueCountries as country}
            <option value={country}>{country}</option>
          {/each}
        </select>
      {/if}
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th class="text-primary">Rank</th>
              <th class="text-primary">City</th>
              <th class="text-primary">Station Count</th>
              <th class="text-primary">Median Temperature</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredData as city, i}
              <tr class="hover">
                <td class="font-semibold">#{i + 1}</td>
                <td class="font-medium">
                  {#if activeTab === 'all'}
                    <a href="/{city.city}" class="link link-primary">{city.city}</a>
                  {:else if activeTab === 'state'}
                    <span>{city.state || 'Unknown State'}</span>
                  {:else}
                    <span>{city.country || 'Unknown Country'}</span>
                  {/if}
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
