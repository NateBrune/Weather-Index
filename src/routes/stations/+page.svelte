<script>
  import { onMount, onDestroy, tick } from "svelte";
  import moment from "moment";
  import {
    Chart,
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    LineController,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    Filler,
  } from "chart.js";
  import "chartjs-adapter-moment";

  Chart.register(
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    LineController,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    Filler,
  );

  export let data;
  let timeRange = "24h";
  let stationData = []; // Initialize as empty array
  let loading = false;
  let chartContainer;
  let chart;

  async function fetchData() {
    loading = true;
    const response = await fetch(
      `/api/weather-cities/stats?timeRange=${timeRange}`,
    );
    const newData = await response.json();

    // Destroy existing chart
    if (chart) {
      chart.destroy();
      chart = null;
    }

    // Update data after chart is destroyed
    stationData = newData.station_count_history;
    loading = false;

    // Wait for next tick to ensure DOM is updated
    await tick();
    updateChart();
  }

  function updateChart() {
    if (stationData.length > 0) {
      // Create chart if it doesn't exist
      const chartData = {
        datasets: [
          {
            label: "Active Stations",
            data: stationData.slice(1, -1).map((d) => ({
              x: moment.utc(d.timestamp).local().valueOf(), // Parse as UTC and convert to local time
              y: parseInt(d.count, 10),
            })),
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            fill: true,
            tension: 0.1,
          },
        ],
      };

      if (!chartContainer) return;

      chart = new Chart(chartContainer, {
        type: "line",
        data: chartData,
        options: {
          responsive: true,
          scales: {
            x: {
              type: "time",
              adapters: {
                date: {
                  zone: "local",
                },
              },
              time: {
                unit: (() => {
                  switch (timeRange) {
                    case "24h":
                      return "hour";
                    case "7d":
                      return "day";
                    case "30d":
                      return "week";
                    default:
                      return "hour";
                  }
                })(),
                tooltipFormat: navigator.language.startsWith("en-US")
                  ? "ll hh:mm A"
                  : "ll HH:mm",
                displayFormats: {
                  hour: navigator.language.startsWith("en-US")
                    ? "hh:mm A"
                    : "HH:mm",
                  day: "MMM D",
                  week: "MMM D",
                },
                stepSize: 1,
              },
              title: {
                display: true,
                text: "Time",
              },
              ticks: {
                source: "auto",
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: (() => {
                  switch (timeRange) {
                    case "24h":
                      return 24;
                    case "7d":
                      return 14;
                    case "30d":
                      return 30;
                    default:
                      return 24;
                  }
                })(),
              },
            },
            y: {
              type: "linear",
              title: {
                display: true,
                text: "Active Stations",
              },
              ticks: {
                beginAtZero: false,
              },
            },
          },
          plugins: {
            legend: {
              display: true,
            },
            tooltip: {
              intersect: false,
              mode: "nearest",
            },
          },
          hover: {
            intersect: false,
            mode: "nearest",
          },
        },
      });
    }
  }

  onMount(async () => {
    fetchData();
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });
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
            }}>One Day</button
          >
          <button
            class="btn btn-sm {timeRange === '7d'
              ? 'btn-primary'
              : 'btn-ghost'}"
            on:click={() => {
              timeRange = "7d";
              fetchData();
            }}>One Week</button
          >
          <button
            class="btn btn-sm {timeRange === '30d'
              ? 'btn-primary'
              : 'btn-ghost'}"
            on:click={() => {
              timeRange = "30d";
              fetchData();
            }}>One Month</button
          >
        </div>

        {#if loading}
          <div class="h-[400px] flex items-center justify-center">
            <span class="loading loading-dots loading-lg"></span>
          </div>
        {:else}
          <div class="h-[400px] relative">
            <canvas bind:this={chartContainer}></canvas>
            <div
              class="absolute bottom-0 right-0 p-4 bg-base-100/80 backdrop-blur-sm rounded-lg"
            >
              <div class="text-4xl font-bold">
                {stationData[stationData.length - 2]?.count || 0}
              </div>
              <div class="text-sm opacity-70">Active Stations</div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  canvas {
    width: 100% !important;
    height: 100% !important;
  }
</style>
