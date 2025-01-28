<script>
  export let data;
  import { temperatureUnit } from "$lib/stores";
  import { goto } from "$app/navigation";

  const tabs = [
    { id: "city", label: "Cities" },
    { id: "state", label: "States" },
    { id: "country", label: "Countries" },
  ];

  let searchQuery = "";
  let sortBy = "station_count"; // Default sort
  let sortOrder = "desc"; // Default order

  function changeTab(tabId) {
    goto(`?groupBy=${tabId}`);
  }

  $: filteredData = data.data
    .filter((item) =>
      item.location_name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      const modifier = sortOrder === "desc" ? -1 : 1;
      if (sortBy === "temperature") {
        const tempA =
          $temperatureUnit === "C"
            ? a.median_temperature
            : (a.median_temperature * 9) / 5 + 32;
        const tempB =
          $temperatureUnit === "C"
            ? b.median_temperature
            : (b.median_temperature * 9) / 5 + 32;
        return (tempA - tempB) * modifier;
      } else if (sortBy === "wind_speed") {
        return (a.median_wind_speed - b.median_wind_speed) * modifier;
      } else if (sortBy === "temp_change") {
        const changeA = a.temp_change_24h || 0;
        const changeB = b.temp_change_24h || 0;
        return (changeA - changeB) * modifier;
      }
      return (a[sortBy] - b[sortBy]) * modifier;
    });

  function toggleSort(field) {
    if (sortBy === field) {
      sortOrder = sortOrder === "desc" ? "asc" : "desc";
    } else {
      sortBy = field;
      sortOrder = "desc";
    }
  }
</script>

<div class="min-h-screen bg-base-200 pt-20 px-4 pb-8">
  <div class="max-w-4xl mx-auto backdrop-blur-sm">
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-primary">Weather Statistics</h1>
      <div class="grid grid-cols-2 gap-4">
        <h3 class="text-1xl font-bold text-info">Powered By WeatherXM 🛰️</h3>
        <h3 class="text-1xl font-bold text-info text-right">Made with Replit ❤️</h3>
      </div>
    </div>

    <div class="flex flex-col gap-4 mb-4">
      <div class="tabs tabs-boxed">
        {#each tabs as tab}
          <button
            class="tab {data.activeTab === tab.id ? 'tab-active' : ''}"
            on:click={() => changeTab(tab.id)}
          >
            {tab.label}
          </button>
        {/each}
      </div>

      <input
        type="text"
        placeholder="Search locations..."
        class="input input-bordered w-full"
        bind:value={searchQuery}
      />
    </div>

    <div
      class="card bg-base-100/80 shadow-2xl backdrop-blur-sm border border-base-300/50"
    >
      <div class="card-body overflow-x-auto px-2 sm:px-6">
        <table class="table table-zebra bg-transparent">
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
              <th
                class="text-primary cursor-pointer"
                on:click={() => toggleSort("station_count")}
              >
                Station Count
                {#if sortBy === "station_count"}
                  <span>{sortOrder === "desc" ? "↓" : "↑"}</span>
                {/if}
              </th>
              <th
                class="text-primary cursor-pointer"
                on:click={() => toggleSort("wind_speed")}
              >
                Wind Speed
                {#if sortBy === "wind_speed"}
                  <span>{sortOrder === "desc" ? "↓" : "↑"}</span>
                {/if}
              </th>
              <th
                class="text-primary cursor-pointer"
                on:click={() => toggleSort("temperature")}
              >
                Median Temperature
                {#if sortBy === "temperature"}
                  <span>{sortOrder === "desc" ? "↓" : "↑"}</span>
                {/if}
              </th>
              <th
                class="text-primary cursor-pointer"
                on:click={() => toggleSort("temp_change")}
              >
                24h Change
                {#if sortBy === "temp_change"}
                  <span>{sortOrder === "desc" ? "↓" : "↑"}</span>
                {/if}
              </th>
              <th class="text-primary">Weather</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredData as item, i}
              <tr class="hover">
                <td class="font-semibold">#{i + 1}</td>
                <td class="font-medium">
                  {#if data.activeTab === "city"}
                    <a href="/{item.location_name}" class="link link-primary">
                      {item.location_name}
                    </a>
                  {:else if data.activeTab === "state"}
                    <a
                      href="/state/{item.location_name}"
                      class="link link-primary"
                    >
                      {item.location_name}
                    </a>
                  {:else}
                    <a
                      href="/country/{item.location_name}"
                      class="link link-primary"
                    >
                      {item.location_name}
                    </a>
                  {/if}
                </td>
                <td class="text-center">
                  <div class="badge badge-info">{item.station_count}</div>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span>{(item.median_wind_speed || 0).toFixed(1)} m/s</span>
                  </div>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="text-error">
                      {$temperatureUnit === "C"
                        ? item.median_temperature
                        : ((item.median_temperature * 9) / 5 + 32).toFixed(
                            1,
                          )}°{$temperatureUnit}
                    </span>
                    {#if item.sparkline_data}
                      <svg
                        class="w-20 h-8"
                        viewBox="0 0 80 32"
                        preserveAspectRatio="none"
                      >
                        {#if item.sparkline_data.length > 1}
                          {@const temperatures = item.sparkline_data.map(
                            (d) => d.temperature,
                          )}
                          {@const min = Math.min(...temperatures)}
                          {@const max = Math.max(...temperatures)}
                          {@const range = max - min}
                          {@const points = item.sparkline_data
                            .map(
                              (d, i) =>
                                `${(i * 80) / (item.sparkline_data.length - 1)},${32 - ((d.temperature - min) * 32) / (range || 1)}`,
                            )
                            .join(" ")}
                          <polyline
                            {points}
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            class={item.temp_change_24h > 0
                              ? "text-error"
                              : "text-info"}
                          />
                        {/if}
                      </svg>
                    {:else}
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
                    {/if}
                  </div>
                </td>
                <td>
                  {#if item.temp_change_24h !== null}
                    <span
                      class="font-medium {item.temp_change_24h > 0
                        ? 'text-error'
                        : item.temp_change_24h < 0
                          ? 'text-info'
                          : 'text-base-content'}"
                    >
                      {item.temp_change_24h > 0 ? "+" : ""}{$temperatureUnit ===
                      "C"
                        ? item.temp_change_24h
                        : ((item.temp_change_24h * 9) / 5).toFixed(
                            1,
                          )}°{$temperatureUnit}
                    </span>
                  {/if}
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
