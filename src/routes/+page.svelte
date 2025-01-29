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
  let currentPage = 1;
  let itemsPerPage = 100;

  const itemsPerPageOptions = [50, 100, 200, 500];

  function changeTab(tabId) {
    goto(`?groupBy=${tabId}`);
  }

  $: stationCountRanks = data.data
    .sort((a, b) => b.station_count - a.station_count)
    .reduce((acc, item, index) => {
      acc[item.location_name] = index + 1;
      return acc;
    }, {});

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
      } else if (sortBy === "temp_change_1h") {
        const changeA = a.sparkline_data
          ? parseFloat(
              calculateTempChange(a.sparkline_data, 1).replace("°", ""),
            ) || 0
          : 0;
        const changeB = b.sparkline_data
          ? parseFloat(
              calculateTempChange(b.sparkline_data, 1).replace("°", ""),
            ) || 0
          : 0;
        return (changeA - changeB) * modifier;
      } else if (sortBy === "temp_change_24h") {
        const changeA = a.sparkline_data
          ? parseFloat(calculateTempChange(a.sparkline_data, 24)) || 0
          : 0;
        const changeB = b.sparkline_data
          ? parseFloat(calculateTempChange(b.sparkline_data, 24)) || 0
          : 0;
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

  function formatTemperature(temp, unit) {
    if (temp == null || isNaN(temp)) return "N/A";
    const numTemp = Number(temp);
    return unit === "C"
      ? numTemp.toFixed(1)
      : ((numTemp * 9) / 5 + 32).toFixed(1);
  }

  function calculateTempChange(sparklineData, hours = 24) {
    if (!sparklineData || sparklineData.length < 2) return "N/A";
    const lastTemp = sparklineData[sparklineData.length - 1].temperature;
    const lastTimestamp = new Date(
      sparklineData[sparklineData.length - 1].timestamp,
    );

    if (hours === 1) {
      // For 1 hour change, look for data point closest to 1 hour ago
      const oneHourAgo = new Date(lastTimestamp.getTime() - 3600000);
      const hourAgoIndex = sparklineData.reduce((closest, point, index) => {
        const pointTime = new Date(point.timestamp);
        const currentDiff = Math.abs(pointTime - oneHourAgo);
        const closestDiff = Math.abs(
          new Date(sparklineData[closest].timestamp) - oneHourAgo,
        );
        return currentDiff < closestDiff ? index : closest;
      }, 0);
      const change = lastTemp - sparklineData[hourAgoIndex].temperature;
      const convertedChange =
        $temperatureUnit === "C" ? change : (change * 9) / 5;
      const sign = convertedChange > 0 ? "+" : "";
      return `${sign}${convertedChange.toFixed(1)}°${$temperatureUnit}`;
    } else {
      // For 24 hour change, use the oldest available data point
      const change = lastTemp - sparklineData[0].temperature;
      const convertedChange =
        $temperatureUnit === "C" ? change : (change * 9) / 5;
      const sign = convertedChange > 0 ? "+" : "";
      return `${sign}${convertedChange.toFixed(1)}°${$temperatureUnit}`;
    }
  }
</script>

<div class="min-h-screen bg-base-200 pt-20 px-4 pb-8">
  <div class="max-w-6xl mx-auto backdrop-blur-sm">
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-primary">Weather Statistics</h1>
      <div class="grid grid-cols-2 gap-4">
        <h3 class="text-1xl font-bold text-secondary">
          Powered By WeatherXM 🌦️
        </h3>
        <h3 class="text-1xl font-bold text-accent text-right">
          Made with Replit ❤️
        </h3>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div class="card bg-base-100 text-neutral-content shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl">Global Station Count</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col justify-center">
              <div class="flex flex-col">
                <a
                  href="/stations"
                  class="text-4xl font-bold hover:text-primary transition-colors"
                >
                  {data.networkStats?.station_count?.toLocaleString() ?? 0}
                </a>
                {#if data.networkStats?.station_count_history}
                  {@const firstCount = data.networkStats.station_count_history[0].count}
                  {@const lastCount = data.networkStats.station_count_history[data.networkStats.station_count_history.length - 1].count}
                  {@const change = lastCount - firstCount}
                  <p
                    class="text-lg mt-2 {change > 0
                      ? 'text-error'
                      : change < 0
                        ? 'text-info'
                        : 'text-base-content'}"
                  >
                    {change > 0 ? "+" : ""}{change} / 24h
                  </p>
                {/if}
              </div>
            </div>
            {#if data.networkStats?.station_count_history}
              {@const historicalData = data.networkStats.station_count_history.slice(0, -1)}
              {@const counts = historicalData.map((d) => d.count)}
              {@const min = Math.min(...counts)}
              {@const max = Math.max(...counts)}
              {@const range = max - min || 1}
              {@const points = historicalData
                .map(
                  (d, i) =>
                    `${(i * 120) / (historicalData.length - 1)},${48 - ((d.count - min) * 48) / range}`,
                )
                .join(" ")}
              <svg
                class="w-full h-24"
                viewBox="0 0 200 96"
                preserveAspectRatio="none"
              >
                <polyline
                  {points}
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="text-primary"
                />
              </svg>
            {/if}
          </div>
        </div>
      </div>
      <div class="card bg-base-100 text-neutral-content shadow-xl">
        <div class="card-body p-4 md:p-6">
          <a href="https://docs.weatherxm.com/rewards/quality-of-data" target="_blank" rel="noopener noreferrer" class="hover:opacity-80">
            <h2 class="card-title text-xl md:text-2xl">Network Data Quality</h2>
            <div class="flex flex-col gap-2">
              <div class="text-2xl md:text-4xl font-bold">
                {data.networkStats.avg_quality_percentage}%
              </div>
              <div class="text-xs md:text-sm opacity-70">
                {data.networkStats.high_quality_stations} high quality stations
              </div>
            <progress
              class="progress progress-success"
              value={data.networkStats.high_quality_stations}
              max={data.networkStats.station_count}
            ></progress>
          </div>
          </a>
        </div>
      </div>
      <div class="card bg-base-100 text-neutral-content shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl">Network Median Temperature</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col justify-center">
              <p class="text-4xl font-bold">
                {formatTemperature(
                  data.networkStats?.median_temperature,
                  $temperatureUnit,
                )}°{$temperatureUnit}
              </p>
              {#if data.networkStats?.sparkline_data}
                {@const firstTemp =
                  data.networkStats.sparkline_data[0].temperature}
                {@const lastTemp =
                  data.networkStats.sparkline_data[
                    data.networkStats.sparkline_data.length - 1
                  ].temperature}
                {@const change = lastTemp - firstTemp}
                <p
                  class="text-lg mt-2 {change > 0
                    ? 'text-error'
                    : change < 0
                      ? 'text-info'
                      : 'text-base-content'}"
                >
                  {change > 0 ? "+" : ""}{$temperatureUnit === "C"
                    ? change.toFixed(1)
                    : ((change * 9) / 5).toFixed(1)}°{$temperatureUnit} / 24h
                </p>
              {/if}
            </div>
            {#if data.networkStats?.sparkline_data}
              {#each [data.networkStats.sparkline_data] as sparkline}
                {@const temperatures = sparkline.map((d) => d.temperature)}
                {@const min = Math.min(...temperatures)}
                {@const max = Math.max(...temperatures)}
                {@const range = max - min}
                {@const points = sparkline
                  .map(
                    (d, i) =>
                      `${(i * 120) / (sparkline.length - 1)},${48 - ((d.temperature - min) * 48) / (range || 1)}`,
                  )
                  .join(" ")}
                <svg
                  class="w-full h-24"
                  viewBox="0 0 200 96"
                  preserveAspectRatio="none"
                >
                  <polyline
                    {points}
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class={data.data[0]?.temp_change_24h > 0
                      ? "text-error"
                      : "text-info"}
                  />
                </svg>
              {/each}
            {/if}
          </div>
        </div>
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

      <div class="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search locations..."
          class="input input-bordered flex-grow"
          bind:value={searchQuery}
        />
        <select
          class="select select-bordered w-full max-w-xs"
          bind:value={itemsPerPage}
        >
          {#each itemsPerPageOptions as option}
            <option value={option}>{option} per page</option>
          {/each}
        </select>
      </div>
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
                Median °
                {#if sortBy === "temperature"}
                  <span>{sortOrder === "desc" ? "↓" : "↑"}</span>
                {/if}
              </th>
              <th
                class="text-primary cursor-pointer"
                on:click={() => toggleSort("temp_change_1h")}
              >
                1h Change
                {#if sortBy === "temp_change_1h"}
                  <span>{sortOrder === "desc" ? "↓" : "↑"}</span>
                {/if}
              </th>
              <th
                class="text-primary cursor-pointer"
                on:click={() => toggleSort("temp_change_24h")}
              >
                24h Change
                {#if sortBy === "temp_change_24h"}
                  <span>{sortOrder === "desc" ? "↓" : "↑"}</span>
                {/if}
              </th>
              <th class="text-primary">Sparkline</th>
              <th class="text-primary">Weather</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) as item, i}
              <tr class="hover">
                <td class="font-semibold"
                  >#{stationCountRanks[item.location_name]}</td
                >
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
                    <span class="neutral-content">
                      {formatTemperature(
                        item.median_temperature,
                        $temperatureUnit,
                      )}°{$temperatureUnit}
                    </span>
                  </div>
                </td>
                <td>
                  {#if true}
                    {@const oneHourChange = calculateTempChange(
                      item.sparkline_data,
                      1,
                    )}
                    <span
                      class="font-medium {oneHourChange !== 'N/A' &&
                      parseFloat(oneHourChange) > 0
                        ? 'text-error'
                        : oneHourChange !== 'N/A' &&
                            parseFloat(oneHourChange) < 0
                          ? 'text-info'
                          : 'text-base-content'}"
                    >
                      {oneHourChange}
                    </span>
                  {/if}
                </td>
                <td>
                  {#if true}
                    {@const dayChange = calculateTempChange(
                      item.sparkline_data,
                      24,
                    )}
                    <span
                      class="font-medium {dayChange !== 'N/A' &&
                      parseFloat(dayChange) > 0
                        ? 'text-error'
                        : dayChange !== 'N/A' && parseFloat(dayChange) < 0
                          ? 'text-info'
                          : 'text-base-content'}"
                    >
                      {dayChange}
                    </span>
                  {/if}
                </td>
                <td>
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
                        {@const firstTemp = item.sparkline_data[0].temperature}
                        {@const lastTemp =
                          item.sparkline_data[item.sparkline_data.length - 1]
                            .temperature}
                        <polyline
                          {points}
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.5"
                          class={lastTemp > firstTemp
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
      <div class="flex items-center justify-between p-4">
        <div class="text-sm text-base-content/70">
          Showing {Math.min(
            (currentPage - 1) * itemsPerPage + 1,
            filteredData.length,
          )} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
          entries
        </div>
        <div class="join">
          <button
            class="join-item btn"
            disabled={currentPage === 1}
            on:click={() => (currentPage = 1)}>«</button
          >
          <button
            class="join-item btn"
            disabled={currentPage === 1}
            on:click={() => currentPage--}>‹</button
          >
          <button class="join-item btn">Page {currentPage}</button>
          <button
            class="join-item btn"
            disabled={currentPage >=
              Math.ceil(filteredData.length / itemsPerPage)}
            on:click={() => currentPage++}>›</button
          >
          <button
            class="join-item btn"
            disabled={currentPage >=
              Math.ceil(filteredData.length / itemsPerPage)}
            on:click={() =>
              (currentPage = Math.ceil(filteredData.length / itemsPerPage))}
            >»</button
          >
        </div>
      </div>
    </div>
  </div>
</div>
