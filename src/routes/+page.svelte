<script>
  export let data;
  import { goto } from "$app/navigation";

  const tabs = [
    { id: "city", label: "Cities" },
    { id: "state", label: "States" },
    { id: "country", label: "Countries" },
  ];

  function changeTab(tabId) {
    goto(`?groupBy=${tabId}`);
  }
</script>

<div class="min-h-screen bg-base-200 p-4">
  <div class="max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-primary">Weather Statistics</h1>
    </div>

    <div class="tabs tabs-boxed mb-4">
      {#each tabs as tab}
        <button
          class="tab {data.activeTab === tab.id ? 'tab-active' : ''}"
          on:click={() => changeTab(tab.id)}
        >
          {tab.label}
        </button>
      {/each}
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th class="text-primary">Rank</th>
              <th class="text-primary">
                {data.activeTab === "city"
                  ? "City"
                  : data.activeTab === "state"
                    ? "State"
                    : "Country"}
              </th>
              <th class="text-primary">Station Count</th>
              <th class="text-primary">Median Temperature</th>
              <th class="text-primary">Weather</th>
            </tr>
          </thead>
          <tbody>
            {#each data.data as item, i}
              <tr class="hover">
                <td class="font-semibold">#{i + 1}</td>
                <td class="font-medium">
                  {#if data.activeTab === "city"}
                    <a href="/{item.location_name}" class="link link-primary">
                      {item.location_name}
                    </a>
                  {:else}
                    {item.location_name}
                  {/if}
                </td>
                <td class="text-center">
                  <div class="badge badge-info">{item.station_count}</div>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="text-error">{item.median_temperature}°C</span>
                    <progress
                      class="progress progress-error w-20"
                      value={Math.max(
                        0,
                        Math.min(
                          40,
                          parseFloat(item.median_temperature) + 20 || 0,
                        ),
                      )}
                      max="40"
                    ></progress>
                  </div>
                </td>
                <td>
                  {#if item.weather_icon}
                    <img
                      src="icons/{item.weather_icon}.svg"
                      alt={item.weather_icon}
                      class="w-8 h-8"
                    />
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
