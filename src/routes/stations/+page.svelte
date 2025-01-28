<script>
  import { onMount } from "svelte";

  let timeRange = "24h";
  let stationData = [];
  let loading = true;

  async function fetchData() {
    loading = true;
    const response = await fetch(
      `/api/weather-cities/stats/stations?timeRange=${timeRange}`,
    );
    const data = await response.json();
    stationData = data;
    loading = false;
  }

  onMount(fetchData);

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
  }
</script>

<div class="min-h-screen bg-base-200 pt-20 px-4 pb-8">
  <div class="max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-primary">Global Station Count</h1>
      <p class="text-secondary">
        Track the number of active weather stations over time
      </p>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="flex justify-end gap-2 mb-4">
          <button
            class="btn btn-sm {timeRange === '24h'
              ? 'btn-primary'
              : 'btn-ghost'}"
            on:click={() => {
              timeRange = "24h";
              fetchData();
            }}>24h</button
          >
          <button
            class="btn btn-sm {timeRange === '7d'
              ? 'btn-primary'
              : 'btn-ghost'}"
            on:click={() => {
              timeRange = "7d";
              fetchData();
            }}>7d</button
          >
          <button
            class="btn btn-sm {timeRange === '30d'
              ? 'btn-primary'
              : 'btn-ghost'}"
            on:click={() => {
              timeRange = "30d";
              fetchData();
            }}>30d</button
          >
        </div>

        {#if loading}
          <div class="h-[400px] flex items-center justify-center">
            <span class="loading loading-dots loading-lg"></span>
          </div>
        {:else}
          <div class="h-[400px] relative">
            {#if stationData.length > 0}
              {@const maxCount = Math.max(
                ...stationData.map((d) => d.active_stations),
              )}
              {@const minCount = Math.min(
                ...stationData.map((d) => d.active_stations),
              )}
              {@const range = maxCount - minCount || 1}
              {@const points = stationData
                .map(
                  (d, i) =>
                    `${(i * 100) / (stationData.length - 1)},${100 - ((d.active_stations - minCount) * 100) / range}`,
                )
                .join(" ")}

              <svg
                class="w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <polyline
                  {points}
                  fill="none"
                  stroke="currentColor"
                  stroke-width="0.5"
                  class="text-primary"
                />
              </svg>

              <div
                class="absolute bottom-0 right-0 p-4 bg-base-100/80 backdrop-blur-sm rounded-lg"
              >
                <div class="text-4xl font-bold">
                  {stationData[stationData.length - 1].active_stations}
                </div>
                <div class="text-sm opacity-70">Active Stations</div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
